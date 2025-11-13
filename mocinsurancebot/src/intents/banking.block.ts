import { Injectable } from '@nestjs/common';

import { FulfillmentContext } from '../fulfillment/fulfillment.context';
import { DialogFlowIntent } from '../fulfillment/fulfillment.decorator';
import { DialogFlowFulfillmentResponse } from '../fulfillment/interfaces';
import { GliaApiService } from '../gliaApi/gliaApi.service';

@Injectable()
export class BankingBlock {
  constructor(private gliaApiService: GliaApiService) {}

  @DialogFlowIntent('1.0-banking-start')
  async chooseAgent(
    context: FulfillmentContext,
  ): Promise<DialogFlowFulfillmentResponse> {
    const engagement = await this.gliaApiService.fetchEngagementInfo(
      context.userId,
    );
    const fulfillmentMessages =
      context.dialogFlowResponse.queryResult.fulfillmentMessages;
    fulfillmentMessages[0].payload.content =
      fulfillmentMessages[0].payload.content.replace(
        '<username>',
        engagement.visitor_name && !/Visitor #/.test(engagement.visitor_name)
          ? engagement.visitor_name
          : 'John',
      );
    return {
      fulfillmentMessages,
    };
  }
}
