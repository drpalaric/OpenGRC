/**
 * Dashboard page component
 * Displays quick actions and getting started information
 */
export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>

      {/* Quick Actions Widget */}
      <div className="bg-gray-900 border border-gray-800 overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="w-full">
              <dl>
                <dt className="text-sm font-medium text-gray-400 truncate">Quick Actions</dt>
                <dd className="mt-3 space-y-2">
                  <a href="/controls" className="block text-sm text-amber-400 hover:text-amber-300 transition-colors">
                    → Manage Controls
                  </a>
                  <a href="/risks" className="block text-sm text-amber-400 hover:text-amber-300 transition-colors">
                    → Manage Risks
                  </a>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="bg-gray-900 border border-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-white">
            Getting Started
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-400">
            <p>
              Welcome to the GRC Platform. Use the sidebar navigation to manage frameworks, controls, and risks.
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
