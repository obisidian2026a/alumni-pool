import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { RestockController } from './restock.controller';
import { RestockService } from './restock.service';

@Module({
  imports: [ActivityModule],
  controllers: [RestockController],
  providers: [RestockService],
  exports: [RestockService],
})
export class RestockModule {}
