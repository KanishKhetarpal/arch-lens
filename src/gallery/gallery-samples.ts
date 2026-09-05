import { join } from 'node:path';

export interface GallerySample {
  id: string;
  name: string;
  description: string;
  path: string;
}

/**
 * Curated repos analyzed for the gallery, chosen to each show off a
 * different structural property arch-lens can detect. Paths are resolved
 * relative to this file (`../../samples/<id>` from `dist/gallery` or
 * `src/gallery`), not the process cwd, so `npm run gallery` works from
 * anywhere.
 */
export const GALLERY_SAMPLES: GallerySample[] = [
  {
    id: 'blog-api',
    name: 'Blog API',
    description:
      'A clean layered Nest app: controllers call services, services call repositories, ' +
      'and the Posts module depends on the Users module to attach an author. No cycles.',
    path: join(__dirname, '../../samples/blog-api'),
  },
  {
    id: 'coupled-notifications',
    name: 'Coupled Notifications',
    description:
      'Notifications and Subscriptions inject each other (via forwardRef) so each can ' +
      'reach the other, producing both a service-level and a module-level import cycle.',
    path: join(__dirname, '../../samples/coupled-notifications'),
  },
];
