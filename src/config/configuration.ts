export interface AppConfig {
  nodeEnv: string;
  port: number;
  analysisCacheTtlSeconds: number;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  analysisCacheTtlSeconds: parseInt(process.env.ANALYSIS_CACHE_TTL_SECONDS ?? '300', 10),
});
