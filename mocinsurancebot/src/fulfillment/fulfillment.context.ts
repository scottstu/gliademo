import { DialogFlowResponse, OutputContexts } from './interfaces';

export class FulfillmentContext {
  readonly dialogFlowResponse: DialogFlowResponse;
  readonly userId: string;
  private language: string;

  constructor(dialogFlowResponse: DialogFlowResponse) {
    this.userId = this.parseUserId(dialogFlowResponse.session);
    this.dialogFlowResponse = dialogFlowResponse;
  }

  createOutputContexts(outputContextList: OutputContexts[]) {
    return outputContextList.map((outputContext: OutputContexts) =>
      this.outputContextMaker(outputContext),
    );
  }
  createOutputContext(outputContext: OutputContexts) {
    return this.outputContextMaker(outputContext);
  }

  private outputContextMaker(outputContext: OutputContexts) {
    return {
      ...outputContext,
      name: this.dialogFlowResponse.session + '/contexts/' + outputContext.name,
    };
  }

  createFollowupEventInput(eventName: string, parameters: any = {}) {
    return {
      name: eventName,
      languageCode: this.language,
      parameters,
    };
  }

  createFulfillmentMessages(messages: string[]) {
    return messages.map((message: string) =>
      this.fulfillmentMessageMaker(message),
    );
  }

  createFulfillmentMessage(message: string) {
    return this.fulfillmentMessageMaker(message);
  }

  createSuggestionFulfillmentMessage(
    message: string,
    options: { text: string; value: string }[],
  ) {
    return {
      payload: {
        attachment: {
          options,
          type: 'single_choice',
        },
        content: message,
        type: 'suggestion',
      },
    };
  }

  createTransferMessage(
    operator_id: string,
    notifications: {
      success: string;
      failure: string;
      timed_out: string;
      declined: string;
      transfer_already_ongoing: string;
    },
  ) {
    return {
      payload: {
        type: 'transfer',
        properties: {
          media: 'text',
          notifications,
          operator_id: operator_id,
          version: '0',
        },
      },
    };
  }

  private fulfillmentMessageMaker(message: string) {
    return {
      payload: {
        content: message,
        type: 'suggestion',
        metadata: {
          customMessage: true,
        },
      },
    };
  }

  getContextByName(name: string) {
    const context = this.dialogFlowResponse.queryResult.outputContexts.find(
      (outputContext) => {
        const arr = outputContext.name.split('/');
        return arr[6] === name;
      },
    );

    return context;
  }

  private parseUserId(session: string) {
    const list = session.split('/');
    return list[4];
  }
}
