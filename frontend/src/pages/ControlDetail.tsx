import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Framework {
  id: string;
  code: string;
  name: string;
}

interface Control {
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
  procedures?: string;
}

interface Risk {
  id: string;
  riskId: string;
  title: string;
  description?: string;
  riskLevel?: string;
  linkedControls?: string[];
  riskOwner?: string;
}

type TabType = 'details' | 'labels' | 'proof' | 'tests' | 'automations' | 'notes' | 'issues';

export default function ControlDetail() {
  const { controlId } = useParams<{ controlId: string }>();
  const navigate = useNavigate();
  const [control, setControl] = useState<Control | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editedControl, setEditedControl] = useState<Control | null>(null);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [linkedRisks, setLinkedRisks] = useState<Risk[]>([]);
  const [activeLinksTab, setActiveLinksTab] = useState<'risks' | 'vendors' | 'evaluations'>('risks');

  useEffect(() => {
    fetchFrameworks();
    if (controlId) {
      fetchControl(controlId);
    }
  }, [controlId]);

  // Fetch linked risks after control is loaded
  useEffect(() => {
    if (control) {
      fetchLinkedRisks();
    }
  }, [control]);

  const fetchFrameworks = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/frameworks/');
      const result = await response.json();
      setFrameworks(result.data || []);
    } catch (error) {
      console.error('Error fetching frameworks:', error);
    }
  };

  const fetchControl = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/frameworks/controls/${id}`);
      const result = await response.json();
      setControl(result.data);
      setEditedControl(result.data);
    } catch (error) {
      console.error('Error fetching control:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedRisks = async () => {
    if (!control) return;

    try {
      // Fetch all risks
      const response = await fetch('http://localhost:3002/api/frameworks/risks');
      const result = await response.json();
      const allRisks = result.data || [];

      // Filter risks that have this control's requirementId in their linkedControls array
      // linkedControls stores requirementId (e.g., "IAC-01"), not UUID
      const risksLinkedToControl = allRisks.filter((risk: Risk) =>
        risk.linkedControls?.includes(control.requirementId)
      );
      setLinkedRisks(risksLinkedToControl);
    } catch (error) {
      console.error('Error fetching linked risks:', error);
    }
  };

  const saveControl = async () => {
    if (!editedControl) return;
    try {
      const response = await fetch(`http://localhost:3002/api/frameworks/controls/${editedControl.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedControl)
      });
      const result = await response.json();
      setControl(result.data);
      setEditedControl(result.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving control:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'text-green-400';
      case 'partially_implemented': return 'text-yellow-400';
      case 'not_implemented': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-amber-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black-950 flex items-center justify-center">
        <div className="text-gray-400">Loading control...</div>
      </div>
    );
  }

  if (!control) {
    return (
      <div className="min-h-screen bg-black-950 flex items-center justify-center">
        <div className="text-gray-400">Control not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-950">
      {/* Header */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/controls')}
                className="text-gray-400 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-white">{control.requirementId} - {control.title}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(control.implementationStatus)}`}>
                    {control.implementationStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedControl(control);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveControl}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-md"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'details', label: 'Details' },
              { id: 'labels', label: 'Labels' },
              { id: 'proof', label: 'Proof' },
              { id: 'tests', label: 'Tests' },
              { id: 'automations', label: 'Automations' },
              { id: 'notes', label: 'Notes' },
              { id: 'issues', label: 'Issues' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="bg-black border border-gray-800 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Control Information</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Framework</label>
                      {isEditing ? (
                        <select
                          value={editedControl?.frameworkId || ''}
                          onChange={(e) => setEditedControl({ ...editedControl!, frameworkId: e.target.value === '' ? null : e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                        >
                          <option value="">No Framework</option>
                          {frameworks.map(fw => (
                            <option key={fw.id} value={fw.id}>{fw.code} - {fw.name}</option>
                          ))}
                      </select>
                      ) : (
                        <p className="text-sm text-white">{frameworks.find(f => f.id === control.frameworkId)?.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Control ID</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedControl?.requirementId || ''}
                          onChange={(e) => setEditedControl({ ...editedControl!, requirementId: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                        />
                      ) : (
                        <p className="text-sm text-white">{control.requirementId}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Control name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedControl?.title || ''}
                          onChange={(e) => setEditedControl({ ...editedControl!, title: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                        />
                      ) : (
                        <p className="text-sm text-white">{control.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                      {isEditing ? (
                        <textarea
                          value={editedControl?.description || ''}
                          onChange={(e) => setEditedControl({ ...editedControl!, description: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                        />
                      ) : (
                        <p className="text-sm text-gray-300">{control.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Domain</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedControl?.domain || ''}
                            onChange={(e) => setEditedControl({ ...editedControl!, domain: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm text-white">{control.domain || '(Not set)'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedControl?.category || ''}
                            onChange={(e) => setEditedControl({ ...editedControl!, category: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm text-white">{control.category}</p>
                        )}
                      </div>
                    </div>

                    {control.rationale && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Rationale</label>
                        {isEditing ? (
                          <textarea
                            value={editedControl?.rationale || ''}
                            onChange={(e) => setEditedControl({ ...editedControl!, rationale: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm text-gray-300">{control.rationale}</p>
                        )}
                      </div>
                    )}

                    {control.guidance && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Guidance</label>
                        {isEditing ? (
                          <textarea
                            value={editedControl?.guidance || ''}
                            onChange={(e) => setEditedControl({ ...editedControl!, guidance: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm text-gray-300">{control.guidance}</p>
                        )}
                      </div>
                    )}

                    {control.testingProcedure && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Testing Procedure</label>
                        {isEditing ? (
                          <textarea
                            value={editedControl?.testingProcedure || ''}
                            onChange={(e) => setEditedControl({ ...editedControl!, testingProcedure: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm text-gray-300">{control.testingProcedure}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Procedures</label>
                      {isEditing ? (
                        <textarea
                          value={editedControl?.procedures || ''}
                          onChange={(e) => setEditedControl({ ...editedControl!, procedures: e.target.value })}
                          rows={4}
                          placeholder="Document the procedures for this control..."
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                        />
                      ) : (
                        <p className="text-sm text-gray-300">{control.procedures || '(Not set)'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Links Section */}
                <div className="bg-black border border-gray-800 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Linked Risks</h3>
                  <div className="flex space-x-4 border-b border-gray-800">
                    <button
                      onClick={() => setActiveLinksTab('risks')}
                      className={`pb-2 px-1 text-sm font-medium ${
                        activeLinksTab === 'risks'
                          ? 'text-indigo-500 border-b-2 border-indigo-500'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Risks
                    </button>
                    <button
                      onClick={() => setActiveLinksTab('vendors')}
                      className={`pb-2 px-1 text-sm font-medium ${
                        activeLinksTab === 'vendors'
                          ? 'text-indigo-500 border-b-2 border-indigo-500'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Vendors
                    </button>
                    <button
                      onClick={() => setActiveLinksTab('evaluations')}
                      className={`pb-2 px-1 text-sm font-medium ${
                        activeLinksTab === 'evaluations'
                          ? 'text-indigo-500 border-b-2 border-indigo-500'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Evaluations
                    </button>
                  </div>

                  {activeLinksTab === 'risks' && (
                    <div className="mt-4">
                      {linkedRisks.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500">No risks linked to this control</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {linkedRisks.map((risk) => (
                            <div
                              key={risk.id}
                              onClick={() => navigate(`/risks/${risk.id}`)}
                              className="p-3 border border-gray-700 rounded-md hover:bg-gray-800 cursor-pointer transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-amber-400">
                                      {risk.riskId}
                                    </span>
                                    {risk.riskLevel && (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        risk.riskLevel === 'critical' ? 'bg-red-900 text-red-200' :
                                        risk.riskLevel === 'high' ? 'bg-orange-600 text-white' :
                                        risk.riskLevel === 'medium' ? 'bg-amber-500 text-white' :
                                        'bg-gray-700 text-gray-300'
                                      }`}>
                                        {risk.riskLevel.replace('_', ' ')}
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-sm text-white">{risk.title}</p>
                                  {risk.description && (
                                    <p className="mt-1 text-xs text-gray-400 line-clamp-2">{risk.description}</p>
                                  )}
                                  {risk.riskOwner && (
                                    <p className="mt-1 text-xs text-gray-500">Owner: {risk.riskOwner}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeLinksTab === 'vendors' && (
                    <div className="mt-4 text-center py-8">
                      <p className="text-sm text-gray-500">No vendors linked yet</p>
                    </div>
                  )}

                  {activeLinksTab === 'evaluations' && (
                    <div className="mt-4 text-center py-8">
                      <p className="text-sm text-gray-500">No evaluations linked yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'labels' && (
              <div className="bg-black border border-gray-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Labels feature coming soon</p>
              </div>
            )}

            {activeTab === 'proof' && (
              <div className="bg-black border border-gray-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Proof/Evidence upload coming soon</p>
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="bg-black border border-gray-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Tests feature coming soon</p>
              </div>
            )}

            {activeTab === 'automations' && (
              <div className="bg-black border border-gray-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Automations feature coming soon</p>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="bg-black border border-gray-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Notes feature coming soon</p>
              </div>
            )}

            {activeTab === 'issues' && (
              <div className="bg-black border border-gray-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Issues tracking coming soon</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-black border border-gray-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Status</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Health</label>
                  <p className={`text-sm font-medium ${getStatusColor(control.implementationStatus)}`}>
                    {control.implementationStatus.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Implementation</label>
                  <p className={`text-sm font-medium ${getStatusColor(control.implementationStatus)}`}>
                    {control.implementationStatus.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Testing status</label>
                  <p className="text-sm font-medium text-gray-400">(Not set)</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Freshness</label>
                  <p className="text-sm font-medium text-gray-400">(Not set)</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Priority</label>
                  <p className={`text-sm font-medium ${getPriorityColor(control.priority)}`}>
                    {control.priority}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black border border-gray-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Automation</h3>
              <p className="text-sm text-gray-500">Not started</p>
            </div>

            <div className="bg-black border border-gray-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Issues</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Active issues</span>
                  <span className="text-sm text-white">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Closed issues</span>
                  <span className="text-sm text-white">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
