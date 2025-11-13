import { Module } from '@nestjs/common';

import { AgentCalendarService } from './agentCalendar.service';

@Module({
  imports: [],
  providers: [AgentCalendarService],
  exports: [AgentCalendarService],
})
export class AgentCalendarModule {}
