import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import * as qs from 'qs';

import { ScheduledEvent } from '../common/types';
import { outlookConfig } from '../config/constants';
import { HttpRequest, HttpRequestOptions } from '../libs/HttpRequest';

@Injectable()
export class OutlookCalendarApiService {
  private token: { expiredAt: Date; value: string } | null;
  private OUTLOOK_TENANT: string;
  private OUTLOOK_CLIENT_ID: string;
  private OUTLOOK_SECRET: string;

  private ZOOM_LINK: string;
  private ZOOM_MEETING_ID: string;
  private ZOOM_MEETING_PASS: string;

  private outlookApiClient: HttpRequest;
  private outlookLoginApiClient: HttpRequest;

  constructor(private readonly configService: ConfigService) {
    this.OUTLOOK_TENANT = this.configService.get<string>('OUTLOOK_TENANT');
    this.OUTLOOK_CLIENT_ID =
      this.configService.get<string>('OUTLOOK_CLIENT_ID');
    this.OUTLOOK_SECRET = this.configService.get<string>('OUTLOOK_SECRET');

    this.ZOOM_LINK = this.configService.get<string>('ZOOM_LINK');
    this.ZOOM_MEETING_ID = this.configService.get<string>('ZOOM_MEETING_ID');
    this.ZOOM_MEETING_PASS =
      this.configService.get<string>('ZOOM_MEETING_PASS');

    this.outlookLoginApiClient = new HttpRequest(outlookConfig.loginBaseUrl);
    this.outlookApiClient = new HttpRequest(outlookConfig.baseUrl);
  }

  async fetchEvents(
    userId: string,
    agentTimeZone: string,
  ): Promise<ScheduledEvent[]> {
    const nextDay = DateTime.now()
      .plus({ days: 1 })
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

    const requestOptions: HttpRequestOptions = {
      url: `/users/${userId}/calendar/events`,
      method: 'GET',
      headers: {
        authorization: await this.getBearerToken(),
      },
      params: {
        $filter: `start/dateTime ge '${nextDay.toISO()}'`,
      },
    };
    const { data } = await this.outlookApiClient.makeRequest(requestOptions);
    return data.value.map((anEvent) => {
      return {
        start: DateTime.fromFormat(
          anEvent.start.dateTime.slice(0, -8),
          `yyyy-MM-dd'T'hh:mm:ss`,
          { zone: 'utc' },
        ).setZone(agentTimeZone),
        end: DateTime.fromFormat(
          anEvent.end.dateTime.slice(0, -8),
          `yyyy-MM-dd'T'hh:mm:ss`,
          {
            zone: 'utc',
          },
        ).setZone(agentTimeZone),
      };
    });
  }

  async bookEvent(
    calendarUserId: string,
    email: string,
    start: DateTime,
    end: DateTime,
  ) {
    const requestOptions: HttpRequestOptions = {
      url: `/users/${calendarUserId}/calendar/events`,
      method: 'POST',
      headers: {
        authorization: await this.getBearerToken(),
      },
      data: {
        // subject: `Meeting with ${email}`,
        subject: `Meeting with Daria Vynohradina`,
        start: {
          dateTime: start.toISO(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: end.toISO(),
          timeZone: 'UTC',
        },

        location: {
          displayName: this.ZOOM_LINK,
          locationType: 'default',
          uniqueId: this.ZOOM_LINK,
          uniqueIdType: 'private',
        },
        attendees: [
          {
            emailAddress: {
              address: email,
            },
            type: 'required',
          },
        ],
        body: {
          contentType: 'text',
          content:
            'Daria Vynohradina is inviting you to a scheduled Zoom meeting' +
            `\nJoin Zoom Meeting:\n${this.ZOOM_LINK}` +
            `\nMeeting ID: ${this.ZOOM_MEETING_ID}` +
            `\nPasscode: ${this.ZOOM_MEETING_PASS}`,
        },
      },
    };
    try {
      await this.outlookApiClient.makeRequest(requestOptions);
      return true;
    } catch (error) {
      console.error('Error: truing to book event', requestOptions.data, error);
      return false;
    }
  }
  private async getBearerToken() {
    if (this.token && new Date() > this.token.expiredAt)
      return `Bearer ${this.token.value}`;

    const token = await this.fetchToken();
    this.token = {
      value: token,
      expiredAt: new Date(new Date().getTime() + 59 * 60_000),
    };

    return `Bearer ${this.token.value}`;
  }

  private async fetchToken(): Promise<string> {
    const requestOptions: HttpRequestOptions = {
      url: `/${this.OUTLOOK_TENANT}/oauth2/v2.0/token`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: qs.stringify({
        client_id: this.OUTLOOK_CLIENT_ID,
        scope: outlookConfig.scope,
        client_secret: this.OUTLOOK_SECRET,
        grant_type: 'client_credentials',
      }),
    };
    const { data } = await this.outlookLoginApiClient.makeRequest(
      requestOptions,
    );
    return data.access_token;
  }
}
