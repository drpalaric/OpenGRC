import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

describe('Sidebar Component', () => {
  it('should render all navigation links', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    // Verify all navigation items are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Frameworks')).toBeInTheDocument();
    expect(screen.getByText('Controls')).toBeInTheDocument();
    expect(screen.getByText('Risks')).toBeInTheDocument();
  });

  it('should render the GRC Platform logo', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    expect(screen.getByText('GRC Platform')).toBeInTheDocument();
  });

  it('should highlight active link for Dashboard route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-amber-500/10');
    expect(dashboardLink).toHaveClass('text-amber-400');
  });

  it('should highlight active link for Frameworks route', () => {
    render(
      <MemoryRouter initialEntries={['/frameworks']}>
        <Sidebar />
      </MemoryRouter>
    );

    const frameworksLink = screen.getByText('Frameworks').closest('a');
    expect(frameworksLink).toHaveClass('bg-amber-500/10');
    expect(frameworksLink).toHaveClass('text-amber-400');
  });

  it('should highlight active link for Controls route', () => {
    render(
      <MemoryRouter initialEntries={['/controls']}>
        <Sidebar />
      </MemoryRouter>
    );

    const controlsLink = screen.getByText('Controls').closest('a');
    expect(controlsLink).toHaveClass('bg-amber-500/10');
    expect(controlsLink).toHaveClass('text-amber-400');
  });

  it('should highlight active link for Risks route', () => {
    render(
      <MemoryRouter initialEntries={['/risks']}>
        <Sidebar />
      </MemoryRouter>
    );

    const risksLink = screen.getByText('Risks').closest('a');
    expect(risksLink).toHaveClass('bg-amber-500/10');
    expect(risksLink).toHaveClass('text-amber-400');
  });

  it('should have correct navigation link hrefs', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const frameworksLink = screen.getByText('Frameworks').closest('a');
    const controlsLink = screen.getByText('Controls').closest('a');
    const risksLink = screen.getByText('Risks').closest('a');

    expect(dashboardLink).toHaveAttribute('href', '/');
    expect(frameworksLink).toHaveAttribute('href', '/frameworks');
    expect(controlsLink).toHaveAttribute('href', '/controls');
    expect(risksLink).toHaveAttribute('href', '/risks');
  });

  it('should have black background styling', () => {
    const { container } = render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    const sidebar = container.firstChild;
    expect(sidebar).toHaveClass('bg-black');
  });

  it('should have fixed width of 256px (w-64)', () => {
    const { container } = render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    const sidebar = container.firstChild;
    expect(sidebar).toHaveClass('w-64');
  });

  it('should render inactive links with gray text', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>
    );

    // Dashboard is active, so Frameworks should be inactive (gray)
    const frameworksLink = screen.getByText('Frameworks').closest('a');
    expect(frameworksLink).toHaveClass('text-gray-400');
    expect(frameworksLink).not.toHaveClass('text-amber-400');
  });
});
