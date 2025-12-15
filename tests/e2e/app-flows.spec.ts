import { randomUUID } from 'crypto';
import { expect, test, Page, Route } from '@playwright/test';

type Framework = {
  id: string;
  code: string;
  name: string;
  description: string;
  type: string;
  status: string;
  totalControls: number;
};

type Control = {
  id: string;
  controlId: string;
  name: string;
  domain: string;
  description: string;
  requirementId?: string;
  frameworkId?: string | null;
};

type Risk = {
  id: string;
  riskId: string;
  title: string;
  description?: string;
  linkedControls: string[];
};

type ApiState = {
  frameworks: Framework[];
  controls: Control[];
  risks: Risk[];
};

const uid = () => randomUUID();

const fulfill = (route: Route, status: number, body: any) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
  });

async function setupMockApi(page: Page) {
  const state: ApiState = { frameworks: [], controls: [], risks: [] };

  await page.route('**/api/frameworks**', async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/frameworks')) return route.continue();

    const method = route.request().method();
    const pathname = url.pathname;
    const body = ['POST', 'PUT'].includes(method)
      ? route.request().postDataJSON() || {}
      : {};

    if (method === 'OPTIONS') {
      return fulfill(route, 200, {});
    }

    // Controls library
    if (pathname.startsWith('/api/frameworks/controls')) {
      // Bulk add/remove via framework
      const addBulkMatch = pathname.match(/^\/api\/frameworks\/([^/]+)\/controls\/add-bulk$/);
      if (addBulkMatch && method === 'POST') {
        const frameworkId = addBulkMatch[1];
        const ids: string[] = body.controlIds || [];
        state.controls = state.controls.map((c) =>
          ids.includes(c.id) ? { ...c, frameworkId } : c,
        );
        return fulfill(route, 201, { data: { addedCount: ids.length } });
      }

      const removeBulkMatch = pathname.match(/^\/api\/frameworks\/([^/]+)\/controls\/remove-bulk$/);
      if (removeBulkMatch && method === 'POST') {
        const frameworkId = removeBulkMatch[1];
        const ids: string[] = body.controlIds || [];
        state.controls = state.controls.map((c) =>
          ids.includes(c.id) && c.frameworkId === frameworkId ? { ...c, frameworkId: null } : c,
        );
        return fulfill(route, 201, { data: { removedCount: ids.length } });
      }

      const frameworkControlsMatch = pathname.match(/^\/api\/frameworks\/([^/]+)\/controls$/);
      if (frameworkControlsMatch && method === 'GET') {
        const frameworkId = frameworkControlsMatch[1];
        const controls = state.controls.filter((c) => c.frameworkId === frameworkId);
        return fulfill(route, 200, { data: controls });
      }

      const controlDetailMatch = pathname.match(/^\/api\/frameworks\/controls\/([^/]+)$/);
      if (controlDetailMatch) {
        const controlId = controlDetailMatch[1];
        const control = state.controls.find((c) => c.id === controlId);
        if (!control) return fulfill(route, 404, { message: 'Control not found' });

        if (method === 'GET') return fulfill(route, 200, { data: control });
        if (method === 'PUT') {
          Object.assign(control, body);
          return fulfill(route, 200, { data: control });
        }
      }

      if (method === 'GET') {
        return fulfill(route, 200, { data: state.controls });
      }

      if (method === 'POST') {
        const control: Control = {
          id: uid(),
          controlId: body.controlId || body.requirementId || `CTRL-${state.controls.length + 1}`,
          name: body.title || body.name || 'Control',
          domain: body.domain || 'general',
          description: body.description || '',
          requirementId: body.requirementId || '',
          frameworkId: body.frameworkId ?? null,
        };
        state.controls.push(control);
        const framework = state.frameworks.find((f) => f.id === control.frameworkId);
        if (framework) framework.totalControls += 1;
        return fulfill(route, 201, { data: control });
      }
    }

    // Risks
    if (pathname.startsWith('/api/frameworks/risks')) {
      const riskMatch = pathname.match(/^\/api\/frameworks\/risks\/([^/]+)$/);
      if (riskMatch) {
        const riskId = riskMatch[1];
        const risk = state.risks.find((r) => r.id === riskId);
        if (!risk) return fulfill(route, 404, { message: 'Risk not found' });

        if (method === 'GET') return fulfill(route, 200, { data: risk });
        if (method === 'PUT') {
          Object.assign(risk, body);
          return fulfill(route, 200, { data: risk });
        }
        if (method === 'DELETE') {
          state.risks = state.risks.filter((r) => r.id !== riskId);
          return fulfill(route, 204, {});
        }
      }

      if (method === 'GET') {
        return fulfill(route, 200, { data: state.risks });
      }

      if (method === 'POST') {
        const risk: Risk = {
          id: uid(),
          riskId: body.riskId,
          title: body.title,
          description: body.description,
          linkedControls: body.linkedControls || [],
        };
        state.risks.push(risk);
        return fulfill(route, 201, { data: risk });
      }
    }

    // Frameworks root
    if (pathname === '/api/frameworks' && method === 'GET') {
      return fulfill(route, 200, { data: state.frameworks, total: state.frameworks.length });
    }

    if (pathname === '/api/frameworks' && method === 'POST') {
      const framework: Framework = {
        id: uid(),
        code: body.code,
        name: body.name,
        description: body.description,
        type: body.type || 'compliance',
        status: 'draft',
        totalControls: 0,
      };
      state.frameworks.push(framework);
      return fulfill(route, 201, { data: framework });
    }

    // Framework detail
    const frameworkMatch = pathname.match(/^\/api\/frameworks\/([^/]+)$/);
    if (frameworkMatch) {
      const frameworkId = frameworkMatch[1];
      const framework = state.frameworks.find((f) => f.id === frameworkId);
      if (!framework) return fulfill(route, 404, { message: 'Framework not found' });

      if (method === 'GET') return fulfill(route, 200, { data: framework });
      if (method === 'PUT') {
        Object.assign(framework, body);
        return fulfill(route, 200, { data: framework });
      }
      if (method === 'DELETE') {
        state.frameworks = state.frameworks.filter((f) => f.id !== frameworkId);
        state.controls = state.controls.map((c) =>
          c.frameworkId === frameworkId ? { ...c, frameworkId: null } : c,
        );
        return fulfill(route, 204, {});
      }
    }

    // Fallback
    return route.continue();
  });

  return state;
}

