import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api/config';

interface DeletedAccount {
  id: string;
  originalId: string;
  role: string;
  name: string;
  phone: string;
  email: string;
  deletedAt: string;
  data: any;
}

const AdminDeletedAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<DeletedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<DeletedAccount | null>(null);

  useEffect(() => {
    fetchDeletedAccounts();
  }, []);

  const fetchDeletedAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/deleted-accounts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setAccounts(data.deletedAccounts);
      } else {
        setError(data.error || 'Failed to fetch deleted accounts');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'CUSTOMER': return 'bg-blue-100 text-blue-700';
      case 'DRIVER': return 'bg-green-100 text-green-700';
      case 'LEAD': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Deleted Accounts Archive</h1>
        <p className="text-gray-500 text-sm mt-1">View historical data of accounts that have been deleted or deactivated.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 shadow-sm border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">No Deleted Accounts</h3>
          <p className="text-gray-500 text-sm">There are no archived accounts in the system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col h-[calc(100vh-200px)]">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-800">Archive List</h2>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {accounts.map(account => (
                <div 
                  key={account.id}
                  onClick={() => setSelectedAccount(account)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedAccount?.id === account.id ? 'bg-black text-white border-black shadow-md' : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold ${selectedAccount?.id === account.id ? 'text-white' : 'text-gray-900'}`}>
                      {account.name || 'Unknown'}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${selectedAccount?.id === account.id ? 'bg-white/20 text-white' : getRoleColor(account.role)}`}>
                      {account.role}
                    </span>
                  </div>
                  <div className={`space-y-1 text-xs ${selectedAccount?.id === account.id ? 'text-gray-300' : 'text-gray-500'}`}>
                    <p className="flex items-center gap-2" title={account.phone}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {account.phone?.startsWith('deleted_') ? 'N/A (Anonymized)' : (account.phone || 'N/A')}
                    </p>
                    <p className="flex items-center gap-2" title={account.email}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {account.email?.startsWith('deleted_') ? 'N/A (Anonymized)' : (account.email || 'N/A')}
                    </p>
                    <p className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Deleted: {new Date(account.deletedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col h-[calc(100vh-200px)]">
            {selectedAccount ? (
              <>
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h2 className="font-bold text-gray-800">Original Data Dump</h2>
                  <span className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border shadow-sm">ID: {selectedAccount.originalId}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-gray-900 text-gray-100 font-mono text-xs">
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedAccount.data, null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <svg className="w-12 h-12 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Select an account from the list<br/>to view its full original data</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeletedAccounts;
