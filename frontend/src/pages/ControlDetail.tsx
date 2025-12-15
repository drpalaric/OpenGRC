import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Control {
  id: string; // UUID primary key
  controlId: string; // Business ID (e.g., AST-01) - editable
  source: string;
  name: string;
  description: string | null;
  domain: string;
  procedure: string | null;
  maturity: string | null;
  nist80053: string | null;
  evidence: string | null;
  policy: string | null;
}

interface Risk {
  id: string;
  riskId: string;
  title: string;
  inherentLikelihood: string;
  inherentImpact: string;
  treatment: string;
}

export default function ControlDetail() {
  const { controlId } = useParams<{ controlId: string }>();
  const navigate = useNavigate();
  const [control, setControl] = useState<Control | null>(null);
  const [linkedRisks, setLinkedRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Control>>({});

  useEffect(() => {
    fetchControlAndRisks();
  }, [controlId]);

  const fetchControlAndRisks = async () => {
    if (!controlId) return;

    setLoading(true);
    try {
      // Fetch control details
      const controlResponse = await fetch(`http://localhost:3002/api/frameworks/controls/${controlId}`);
      const controlResult = await controlResponse.json();
      setControl(controlResult.data);
      setFormData(controlResult.data);

      // Fetch linked risks
      const risksResponse = await fetch('http://localhost:3002/api/frameworks/risks');
      const risksResult = await risksResponse.json();
      const risks = risksResult.data || [];

      // Filter risks that have this control linked
      // linkedControls now stores UUIDs, so use the UUID from URL parameter
      const linked = risks.filter((risk: Risk & { linkedControls?: string[] }) =>
        risk.linkedControls && risk.linkedControls.includes(controlId)
      );
      setLinkedRisks(linked);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await fetch(`http://localhost:3002/api/frameworks/controls/${controlId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setEditing(false);
      fetchControlAndRisks();
    } catch (error) {
      console.error('Error updating control:', error);
    }
  };

  const handleCancel = () => {
    setFormData(control || {});
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400 py-8">Loading control...</div>
      </div>
    );
  }

  if (!control) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400 py-8">Control not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <button
            onClick={() => navigate('/controls')}
            className="text-gray-400 hover:text-white mb-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Controls
          </button>
          <h1 className="text-2xl font-bold text-white">
            {control.controlId}: {control.name}
          </h1>
          <p className="text-gray-400 mt-1">
            {control.source} Framework • {control.domain}
          </p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-600 transition-colors"
            >
              Edit Control
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-600 transition-colors"
              >
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Control Information */}
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Control Information</h2>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Control Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-gray-300">{control.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                {editing ? (
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-gray-300">{control.description || 'No description'}</p>
                )}
              </div>

              {/* Domain */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Domain
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.domain || ''}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-gray-300">{control.domain}</p>
                )}
              </div>

              {/* Procedure */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Procedure
                </label>
                {editing ? (
                  <textarea
                    value={formData.procedure || ''}
                    onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-gray-300">{control.procedure || 'No procedure defined'}</p>
                )}
              </div>

              {/* Evidence */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Evidence
                </label>
                {editing ? (
                  <textarea
                    value={formData.evidence || ''}
                    onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-gray-300">{control.evidence || 'No evidence specified'}</p>
                )}
              </div>

              {/* Policy */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Policy
                </label>
                {editing ? (
                  <textarea
                    value={formData.policy || ''}
                    onChange={(e) => setFormData({ ...formData, policy: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-gray-300">{control.policy || 'No policy specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Linked Risks */}
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Linked Risks ({linkedRisks.length})</h3>
            {linkedRisks.length === 0 ? (
              <p className="text-gray-400 text-sm">No risks linked to this control</p>
            ) : (
              <div className="space-y-3">
                {linkedRisks.map(risk => (
                  <div
                    key={risk.id}
                    onClick={() => navigate(`/risks/${risk.id}`)}
                    className="p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-amber-500 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-amber-500">{risk.riskId}</p>
                        <p className="text-sm text-white mt-1">{risk.title}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2 text-xs">
                      <span className="text-gray-400">
                        Likelihood: <span className="text-gray-300">{risk.inherentLikelihood}</span>
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">
                        Impact: <span className="text-gray-300">{risk.inherentImpact}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Right 1/3 */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Metadata</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">UUID</span>
                <p className="text-gray-300 font-mono text-xs">{control.id}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Control ID</span>
                {editing ? (
                  <input
                    type="text"
                    value={formData.controlId || ''}
                    onChange={(e) => setFormData({ ...formData, controlId: e.target.value })}
                    className="w-full px-3 py-1 mt-1 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-gray-300 font-medium">{control.controlId}</p>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-500">Source</span>
                <p className="text-gray-300">{control.source}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Maturity Level</span>
                {editing ? (
                  <input
                    type="text"
                    value={formData.maturity || ''}
                    onChange={(e) => setFormData({ ...formData, maturity: e.target.value })}
                    className="w-full px-3 py-1 mt-1 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-gray-300">{control.maturity || 'Not specified'}</p>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-500">NIST 800-53</span>
                {editing ? (
                  <input
                    type="text"
                    value={formData.nist80053 || ''}
                    onChange={(e) => setFormData({ ...formData, nist80053: e.target.value })}
                    className="w-full px-3 py-1 mt-1 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-gray-300">{control.nist80053 || 'Not mapped'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
