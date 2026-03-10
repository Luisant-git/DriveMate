import React, { useState, useEffect } from 'react';
import { getAllLeadPlans, createLeadPlan, updateLeadPlan } from '../../api/leadSubscription';

interface LeadPackage {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  type: string;
  types?: string[];
  isActive: boolean;
  maxLeads?: number;
  hasDriverTaxi?: boolean;
  hasLocal?: boolean;
  hasOutstation?: boolean;
  hasMonthly?: boolean;
  advancePayment?: number;
}

const LeadPackage: React.FC = () => {
  const [packages, setPackages] = useState<LeadPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<LeadPackage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'LOCAL',
    types: [],
    price: 0,
    duration: 30,
    description: '',
    maxLeads: 0,
    advancePayment: 0,
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
        types: pkg.types || [],
        price: pkg.price,
        duration: pkg.duration,
        description: pkg.description || '',
        maxLeads: pkg.maxLeads || 0,
        advancePayment: pkg.advancePayment || 0,
      });
    } else {
      setEditingPackage(null);
      setFormData({ 
        name: '', 
        type: 'LOCAL',
        types: [],
        price: 0, 
        duration: 30, 
        description: '',
        maxLeads: 0,
        advancePayment: 0,
      });
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="border-2 border-gray-200 rounded-xl p-6 bg-white hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-bold text-xl text-gray-900">{pkg.name}</h4>
              <span className="bg-gray-100 text-xs font-bold px-2 py-1 rounded">
                {pkg.types ? pkg.types.join(', ') : pkg.type}
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-3xl font-bold mb-1">₹{pkg.price}</p>
              <p className="text-sm text-gray-600">Duration: {pkg.duration} days</p>
              {pkg.maxLeads && <p className="text-sm font-medium text-green-600">Up to {pkg.maxLeads} leads</p>}
              {pkg.advancePayment && <p className="text-sm font-medium text-blue-600">Advance: ₹{pkg.advancePayment}</p>}
            </div>
            
            {/* Service Features */}
            <div className="mb-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-gray-600">
                  {pkg.types?.includes('DRIVER_TAXI') ? '✓' : '✗'} Driver/Taxi
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  {pkg.types?.includes('LOCAL') ? '✓' : '✗'} Local
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  {pkg.types?.includes('OUTSTATION') ? '✓' : '✗'} Outstation
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  {pkg.types?.includes('MONTHLY') ? '✓' : '✗'} Monthly
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mb-4 line-clamp-3">{pkg.description}</p>
            
            <div className="flex justify-between items-center border-t border-gray-100 pt-3">
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
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">{editingPackage ? 'Edit Package' : 'Add Package'}</h3>
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
              
              <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Max Leads
                  <input
                    type="number"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={formData.maxLeads}
                    onChange={(e) => setFormData({ ...formData, maxLeads: Number(e.target.value) })}
                  />
                </label>
              </div>
              
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
                  Advance Payment (₹)
                  <input
                    type="number"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={formData.advancePayment}
                    onChange={(e) => setFormData({ ...formData, advancePayment: Number(e.target.value) })}
                  />
                </label>
              </div>
              
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
              
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase">Service Features</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.types.includes('DRIVER_TAXI')}
                      onChange={(e) => {
                        const newTypes = e.target.checked 
                          ? [...formData.types, 'DRIVER_TAXI']
                          : formData.types.filter(t => t !== 'DRIVER_TAXI');
                        setFormData({ ...formData, types: newTypes });
                      }}
                      className="w-4 h-4"
                    />
                    Driver/Taxi
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.types.includes('LOCAL')}
                      onChange={(e) => {
                        const newTypes = e.target.checked 
                          ? [...formData.types, 'LOCAL']
                          : formData.types.filter(t => t !== 'LOCAL');
                        setFormData({ ...formData, types: newTypes });
                      }}
                      className="w-4 h-4"
                    />
                    Local
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.types.includes('OUTSTATION')}
                      onChange={(e) => {
                        const newTypes = e.target.checked 
                          ? [...formData.types, 'OUTSTATION']
                          : formData.types.filter(t => t !== 'OUTSTATION');
                        setFormData({ ...formData, types: newTypes });
                      }}
                      className="w-4 h-4"
                    />
                    Outstation
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.types.includes('MONTHLY')}
                      onChange={(e) => {
                        const newTypes = e.target.checked 
                          ? [...formData.types, 'MONTHLY']
                          : formData.types.filter(t => t !== 'MONTHLY');
                        setFormData({ ...formData, types: newTypes });
                      }}
                      className="w-4 h-4"
                    />
                    Monthly
                  </label>
                </div>
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
