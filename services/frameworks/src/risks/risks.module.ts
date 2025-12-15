import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RisksService } from './risks.service';
import { RisksController } from './risks.controller';
import { Risk } from './entities/risk.entity';
import { RiskControl } from './entities/risk-control.entity';

/**
 * Risks module
 * Manages organizational risks with CRUD operations
 * Includes RiskControl junction table for many-to-many control relationships
 */
@Module({
  imports: [TypeOrmModule.forFeature([Risk, RiskControl])],
  controllers: [RisksController],
  providers: [RisksService],
  exports: [RisksService],
})
export class RisksModule {}
