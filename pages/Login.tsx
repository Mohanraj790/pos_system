import React, { useState } from 'react';
import { Store, UserRole, User } from '../types';
import { Button, Input, Select, Card } from '../components/UI';
import { Lock, User as UserIcon, Store as StoreIcon } from 'lucide-react';
import { authApi } from '../src/api/auth';

interface LoginProps {
  stores: Store[];
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ stores, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Basic Validation
      if (!username || !password) {
        setError('Please enter username and password');
        setLoading(false);
        return;
      }

      // Call login API
      console.log('🔍 Logging in user:', username);
      const { token, user } = await authApi.login(username, password);

      // Store token in localStorage
      localStorage.setItem('auth_token', token);

      // Check if store selection is required
      const userRole = user.role as UserRole;
      if ((userRole === 'STORE_ADMIN' || userRole === 'CASHIER')) {
        // Use store from database if available, otherwise require selection
        const storeId = user.storeId || selectedStoreId;

        if (!storeId) {
          setError('Please select a store to access');
          setLoading(false);
          return;
        }

        // Create user object
        const finalUser: User = {
          id: user.id,
          username: user.username,
          role: userRole,
          storeId: storeId,
          email: user.email,
          imageUrl: user.imageUrl
        };

        console.log('✅ Login successful!', finalUser);
        onLogin(finalUser);
      } else {
        // Super Admin
        const finalUser: User = {
          id: user.id,
          username: user.username,
          role: userRole,
          storeId: undefined,
          email: user.email,
          imageUrl: user.imageUrl
        };

        console.log('✅ Login successful!', finalUser);
        onLogin(finalUser);
      }

    } catch (err: any) {
      console.error('❌ Login error:', err);
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
            <Input
              label="Username"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Select Store (if applicable)</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100"
                value={selectedStoreId}
                onChange={e => setSelectedStoreId(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Choose Store (Optional) --</option>
                {stores.filter(s => s.isActive).map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500">Required for Store Admin and Cashier roles</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-3 text-lg shadow-lg shadow-indigo-200"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-xs text-slate-400 mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-blue-700">
                <strong>Test Credentials:</strong><br />
                admin / admin123 (Super Admin)<br />
                cashier / cashier123 (Cashier)
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
