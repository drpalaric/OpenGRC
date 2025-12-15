import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

describe('Dashboard Component', () => {
  it('shows the dashboard title and hero sections', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
  });

  it('lists backend service information in Getting Started', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Backend Services/i)).toBeInTheDocument();
    expect(screen.getByText(/Controls Service: Running on port 3001/)).toBeInTheDocument();
    expect(screen.getByText(/Risk Service: Running on port 3008/)).toBeInTheDocument();
  });

  it('renders navigation links for managing controls and risks', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const controlsLink = screen.getByRole('link', { name: /Manage Controls/i });
    const risksLink = screen.getByRole('link', { name: /Manage Risks/i });

    expect(controlsLink).toBeInTheDocument();
    expect(risksLink).toBeInTheDocument();
    expect(controlsLink).toHaveAttribute('href', '/controls');
    expect(risksLink).toHaveAttribute('href', '/risks');
  });
});
