import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Control interface from master library
 * Source of truth for all control definitions (SCF, CIS, NIST, custom, etc.)
 */
interface Control {
  id: string; // UUID
  controlId: string; // Business ID (e.g., AST-01)
  source: string;
  name: string;
  description: string | null;
  domain: string;
  procedure: string | null;
  maturity: string | null;
  nist80053: string | null;
  nistCsf: string | null;
  iso27k: string | null;
  pci4: string | null;
  mitre: string | null;
  evidence: string | null;
  policy: string | null;
}

export default function Controls() {
  const navigate = useNavigate();
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'controlId' | 'name' | 'domain' | 'nist80053'>('controlId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchControls();
  }, []);

  const fetchControls = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3002/api/frameworks/controls');
      const result = await response.json();
      setControls(result.data || []);
    } catch (error) {
      console.error('Error fetching controls:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique domains and sources for filter dropdowns
  const domains = Array.from(new Set(controls.map(c => c.domain))).sort();
  const sources = Array.from(new Set(controls.map(c => c.source))).sort();

  // Handle column sort
  const handleSort = (field: 'controlId' | 'name' | 'domain' | 'nist80053') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter controls
  const filteredControls = controls.filter(control => {
    const matchesDomain = !filterDomain || control.domain === filterDomain;
    const matchesSource = !filterSource || control.source === filterSource;
    const matchesSearch = !searchQuery ||
      control.controlId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      control.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (control.description && control.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDomain && matchesSource && matchesSearch;
  }).sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    const comparison = aValue.toString().localeCompare(bValue.toString());
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleRowClick = (controlId: string) => {
    navigate(`/controls/${controlId}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Controls Library</h1>
        <p className="text-gray-400">
          Master library of security controls - {controls.length} controls from various frameworks
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, or description..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Filter by Source
          </label>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Sources</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Filter by Domain
          </label>
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Domains</option>
            {domains.map(domain => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading controls...</div>
      ) : (
        <>
          <div className="text-sm text-gray-400 mb-4">
            Showing {filteredControls.length} of {controls.length} controls
          </div>

          <div className="bg-black border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900">
                    <th
                      onClick={() => handleSort('controlId')}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center">
                        Control ID
                        {sortField === 'controlId' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('name')}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center">
                        Name
                        {sortField === 'name' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('domain')}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center">
                        Domain
                        {sortField === 'domain' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('nist80053')}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center">
                        NIST 800-53
                        {sortField === 'nist80053' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredControls.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                        No controls found matching your filters
                      </td>
                    </tr>
                  ) : (
                    filteredControls.map(control => (
                      <tr
                        key={control.id}
                        onClick={() => handleRowClick(control.id)}
                        className="hover:bg-gray-900 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-amber-500">
                          {control.controlId}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {control.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {control.domain}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {control.nist80053 || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
