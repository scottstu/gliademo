import { Injectable } from '@nestjs/common';

import { FulfillmentContext } from './fulfillment.context';
import {
  DialogFlowFulfillmentResponse,
  DialogFlowResponse,
} from './interfaces';

@Injectable()
export class IntentContainer {
  private container: Map<string, { provider: any; methodName: string }> =
    new Map();

  public register(
    actionOrIntent: string,
    provider: any,
    methodName: string,
  ): void {
    if (this.container.has(actionOrIntent)) {
      throw new Error(
        `Cannot have duplicate handlers for intent [${actionOrIntent}]`,
      );
    }

    this.container.set(actionOrIntent, { provider, methodName });
  }

  public async findAndCallHandlers(
    dialogFlowResponse: DialogFlowResponse,
    { intent, action }: { intent: string; action: string },
  ): Promise<DialogFlowFulfillmentResponse> {
    if (!this.container.has(intent) && !this.container.has(action)) {
      throw new Error(
        `Unknown handler for ${intent ? '[intent: ' + intent + ']' : ''}${
          action ? '[action: ' + action + ']' : ''
        }.`,
      );
    }

    const { provider, methodName } = this.container.get(intent);

    const fulfillmentContext = new FulfillmentContext(dialogFlowResponse);

    const response = await provider[methodName](fulfillmentContext);
    return response as DialogFlowFulfillmentResponse;
  }
}
