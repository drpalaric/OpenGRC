import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('should render the Sidebar navigation', () => {
    render(<App />);

    // Verify sidebar navigation items are present (using getAllByText to handle duplicates)
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getByText('Frameworks')).toBeInTheDocument();
    expect(screen.getByText('Controls')).toBeInTheDocument();
    expect(screen.getByText('Risks')).toBeInTheDocument();
  });

  it('should NOT render top navigation bar', () => {
    const { container } = render(<App />);

    // The old top nav had bg-gray-900 and border-b border-gray-800
    // Verify these are not present as a top nav structure
    const navElements = container.querySelectorAll('nav');

    // If there are nav elements, they should be in the sidebar, not a top bar
    // Top bar would have been a horizontal nav with specific classes
    navElements.forEach(nav => {
      expect(nav).not.toHaveClass('border-b', 'border-gray-800');
    });
  });

  it('should render the Layout component wrapper', () => {
    const { container } = render(<App />);

    // Layout has a flex container with sidebar
    const flexContainer = container.querySelector('.flex.h-screen');
    expect(flexContainer).toBeInTheDocument();
  });

  it('should render the GRC Platform branding in sidebar', () => {
    render(<App />);

    expect(screen.getByText('GRC Platform')).toBeInTheDocument();
  });

  it('should have black background theme', () => {
    const { container } = render(<App />);

    // Verify black background is present
    const blackBg = container.querySelector('.bg-black');
    expect(blackBg).toBeInTheDocument();
  });

  it('should render router and routing structure', () => {
    render(<App />);

    // Verify the BrowserRouter is rendering (check for presence of Routes)
    // The app should have navigation links which are only possible with Router
    const dashboardLinks = screen.getAllByText('Dashboard');
    const dashboardNavLink = dashboardLinks.find(el => el.closest('a'));
    expect(dashboardNavLink?.closest('a')).toHaveAttribute('href', '/');
  });

  it('should use Layout component for all routes', () => {
    const { container } = render(<App />);

    // Layout provides the sidebar + main content structure
    // Verify the structure exists (flex with sidebar width)
    const sidebar = container.querySelector('.w-64');
    expect(sidebar).toBeInTheDocument();

    const mainContent = container.querySelector('.flex-1');
    expect(mainContent).toBeInTheDocument();
  });
});
