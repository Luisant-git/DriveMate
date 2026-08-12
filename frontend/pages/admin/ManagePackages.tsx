import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CATEGORIES = ['Silver', 'Gold', 'Platinum', 'Diamond'];

interface Package {
  id: string;
  category: string;
  name: string;
  type: 'LOCAL' | 'OUTSTATION';
  duration: number;
  price: number;
  description: string;
  maxDuties: number;
  isActive: boolean;
}

const emptyForm = {
  category: 'Silver',
  name: '',
  type: 'LOCAL' as 'LOCAL' | 'OUTSTATION',
  duration: 0,
  price: 0,
  maxDuties: 0,
  description: ''
};

const ManagePackages: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/subscriptions/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPackages(res.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        await axios.put(`${API_URL}/api/subscriptions/plans/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/subscriptions/plans`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      fetchPackages();
    } catch (error) {
      console.error('Error saving package:', error);
    }
  };

  const handleEdit = (pkg: Package) => {
    setFormData({
      category: pkg.category || 'Silver',
      name: pkg.name,
      type: pkg.type,
      duration: pkg.duration,
      price: pkg.price,
      maxDuties: pkg.maxDuties || 0,
      description: pkg.description || ''
    });
    setEditingId(pkg.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/subscriptions/plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/subscriptions/plans/${id}`, { isActive: !isActive }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPackages();
    } catch (error) {
      console.error('Error toggling package:', error);
    }
  };

  const groupedPackages = (category: string) =>
    packages
      .filter((pkg) => (pkg.category || 'Silver') === category)
      .sort((a, b) => a.price - b.price);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Subscription Packages</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData(emptyForm);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Package
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['All', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${
              selectedCategory === cat
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit' : 'Add'} Package</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1">Package Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Local (18 Duty - 1 Month)"
                className="w-full border px-3 py-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'LOCAL' | 'OUTSTATION' })}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="LOCAL">LOCAL</option>
                <option value="OUTSTATION">OUTSTATION</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block mb-1">Duration (days)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Max Duties</label>
                <input
                  type="number"
                  min={0}
                  value={formData.maxDuties}
                  onChange={(e) => setFormData({ ...formData, maxDuties: parseInt(e.target.value) })}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-8">
        {CATEGORIES.map((category) => {
          if (selectedCategory !== 'All' && category !== selectedCategory) return null;
          const categoryPackages = groupedPackages(category);
          if (categoryPackages.length === 0) return null;
          return (
            <div key={category}>
              <h2 className="text-xl font-bold mb-3 text-gray-800">{category.toUpperCase()}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryPackages.map((pkg) => (
                  <div key={pkg.id} className={`bg-white p-4 rounded shadow ${!pkg.isActive ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{pkg.category} ₹{pkg.price}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${pkg.type === 'LOCAL' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {pkg.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{pkg.name}</p>
                    <p className="text-gray-600 mb-2">{pkg.description}</p>
                    <div className="mb-3">
                      <p className="text-sm"><strong>Duration:</strong> {pkg.duration} days</p>
                      {pkg.maxDuties > 0 && <p className="text-sm"><strong>Max Duties:</strong> {pkg.maxDuties}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(pkg)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(pkg.id, pkg.isActive)}
                        className={`${pkg.isActive ? 'bg-orange-500' : 'bg-green-500'} text-white px-3 py-1 rounded text-sm hover:opacity-80`}
                      >
                        {pkg.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ManagePackages;
