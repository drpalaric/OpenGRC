import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Framework {
  id: string;
  code: string;
  name: string;
  description: string;
  type: string;
  status: string;
  totalControls: number;
  implementedControls: number;
  completionPercentage: string;
  publisher?: string;
  version?: string;
}

interface FrameworkControl {
  id: string;
  frameworkId?: string | null;
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

export default function Frameworks() {
  const navigate = useNavigate();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [controls, setControls] = useState<FrameworkControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingControl, setEditingControl] = useState<FrameworkControl | null>(null);
  const [isCreatingControl, setIsCreatingControl] = useState(false);
  const [isCreatingFramework, setIsCreatingFramework] = useState(false);
  const [newFramework, setNewFramework] = useState({
    code: '',
    name: '',
    description: '',
    type: 'compliance',
    publisher: '',
    version: ''
  });
  const [newControl, setNewControl] = useState<Partial<FrameworkControl>>({
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [frameworkToDelete, setFrameworkToDelete] = useState<Framework | null>(null);
  const [selectedControlIds, setSelectedControlIds] = useState<Set<string>>(new Set());
  const [isRemovingControls, setIsRemovingControls] = useState(false);
  const [isAddExistingControlsOpen, setIsAddExistingControlsOpen] = useState(false);
  const [availableControls, setAvailableControls] = useState<FrameworkControl[]>([]);
  const [controlsToAdd, setControlsToAdd] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('');
  const [isAddingControls, setIsAddingControls] = useState(false);

  useEffect(() => {
    fetchFrameworks();
  }, []);

  const fetchFrameworks = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/frameworks');
      const result = await response.json();
      // API returns paginated data with structure: { data: [...], total, page, limit }
      setFrameworks(result.data || []);
    } catch (error) {
      console.error('Error fetching frameworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchControls = async (frameworkId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/frameworks/${frameworkId}/controls`);
      const result = await response.json();
      setControls(result.data || []);
    } catch (error) {
      console.error('Error fetching controls:', error);
    }
  };

  const selectFramework = async (framework: Framework) => {
    setSelectedFramework(framework);
    await fetchControls(framework.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-amber-900 text-amber-200';
      case 'high': return 'bg-orange-900 text-orange-200';
      case 'medium': return 'bg-yellow-900 text-yellow-200';
      case 'low': return 'bg-green-900 text-green-200';
      default: return 'bg-gray-800 text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-900 text-green-200';
      case 'partially_implemented': return 'bg-yellow-900 text-yellow-200';
      case 'not_implemented': return 'bg-gray-800 text-gray-300';
      default: return 'bg-gray-800 text-gray-300';
    }
  };

  const saveControl = async (controlId: string, updates: Partial<FrameworkControl>) => {
    setSaving(true);
    try {
      await fetch(`http://localhost:3002/api/frameworks/controls/${controlId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (selectedFramework) {
        await fetchControls(selectedFramework.id);
        await fetchFrameworks();
      }
      setEditingControl(null);
    } catch (error) {
      console.error('Error saving control:', error);
    } finally {
      setSaving(false);
    }
  };

  const createControl = async () => {

    setSaving(true);
    try {
      await fetch('http://localhost:3002/api/frameworks/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newControl,
          frameworkId: selectedFramework?.id ?? null
        })
      });
      if (selectedFramework) {
        await fetchControls(selectedFramework.id);
      }
      await fetchFrameworks();
      setIsCreatingControl(false);
      setNewControl({
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

  const createFramework = async () => {
    setSaving(true);
    try {
      const response = await fetch('http://localhost:3002/api/frameworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFramework)
      });
      const result = await response.json();
      await fetchFrameworks();
      setIsCreatingFramework(false);
      setNewFramework({
        code: '',
        name: '',
        description: '',
        type: 'compliance',
        publisher: '',
        version: ''
      });
      // Auto-select the newly created framework
      if (result.data) {
        await selectFramework(result.data);
      }
    } catch (error) {
      console.error('Error creating framework:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Delete a framework with confirmation
   * Controls are unlinked (not deleted) when framework is removed
   */
  const confirmDeleteFramework = (framework: Framework) => {
    setFrameworkToDelete(framework);
    setIsDeleteDialogOpen(true);
  };

  const deleteFramework = async () => {
    if (!frameworkToDelete) return;

    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3002/api/frameworks/${frameworkToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Clear selection if deleted framework was selected
        if (selectedFramework?.id === frameworkToDelete.id) {
          setSelectedFramework(null);
          setControls([]);
        }
        await fetchFrameworks();
        setIsDeleteDialogOpen(false);
        setFrameworkToDelete(null);
      } else {
        console.error('Failed to delete framework');
      }
    } catch (error) {
      console.error('Error deleting framework:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Bulk remove selected controls from the current framework
   * Controls are unlinked (frameworkId set to null), not deleted
   */
  const bulkRemoveControls = async () => {
    if (!selectedFramework || selectedControlIds.size === 0) return;

    setIsRemovingControls(true);
    try {
      const response = await fetch(
        `http://localhost:3002/api/frameworks/${selectedFramework.id}/controls/remove-bulk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            controlIds: Array.from(selectedControlIds)
          })
        }
      );

