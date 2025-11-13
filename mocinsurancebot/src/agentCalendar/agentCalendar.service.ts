import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';

import { ScheduledEvent } from '../common/types';

@Injectable()
export class AgentCalendarService {
  private WORKING_HOURS_START: number;
  private WORKING_HOURS_END: number;

  constructor(private readonly configService: ConfigService) {
    this.WORKING_HOURS_START = this.configService.get<number>(
      'WORKING_HOURS_START',
    );
    this.WORKING_HOURS_END =
      this.configService.get<number>('WORKING_HOURS_END');
  }
  getFreeSlots(
    scheduledEvents: ScheduledEvent[],
    agentTimeZone: string,
    chosenDay?: DateTime,
  ) {
    const generatedSchedule = this.generateSchedule(agentTimeZone);

    if (chosenDay) {
      return generatedSchedule.filter(
        (anGeneratedEvent) =>
          anGeneratedEvent.start.day === chosenDay.day &&
          this.workingHoursFilter(anGeneratedEvent) &&
          this.slotIsNotUsedFilter(scheduledEvents, anGeneratedEvent),
      );
    }

    return generatedSchedule.filter(
      (anGeneratedEvent) =>
        this.workingHoursFilter(anGeneratedEvent) &&
        this.slotIsNotUsedFilter(scheduledEvents, anGeneratedEvent),
    );
  }

  getDaysWithFreeSlots(
    scheduledEvents: ScheduledEvent[],
    agentTimeZone: string,
  ) {
    const result: string[] = [];
    const freeScheduleEvents = this.getFreeSlots(
      scheduledEvents,
      agentTimeZone,
    );

    freeScheduleEvents.forEach((anEvent) => {
      const eventDay = anEvent.start.toFormat('dd LLL');
      if (!result.includes(eventDay)) result.push(eventDay);
    });
    return result;
  }

  private slotIsNotUsedFilter(
    scheduledEvents: ScheduledEvent[],
    anGeneratedEvent: ScheduledEvent,
  ) {
    let isUsed = false;
    scheduledEvents.forEach((anScheduledEvent) => {
      if (
        anGeneratedEvent.start >= anScheduledEvent.start &&
        anScheduledEvent.end >= anGeneratedEvent.end
      )
        isUsed = true;
    });
    return !isUsed;
  }

  private workingHoursFilter(scheduledEvent: ScheduledEvent) {
    return (
      scheduledEvent.start.hour >= this.WORKING_HOURS_START &&
      scheduledEvent.start.hour < this.WORKING_HOURS_END &&
      scheduledEvent.end.hour >= this.WORKING_HOURS_START &&
      scheduledEvent.end.hour <= this.WORKING_HOURS_END
    );
  }

  private generateSchedule(agentTimeZone: string) {
    const result: ScheduledEvent[] = [];

    let dateTimeIterationValue = DateTime.now()
      .setZone(agentTimeZone)
      .plus({ days: 1 })
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

    const dateTimeMax = dateTimeIterationValue.plus({ days: 5 });
    for (; dateTimeIterationValue < dateTimeMax; ) {
      result.push({
        start: dateTimeIterationValue,
        end: dateTimeIterationValue.plus({ minutes: 30 }),
      });

      dateTimeIterationValue = dateTimeIterationValue.plus({ minutes: 30 });
    }

    return result;
  }
}
