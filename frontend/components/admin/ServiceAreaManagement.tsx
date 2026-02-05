import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

export default function ServiceAreaManagement() {
  const [areas, setAreas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    radius: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/service-areas`);
      if (response.data.success) {
        setAreas(response.data.areas);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingArea) {
        await axios.put(`${API_URL}/api/service-areas/${editingArea.id}`, formData);
        toast.success('Service area updated!');
      } else {
        await axios.post(`${API_URL}/api/service-areas`, formData);
        toast.success('Service area created!');
      }
      setShowModal(false);
      setEditingArea(null);
      setFormData({ name: '', city: '', state: '', radius: '', latitude: '', longitude: '' });
      fetchAreas();
    } catch (error) {
      toast.error('Error saving service area');
    }
  };

  const handleEdit = (area) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      city: area.city,
      state: area.state,
      radius: area.radius,
      latitude: area.latitude,
      longitude: area.longitude
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this service area?')) {
      try {
        await axios.delete(`${API_URL}/api/service-areas/${id}`);
        toast.success('Service area deleted!');
        fetchAreas();
      } catch (error) {
        toast.error('Error deleting service area');
      }
    }
  };

  const toggleActive = async (area) => {
    try {
      await axios.put(`${API_URL}/api/service-areas/${area.id}`, {
        ...area,
        isActive: !area.isActive
      });
      toast.success('Status updated!');
      fetchAreas();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Service Areas</h2>
        <button
          onClick={() => {
            setEditingArea(null);
            setFormData({ name: '', city: '', state: '', radius: '', latitude: '', longitude: '' });
            setShowModal(true);
          }}
          className="bg-black text-white px-4 py-2 rounded-lg font-bold"
        >
          + Add Service Area
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">City</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">State</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Radius (km)</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {areas.map((area) => (
              <tr key={area.id}>
                <td className="px-6 py-4 text-sm font-medium">{area.name}</td>
                <td className="px-6 py-4 text-sm">{area.city}</td>
                <td className="px-6 py-4 text-sm">{area.state}</td>
                <td className="px-6 py-4 text-sm">{area.radius} km</td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => toggleActive(area)}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      area.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {area.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => handleEdit(area)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(area.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingArea ? 'Edit Service Area' : 'Add Service Area'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Area Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g., Bangalore Central"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g., Bangalore"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g., Karnataka"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Radius (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g., 50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g., 12.9716"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g., 77.5946"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingArea(null);
                  }}
                  className="flex-1 border border-gray-300 rounded-lg py-2 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-black text-white rounded-lg py-2 font-bold"
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
