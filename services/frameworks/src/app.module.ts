import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor, TransformInterceptor } from './common';
import { FrameworksModule } from './frameworks/frameworks.module';
import { RisksModule } from './risks/risks.module';
import { HealthModule } from './health/health.module';
import { Framework } from './frameworks/entities/framework.entity';
import { FrameworkControl } from './frameworks/entities/framework-control.entity';
import { Risk } from './risks/entities/risk.entity';

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
        entities: [Framework, FrameworkControl, Risk],
        synchronize: true, // Auto-sync schema in dev
        logging: false,
      }),
    }),
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
