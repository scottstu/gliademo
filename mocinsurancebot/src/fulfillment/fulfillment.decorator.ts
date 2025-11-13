import 'reflect-metadata';

import { DIALOG_FLOW_INTENT } from './constants';

export const DialogFlowIntent = (intent: string | string[]) => {
  return (
    target: Record<string, any>,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    /* Apply the intent value on the descriptor to be handled. */
    Reflect.defineMetadata(DIALOG_FLOW_INTENT, intent, descriptor.value);
    return descriptor;
  };
};
