import { Module } from '@nestjs/common';

import { GliaApiService } from './gliaApi.service';

@Module({
  imports: [],
  providers: [GliaApiService],
  exports: [GliaApiService],
})
export class GliaApiModule {}
