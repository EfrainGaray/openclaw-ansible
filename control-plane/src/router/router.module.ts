import { Module } from '@nestjs/common';

import { RouterRunner } from './router.runner';

@Module({
  providers: [RouterRunner]
})
export class RouterModule {}
