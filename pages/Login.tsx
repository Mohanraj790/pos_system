import React, { useState } from 'react';
import { Store, UserRole, User } from '../types';
import { Button, Input, Select, Card } from '../components/UI';
import { Lock, User as UserIcon, Store as StoreIcon } from 'lucide-react';

interface LoginProps {
  stores: Store[];
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ stores, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('SUPER_ADMIN');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    if ((role === 'STORE_ADMIN' || role === 'CASHIER') && !selectedStoreId) {
      setError('Please select a store to access');
      return;
    }

    // Determine Store ID based on role
    // Super Admin is global (no storeId needed initially, or null)
    const storeId = role === 'SUPER_ADMIN' ? undefined : selectedStoreId;

    const user: User = {
      id: `user_${Date.now()}`,
      username,
      role,
      storeId
    };

    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">U</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">UniBill POS</h1>
          <p className="text-slate-500 mt-2">Sign in to your account</p>
        </div>

        <Card className="shadow-xl border-0">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Role</label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg">
                {(['SUPER_ADMIN', 'STORE_ADMIN', 'CASHIER'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRole(r); setSelectedStoreId(''); }}
                    className={`
                      py-2 px-2 rounded-md text-xs font-bold transition-all
                      ${role === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                    `}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <Input 
              label="Username" 
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              // icon={<UserIcon size={18} />}
            />

            <Input 
              label="Password" 
              type="password" 
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            {(role === 'STORE_ADMIN' || role === 'CASHIER') && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Select Store</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={selectedStoreId}
                  onChange={e => setSelectedStoreId(e.target.value)}
                >
                  <option value="">-- Choose Store --</option>
                  {stores.filter(s => s.isActive).map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
                {stores.length === 0 && <p className="text-xs text-red-500">No active stores found.</p>}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full py-3 text-lg shadow-lg shadow-indigo-200">
              Login as {role.replace('_', ' ')}
            </Button>
            
            <div className="text-center text-xs text-slate-400 mt-4">
              Use any password for demo
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