const createControlSeed = (state: ApiState, partial?: Partial<Control>) => {
  const control: Control = {
    id: uid(),
    controlId: partial?.controlId || `CTRL-${state.controls.length + 1}`,
    name: partial?.name || 'Test Control',
    domain: partial?.domain || 'security',
    description: partial?.description || 'Control description',
    requirementId: partial?.requirementId || `REQ-${state.controls.length + 1}`,
    frameworkId: partial?.frameworkId ?? null,
  };
  state.controls.push(control);
  return control;
};

const createRiskSeed = (state: ApiState, partial?: Partial<Risk>) => {
  const risk: Risk = {
    id: uid(),
    riskId: partial?.riskId || `RISK-${state.risks.length + 1}`,
    title: partial?.title || 'Test Risk',
    description: partial?.description || 'Risk description',
    linkedControls: partial?.linkedControls || [],
  };
  state.risks.push(risk);
  return risk;
};

test.describe('Playwright app flows (mocked API)', () => {
  test('framework creation and control onboarding', async ({ page }) => {
    await setupMockApi(page);

    await page.goto('/frameworks');

    await page.getByRole('button', { name: '+ Create' }).click();
    await page.getByPlaceholder('e.g., SCF-2024').fill('SCF-2025');
    await page.getByPlaceholder('e.g., Secure Controls Framework').fill('Secure Controls Framework');
    await page.getByPlaceholder('Describe the framework...').fill('Framework description');
    await page.getByRole('button', { name: 'Create Framework' }).click();

    await expect(page.getByText('Frameworks (1)')).toBeVisible();
    await page.getByRole('button', { name: /SCF-2025/ }).first().click();

    await page.getByRole('button', { name: '+ Create New' }).click();
    await page.getByPlaceholder('e.g., IAC-01').fill('REQ-001');
    await page.getByPlaceholder('e.g., Access Control Policy').fill('Access Control');
    await page.getByPlaceholder('Describe the control requirement...').fill('Only authorized users');
    await page.getByPlaceholder('e.g., Identity & Access Management').fill('Identity');
    await page.getByPlaceholder('e.g., Inventory and Control of Enterprise Assets').fill('security');
    await page.getByRole('button', { name: 'Create Control' }).click();

    await expect(page.getByText('1 controls')).toBeVisible();
  });

  test('risk creation with linked controls', async ({ page }) => {
    const state = await setupMockApi(page);
    const ctrlA = createControlSeed(state, { controlId: 'CTRL-001', name: 'Access Control' });
    const ctrlB = createControlSeed(state, { controlId: 'CTRL-002', name: 'Encryption' });

    await page.goto('/risks');
    await page.getByRole('button', { name: 'Add Risk' }).click();

    await page.getByPlaceholder('e.g., RISK-001').fill('RISK-100');
    await page.getByPlaceholder('e.g., Data Breach Risk').fill('Data Breach');
    await page.getByPlaceholder('Describe the risk...').fill('Sensitive data exposure');

    await expect(page.getByRole('checkbox', { name: new RegExp(ctrlA.controlId) })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: new RegExp(ctrlB.controlId) })).toBeVisible();
    await page.getByRole('checkbox', { name: new RegExp(ctrlA.controlId) }).check();
    await page.getByRole('checkbox', { name: new RegExp(ctrlB.controlId) }).check();

    await page.getByRole('button', { name: 'Create Risk' }).click();

    await expect(page.getByText('RISK-100')).toBeVisible();
    await expect(page.getByText('Data Breach')).toBeVisible();
    await expect(page.getByText(/CTRL-001/)).toBeVisible();
    await expect(page.getByText(/CTRL-002/)).toBeVisible();
  });

  test('risk detail allows linking/unlinking controls', async ({ page }) => {
    const state = await setupMockApi(page);
    const ctrlA = createControlSeed(state, { controlId: 'CTRL-010', name: 'MFA' });
    const ctrlB = createControlSeed(state, { controlId: 'CTRL-011', name: 'Logging' });
    const risk = createRiskSeed(state, { riskId: 'RISK-200', title: 'Unauthorized access', linkedControls: [ctrlA.id] });

    await page.goto(`/risks/${risk.id}`);
    await page.getByRole('button', { name: 'Edit' }).click();

    await expect(page.getByRole('checkbox', { name: /CTRL-011/ })).toBeVisible();
    await page.getByRole('checkbox', { name: /CTRL-011/ }).check();
    await page.getByRole('checkbox', { name: /CTRL-010/ }).uncheck();
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(/CTRL-011/)).toBeVisible();
    await expect(page.getByText(/CTRL-010/)).toHaveCount(0);
  });

  test('control detail renders control information', async ({ page }) => {
    const state = await setupMockApi(page);
    const control = createControlSeed(state, { controlId: 'CTRL-050', name: 'Asset Inventory' });

    await page.goto(`/controls/${control.id}`);

    await expect(page.getByRole('heading', { name: /CTRL-050/ })).toBeVisible();
    await expect(page.getByText(/Control Information/)).toBeVisible();
  });
});
