import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config.js';

const API_URL = API_BASE_URL + '/api';

export default function Driver() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [packages, setPackages] = useState([]);
  const [packageMap, setPackageMap] = useState({});

  useEffect(() => {
    fetchPackages();
    fetchDrivers();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${API_URL}/subscriptions/active-packages`, { withCredentials: true });
      if (res.data.success) {
        setPackages(res.data.packages);
        const map = {};
        res.data.packages.forEach(pkg => {
          map[pkg.type] = pkg.name;
        });
        setPackageMap(map);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/drivers`, { withCredentials: true });
      setDrivers(res.data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const viewDriverDetails = (driver) => {
    setSelectedDriver(driver);
  };

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading drivers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">All Drivers</h2>
      
      {drivers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No drivers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">License No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Package</th>
                {/* <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th> */}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {drivers.map((driver, index) => (
                <tr key={driver.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{index + 1}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {driver.name ? driver.name[0] : 'D'}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{driver.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{driver.phone}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{driver.licenseNo}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {packageMap[driver.packageType] || driver.packageType}
                    </span>
                  </td>
                  {/* <td className="px-4 py-4">
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
                      driver.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                      driver.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {driver.status}
                    </span>
                  </td> */}
                  <td className="px-4 py-4">
                    <button 
                      onClick={() => viewDriverDetails(driver)}
                      className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Driver Details</h2>
                <button 
                  onClick={() => setSelectedDriver(null)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div><span className="font-medium">Name:</span> {selectedDriver.name}</div>
                    <div><span className="font-medium">Email:</span> {selectedDriver.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedDriver.phone}</div>
                    <div><span className="font-medium">Aadhar No:</span> {selectedDriver.aadharNo}</div>
                    <div><span className="font-medium">License No:</span> {selectedDriver.licenseNo}</div>
                    
                    <div className="mt-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Documents</h4>
                      <div className="space-y-2">
                        {selectedDriver.photo && (
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">Photo</span>
                            <button 
                              onClick={() => window.open(`${API_BASE_URL}/uploads/${selectedDriver.photo}`, '_blank')}
                              className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                              title="Download Photo"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                              </svg>
                            </button>
                          </div>
                        )}
                        {selectedDriver.dlPhoto && (
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">DL Photo</span>
                            <button 
                              onClick={() => window.open(`${API_BASE_URL}/uploads/${selectedDriver.dlPhoto}`, '_blank')}
                              className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                              title="Download DL Photo"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                              </svg>
                            </button>
                          </div>
                        )}
                        {selectedDriver.panPhoto && (
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">PAN Photo</span>
                            <button 
                              onClick={() => window.open(`${API_BASE_URL}/uploads/${selectedDriver.panPhoto}`, '_blank')}
                              className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                              title="Download PAN Photo"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                              </svg>
                            </button>
                          </div>
                        )}
                        {selectedDriver.aadharPhoto && (
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">Aadhar Photo</span>
                            <button 
                              onClick={() => window.open(`${API_BASE_URL}/uploads/${selectedDriver.aadharPhoto}`, '_blank')}
                              className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                              title="Download Aadhar Photo"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Vehicle</h3>
                  <div className="space-y-3">
                    <div><span className="font-medium">Alt Mobile 1:</span> {selectedDriver.alternateMobile1 || 'N/A'}</div>
                    <div><span className="font-medium">Alt Mobile 2:</span> {selectedDriver.alternateMobile2 || 'N/A'}</div>
                    <div><span className="font-medium">Alt Mobile 3:</span> {selectedDriver.alternateMobile3 || 'N/A'}</div>
                    <div><span className="font-medium">Alt Mobile 4:</span> {selectedDriver.alternateMobile4 || 'N/A'}</div>
                    <div><span className="font-medium">GPay:</span> {selectedDriver.gpayNo || 'N/A'}</div>
                    <div><span className="font-medium">PhonePe:</span> {selectedDriver.phonepeNo || 'N/A'}</div>
                    {/* <div><span className="font-medium">Vehicle Type:</span> {selectedDriver.vehicleType || 'N/A'}</div>
                    <div><span className="font-medium">Vehicle No:</span> {selectedDriver.vehicleNo || 'N/A'}</div> */}
                    <div><span className="font-medium">Package:</span> {packageMap[selectedDriver.packageType] || selectedDriver.packageType}</div>
                    <div><span className="font-medium">Total Rides:</span> {selectedDriver.totalRides}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}