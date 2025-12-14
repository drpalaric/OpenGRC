import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Framework {
  id: string;
  code: string;
  name: string;
}

interface FrameworkControl {
  id: string;
  frameworkId?: string;
  requirementId: string;
  title: string;
  description: string;
  category: string;
  domain?: string;
  priority: string;
  implementationStatus: string;
  requiresEvidence: boolean;
  guidance?: string;
  testingProcedure?: string;
  rationale?: string;
}

export default function Controls() {
  const navigate = useNavigate();
  const [allControls, setAllControls] = useState<FrameworkControl[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFramework, setFilterFramework] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [isCreatingControl, setIsCreatingControl] = useState(false);
  const [newControl, setNewControl] = useState<Partial<FrameworkControl>>({
    // frameworkId: undefined,
    requirementId: '',
    title: '',
    description: '',
    category: '',
    domain: '',
    priority: 'medium',
    implementationStatus: 'not_implemented',
    requiresEvidence: false,
    guidance: '',
    testingProcedure: '',
    rationale: ''
  });
  const [saving, setSaving] = useState(false);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch frameworks
      const fwResponse = await fetch('http://localhost:3002/api/frameworks/');
      const fwResult = await fwResponse.json();
      const frameworksList = fwResult.data || [];
      setFrameworks(frameworksList);

      // Fetch controls for each framework
      const ctrlResponse = await fetch('http://localhost:3002/api/frameworks/controls');
      const ctrlResult = await ctrlResponse.json();
      setAllControls(ctrlResult.data || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createControl = async () => {
    
    setSaving(true);
    try {
      const payload = {
         ...newControl,
        frameworkId: newControl.frameworkId || undefined,
      };
      await fetch('http://localhost:3002/api/frameworks/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await fetchData();
      setIsCreatingControl(false);
      setNewControl({
        frameworkId: '',
        requirementId: '',
        title: '',
        description: '',
        category: '',
        domain: '',
        priority: 'medium',
        implementationStatus: 'not_implemented',
        requiresEvidence: false,
        guidance: '',
        testingProcedure: '',
        rationale: ''
      });
    } catch (error) {
      console.error('Error creating control:', error);
    } finally {
      setSaving(false);
    }
  };

  // Filter controls
  const filteredControls = allControls.filter(control => {
    if (filterFramework && filterFramework === 'unassigned') {
      return !control.frameworkId;
    }
    if (filterFramework && control.frameworkId !== filterFramework) {
      return false;
    }
    if (filterDomain && control.domain !== filterDomain) {
      return false;
    }
    if (filterCategory && control.category !== filterCategory) {
      return false;
    }
    if (filterStatus && control.implementationStatus !== filterStatus) {
      return false;
    }
    return true;
  });

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(allControls.map(c => c.category))).filter(Boolean);

  // Get unique statuses for filter
  const uniqueStatuses = Array.from(new Set(allControls.map(c => c.implementationStatus)));

  // Get unique domains for filter
  const uniqueDomains = Array.from(new Set(allControls.map(c => c.domain))).filter(Boolean);

  // Handle column sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort controls
  const sortedControls = [...filteredControls].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: any = a[sortField as keyof FrameworkControl];
    let bValue: any = b[sortField as keyof FrameworkControl];

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // String comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Number/other comparison
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Render sort indicator
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center text-gray-400">Loading controls...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 bg-black min-h-screen">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Controls Management</h1>
          <p className="mt-2 text-sm text-gray-400">
            View and manage all controls across all frameworks
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsCreatingControl(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            + Create Control
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-black border border-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Framework
            </label>
            <select
              value={filterFramework}
              onChange={(e) => setFilterFramework(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
            >
              <option value="">All Frameworks</option>
              <option value="unassigned">Unassigned</option>
              {frameworks.map(fw => (
                <option key={fw.id} value={fw.id}>{fw.code} - {fw.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Domain
            </label>
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
            >
              <option value="">All Domains</option>
              {uniqueDomains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Implementation Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(filterFramework || filterCategory || filterStatus || filterDomain) && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Showing {filteredControls.length} of {allControls.length} controls
            </span>
            <button
              onClick={() => {
                setFilterFramework('');
                setFilterCategory('');
                setFilterStatus('');
                setFilterDomain('');
              }}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Controls Table */}
      <div className="bg-black border border-gray-800 rounded-lg shadow overflow-hidden">
        {sortedControls.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No controls found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-900">
                <tr>
                  <th
                    onClick={() => handleSort('requirementId')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-amber-400"
                  >
                    Control ID{renderSortIcon('requirementId')}
                  </th>
                  <th
                    onClick={() => handleSort('title')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-amber-400"
                  >
                    Name{renderSortIcon('title')}
                  </th>
                  <th
                    onClick={() => handleSort('domain')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-amber-400"
                  >
                    Domain{renderSortIcon('domain')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-black divide-y divide-gray-800">
                {sortedControls.map((control) => (
                  <tr
                    key={control.id}
                    onClick={() => navigate(`/controls/${control.id}`)}
                    className="hover:bg-gray-900 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-400">
                      {control.requirementId}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {control.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {control.domain || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      <div className="line-clamp-2">
                        {control.description}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Control Modal */}
      {isCreatingControl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Create New Control</h3>
              <button
                onClick={() => setIsCreatingControl(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Framework <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={newControl.frameworkId ?? ''}
                    onChange={(e) => setNewControl({ ...newControl, frameworkId: e.target.value === '' ? undefined : e.target.value  })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  >
                    <option value="">No Framework</option>
                    {frameworks.map(fw => (
                      <option key={fw.id} value={fw.id}>{fw.code} - {fw.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Requirement ID <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newControl.requirementId}
                    onChange={(e) => setNewControl({ ...newControl, requirementId: e.target.value })}
                    placeholder="e.g., IAC-01"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Title <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newControl.title}
                    onChange={(e) => setNewControl({ ...newControl, title: e.target.value })}
                    placeholder="e.g., Access Control Policy"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description <span className="text-amber-400">*</span>
                  </label>
                  <textarea
                    value={newControl.description}
                    onChange={(e) => setNewControl({ ...newControl, description: e.target.value })}
                    placeholder="Describe the control requirement..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newControl.category}
                    onChange={(e) => setNewControl({ ...newControl, category: e.target.value })}
                    placeholder="e.g., Identity & Access Management"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={newControl.domain || ''}
                    onChange={(e) => setNewControl({ ...newControl, domain: e.target.value })}
                    placeholder="e.g., Inventory and Control of Enterprise Assets"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newControl.priority}
                    onChange={(e) => setNewControl({ ...newControl, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Implementation Status
                  </label>
                  <select
                    value={newControl.implementationStatus}
                    onChange={(e) => setNewControl({ ...newControl, implementationStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  >
                    <option value="not_implemented">Not Implemented</option>
                    <option value="partially_implemented">Partially Implemented</option>
                    <option value="implemented">Implemented</option>
                    <option value="not_applicable">Not Applicable</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="newRequiresEvidence"
                    checked={newControl.requiresEvidence || false}
                    onChange={(e) => setNewControl({ ...newControl, requiresEvidence: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded bg-gray-800"
                  />
                  <label htmlFor="newRequiresEvidence" className="ml-2 block text-sm text-gray-300">
                    Requires Evidence
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => setIsCreatingControl(false)}
                className="px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={createControl}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                disabled={saving || !newControl.requirementId || !newControl.title || !newControl.description || !newControl.category}
              >
                {saving ? 'Creating...' : 'Create Control'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
