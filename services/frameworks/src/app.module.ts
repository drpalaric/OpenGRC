import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor, TransformInterceptor } from './common';
import { FrameworksModule } from './frameworks/frameworks.module';
import { RisksModule } from './risks/risks.module';
import { ControlsModule } from './controls/controls.module';
import { HealthModule } from './health/health.module';
import { Framework } from './frameworks/entities/framework.entity';
import { FrameworkControl } from './frameworks/entities/framework-control.entity';
import { Risk } from './risks/entities/risk.entity';
import { RiskControl } from './risks/entities/risk-control.entity';
import { Control } from './controls/entities/control.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [Framework, FrameworkControl, Risk, RiskControl, Control],
        synchronize: true, // Auto-sync schema in dev
        logging: false,
      }),
    }),
    ControlsModule,  // Load Controls module first to take precedence for /controls route
    RisksModule,
    FrameworksModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
