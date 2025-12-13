import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FrameworksService } from './frameworks.service';
import { FrameworksController } from './frameworks.controller';
import { Framework } from './entities/framework.entity';
import { FrameworkControl } from './entities/framework-control.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Framework, FrameworkControl])],
  controllers: [FrameworksController],
  providers: [FrameworksService],
  exports: [FrameworksService],
})
export class FrameworksModule {}
