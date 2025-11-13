import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { validate } from './config/env.validation';
import { FulfillmentModule } from './fulfillment/fulfillment.module';
import { OutlookCalendarApiModule } from './outlookCalendarApi/outlookCalendarApi.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      exclude: ['/api*'],
    }),
    FulfillmentModule,
    OutlookCalendarApiModule,
  ],
})
export class AppModule {}
