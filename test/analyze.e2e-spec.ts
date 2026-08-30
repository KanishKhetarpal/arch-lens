import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { join } from 'node:path';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

const FIXTURE_PATH = join(__dirname, '../src/parser/__fixtures__/sample-project');

async function pollUntilSettled(app: INestApplication, id: string): Promise<request.Response> {
  const deadline = Date.now() + 10_000;
  for (;;) {
    const response = await request(app.getHttpServer()).get(`/analyze/${id}`);
    if (response.body.status === 'completed' || response.body.status === 'failed') {
      return response;
    }
    if (Date.now() > deadline) {
      throw new Error(`Job ${id} did not settle in time (last status: ${response.body.status})`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

describe('Analyze API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a malformed analyze request', () => {
    return request(app.getHttpServer()).post('/analyze').send({ type: 'local' }).expect(400);
  });

  it('reports 404 for an unknown job', () => {
    return request(app.getHttpServer()).get('/analyze/does-not-exist').expect(404);
  });

  it('marks a job failed when the repo path does not exist', async () => {
    const create = await request(app.getHttpServer())
      .post('/analyze')
      .send({ type: 'local', path: join(__dirname, 'nowhere') })
      .expect(201);

    const settled = await pollUntilSettled(app, create.body.id);
    expect(settled.body.status).toBe('failed');
    expect(settled.body.error).toContain('does not exist');

    await request(app.getHttpServer()).get(`/diagram/${create.body.id}`).expect(409);
  });

  describe('a completed analysis', () => {
    let jobId: string;

    beforeAll(async () => {
      const create = await request(app.getHttpServer())
        .post('/analyze')
        .send({ type: 'local', path: FIXTURE_PATH })
        .expect(201);

      expect(['pending', 'running']).toContain(create.body.status);
      jobId = create.body.id;

      const settled = await pollUntilSettled(app, jobId);
      expect(settled.body.status).toBe('completed');
    });

    it('renders a Mermaid diagram by default', async () => {
      const response = await request(app.getHttpServer()).get(`/diagram/${jobId}`).expect(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('flowchart TD');
    });

    it('exports D3 JSON on request', async () => {
      const response = await request(app.getHttpServer())
        .get(`/diagram/${jobId}`)
        .query({ format: 'json' })
        .expect(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(Array.isArray(response.body.nodes)).toBe(true);
      expect(Array.isArray(response.body.links)).toBe(true);
    });

    it('renders an interactive HTML document on request', async () => {
      const response = await request(app.getHttpServer())
        .get(`/diagram/${jobId}`)
        .query({ format: 'html' })
        .expect(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('<!DOCTYPE html>');
    });

    it('rejects an unsupported diagram format', () => {
      return request(app.getHttpServer())
        .get(`/diagram/${jobId}`)
        .query({ format: 'bogus' })
        .expect(400);
    });

    it('serves the explanation', async () => {
      const response = await request(app.getHttpServer()).get(`/explanation/${jobId}`).expect(200);
      expect(response.body).toHaveProperty('moduleSummaries');
      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('hotspots');
      expect(typeof response.body.prompt).toBe('string');
    });

    it('serves a repeat analysis of the same path from cache', async () => {
      const create = await request(app.getHttpServer())
        .post('/analyze')
        .send({ type: 'local', path: FIXTURE_PATH })
        .expect(201);

      expect(create.body.status).toBe('completed');
      expect(create.body.fromCache).toBe(true);
    });

    it('bypasses the cache when noCache is set', async () => {
      const create = await request(app.getHttpServer())
        .post('/analyze')
        .send({ type: 'local', path: FIXTURE_PATH, noCache: true })
        .expect(201);

      expect(create.body.fromCache).toBeUndefined();
      await pollUntilSettled(app, create.body.id);
    });
  });
});
