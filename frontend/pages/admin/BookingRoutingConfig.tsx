import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';

const SERVICE_TYPES = ['Local - Hourly', 'Outstation'];
const TRIP_TYPES = ['One Way', 'Round Trip'];

export default function BookingRoutingConfig() {
  const [configs, setConfigs] = useState([]);
  const [driverPlans, setDriverPlans] = useState([]);
  const [leadPlans, setLeadPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ serviceType: 'Local - Hourly', tripType: 'One Way', driverPlanIds: [], leadPlanIds: [] });
  const [addError, setAddError] = useState('');
  const [addSaving, setAddSaving] = useState(false);

  // Edit modal
  const [editingConfig, setEditingConfig] = useState(null);
  const [editForm, setEditForm] = useState({ driverPlanIds: [], leadPlanIds: [] });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { fetchConfigs(); }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/booking-routing');
      setConfigs(res.data.configs || []);
      const sortedDriverPlans = (res.data.driverPlans || []).sort((a, b) => b.price - a.price);
      const sortedLeadPlans = (res.data.leadPlans || []).sort((a, b) => b.price - a.price);
      setDriverPlans(sortedDriverPlans);
      setLeadPlans(sortedLeadPlans);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (config) => {
    setEditingConfig(config);
    setEditForm({ driverPlanIds: config.driverPlanIds || [], leadPlanIds: config.leadPlanIds || [] });
  };

  const toggleEditPlan = (type, planId) => {
    setEditForm(prev => {
      const current = prev[type] || [];
      const updated = current.includes(planId) ? current.filter(id => id !== planId) : [...current, planId];
      return { ...prev, [type]: updated };
    });
  };

  const toggleAddPlan = (type, planId) => {
    setAddForm(prev => {
      const current = prev[type] || [];
      const updated = current.includes(planId) ? current.filter(id => id !== planId) : [...current, planId];
      return { ...prev, [type]: updated };
    });
  };

  const handleEditSave = async () => {
    if (!editingConfig) return;
    setEditSaving(true);
    try {
      await apiClient.put(`/booking-routing/${editingConfig.id}`, editForm);
      setEditingConfig(null);
      await fetchConfigs();
    } catch (e) {
      console.error(e);
    } finally {
      setEditSaving(false);
    }
  };

  const deleteConfig = async (configId) => {
    if (!confirm('Delete this routing configuration?')) return;
    setDeleting(configId);
    try {
      await apiClient.delete(`/booking-routing/${configId}`);
      await fetchConfigs();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSaving(true);
    try {
      await apiClient.post('/booking-routing', addForm);
      setShowAddModal(false);
      setAddForm({ serviceType: 'Local - Hourly', tripType: 'One Way', driverPlanIds: [], leadPlanIds: [] });
      await fetchConfigs();
    } catch (e) {
      setAddError(e.response?.data?.error || 'Failed to create configuration');
    } finally {
      setAddSaving(false);
    }
  };

  const getPlanNames = (planIds, plans) =>
    plans.filter(p => planIds.includes(p.id)).map(p => p.name);

  const PlanCheckboxList = ({ plans, selectedIds, onToggle }) => (
    <div className="space-y-1.5">
      {plans.length === 0 ? (
        <p className="text-xs text-gray-400">No plans available</p>
      ) : plans.map(plan => {
        const checked = selectedIds.includes(plan.id);
        return (
          <label key={plan.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition ${checked ? 'border-black bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <input type="checkbox" checked={checked} onChange={() => onToggle(plan.id)} className="w-4 h-4 accent-black flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
              <p className="text-xs text-gray-500">₹{plan.price} · {plan.duration}d · {plan.type}</p>
            </div>
            {checked && <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-bold">ON</span>}
          </label>
        );
      })}
    </div>
  );

  if (loading) return <div className="px-6 py-6 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-gray-900">Booking Routing Config</h2>
        <button
          onClick={() => { setShowAddModal(true); setAddError(''); }}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
        >
          + Add Configuration
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        Map driver and lead subscription plans to service + trip type combinations. Bookings are automatically routed to mapped subscribers in <strong>Priority Tiers based on Plan Price</strong>. The highest priced plans receive the booking first. If no one accepts within 2 minutes, it cascades to the next highest price tier, and so on.
      </p>

      {configs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm mb-3">No routing configurations yet</p>
          <button onClick={() => setShowAddModal(true)} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition">
            Add First Configuration
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Service Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trip Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Driver Plans</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Lead Plans</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {configs.map((config, index) => {
                const driverNames = getPlanNames(config.driverPlanIds, driverPlans);
                const leadNames = getPlanNames(config.leadPlanIds, leadPlans);
                const isDeleting = deleting === config.id;

                return (
                  <tr key={config.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {config.serviceType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {config.tripType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {driverNames.length === 0 ? (
                        <span className="text-xs text-gray-400">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {driverNames.map(n => (
                            <span key={n} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">{n}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {leadNames.length === 0 ? (
                        <span className="text-xs text-gray-400">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {leadNames.map(n => (
                            <span key={n} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">{n}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(config)}
                          className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteConfig(config.id)}
                          disabled={isDeleting}
                          className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 disabled:opacity-50 transition"
                        >
                          {isDeleting ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">Edit Routing Configuration</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editingConfig.serviceType} — {editingConfig.tripType}</p>
              </div>
              <button onClick={() => setEditingConfig(null)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Driver Plans</p>
                <PlanCheckboxList
                  plans={driverPlans}
                  selectedIds={editForm.driverPlanIds}
                  onToggle={(id) => toggleEditPlan('driverPlanIds', id)}
                />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Lead Plans</p>
                <PlanCheckboxList
                  plans={leadPlans}
                  selectedIds={editForm.leadPlanIds}
                  onToggle={(id) => toggleEditPlan('leadPlanIds', id)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingConfig(null)} className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button onClick={handleEditSave} disabled={editSaving} className="flex-1 py-2.5 text-sm font-bold text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 transition">
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">Add Routing Configuration</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {addError && <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-lg">{addError}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Service Type</label>
                  <select
                    value={addForm.serviceType}
                    onChange={e => setAddForm(p => ({ ...p, serviceType: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Trip Type</label>
                  <select
                    value={addForm.tripType}
                    onChange={e => setAddForm(p => ({ ...p, tripType: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    {TRIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Driver Plans</p>
                <PlanCheckboxList
                  plans={driverPlans}
                  selectedIds={addForm.driverPlanIds}
                  onToggle={(id) => toggleAddPlan('driverPlanIds', id)}
                />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Lead Plans</p>
                <PlanCheckboxList
                  plans={leadPlans}
                  selectedIds={addForm.leadPlanIds}
                  onToggle={(id) => toggleAddPlan('leadPlanIds', id)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" disabled={addSaving} className="flex-1 py-2.5 text-sm font-bold text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 transition">
                  {addSaving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
