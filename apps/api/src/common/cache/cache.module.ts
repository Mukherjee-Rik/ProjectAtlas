import { Global, Module } from '@nestjs/common';

import { TtlCacheService } from './ttl-cache.service';

/**
 * Global so guards, strategies and services can share one cache instance
 * without every feature module having to import it.
 */
@Global()
@Module({
  providers: [TtlCacheService],
  exports: [TtlCacheService],
})
export class CacheModule {}
