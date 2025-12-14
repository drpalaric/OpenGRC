import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

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
  requirementId: string;
  title: string;
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

export default function RiskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [risk, setRisk] = useState<Risk | null>(null);
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRisk, setEditedRisk] = useState<Partial<Risk>>({});
  const [controlSearch, setControlSearch] = useState('');

  useEffect(() => {
    fetchRisk();
    fetchControls();
  }, [id]);

  const fetchRisk = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3002/api/frameworks/risks/${id}`);
      const result = await response.json();
      setRisk(result.data);
      setEditedRisk(result.data);
    } catch (error) {
      console.error('Error fetching risk:', error);
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
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedRisk({ ...risk });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedRisk({ ...risk });
    setControlSearch('');
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/frameworks/risks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedRisk)
      });
      const result = await response.json();
      setRisk(result.data);
      setEditedRisk(result.data);
      setIsEditing(false);
      setControlSearch('');
    } catch (error) {
      console.error('Error updating risk:', error);
    }
  };

  const toggleControlLink = (controlId: string) => {
    const currentLinks = editedRisk.linkedControls || [];
    if (currentLinks.includes(controlId)) {
      setEditedRisk({
        ...editedRisk,
        linkedControls: currentLinks.filter(id => id !== controlId)
      });
    } else {
      setEditedRisk({
        ...editedRisk,
        linkedControls: [...currentLinks, controlId]
      });
    }
  };

  // Get control details by ID
  const getControlDetails = (controlId: string) => {
    if (!Array.isArray(controls)) return undefined;
    return controls.find(c => c.requirementId === controlId);
  };

  // Filter controls based on search
  const filteredControls = controls.filter(control => {
    if (!controlSearch) return true;
    const searchLower = controlSearch.toLowerCase();
    return (
      control.title.toLowerCase().includes(searchLower) ||
      control.description.toLowerCase().includes(searchLower) ||
      control.requirementId.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center text-gray-400">Loading risk...</div>
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center text-gray-400">Risk not found</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/risks"
          className="text-sm text-amber-400 hover:text-amber-300 mb-4 inline-block"
        >
          ← Back to Risks
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{risk.riskId}</h1>
            <p className="mt-1 text-lg text-gray-400">{risk.title}</p>
          </div>
          <div className="flex space-x-3">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="px-4 py-2 border border-amber-600 text-sm font-medium rounded-md text-amber-600 hover:bg-amber-600 hover:text-white transition"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Risk Details */}
      <div className="bg-black border border-gray-800 rounded-lg shadow p-6 space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Risk ID <span className="text-amber-400">*</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedRisk.riskId || ''}
                onChange={(e) => setEditedRisk({ ...editedRisk, riskId: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
              />
            ) : (
              <p className="text-white font-mono">{risk.riskId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title <span className="text-amber-400">*</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedRisk.title || ''}
                onChange={(e) => setEditedRisk({ ...editedRisk, title: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
              />
            ) : (
              <p className="text-white">{risk.title}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Risk Owner
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editedRisk.riskOwner || ''}
              onChange={(e) => setEditedRisk({ ...editedRisk, riskOwner: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
            />
          ) : (
            <p className="text-white">{risk.riskOwner || '-'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          {isEditing ? (
            <textarea
              value={editedRisk.description || ''}
              onChange={(e) => setEditedRisk({ ...editedRisk, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
            />
          ) : (
            <p className="text-white">{risk.description || '-'}</p>
          )}
        </div>

        {/* Risk Levels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Inherent Likelihood
            </label>
            {isEditing ? (
              <select
                value={editedRisk.inherentLikelihood || ''}
                onChange={(e) => setEditedRisk({ ...editedRisk, inherentLikelihood: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
              >
                <option value="">Select...</option>
                <option value="very_low">Very Low</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            ) : (
              <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${getRiskLevelColor(risk.inherentLikelihood)}`}>
                {risk.inherentLikelihood?.replace('_', ' ') || '-'}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Inherent Impact
            </label>
            {isEditing ? (
              <select
                value={editedRisk.inherentImpact || ''}
                onChange={(e) => setEditedRisk({ ...editedRisk, inherentImpact: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
              >
                <option value="">Select...</option>
                <option value="very_low">Very Low</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            ) : (
              <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${getRiskLevelColor(risk.inherentImpact)}`}>
                {risk.inherentImpact?.replace('_', ' ') || '-'}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Residual Likelihood
            </label>
            {isEditing ? (
              <select
                value={editedRisk.residualLikelihood || ''}
                onChange={(e) => setEditedRisk({ ...editedRisk, residualLikelihood: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
              >
                <option value="">Select...</option>
                <option value="very_low">Very Low</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            ) : (
              <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${getRiskLevelColor(risk.residualLikelihood)}`}>
                {risk.residualLikelihood?.replace('_', ' ') || '-'}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Residual Impact
            </label>
            {isEditing ? (
              <select
                value={editedRisk.residualImpact || ''}
                onChange={(e) => setEditedRisk({ ...editedRisk, residualImpact: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
              >
                <option value="">Select...</option>
                <option value="very_low">Very Low</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            ) : (
              <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${getRiskLevelColor(risk.residualImpact)}`}>
                {risk.residualImpact?.replace('_', ' ') || '-'}
              </span>
            )}
          </div>
        </div>

        {/* Treatment & Threats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Treatment
            </label>
            {isEditing ? (
              <select
                value={editedRisk.treatment || ''}
                onChange={(e) => setEditedRisk({ ...editedRisk, treatment: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
              >
                <option value="">Select...</option>
                <option value="Accept">Accept</option>
                <option value="Mitigate">Mitigate</option>
                <option value="Transfer">Transfer</option>
                <option value="Avoid">Avoid</option>
              </select>
            ) : (
              <p className="text-white">{risk.treatment || '-'}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Threats
          </label>
          {isEditing ? (
            <textarea
              value={editedRisk.threats || ''}
              onChange={(e) => setEditedRisk({ ...editedRisk, threats: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
            />
          ) : (
            <p className="text-white">{risk.threats || '-'}</p>
          )}
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Creator
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedRisk.creator || ''}
                onChange={(e) => setEditedRisk({ ...editedRisk, creator: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
              />
            ) : (
              <p className="text-white">{risk.creator || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Business Unit
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedRisk.businessUnit || ''}
                onChange={(e) => setEditedRisk({ ...editedRisk, businessUnit: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
              />
            ) : (
              <p className="text-white">{risk.businessUnit || '-'}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Assets
          </label>
          {isEditing ? (
            <textarea
              value={editedRisk.assets || ''}
              onChange={(e) => setEditedRisk({ ...editedRisk, assets: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
            />
          ) : (
            <p className="text-white">{risk.assets || '-'}</p>
          )}
        </div>

        {/* Linked Controls */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Linked Controls
          </label>
          {!isEditing && (
            <div className="space-y-2">
              {risk.linkedControls && risk.linkedControls.length > 0 ? (
                risk.linkedControls.map((controlId) => {
                  const control = getControlDetails(controlId);
                  return (
                    <div
                      key={controlId}
                      onClick={() => control && navigate(`/controls/${control.id}`)}
                      className="bg-gray-900 rounded-md px-4 py-2 border border-gray-800 cursor-pointer hover:bg-gray-800 hover:border-amber-600 transition-colors"
                    >
                      <div className="text-sm font-medium text-amber-400">{controlId}</div>
                      {control && (
                        <>
                          <div className="text-sm text-white mt-1">{control.title}</div>
                          <div className="text-xs text-gray-400 mt-1">{control.description}</div>
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">No controls linked</p>
              )}
            </div>
          )}
          {isEditing && (
            <>
              <input
                type="text"
                value={controlSearch}
                onChange={(e) => setControlSearch(e.target.value)}
                placeholder="Search controls by title, description, or ID"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm mb-3"
              />
              <div className="max-h-64 overflow-y-auto bg-gray-900 rounded-md border border-gray-700">
                {filteredControls.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    {controlSearch ? 'No controls found matching search' : 'No controls available'}
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
                        checked={editedRisk.linkedControls?.includes(control.requirementId) || false}
                        onChange={() => toggleControlLink(control.requirementId)}
                        className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-700 rounded bg-gray-800"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-white">
                          {control.requirementId} - {control.title}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
