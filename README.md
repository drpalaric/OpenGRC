# GRC Platform

A simple GRC (Governance, Risk, and Compliance) platform for managing frameworks and controls.

## What's Included

- **Backend**: NestJS API for frameworks and controls
- **Frontend**: React app with framework management UI
- **Database**: PostgreSQL

## Quick Start

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

## Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3002/api/frameworks/frameworks
- **API Documentation**: http://localhost:3002/api/frameworks/docs

## Stack

- **Backend**: NestJS, TypeScript, TypeORM
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Database**: PostgreSQL 16
- **Deployment**: Docker Compose

## Architecture: Modules vs Microservices

This project uses a **modular monolith** architecture instead of microservices.

**Old Microservices Architecture:**
```
┌─────────────┐   HTTP    ┌─────────────┐   HTTP    ┌─────────────┐
│ Controls    │◄─────────►│ Frameworks  │◄─────────►│    Risk     │
│ Service     │           │  Service    │           │  Service    │
│ Port 3001   │           │  Port 3002  │           │  Port 3008  │
└──────┬──────┘           └──────┬──────┘           └──────┬──────┘
       │                         │                         │
       ▼                         ▼                         ▼
┌─────────────┐           ┌─────────────┐           ┌─────────────┐
│  controls   │           │ frameworks  │           │    risk     │
│  database   │           │  database   │           │  database   │
└─────────────┘           └─────────────┘           └─────────────┘

7+ containers, 7+ databases, network calls, complex deployment
```

**New Modular Architecture:**
```
┌────────────────────────────────────────────────┐
│         Backend (Port 3002)                    │
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Frameworks│  │  Risks   │  │ Vendors  │   │
│  │ Module   │  │  Module  │  │  Module  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │          │
│       └─────────────┴─────────────┘          │
│              Memory calls                     │
└────────────────────┬───────────────────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  grc database   │
            │                 │
            │  • frameworks   │
            │  • risks        │
            │  • vendors      │
            └─────────────────┘

3 containers, 1 database, direct calls, simple deployment
```

**Why Modules?**
- **Performance**: Direct function calls (nanoseconds) vs HTTP (milliseconds)
- **Simplicity**: One backend, one database, one log stream
- **Development Speed**: Add features in 5 minutes
- **Cost**: 200MB RAM vs 1.4GB RAM for microservices

## Development

The backend uses auto-sync for the database schema, so changes to entities automatically update the database in development mode.

To rebuild after code changes:
```bash
docker-compose up -d --build
```

### Adding New Features

Follow this simple pattern. Example: adding a "risks" module.

#### 1. Create the module directory

```bash
mkdir -p services/frameworks/src/risks/{entities,dto}
```

#### 2. Create the entity (`risks/entities/risk.entity.ts`)

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

@Entity('risks')
export class Risk extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'medium' })
  severity: string;

  @Column({ default: 'open' })
  status: string;
}
```

#### 3. Create DTOs

**`risks/dto/create-risk.dto.ts`**:
```typescript
import { IsString, IsOptional } from 'class-validator';

export class CreateRiskDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
```

**`risks/dto/update-risk.dto.ts`**:
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateRiskDto } from './create-risk.dto';

export class UpdateRiskDto extends PartialType(CreateRiskDto) {}
```

#### 4. Create service, controller, module

Follow the frameworks module pattern for:
- `risks.service.ts` - CRUD operations
- `risks.controller.ts` - REST endpoints
- `risks.module.ts` - Module definition

#### 5. Register in app.module.ts

```typescript
import { Risk } from './risks/entities/risk.entity';
import { RisksModule } from './risks/risks.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      entities: [Framework, FrameworkControl, Risk], // Add entity
    }),
    FrameworksModule,
    RisksModule, // Add module
    HealthModule,
  ],
})
```

#### 6. Rebuild

```bash
docker-compose up -d --build
```

New API available at:
- `http://localhost:3002/api/frameworks/risks`
- Docs: `http://localhost:3002/api/frameworks/docs`

### How Modules Talk to Each Other

Modules can call each other directly:

```typescript
// In FrameworksService
import { RisksService } from '../risks/risks.service';

@Injectable()
export class FrameworksService {
  constructor(private risksService: RisksService) {}

  async getFrameworkWithRisks(id: string) {
    const framework = await this.findOne(id);
    const risks = await this.risksService.findByFramework(id);  // Direct call
    return { framework, risks };
  }
}
```

No HTTP calls, no network issues, instant results.

## Database

- **Database**: `grc`
- **Tables**: `frameworks`, `framework_controls`
- **User**: `grcadmin`
- **Password**: `changeme`

Connect directly:
```bash
psql postgresql://grcadmin:changeme@localhost:5432/grc
```

Reset database:
```bash
docker-compose down -v
docker-compose up -d
```

## Testing

Test-driven development ensuring the system does **only** what it's intended to do.

### Running Tests

```bash
cd services/frameworks

# Run all unit tests
npm test

# Run with coverage
npm run test:cov

# Run E2E/integration tests
npm run test:e2e
```

### What We Test

**Intended Functionality** (What SHOULD happen):
- ✅ Framework CRUD operations work correctly
- ✅ Control CRUD operations work correctly
- ✅ Data validation catches invalid inputs
- ✅ Auto-generated UUIDs and timestamps
- ✅ Proper error handling and status codes

**Intended Behavior** (What should NOT happen):
- ✅ NO soft deletes (hard delete only)
- ✅ NO multi-tenancy filtering (single tenant)
- ✅ NO authentication required (public access)
- ✅ NO unwhitelisted fields accepted
- ✅ NO side effects (emails, webhooks, etc.)
- ✅ NO data transformation (return as stored)

### Test Results

```
✓ 15 unit tests - Service layer
✓ E2E tests - All API endpoints
✓ All tests passing
```

Tests verify the system works as designed and doesn't do anything it's not supposed to.
