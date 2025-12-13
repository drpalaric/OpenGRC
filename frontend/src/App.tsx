import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Controls from './pages/Controls';
import Frameworks from './pages/Frameworks';
import Risks from './pages/Risks';
import ControlDetail from './pages/ControlDetail';

/**
 * Main application component
 * Sets up routing and wraps all pages with the sidebar layout
 */
function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/frameworks" element={<Frameworks />} />
          <Route path="/frameworks/controls/:controlId" element={<ControlDetail />} />
          <Route path="/controls" element={<Controls />} />
          <Route path="/controls/:controlId" element={<ControlDetail />} />
          <Route path="/risks" element={<Risks />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
