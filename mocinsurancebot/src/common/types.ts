import { DateTime } from 'luxon';

export interface ScheduledEvent {
  start: DateTime;
  end: DateTime;
}
