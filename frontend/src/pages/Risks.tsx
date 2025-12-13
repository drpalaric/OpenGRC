export default function Risks() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-white mb-8">Risk Management</h1>

      <div className="bg-black border border-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-white">
            Risk Register
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-400">
            <p>
              Risk management interface coming soon.
            </p>
            <p className="mt-2">
              For now, use the API directly at{' '}
              <a
                href="http://localhost:3008/api/risk/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 font-medium"
              >
                http://localhost:3008/api/risk/docs
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
