import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from './Layout';

describe('Layout Component', () => {
  it('should render children in the main content area', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div data-testid="test-child">Test Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render the Sidebar component', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>
    );

    // Verify sidebar navigation items are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Frameworks')).toBeInTheDocument();
    expect(screen.getByText('Controls')).toBeInTheDocument();
    expect(screen.getByText('Risks')).toBeInTheDocument();
  });

  it('should have a flex layout with sidebar and main content', () => {
    const { container } = render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>
    );

    const layoutWrapper = container.firstChild;
    expect(layoutWrapper).toHaveClass('flex');
    expect(layoutWrapper).toHaveClass('h-screen');
  });

  it('should have black background on main content area', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div data-testid="content">Content</div>
        </Layout>
      </BrowserRouter>
    );

    // Find the main content wrapper
    const main = screen.getByTestId('content').parentElement;
    expect(main).toHaveClass('bg-black');
  });

  it('should have proper padding on main content area', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div data-testid="content">Content</div>
        </Layout>
      </BrowserRouter>
    );

    // Main content should have padding (p-6 = 1.5rem = 24px like Jira)
    const main = screen.getByTestId('content').parentElement;
    expect(main).toHaveClass('p-6');
  });

  it('should make main content scrollable with overflow', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div data-testid="content">Content</div>
        </Layout>
      </BrowserRouter>
    );

    const main = screen.getByTestId('content').parentElement;
    expect(main).toHaveClass('overflow-y-auto');
  });

  it('should have flex-1 on main content to take remaining space', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div data-testid="content">Content</div>
        </Layout>
      </BrowserRouter>
    );

    const main = screen.getByTestId('content').parentElement;
    expect(main).toHaveClass('flex-1');
  });
});
