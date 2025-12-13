import { ReactNode } from 'react';
import Sidebar from './Sidebar';

/**
 * Layout component props
 */
interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout component that wraps all pages
 * Provides sidebar navigation and main content area with consistent styling
 */
const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen bg-black">
      {/* Fixed sidebar navigation */}
      <Sidebar />

      {/* Main content area - scrollable with padding */}
      <main className="flex-1 overflow-y-auto bg-black p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
