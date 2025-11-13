import { Module } from '@nestjs/common';

import { OutlookCalendarApiService } from './outlookCalendarApi.service';

@Module({
  imports: [],
  providers: [OutlookCalendarApiService],
  exports: [OutlookCalendarApiService],
})
export class OutlookCalendarApiModule {}
