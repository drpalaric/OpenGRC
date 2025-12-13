import { Link, useLocation } from 'react-router-dom';

/**
 * Navigation item interface for sidebar menu
 */
interface NavItem {
  name: string;
  path: string;
}

/**
 * Sidebar navigation component
 * Provides fixed-width sidebar navigation with active state highlighting
 */
const Sidebar = () => {
  const location = useLocation();

  // Navigation menu items
  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/' },
    { name: 'Frameworks', path: '/frameworks' },
    { name: 'Controls', path: '/controls' },
    { name: 'Risks', path: '/risks' },
  ];

  /**
   * Determines if a navigation item is currently active
   * Dashboard (/) requires exact match, others match by prefix
   */
  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-black border-r border-gray-800 h-screen flex flex-col">
      {/* Logo/Brand Section */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">GRC Platform</h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    block px-4 py-2 rounded-lg font-medium transition-colors
                    ${
                      active
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                    }
                  `}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
