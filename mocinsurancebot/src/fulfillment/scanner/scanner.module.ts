import { Global, Module } from '@nestjs/common';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';

import { ScannerService } from './scanner.service';

/**
 * Exposes a query API over top of the NestJS Module container
 *
 * @export
 * @class ScannerModule
 */
@Global()
@Module({
  providers: [ScannerService, MetadataScanner],
  exports: [ScannerService],
})
export class ScannerModule {}
