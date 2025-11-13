import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FULFILLMENT_HEADER_KEY_NAME } from './constants';
import { IntentContainer } from './fulfillment.container';
import {
  DialogFlowFulfillmentResponse,
  DialogFlowResponse,
} from './interfaces';

@Injectable()
export class FulfillmentService {
  private readonly AUTH_KEY;

  constructor(
    private readonly intentContainer: IntentContainer,
    private readonly configService: ConfigService,
  ) {
    this.AUTH_KEY = this.configService.get<string>(FULFILLMENT_HEADER_KEY_NAME);
  }

  public async handleIntentOrAction(
    authKey: string,
    dialogFlowResponse: DialogFlowResponse,
  ): Promise<DialogFlowFulfillmentResponse> {
    if (authKey !== this.AUTH_KEY)
      throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);

    const intent = dialogFlowResponse.queryResult.intent.displayName;
    const action = dialogFlowResponse.queryResult.action;

    const fulfillment = this.intentContainer.findAndCallHandlers(
      dialogFlowResponse,
      {
        intent,
        action,
      },
    );
    return fulfillment;
  }
}
