import React, { useState } from 'react';
import { loginLead } from '../../api/lead';
import { toast } from 'react-toastify';

interface LeadLoginProps {
  onLogin: (lead: any) => void;
  onBack: () => void;
  onRegister: () => void;
}

const LeadLogin: React.FC<LeadLoginProps> = ({ onLogin, onBack, onRegister }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await loginLead(phone, password);
    
    if (result.success) {
      toast.success('Login successful!');
      onLogin({ ...result.lead, role: 'LEAD' });
    } else {
      toast.error(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="animate-fade-in flex-grow flex flex-col">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-black mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm font-bold">Back</span>
      </button>

      <h2 className="text-xl font-bold mb-6">Lead Login</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 flex-grow flex flex-col">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter phone number"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter password"
            required
          />
        </div>
        
        <div className="flex-grow"></div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition disabled:bg-gray-400"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{' '}
          <button type="button" onClick={onRegister} className="text-black font-bold hover:underline">
            Register here
          </button>
        </p>
      </form>
    </div>
  );
};

export default LeadLogin;
