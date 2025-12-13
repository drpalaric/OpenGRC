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
                  <button
                    key={framework.id}
                    onClick={() => selectFramework(framework)}
                    className={`w-full text-left px-4 py-4 hover:bg-gray-800 transition-colors ${
                      selectedFramework?.id === framework.id ? 'bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
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
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-400">
                            {framework.completionPercentage}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {framework.implementedControls}/{framework.totalControls}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
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
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      selectedFramework.status === 'active' ? 'bg-green-900 text-green-200' : 'bg-gray-800 text-gray-300'
                    }`}>
                      {selectedFramework.status}
                    </span>
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
                  <h3 className="text-lg font-medium text-white">
                    Controls ({controls.length})
                  </h3>
                  <button
                    onClick={() => setIsCreatingControl(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    + Add Control
                  </button>
                </div>
                <div className="divide-y divide-gray-800">
                  {controls.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                      No controls found for this framework
                    </div>
                  ) : (
                    controls.map((control) => (
                      <div key={control.id} className="px-6 py-4 hover:bg-gray-800 transition-colors">
                        <div className="flex items-start justify-between">
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
    </div>
  );
}
