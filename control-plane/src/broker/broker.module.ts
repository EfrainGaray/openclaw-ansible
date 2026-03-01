import { Module } from '@nestjs/common';

import { BrokerRunner } from './broker.runner';

@Module({
  providers: [BrokerRunner]
})
export class BrokerModule {}
