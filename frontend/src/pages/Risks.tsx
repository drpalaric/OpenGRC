import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Risk interface matching backend entity
interface Risk {
  id: string;
  riskId: string;
  title: string;
  description?: string;
  inherentLikelihood?: string;
  inherentImpact?: string;
  residualLikelihood?: string;
  residualImpact?: string;
  riskLevel?: string;
  treatment?: string;
  threats?: string;
  linkedControls?: string[];
  stakeholders?: string[];
  creator?: string;
  businessUnit?: string;
  riskOwner?: string;
  assets?: string;
}

// Control interface for linking
interface Control {
  id: string;
  controlId: string;
  name: string;
  domain: string;
  description: string;
}

// Helper function to get color class for risk level
const getRiskLevelColor = (level?: string): string => {
  switch (level) {
    case 'very_low':
      return 'bg-white text-black';
    case 'low':
      return 'bg-gray-300 text-black';
    case 'medium':
      return 'bg-amber-500 text-white';
    case 'high':
      return 'bg-orange-600 text-white';
    case 'critical':
      return 'bg-red-900 text-white';
    default:
      return 'bg-gray-700 text-gray-300';
  }
};

export default function Risks() {
  const navigate = useNavigate();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingRisk, setIsCreatingRisk] = useState(false);
  const [controlSearch, setControlSearch] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [newRisk, setNewRisk] = useState<Partial<Risk>>({
    riskId: '',
    title: '',
    description: '',
    inherentLikelihood: undefined,
    inherentImpact: undefined,
    residualLikelihood: undefined,
    residualImpact: undefined,
    treatment: undefined,
    threats: '',
    linkedControls: [],
    stakeholders: [],
    creator: '',
    businessUnit: '',
    riskOwner: '',
    assets: ''
  });

  useEffect(() => {
    fetchRisks();
    fetchControls();
  }, []);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3002/api/frameworks/risks');
      const result = await response.json();
      setRisks(result.data || []);
    } catch (error) {
      console.error('Error fetching risks:', error);
      setRisks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchControls = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/frameworks/controls');
      const result = await response.json();
      setControls(result.data || []);
    } catch (error) {
      console.error('Error fetching controls:', error);
      setControls([]);
    }
  };

  const createRisk = async () => {
    try {
      await fetch('http://localhost:3002/api/frameworks/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRisk)
      });
      await fetchRisks();
      setIsCreatingRisk(false);
      // Reset form
      setNewRisk({
        riskId: '',
        title: '',
        description: '',
        inherentLikelihood: undefined,
        inherentImpact: undefined,
        residualLikelihood: undefined,
        residualImpact: undefined,
        treatment: undefined,
        threats: '',
        linkedControls: [],
        stakeholders: [],
        creator: '',
        businessUnit: '',
        riskOwner: '',
        assets: ''
      });
      setControlSearch('');
    } catch (error) {
      console.error('Error creating risk:', error);
    }
  };

  const toggleControlLink = (controlId: string) => {
    const currentLinks = newRisk.linkedControls || [];
    if (currentLinks.includes(controlId)) {
      setNewRisk({
        ...newRisk,
        linkedControls: currentLinks.filter(id => id !== controlId)
      });
    } else {
      setNewRisk({
        ...newRisk,
        linkedControls: [...currentLinks, controlId]
      });
    }
  };

  // Filter controls based on search and sort alphabetically by controlId
  const filteredControls = controls
    .filter(control => {
      if (!controlSearch) return true;
      const searchLower = controlSearch.toLowerCase();
      return (
        control.name.toLowerCase().includes(searchLower) ||
        control.description.toLowerCase().includes(searchLower) ||
        control.controlId.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => a.controlId.localeCompare(b.controlId));

  // Render linked controls with "..." if more than 3
  const renderLinkedControls = (linkedControls?: string[]) => {
    if (!linkedControls || linkedControls.length === 0) {
      return <span className="text-gray-500">None</span>;
    }

    // Sort controls alphabetically by controlId
    const sortedControls = [...linkedControls].sort((a, b) => a.localeCompare(b));
    const displayControls = sortedControls.slice(0, 3);
    const hasMore = sortedControls.length > 3;

    return (
      <div className="flex flex-wrap gap-1">
        {displayControls.map(controlId => {
          // Find the control details from the controls array
          const control = controls.find(c => c.controlId === controlId);
          if (control) {
            return (
              <span key={controlId} className="text-xs text-gray-400">
                {control.controlId}, {control.domain}, {control.name}
              </span>
            );
          }
          // Fallback to just showing the ID if control not found
          return (
            <span key={controlId} className="text-xs text-gray-400">
              {controlId}
            </span>
          );
        })}
        {hasMore && <span className="text-xs text-gray-400">...</span>}
      </div>
    );
  };

  // Handle column sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort risks based on current sort field and direction
  const sortedRisks = [...risks].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: any = a[sortField as keyof Risk];
    let bValue: any = b[sortField as keyof Risk];

    // Handle linked controls sorting
    if (sortField === 'linkedControls') {
      aValue = a.linkedControls?.length || 0;
      bValue = b.linkedControls?.length || 0;
    }

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // String comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Number comparison
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
        <div className="text-center text-gray-400">Loading risks...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 bg-black min-h-screen">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Risk Management</h1>
          <p className="mt-2 text-sm text-gray-400">
            Manage and track organizational risks
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsCreatingRisk(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
          >
            Add Risk
          </button>
        </div>
      </div>

      {/* Risks Table */}
      <div className="bg-black border border-gray-800 rounded-lg shadow overflow-hidden">
        {risks.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No risks found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-900">
                <tr>
                  <th
                    onClick={() => handleSort('riskId')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-amber-400"
                  >
                    Risk ID{renderSortIcon('riskId')}
                  </th>
                  <th
                    onClick={() => handleSort('title')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-amber-400"
                  >
                    Title{renderSortIcon('title')}
                  </th>
                  <th
                    onClick={() => handleSort('riskOwner')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-amber-400"
                  >
                    Owner{renderSortIcon('riskOwner')}
                  </th>
                  <th
                    onClick={() => handleSort('linkedControls')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-amber-400"
                  >
                    Linked Controls{renderSortIcon('linkedControls')}
                  </th>
                  <th
                    onClick={() => handleSort('inherentLikelihood')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-amber-400"
                  >
                    Likelihood{renderSortIcon('inherentLikelihood')}
                  </th>
                  <th
                    onClick={() => handleSort('inherentImpact')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-amber-400"
                  >
                    Impact{renderSortIcon('inherentImpact')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-black divide-y divide-gray-800">
                {sortedRisks.map((risk) => (
                  <tr
                    key={risk.id}
                    onClick={() => navigate(`/risks/${risk.id}`)}
                    className="hover:bg-gray-900 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-400">
                      {risk.riskId}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {risk.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {risk.riskOwner || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {renderLinkedControls(risk.linkedControls)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(risk.inherentLikelihood)}`}>
                        {risk.inherentLikelihood?.replace('_', ' ') || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(risk.inherentImpact)}`}>
                        {risk.inherentImpact?.replace('_', ' ') || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Risk Modal */}
      {isCreatingRisk && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Create New Risk</h3>
              <button
                onClick={() => setIsCreatingRisk(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-4">
                {/* Required Fields */}
                <div>
                  <label htmlFor="riskId" className="block text-sm font-medium text-gray-300 mb-1">
                    Risk ID <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="riskId"
                    type="text"
                    value={newRisk.riskId}
                    onChange={(e) => setNewRisk({ ...newRisk, riskId: e.target.value })}
                    placeholder="e.g., RISK-001"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                    Title <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={newRisk.title}
                    onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
                    placeholder="e.g., Data Breach Risk"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>

                {/* Optional Fields */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newRisk.description || ''}
                    onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                    placeholder="Describe the risk..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inherentLikelihood" className="block text-sm font-medium text-gray-300 mb-1">
                      Inherent Likelihood
                    </label>
                    <select
                      id="inherentLikelihood"
                      value={newRisk.inherentLikelihood || ''}
                      onChange={(e) => setNewRisk({ ...newRisk, inherentLikelihood: e.target.value || undefined })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                    >
                      <option value="">Select...</option>
                      <option value="very_low">Very Low</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="inherentImpact" className="block text-sm font-medium text-gray-300 mb-1">
                      Inherent Impact
                    </label>
                    <select
                      id="inherentImpact"
                      value={newRisk.inherentImpact || ''}
                      onChange={(e) => setNewRisk({ ...newRisk, inherentImpact: e.target.value || undefined })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                    >
                      <option value="">Select...</option>
                      <option value="very_low">Very Low</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="residualLikelihood" className="block text-sm font-medium text-gray-300 mb-1">
                      Residual Likelihood
                    </label>
                    <select
                      id="residualLikelihood"
                      value={newRisk.residualLikelihood || ''}
                      onChange={(e) => setNewRisk({ ...newRisk, residualLikelihood: e.target.value || undefined })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                    >
                      <option value="">Select...</option>
                      <option value="very_low">Very Low</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="residualImpact" className="block text-sm font-medium text-gray-300 mb-1">
                      Residual Impact
                    </label>
                    <select
                      id="residualImpact"
                      value={newRisk.residualImpact || ''}
                      onChange={(e) => setNewRisk({ ...newRisk, residualImpact: e.target.value || undefined })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                    >
                      <option value="">Select...</option>
                      <option value="very_low">Very Low</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="treatment" className="block text-sm font-medium text-gray-300 mb-1">
                    Treatment
                  </label>
                  <select
                    id="treatment"
                    value={newRisk.treatment || ''}
                    onChange={(e) => setNewRisk({ ...newRisk, treatment: e.target.value || undefined })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="Accept">Accept</option>
                    <option value="Mitigate">Mitigate</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Avoid">Avoid</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="threats" className="block text-sm font-medium text-gray-300 mb-1">
                    Threats
                  </label>
                  <textarea
                    id="threats"
                    value={newRisk.threats || ''}
                    onChange={(e) => setNewRisk({ ...newRisk, threats: e.target.value })}
                    placeholder="Describe potential threats..."
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="riskOwner" className="block text-sm font-medium text-gray-300 mb-1">
                    Risk Owner
                  </label>
                  <input
                    id="riskOwner"
                    type="text"
                    value={newRisk.riskOwner || ''}
                    onChange={(e) => setNewRisk({ ...newRisk, riskOwner: e.target.value })}
                    placeholder="e.g., CISO"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="creator" className="block text-sm font-medium text-gray-300 mb-1">
                    Creator
                  </label>
                  <input
                    id="creator"
                    type="text"
                    value={newRisk.creator || ''}
                    onChange={(e) => setNewRisk({ ...newRisk, creator: e.target.value })}
                    placeholder="e.g., John Doe"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="businessUnit" className="block text-sm font-medium text-gray-300 mb-1">
                    Business Unit
                  </label>
                  <input
                    id="businessUnit"
                    type="text"
                    value={newRisk.businessUnit || ''}
                    onChange={(e) => setNewRisk({ ...newRisk, businessUnit: e.target.value })}
                    placeholder="e.g., IT Department"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="assets" className="block text-sm font-medium text-gray-300 mb-1">
                    Assets
                  </label>
                  <textarea
                    id="assets"
                    value={newRisk.assets || ''}
                    onChange={(e) => setNewRisk({ ...newRisk, assets: e.target.value })}
                    placeholder="List affected assets..."
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>

                {/* Control Linking Section */}
                <div className="border-t border-gray-700 pt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Linked Controls
                  </label>
                  <input
                    type="text"
                    value={controlSearch}
                    onChange={(e) => setControlSearch(e.target.value)}
                    placeholder="Search controls by title, description, or ID"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm mb-3"
                  />
                  <div className="max-h-48 overflow-y-auto bg-gray-900 rounded-md border border-gray-700">
                    {filteredControls.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No controls found
                      </div>
                    ) : (
                      filteredControls.map(control => (
                        <div
                          key={control.id}
                          className="px-4 py-2 hover:bg-gray-800 border-b border-gray-800 last:border-b-0"
                        >
                          <label className="flex items-start cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newRisk.linkedControls?.includes(control.controlId) || false}
                              onChange={() => toggleControlLink(control.controlId)}
                              className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-700 rounded bg-gray-800"
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-white">
                                {control.controlId} - {control.name}
                              </div>
                              <div className="text-xs text-gray-400 line-clamp-1">
                                {control.description}
                              </div>
                            </div>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => setIsCreatingRisk(false)}
                className="px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={createRisk}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                disabled={!newRisk.riskId || !newRisk.title}
              >
                Create Risk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
