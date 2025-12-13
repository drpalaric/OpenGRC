import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RisksService } from './risks.service';
import { RisksController } from './risks.controller';
import { Risk } from './entities/risk.entity';

/**
 * Risks module
 * Manages organizational risks with CRUD operations
 */
@Module({
  imports: [TypeOrmModule.forFeature([Risk])],
  controllers: [RisksController],
  providers: [RisksService],
  exports: [RisksService],
})
export class RisksModule {}
