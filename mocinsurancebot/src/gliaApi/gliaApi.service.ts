import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { gliaConfig } from '../config/constants';
import { HttpRequest, HttpRequestOptions } from '../libs/HttpRequest';

@Injectable()
export class GliaApiService {
  private GLIA_KEY_ID: string;
  private GLIA_KEY_SECRET: string;
  private GLIA_SITE_ID: string;
  private GLIA_TEAM_ID: string;
  private GLIA_VIRTUAL_ASSISTANT_ID: string;

  private token: { expiredAt: Date; value: string } | null;
  private gliaApiClient: HttpRequest;

  constructor(private readonly configService: ConfigService) {
    this.GLIA_KEY_ID = this.configService.get<string>('GLIA_KEY_ID');
    this.GLIA_KEY_SECRET = this.configService.get<string>('GLIA_KEY_SECRET');
    this.GLIA_SITE_ID = this.configService.get<string>('GLIA_SITE_ID');
    this.GLIA_TEAM_ID = this.configService.get<string>('GLIA_TEAM_ID');
    this.GLIA_VIRTUAL_ASSISTANT_ID = this.configService.get<string>(
      'GLIA_VIRTUAL_ASSISTANT_ID',
    );

    this.gliaApiClient = new HttpRequest(gliaConfig.baseUrl);
  }

  async fetchAgents(): Promise<
    {
      name: string;
      id: string;
      email: string;
      icon: string | null;
    }[]
  > {
    const requestOptions: HttpRequestOptions = {
      url: '/operators',
      method: 'GET',
      headers: {
        accept: 'application/vnd.salemove.v1+json',
        authorization: await this.getBearerToken(),
      },
      params: {
        include_engagements: true,
        include_disabled: true,
        include_offline: true,
        include_support: true,
        team_ids: [this.GLIA_TEAM_ID],
      },
    };
    try {
      const { data } = await this.gliaApiClient.makeRequest(requestOptions);
      return data.operators
        .filter(
          (anOperator) => anOperator.id !== this.GLIA_VIRTUAL_ASSISTANT_ID,
        )
        .map((anOperator) => {
          return {
            name: anOperator.name,
            id: anOperator.id,
            email: anOperator.email,
            icon: anOperator?.picture?.url || null,
          };
        });
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async fetchEngagementInfo(engagementId: string) {
    const requestOptions: HttpRequestOptions = {
      url: `/engagements/${engagementId}`,
      method: 'GET',
      headers: {
        accept: 'application/vnd.salemove.v1+json',
        authorization: await this.getBearerToken(),
      },
    };
    try {
      const { data } = await this.gliaApiClient.makeRequest(requestOptions);
      return data;
    } catch (error) {
      console.error('get engagement error', engagementId, error);
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
      url: '/operator_authentication/tokens',
      method: 'POST',
      headers: {
        accept: 'application/vnd.salemove.v1+json',
        'content-type': 'application/json',
      },
      data: {
        api_key_id: this.GLIA_KEY_ID,
        api_key_secret: this.GLIA_KEY_SECRET,
        site_ids: [this.GLIA_SITE_ID],
      },
    };
    const { data } = await this.gliaApiClient.makeRequest(requestOptions);
    return data.token;
  }
}
