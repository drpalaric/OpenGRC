import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Controls from './pages/Controls';
import Frameworks from './pages/Frameworks';
import Risks from './pages/Risks';
import ControlDetail from './pages/ControlDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-950">
        <nav className="bg-gray-900 border-b border-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-white">GRC Platform</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="border-transparent text-gray-300 hover:border-gray-500 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/frameworks"
                    className="border-transparent text-gray-300 hover:border-gray-500 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Frameworks
                  </Link>
                  <Link
                    to="/controls"
                    className="border-transparent text-gray-300 hover:border-gray-500 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Controls
                  </Link>
                  <Link
                    to="/risks"
                    className="border-transparent text-gray-300 hover:border-gray-500 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Risks
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/frameworks" element={<Frameworks />} />
            <Route path="/frameworks/controls/:controlId" element={<ControlDetail />} />
            <Route path="/controls" element={<Controls />} />
            <Route path="/controls/:controlId" element={<ControlDetail />} />
            <Route path="/risks" element={<Risks />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
