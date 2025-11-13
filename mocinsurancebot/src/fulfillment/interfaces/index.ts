export interface DialogFlowFulfillmentResponse {
  followupEventInput?: FollowupEventInput;
  fulfillmentMessages?: any;
  // fulfillmentMessages?: FulfillmentMessages[];
  fulfillmentText?: string;
  outputContexts?: OutputContexts[];
  payload?: any;
  source?: string;
}

export interface OutputContexts {
  name: string;
  lifespanCount: number;
  parameters: any;
}

export interface DialogFlowResponse {
  originalDetectIntentRequest: any;
  queryResult: QueryResult;
  responseId: string;
  session: string;
}

export interface QueryResult {
  action: string;
  allRequiredParamsPresent: boolean;
  diagnosticInfo: { webhook_latency_ms: number };
  fulfillmentMessages: any;
  fulfillmentText: string;
  intent: { name: string; displayName: string };
  intentDetectionConfidence: number;
  languageCode: string;
  outputContexts: OutputContexts[];
  parameters: any;
  queryText: string;
}

export interface FollowupEventInput {
  name: string;
  languageCode: string;
  parameters?: any;
}

// export interface FulfillmentMessages {
//   text?: FulfillmentMessageText;
// }

// export interface FulfillmentMessage {}
