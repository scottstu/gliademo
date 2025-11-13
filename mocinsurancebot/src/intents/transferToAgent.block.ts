import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { gliaConfig } from '../config/constants';
import { FulfillmentContext } from '../fulfillment/fulfillment.context';
import { DialogFlowIntent } from '../fulfillment/fulfillment.decorator';
import { DialogFlowFulfillmentResponse } from '../fulfillment/interfaces';
import { GliaApiService } from '../gliaApi/gliaApi.service';

@Injectable()
export class TransferToAgentBlock {
  private OUTLOOK_USER_ID: string;
  private AGENT_TIME_ZONE: string;
  constructor(
    private configService: ConfigService,
    private gliaApiService: GliaApiService,
  ) {
    this.OUTLOOK_USER_ID = this.configService.get<string>('OUTLOOK_USER_ID');
    this.AGENT_TIME_ZONE = this.configService.get<string>('AGENT_TIME_ZONE');
  }

  @DialogFlowIntent('0.6-choose-an-agent')
  async chooseAgent(
    context: FulfillmentContext,
  ): Promise<DialogFlowFulfillmentResponse> {
    const agents = await this.gliaApiService.fetchAgents();
    return {
      fulfillmentMessages: [
        context.createFulfillmentMessage(
          '<h4>Please choose an agent for transferring:</h4>' +
            agents.reduce((prevVal, anAgent) => {
              return (prevVal += `<div style="margin-top: 5px;display: flex;align-items: center"><img src="${
                anAgent.icon || gliaConfig.defaultAgentImage
              }" style="width:20px;height:20px;">
            <span style="margin-left: 5px">${anAgent.name}</span></div>`);
            }, ''),
        ),
        context.createSuggestionFulfillmentMessage(
          'Please choose an agent',
          agents.map((anAgent) => {
            return {
              text: anAgent.name,
              value: `agent-${anAgent.id}`,
            };
          }),
        ),
      ],
    };
  }

  @DialogFlowIntent('0.6-transfer-to-agent')
  async transfer(
    context: FulfillmentContext,
  ): Promise<DialogFlowFulfillmentResponse> {
    const agentId =
      context.dialogFlowResponse.queryResult.parameters.agent.slice(6);
    return {
      fulfillmentMessages: [
        context.createTransferMessage(agentId, {
          success: 'Sure! Transferring you to a live agent now…',
          failure: 'Sorry something went wrong, please retry later',
          timed_out: 'I am sorry, agent seems to be away',
          declined: 'I am sorry, agent is busy',
          transfer_already_ongoing: 'I am already transferring you',
        }),
      ],
    };
  }
}
