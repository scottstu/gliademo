import { Body, Controller, Headers, Post } from '@nestjs/common';

import { FULFILLMENT_ENDPOINT, FULFILLMENT_HEADER_NAME } from './constants';
import { FulfillmentService } from './fulfillment.service';
import { DialogFlowResponse } from './interfaces';

@Controller(FULFILLMENT_ENDPOINT)
export class FulfillmentController {
  constructor(private readonly dialogFlowService: FulfillmentService) {}

  @Post()
  async processMessage(
    @Headers(FULFILLMENT_HEADER_NAME) auth,
    @Body() dialogFlowResponse: DialogFlowResponse,
  ) {
    return this.dialogFlowService.handleIntentOrAction(
      auth,
      dialogFlowResponse,
    );
  }
}
