import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [controlsHealth, setControlsHealth] = useState<any>(null);
  const [risksHealth, setRisksHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const [controls, risks] = await Promise.all([
          axios.get('http://localhost:3001/api/controls/health'),
          axios.get('http://localhost:3008/api/risk/health'),
        ]);
        setControlsHealth(controls.data);
        setRisksHealth(risks.data);
      } catch (error) {
        console.error('Failed to fetch health status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Controls Service Status */}
        <div className="bg-gray-900 border border-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`h-3 w-3 rounded-full ${controlsHealth?.data?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Controls Service</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {controlsHealth?.data?.status || 'offline'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 px-5 py-3">
            <div className="text-sm">
              <a href="http://localhost:3001/api/controls/docs" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-400 hover:text-indigo-300">
                View API docs
              </a>
            </div>
          </div>
        </div>

        {/* Risk Service Status */}
        <div className="bg-gray-900 border border-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`h-3 w-3 rounded-full ${risksHealth?.data?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Risk Service</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {risksHealth?.data?.status || 'offline'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 px-5 py-3">
            <div className="text-sm">
              <a href="http://localhost:3008/api/risk/docs" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-400 hover:text-indigo-300">
                View API docs
              </a>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-900 border border-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Quick Actions</dt>
                  <dd className="mt-3 space-y-2">
                    <a href="/controls" className="block text-sm text-indigo-400 hover:text-indigo-300">
                      → Manage Controls
                    </a>
                    <a href="/risks" className="block text-sm text-indigo-400 hover:text-indigo-300">
                      → Manage Risks
                    </a>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-900 border border-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-white">
            Getting Started
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-400">
            <p>
              Welcome to the GRC Platform. Use the navigation above to manage controls and risks.
            </p>
          </div>
          <div className="mt-5">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-white">Backend Services</dt>
                <dd className="mt-1 text-sm text-gray-400">
                  <ul className="list-disc list-inside">
                    <li>Controls Service: Running on port 3001</li>
                    <li>Risk Service: Running on port 3008</li>
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
