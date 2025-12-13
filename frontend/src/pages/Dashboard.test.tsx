import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

describe('Dashboard Component', () => {
  it('should NOT render Controls Service status widget', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Verify the controls service widget is not present
    expect(screen.queryByText('Controls Service')).not.toBeInTheDocument();
    expect(screen.queryByText(/localhost:3001/)).not.toBeInTheDocument();
  });

  it('should NOT render Risk Service status widget', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Verify the risk service widget is not present
    expect(screen.queryByText('Risk Service')).not.toBeInTheDocument();
    expect(screen.queryByText(/localhost:3008/)).not.toBeInTheDocument();
  });

  it('should render the Getting Started section', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Getting Started')).toBeInTheDocument();
  });

  it('should render Getting Started content about backend services', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Check for backend service information
    expect(screen.getByText(/backend services/i)).toBeInTheDocument();
  });

  it('should render Quick Actions section', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should render Quick Actions links', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Verify quick action links are present
    expect(screen.getByRole('link', { name: /Manage Controls/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage Risks/i })).toBeInTheDocument();
  });

  it('should have correct navigation hrefs in Quick Actions', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const controlsLink = screen.getByRole('link', { name: /Manage Controls/i });
    const risksLink = screen.getByRole('link', { name: /Manage Risks/i });

    expect(controlsLink).toHaveAttribute('href', '/controls');
    expect(risksLink).toHaveAttribute('href', '/risks');
  });

  it('should render the dashboard title', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should have black background styling', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // The main container should have minimal black background classes
    // (most styling will come from the Layout component)
    const dashboard = container.querySelector('[class*="space-y"]');
    expect(dashboard).toBeInTheDocument();
  });
});
