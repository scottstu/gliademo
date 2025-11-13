import { Module } from '@nestjs/common';

import { AgentCalendarModule } from '../agentCalendar/agentCalendar.module';
import { GliaApiModule } from '../gliaApi/gliaApi.module';
import { OutlookCalendarApiModule } from '../outlookCalendarApi/outlookCalendarApi.module';
import { BankingBlock } from './banking.block';
import { BookAppointmentBlock } from './booking.block';
import { TransferToAgentBlock } from './transferToAgent.block';

@Module({
  imports: [GliaApiModule, AgentCalendarModule, OutlookCalendarApiModule],
  providers: [BookAppointmentBlock, TransferToAgentBlock, BankingBlock],
})
export class IntentsModule {}
