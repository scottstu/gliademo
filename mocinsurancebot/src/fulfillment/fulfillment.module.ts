import { Module, OnModuleInit } from '@nestjs/common';

import { IntentsModule } from '../intents/intents.module';
import { DIALOG_FLOW_INTENT } from './constants';
import { IntentContainer } from './fulfillment.container';
import { FulfillmentController } from './fulfillment.controller';
import { FulfillmentService } from './fulfillment.service';
import { ScannerModule, ScannerService } from './scanner';

@Module({
  imports: [ScannerModule, IntentsModule],
  providers: [FulfillmentService, IntentContainer],
  controllers: [FulfillmentController],
})
export class FulfillmentModule implements OnModuleInit {
  constructor(
    private readonly scannerService: ScannerService,
    private readonly intentContainer: IntentContainer,
  ) {}

  public async onModuleInit(): Promise<void> {
    const providersMethodAndMetaForIntent =
      await this.scannerService.providerMethodsWithMetaAtKey<string>(
        DIALOG_FLOW_INTENT,
      );

    for (const providerMethodAndMeta of providersMethodAndMetaForIntent) {
      this.intentContainer.register(
        providerMethodAndMeta.meta,
        providerMethodAndMeta.discoveredMethod.parentClass.instance,
        providerMethodAndMeta.discoveredMethod.methodName,
      );
    }
  }
}
