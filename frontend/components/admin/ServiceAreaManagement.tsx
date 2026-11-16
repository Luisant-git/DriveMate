import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LocationAutocomplete from '../LocationAutocomplete';
import { geocodeAddress } from '../../api/maps.js';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
const DEFAULT_RADIUS_KM = 40;
const PRESET_RADII = [20, 30, 40, 50, 60];

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export default function ServiceAreaManagement() {
  const [areas, setAreas] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    radius: String(DEFAULT_RADIUS_KM),
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/service-areas`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (response.data.success) {
        setAreas(response.data.areas || []);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const handleOpenAddModal = () => {
    setEditingArea(null);
    setSearchLocation('');
    setFormData({
      name: '',
      city: '',
      state: '',
      radius: String(DEFAULT_RADIUS_KM),
      latitude: '',
      longitude: ''
    });
    setShowModal(true);
  };

  const handleLocationSearchSelect = async (placeDescription: string) => {
    setSearchLocation(placeDescription);
    if (!placeDescription) return;

    try {
      const res = await geocodeAddress(placeDescription);
      if (res && res.success) {
        setFormData(prev => ({
          ...prev,
          name: prev.name || res.area || placeDescription.split(',')[0].trim(),
          city: res.city || prev.city,
          state: res.state || prev.state,
          latitude: String(Number(res.lat).toFixed(6)),
          longitude: String(Number(res.lng).toFixed(6)),
          radius: prev.radius && Number(prev.radius) > 0 ? prev.radius : String(DEFAULT_RADIUS_KM)
        }));
        toast.success(`Coordinates found for ${res.city || res.area || placeDescription}`);
      }
    } catch (err) {
      console.error('Geocode search error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      toast.error('Please enter valid Latitude and Longitude coordinates.');
      return;
    }

    const payload = {
      ...formData,
      radius: parseFloat(formData.radius) || DEFAULT_RADIUS_KM,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude)
    };

    try {
      if (editingArea) {
        await axios.put(`${API_URL}/api/service-areas/${editingArea.id}`, payload, {
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        toast.success('Service area updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/service-areas`, payload, {
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        toast.success(`Service area created with ${payload.radius} km radius!`);
      }
      setShowModal(false);
      setEditingArea(null);
      setFormData({ name: '', city: '', state: '', radius: String(DEFAULT_RADIUS_KM), latitude: '', longitude: '' });
      fetchAreas();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error saving service area');
    }
  };

  const handleEdit = (area: any) => {
    setEditingArea(area);
    setSearchLocation(`${area.name}, ${area.city}`);
    setFormData({
      name: area.name,
      city: area.city,
      state: area.state,
      radius: String(area.radius || DEFAULT_RADIUS_KM),
      latitude: String(area.latitude),
      longitude: String(area.longitude)
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this service area?')) {
      try {
        await axios.delete(`${API_URL}/api/service-areas/${id}`, {
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        toast.success('Service area deleted!');
        fetchAreas();
      } catch (error) {
        toast.error('Error deleting service area');
      }
    }
  };

  const toggleActive = async (area: any) => {
    try {
      await axios.put(`${API_URL}/api/service-areas/${area.id}`, {
        ...area,
        isActive: !area.isActive
      }, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      toast.success('Status updated!');
      fetchAreas();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900">Service Areas</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage active service locations and operating radius limits (Default 40 km)
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-black hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Service Area</span>
        </button>
      </div>

      {/* ── Active Coverage Callout ── */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white shadow-sm text-sm font-bold">
            40km
          </span>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">
              Active Service Radius: 40 km Default
            </h4>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Customers can book acting drivers when their pickup is within 40 km of an active service location.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-800 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-xs">
          <span>Active Areas:</span>
          <span className="tabular-nums font-black text-emerald-600">
            {areas.filter(a => a.isActive).length} / {areas.length}
          </span>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Coordinates</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Radius (km)</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {areas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                    No service areas defined yet. Click "+ Add Service Area" to add your active location.
                  </td>
                </tr>
              ) : (
                areas.map((area) => (
                  <tr key={area.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-3.5 text-sm font-bold text-gray-900">{area.name}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700 font-medium">{area.city}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{area.state}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">
                      {area.latitude?.toFixed?.(4) ?? area.latitude}, {area.longitude?.toFixed?.(4) ?? area.longitude}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                        {area.radius} km
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <button
                        type="button"
                        onClick={() => toggleActive(area)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                          area.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${area.isActive ? 'bg-green-600' : 'bg-red-600'}`} />
                        {area.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-right space-x-2 font-medium">
                      <button
                        type="button"
                        onClick={() => handleEdit(area)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(area.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowModal(false);
            setEditingArea(null);
          }}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-5 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {editingArea ? 'Edit Service Area' : 'Add Service Area'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter location details and operating radius (Default: 40 km)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingArea(null);
                }}
                className="text-gray-400 hover:text-black rounded-lg p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Optional Place Search Helper (No GPS) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Search Place / City <span className="text-gray-400 font-normal">(Optional helper to fill coordinates)</span>
              </label>
              <LocationAutocomplete
                value={searchLocation}
                onChange={handleLocationSearchSelect}
                placeholder="Search location (e.g. Bangalore, Mysuru, Salem)..."
                className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-black placeholder-gray-400"
                showMyLocation={false}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Area Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-black"
                  placeholder="e.g., Bangalore Central"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-black"
                    placeholder="e.g., Bangalore"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-black"
                    placeholder="e.g., Karnataka"
                    required
                  />
                </div>
              </div>

              {/* Radius with 40 km default and presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">Radius (km) *</label>
                  <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                    Default: 40 km
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="500"
                    value={formData.radius}
                    onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-bold focus:ring-2 focus:ring-black"
                    placeholder="40"
                    required
                  />
                  <span className="text-xs font-bold text-gray-500 shrink-0">km</span>
                </div>
                {/* Preset Radius Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mr-1">Quick Select:</span>
                  {PRESET_RADII.map(km => {
                    const active = Number(formData.radius) === km;
                    return (
                      <button
                        key={km}
                        type="button"
                        onClick={() => setFormData({ ...formData, radius: String(km) })}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md border transition ${
                          active
                            ? 'bg-black text-white border-black shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {km} km {km === DEFAULT_RADIUS_KM ? '(Default)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-black"
                    placeholder="e.g., 12.9716"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-black"
                    placeholder="e.g., 77.5946"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingArea(null);
                  }}
                  className="flex-1 border border-gray-300 rounded-xl py-2.5 font-bold text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-black hover:bg-gray-800 text-white rounded-xl py-2.5 font-bold text-sm transition"
                >
                  {editingArea ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
