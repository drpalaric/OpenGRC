import { test, expect } from '@playwright/test';

test.describe('Dashboard smoke test', () => {
  test('renders dashboard with quick actions', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Quick Actions')).toBeVisible();
    await expect(page.getByRole('link', { name: /Manage Controls/i })).toHaveAttribute('href', '/controls');
    await expect(page.getByRole('link', { name: /Manage Risks/i })).toHaveAttribute('href', '/risks');
  });

  test('shows backend service guidance', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/Backend Services/i)).toBeVisible();
    await expect(page.getByText(/Controls Service: Running on port 3001/)).toBeVisible();
    await expect(page.getByText(/Risk Service: Running on port 3008/)).toBeVisible();
  });
});
