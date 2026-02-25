import React, { useState, useEffect } from 'react';
import { getAllLeadPlans, createLeadPlan, updateLeadPlan } from '../../api/leadSubscription';

interface LeadPackage {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  type: string;
  isActive: boolean;
}

const LeadPackage: React.FC = () => {
  const [packages, setPackages] = useState<LeadPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<LeadPackage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'LOCAL',
    price: 0,
    duration: 30,
    description: '',
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    const result = await getAllLeadPlans();
    if (result.success) {
      setPackages(result.data?.plans || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = editingPackage
      ? await updateLeadPlan(editingPackage.id, formData)
      : await createLeadPlan(formData);
    
    if (result.success) {
      fetchPackages();
      closeModal();
    }
  };

  const openModal = (pkg?: LeadPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        type: pkg.type,
        price: pkg.price,
        duration: pkg.duration,
        description: pkg.description || '',
      });
    } else {
      setEditingPackage(null);
      setFormData({ name: '', type: 'LOCAL', price: 0, duration: 30, description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
  };

  if (loading) {
    return <div className="p-6">Loading packages...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="font-bold text-lg">Lead Subscription Packages</h3>
        <button
          onClick={() => openModal()}
          className="w-full md:w-auto bg-black text-white px-4 py-2 rounded-lg text-sm font-bold"
        >
          Add Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-lg">{pkg.name}</h4>
              <span className="bg-gray-100 text-xs font-bold px-2 py-1 rounded">{pkg.type}</span>
            </div>
            <p className="text-2xl font-bold mb-2">₹{pkg.price}</p>
            <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>
            <div className="flex justify-between items-center border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500">Duration: {pkg.duration} days</p>
              <div className="flex gap-2">
                <span className={`px-3 py-1 text-xs font-bold rounded ${
                  pkg.isActive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                }`}>
                  {pkg.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => openModal(pkg)}
                  className="px-3 py-1 text-xs font-bold text-black bg-gray-100 rounded hover:bg-gray-200"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold">{editingPackage ? 'Edit Package' : 'Add Package'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <label className="block text-xs font-bold text-gray-500 uppercase">
                Name
                <input
                  type="text"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </label>
              <label className="block text-xs font-bold text-gray-500 uppercase">
                Type
                <select
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="LOCAL">LOCAL</option>
                  <option value="OUTSTATION">OUTSTATION</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Price (₹)
                  <input
                    type="number"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                  />
                </label>
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Duration (days)
                  <input
                    type="number"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    required
                  />
                </label>
              </div>
              <label className="block text-xs font-bold text-gray-500 uppercase">
                Description
                <textarea
                  rows={3}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </label>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-black rounded-lg">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadPackage;
