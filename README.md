# GRC Platform

A simple GRC (Governance, Risk, and Compliance) platform for managing frameworks, controls, and organizational risks.

## What's Included

- **Backend**: NestJS API with modular architecture (Frameworks, Risks, Controls)
- **Frontend**: React app with GRC management UI (Dashboard, Frameworks, Controls, Risks)
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
- **Testing**: Vitest, React Testing Library, Playwright (E2E)
- **Database**: PostgreSQL 18.1
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
│  │Frameworks│  │  Risks   │  │  Health  │   │
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
            │  • controls     │
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
- **Tables**: `frameworks`, `framework_controls`, `risks`
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
- ✅ Risk CRUD operations work correctly
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

## Frontend

### UI Design

The frontend uses a **Jira-inspired dark theme** with sidebar navigation:

**Color Scheme:**
- **Black backgrounds** (#000000) for main surfaces
- **Amber accents** (#F59E0B, #FBBF24) for active states and interactive elements
- **White text** for primary content
- **Gray tones** for secondary content and borders

**Layout:**
```
┌──────────────┬─────────────────────────────┐
│   Sidebar    │      Main Content          │
│   (256px)    │      (Scrollable)          │
│              │                             │
│  Dashboard   │   ┌─────────────────┐      │
│  Frameworks  │   │  Page Content   │      │
│  Controls    │   │  with 24px      │      │
│  Risks       │   │  padding        │      │
│              │   └─────────────────┘      │
└──────────────┴─────────────────────────────┘
```

**Features:**
- Fixed sidebar navigation (always visible)
- Active route highlighting with amber background
- Responsive padding (1.5rem/24px like Jira)
- Consistent dark theme across all pages
- Future support for collapsible submenus

### Frontend Testing

```bash
cd frontend

# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Build production bundle
npm run build
```

**Test Coverage:**
- ✅ Sidebar component tests (navigation, active states, styling)
- ✅ Layout component tests (structure, responsive design)
- ✅ Dashboard tests (widget presence, navigation)
- ✅ App component tests (routing, integration)

All tests written following **Test-Driven Development (TDD)** principles.

### End-to-End Testing (Playwright)

The platform uses Playwright for comprehensive E2E testing across multiple browsers.

```bash
# Run E2E tests
npm run test:e2e

# View test report
npm run report:e2e
```

**Test Configuration:**
- **Test Directory**: `tests/e2e/`
- **Browsers**: Chromium, Firefox, WebKit, Microsoft Edge, Google Chrome
- **Parallel Execution**: Enabled for faster test runs
- **CI Integration**: Configured with retry logic for CI environments

**Features:**
- ✅ Cross-browser testing (5 browser configurations)
- ✅ Automatic dev server startup before tests
- ✅ HTML reporter with detailed test results
- ✅ Trace collection on test failure for debugging
- ✅ Parallel test execution for optimal performance

## Risk Management

The platform includes a comprehensive Risk Management module for identifying, tracking, and mitigating organizational risks.

### Features

**Risk CRUD Operations:**
- Create risks with custom IDs and detailed attributes
- View risks in a tabular format with color-coded severity levels
- Link risks to controls for mitigation tracking
- Search and filter controls when linking to risks

**Risk Fields:**
- **Risk ID*** (required): Custom identifier (e.g., RISK-001)
- **Title*** (required): Brief description of the risk
- **Description**: Detailed risk explanation
- **Inherent Likelihood**: Risk probability before controls (very_low, low, medium, high, critical)
- **Inherent Impact**: Risk severity before controls (very_low, low, medium, high, critical)
- **Residual Likelihood**: Risk probability after controls
- **Residual Impact**: Risk severity after controls
- **Treatment**: Risk response strategy (Accept, Mitigate, Transfer, Avoid)
- **Threats**: Potential threat sources
- **Linked Controls**: Array of control IDs for mitigation
- **Risk Owner**: Person responsible for the risk
- **Creator**: User who created the risk entry
- **Business Unit**: Organizational unit affected
- **Assets**: Affected systems or resources

### Color Coding

Risk levels are visually indicated with distinct colors:

| Level      | Color         | Tailwind Class | Description |
|------------|---------------|----------------|-------------|
| Very Low   | White         | `bg-white`     | Minimal risk |
| Low        | Light Gray    | `bg-gray-300`  | Low impact/likelihood |
| Medium     | Amber         | `bg-amber-500` | Moderate risk requiring attention |
| High       | Red-Orange    | `bg-orange-600`| Significant risk needing mitigation |
| Critical   | Maroon        | `bg-red-900`   | Severe risk requiring immediate action |

### Control Linking

Risks can be linked to existing controls for mitigation tracking:

- **Search**: Filter controls by title, description, or ID
- **Multi-select**: Link multiple controls to a single risk
- **Display**: Shows first 3 controls in risk list, then "..." for additional controls
- **Integration**: Uses existing Controls module data

### API Endpoints

All risk endpoints are available under `/api/frameworks/risks`:

```bash
# Get all risks
GET /api/frameworks/risks

# Get risk by ID
GET /api/frameworks/risks/:id

# Create new risk
POST /api/frameworks/risks
{
  "riskId": "RISK-001",
  "title": "Data Breach",
  "description": "Risk of unauthorized data access",
  "inherentLikelihood": "high",
  "inherentImpact": "critical",
  "riskOwner": "CISO",
  "treatment": "Mitigate"
}

# Update risk
PUT /api/frameworks/risks/:id

# Delete risk
DELETE /api/frameworks/risks/:id
```

### Testing

**Backend Tests (15 tests):**
- ✅ Create risk with all fields
- ✅ Validation for required fields (riskId, title)
- ✅ Enum validation (risk levels, treatment options)
- ✅ Duplicate riskId prevention
- ✅ Find all risks with ordering
- ✅ Find risk by ID
- ✅ Update risk
- ✅ Delete risk
- ✅ Error handling (NotFoundException, BadRequestException)

**Frontend Tests (18 tests):**
- ✅ Page structure and styling
- ✅ Risk list display with all columns
- ✅ Linked control display with "..." for >3 controls
- ✅ Empty state handling
- ✅ Color coding for all 5 risk levels
- ✅ Create risk modal with all fields
- ✅ Required field markers
- ✅ Modal open/close functionality
- ✅ Control linking section
- ✅ Control search functionality

All tests follow **Test-Driven Development (TDD)**: Red → Green → Refactor

### Example Usage

1. **Navigate to Risk Management** page from the sidebar
2. **Click "Add Risk"** to open the creation modal
3. **Fill in required fields**: Risk ID and Title
4. **Set risk levels**: Choose inherent likelihood and impact
5. **Link controls**: Search and select relevant controls
6. **Select treatment**: Choose risk response strategy (Accept/Mitigate/Transfer/Avoid)
7. **Save**: Risk appears in the list with color-coded severity levels