      if (response.ok) {
        // Refresh controls and frameworks to update counts
        await fetchControls(selectedFramework.id);
        await fetchFrameworks();
        setSelectedControlIds(new Set());
      } else {
        console.error('Failed to remove controls');
      }
    } catch (error) {
      console.error('Error removing controls:', error);
    } finally {
      setIsRemovingControls(false);
    }
  };

  /**
   * Toggle control selection for bulk operations
   */
  const toggleControlSelection = (controlId: string) => {
    setSelectedControlIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(controlId)) {
        newSet.delete(controlId);
      } else {
        newSet.add(controlId);
      }
      return newSet;
    });
  };

  /**
   * Select or deselect all controls
   */
  const toggleAllControls = () => {
    if (selectedControlIds.size === controls.length) {
      setSelectedControlIds(new Set());
    } else {
      setSelectedControlIds(new Set(controls.map(c => c.id)));
    }
  };

  /**
   * Fetch all available controls (unlinked + from other frameworks)
   */
  const fetchAvailableControls = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/frameworks/controls');
      const result = await response.json();
      // API returns { data: [...] }
      const allControls = result.data || result;
      // Filter out controls already in current framework
      const filtered = allControls.filter((c: FrameworkControl) =>
        !selectedFramework || c.frameworkId !== selectedFramework.id
      );
      setAvailableControls(filtered);
    } catch (error) {
      console.error('Error fetching available controls:', error);
    }
  };

  /**
   * Open the add existing controls modal
   */
  const openAddExistingControls = async () => {
    await fetchAvailableControls();
    setIsAddExistingControlsOpen(true);
    setControlsToAdd(new Set());
    setSearchQuery('');
    setDomainFilter('');
  };

  /**
   * Toggle control selection in add modal
   */
  const toggleControlToAdd = (controlId: string) => {
    setControlsToAdd(prev => {
      const newSet = new Set(prev);
      if (newSet.has(controlId)) {
        newSet.delete(controlId);
      } else {
        newSet.add(controlId);
      }
      return newSet;
    });
  };

  /**
   * Select or deselect all filtered controls
   */
  const toggleAllControlsToAdd = () => {
    const filtered = getFilteredAvailableControls();
    if (controlsToAdd.size === filtered.length && filtered.length > 0) {
      setControlsToAdd(new Set());
    } else {
      setControlsToAdd(new Set(filtered.map(c => c.id)));
    }
  };

  /**
   * Filter available controls by search and domain
   */
  const getFilteredAvailableControls = () => {
    return availableControls.filter(control => {
      // Search filter
      const matchesSearch = !searchQuery ||
        control.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        control.requirementId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (control.description && control.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Domain filter
      const matchesDomain = !domainFilter || control.domain === domainFilter;

      return matchesSearch && matchesDomain;
    });
  };

  /**
   * Get unique domains from available controls
   */
  const getUniqueDomains = () => {
    const domains = new Set<string>();
    availableControls.forEach(control => {
      if (control.domain) {
        domains.add(control.domain);
      }
    });
    return Array.from(domains).sort();
  };

  /**
   * Bulk add selected controls to the current framework
   */
  const bulkAddControls = async () => {
    if (!selectedFramework || controlsToAdd.size === 0) return;

    setIsAddingControls(true);
    try {
      const response = await fetch(
        `http://localhost:3002/api/frameworks/${selectedFramework.id}/controls/add-bulk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            controlIds: Array.from(controlsToAdd)
          })
        }
      );

      if (response.ok) {
        // Refresh controls and frameworks to update counts
        await fetchControls(selectedFramework.id);
        await fetchFrameworks();
        setIsAddExistingControlsOpen(false);
        setControlsToAdd(new Set());
      } else {
        console.error('Failed to add controls');
      }
    } catch (error) {
      console.error('Error adding controls:', error);
    } finally {
      setIsAddingControls(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center text-gray-400">Loading frameworks...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Compliance Frameworks</h1>
          <p className="mt-2 text-sm text-gray-400">
            Manage compliance frameworks and their control requirements
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <a
            href="http://localhost:3002/api/frameworks/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
          >
            API Docs
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Frameworks List */}
        <div className="lg:col-span-1">
          <div className="bg-black border border-gray-800 rounded-lg shadow">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">Frameworks ({frameworks.length})</h2>
              <button
                onClick={() => setIsCreatingFramework(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                + Create
              </button>
            </div>
            <div className="divide-y divide-gray-800">
              {frameworks.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  No frameworks found
                </div>
              ) : (
                frameworks.map((framework) => (
                  <div
                    key={framework.id}
                    className={`px-4 py-4 hover:bg-gray-800 transition-colors ${
                      selectedFramework?.id === framework.id ? 'bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => selectFramework(framework)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="text-sm font-medium text-white truncate">
                          {framework.code}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {framework.name}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-900 text-indigo-200">
                            {framework.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {framework.totalControls} controls
                          </span>
                        </div>
                      </button>
                      <div className="ml-2 flex-shrink-0 flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-400">
                            {framework.completionPercentage}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {framework.implementedControls}/{framework.totalControls}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteFramework(framework);
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20"
                          title="Delete framework"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Framework Details & Controls */}
        <div className="lg:col-span-2">
          {selectedFramework ? (
            <>
              {/* Framework Info */}
              <div className="bg-black border border-gray-800 rounded-lg shadow mb-6">
                <div className="px-6 py-4 border-b border-gray-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedFramework.name}</h2>
                      <p className="mt-1 text-sm text-gray-400">{selectedFramework.code}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        selectedFramework.status === 'active' ? 'bg-green-900 text-green-200' : 'bg-gray-800 text-gray-300'
                      }`}>
                        {selectedFramework.status}
                      </span>
                      <button
                        onClick={() => confirmDeleteFramework(selectedFramework)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-700 text-sm font-medium rounded-md text-red-300 bg-red-900 bg-opacity-20 hover:bg-opacity-30"
                      >
                        Delete Framework
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-300 mb-4">{selectedFramework.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedFramework.publisher && (
                      <div>
                        <span className="text-gray-500">Publisher:</span>
                        <span className="ml-2 text-gray-300">{selectedFramework.publisher}</span>
                      </div>
                    )}
                    {selectedFramework.version && (
                      <div>
                        <span className="text-gray-500">Version:</span>
                        <span className="ml-2 text-gray-300">{selectedFramework.version}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Completion Progress</span>
                      <span className="text-white font-medium">{selectedFramework.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${selectedFramework.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls List */}
              <div className="bg-black border border-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-white">
                      Controls ({controls.length})
                    </h3>
                    {controls.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="selectAll"
                          checked={selectedControlIds.size === controls.length && controls.length > 0}
                          onChange={toggleAllControls}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded bg-gray-800"
                        />
                        <label htmlFor="selectAll" className="text-sm text-gray-400">
                          Select All
                        </label>
                      </div>
                    )}
                    {selectedControlIds.size > 0 && (
                      <button
                        onClick={bulkRemoveControls}
                        disabled={isRemovingControls}
                        className="inline-flex items-center px-3 py-1.5 border border-red-700 text-sm font-medium rounded-md text-red-300 bg-red-900 bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50"
                      >
                        {isRemovingControls ? 'Removing...' : `Remove ${selectedControlIds.size} Selected`}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={openAddExistingControls}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
                    >
                      + Add Existing
                    </button>
                    <button
                      onClick={() => setIsCreatingControl(true)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      + Create New
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-800">
                  {controls.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                      No controls found for this framework
                    </div>
                  ) : (
                    controls.map((control) => (
                      <div key={control.id} className="px-6 py-4 hover:bg-gray-800 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="flex items-center pt-1">
                            <input
                              type="checkbox"
                              checked={selectedControlIds.has(control.id)}
                              onChange={() => toggleControlSelection(control.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded bg-gray-800"
                            />
                          </div>
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => navigate(`/frameworks/controls/${control.id}`)}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-mono font-medium text-indigo-400">
                                {control.requirementId}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(control.priority)}`}>
                                {control.priority}
                              </span>
                              {control.requiresEvidence && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-200">
                                  Evidence Required
                                </span>
                              )}
                            </div>
                            <h4 className="mt-2 text-sm font-medium text-white">{control.title}</h4>
                            <p className="mt-1 text-sm text-gray-400 line-clamp-2">{control.description}</p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span>{control.category}</span>
                              <span>•</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded ${getStatusColor(control.implementationStatus)}`}>
                                {control.implementationStatus.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingControl(control);
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-black border border-gray-800 rounded-lg shadow h-96 flex items-center justify-center">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-400">No framework selected</h3>
                <p className="mt-1 text-sm text-gray-500">Select a framework from the list to view its details and controls</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Control Modal */}
      {editingControl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Edit Control</h3>
              <button
                onClick={() => setEditingControl(null)}
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
                    Requirement ID
                  </label>
                  <input
                    type="text"
                    value={editingControl.requirementId}
                    onChange={(e) => setEditingControl({ ...editingControl, requirementId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingControl.title}
                    onChange={(e) => setEditingControl({ ...editingControl, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Implementation Status
                  </label>
                  <select
                    value={editingControl.implementationStatus}
                    onChange={(e) => setEditingControl({ ...editingControl, implementationStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  >
                    <option value="not_implemented">Not Implemented</option>
                    <option value="partially_implemented">Partially Implemented</option>
                    <option value="implemented">Implemented</option>
                    <option value="not_applicable">Not Applicable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={editingControl.priority}
                    onChange={(e) => setEditingControl({ ...editingControl, priority: e.target.value })}
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
                    Category
                  </label>
                  <input
                    type="text"
                    value={editingControl.category}
                    onChange={(e) => setEditingControl({ ...editingControl, category: e.target.value })}
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
                    value={editingControl.domain || ''}
                    onChange={(e) => setEditingControl({ ...editingControl, domain: e.target.value })}
                    placeholder="e.g., Inventory and Control of Enterprise Assets"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingControl.description}
                    onChange={(e) => setEditingControl({ ...editingControl, description: e.target.value })}
                    rows={3}
                    placeholder="Detailed description of the control..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Rationale
                  </label>
                  <textarea
                    value={editingControl.rationale || ''}
                    onChange={(e) => setEditingControl({ ...editingControl, rationale: e.target.value })}
                    rows={2}
                    placeholder="Why this control is important..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Guidance
                  </label>
                  <textarea
                    value={editingControl.guidance || ''}
                    onChange={(e) => setEditingControl({ ...editingControl, guidance: e.target.value })}
                    rows={2}
                    placeholder="Implementation guidance..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Testing Procedure
                  </label>
                  <textarea
                    value={editingControl.testingProcedure || ''}
                    onChange={(e) => setEditingControl({ ...editingControl, testingProcedure: e.target.value })}
                    rows={2}
                    placeholder="How to test this control..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresEvidence"
                    checked={editingControl.requiresEvidence}
                    onChange={(e) => setEditingControl({ ...editingControl, requiresEvidence: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded bg-gray-800"
                  />
                  <label htmlFor="requiresEvidence" className="ml-2 block text-sm text-gray-300">
                    Requires Evidence
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => setEditingControl(null)}
                className="px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={() => saveControl(editingControl.id, {
                  requirementId: editingControl.requirementId,
                  title: editingControl.title,
                  implementationStatus: editingControl.implementationStatus,
                  priority: editingControl.priority,
                  category: editingControl.category,
                  domain: editingControl.domain,
                  description: editingControl.description,
                  rationale: editingControl.rationale,
                  guidance: editingControl.guidance,
                  testingProcedure: editingControl.testingProcedure,
                  requiresEvidence: editingControl.requiresEvidence
                })}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Control Modal */}
      {isCreatingControl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Add New Control</h3>
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
                    Category
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
                    Rationale
                  </label>
                  <textarea
                    value={newControl.rationale || ''}
                    onChange={(e) => setNewControl({ ...newControl, rationale: e.target.value })}
                    rows={2}
                    placeholder="Why this control is important..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Guidance
                  </label>
                  <textarea
                    value={newControl.guidance || ''}
                    onChange={(e) => setNewControl({ ...newControl, guidance: e.target.value })}
                    rows={2}
                    placeholder="Implementation guidance..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Testing Procedure
                  </label>
                  <textarea
                    value={newControl.testingProcedure || ''}
                    onChange={(e) => setNewControl({ ...newControl, testingProcedure: e.target.value })}
                    rows={2}
                    placeholder="How to test this control..."
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
                disabled={saving || !newControl.requirementId || !newControl.title || !newControl.description}
              >
                {saving ? 'Creating...' : 'Create Control'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Framework Modal */}
      {isCreatingFramework && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Create New Framework</h3>
              <button
                onClick={() => setIsCreatingFramework(false)}
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
                    Code <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newFramework.code}
                    onChange={(e) => setNewFramework({ ...newFramework, code: e.target.value })}
                    placeholder="e.g., SCF-2024"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newFramework.name}
                    onChange={(e) => setNewFramework({ ...newFramework, name: e.target.value })}
                    placeholder="e.g., Secure Controls Framework"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description <span className="text-amber-400">*</span>
                  </label>
                  <textarea
                    value={newFramework.description}
                    onChange={(e) => setNewFramework({ ...newFramework, description: e.target.value })}
                    placeholder="Describe the framework..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={newFramework.type}
                    onChange={(e) => setNewFramework({ ...newFramework, type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  >
                    <option value="compliance">Compliance</option>
                    <option value="security">Security</option>
                    <option value="privacy">Privacy</option>
                    <option value="industry">Industry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Publisher
                  </label>
                  <input
                    type="text"
                    value={newFramework.publisher}
                    onChange={(e) => setNewFramework({ ...newFramework, publisher: e.target.value })}
                    placeholder="e.g., NIST, ISO, CIS"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={newFramework.version}
                    onChange={(e) => setNewFramework({ ...newFramework, version: e.target.value })}
                    placeholder="e.g., 2024.1"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => setIsCreatingFramework(false)}
                className="px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={createFramework}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                disabled={saving || !newFramework.code || !newFramework.name || !newFramework.description}
              >
                {saving ? 'Creating...' : 'Create Framework'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Framework Confirmation Modal */}
      {isDeleteDialogOpen && frameworkToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-medium text-white">Delete Framework</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-300 mb-4">
                Are you sure you want to delete the framework <strong className="text-white">"{frameworkToDelete.name}"</strong>?
              </p>
              <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-md p-3 mb-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-200">
                      <strong>Note:</strong> Controls will not be deleted. They will be unlinked from this framework and remain in the system.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                This action cannot be undone. The framework will be permanently deleted.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setFrameworkToDelete(null);
                }}
                className="px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={deleteFramework}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Delete Framework'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Existing Controls Modal */}
      {isAddExistingControlsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-medium text-white">Add Existing Controls</h3>
              <p className="mt-1 text-sm text-gray-400">
                Select controls to add to {selectedFramework?.name}
              </p>
            </div>

            {/* Search and Filters */}
            <div className="px-6 py-4 border-b border-gray-800 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, ID, or description..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                </div>
                <div className="w-48">
                  <select
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  >
                    <option value="">All Domains</option>
                    {getUniqueDomains().map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="selectAllAvailable"
                    checked={controlsToAdd.size === getFilteredAvailableControls().length && getFilteredAvailableControls().length > 0}
                    onChange={toggleAllControlsToAdd}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded bg-gray-800"
                  />
                  <label htmlFor="selectAllAvailable" className="text-sm text-gray-400">
                    Select All ({getFilteredAvailableControls().length} controls)
                  </label>
                </div>
                {controlsToAdd.size > 0 && (
                  <span className="text-sm text-indigo-400">
                    {controlsToAdd.size} selected
                  </span>
                )}
              </div>
            </div>

            {/* Controls List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {getFilteredAvailableControls().length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-400">No controls found</p>
                  {(searchQuery || domainFilter) && (
                    <p className="mt-1 text-xs text-gray-500">Try adjusting your filters</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {getFilteredAvailableControls().map((control) => (
                    <div
                      key={control.id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        controlsToAdd.has(control.id)
                          ? 'border-indigo-600 bg-indigo-900 bg-opacity-20'
                          : 'border-gray-700 bg-gray-800 bg-opacity-50 hover:bg-gray-800'
                      }`}
                      onClick={() => toggleControlToAdd(control.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center pt-0.5">
                          <input
                            type="checkbox"
                            checked={controlsToAdd.has(control.id)}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded bg-gray-800"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono font-medium text-indigo-400">
                              {control.requirementId}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(control.priority)}`}>
                              {control.priority}
                            </span>
                            {control.domain && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900 text-purple-200">
                                {control.domain}
                              </span>
                            )}
                            {control.frameworkId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-900 text-amber-200">
                                Other Framework
                              </span>
                            )}
                          </div>
                          <h4 className="mt-1 text-sm font-medium text-white">{control.title}</h4>
                          <p className="mt-1 text-xs text-gray-400 line-clamp-2">{control.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {availableControls.length} total controls available
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setIsAddExistingControlsOpen(false);
                    setControlsToAdd(new Set());
                  }}
                  className="px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
                  disabled={isAddingControls}
                >
                  Cancel
                </button>
                <button
                  onClick={bulkAddControls}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  disabled={isAddingControls || controlsToAdd.size === 0}
                >
                  {isAddingControls ? 'Adding...' : `Add ${controlsToAdd.size} Control${controlsToAdd.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
