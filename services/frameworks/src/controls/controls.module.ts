import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControlsController } from './controls.controller';
import { ControlsService } from './controls.service';
import { Control } from './entities/control.entity';

/**
 * Module for controls master library management
 * Provides endpoints for accessing all controls (SCF, CIS, NIST, custom, etc.)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Control])],
  controllers: [ControlsController],
  providers: [ControlsService],
  exports: [ControlsService],
})
export class ControlsModule {}
