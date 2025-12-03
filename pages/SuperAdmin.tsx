import React, { useState, useMemo, useEffect } from 'react';
import { Store, Currency, Invoice, GlobalSettings, DataSource } from '../types';
import { Card, Button, Input, Select, Badge, Modal } from '../components/UI';
import { Plus, Store as StoreIcon, Activity, TrendingUp, Edit2, Clock, Globe, Mail, Phone, Settings, Database, Server } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SuperAdminProps {
  stores: Store[];
  invoices: Invoice[];
  settings: GlobalSettings;
  onAddStore: (store: Store) => void;
  onUpdateStore: (store: Store) => void;
  onSelectStore: (storeId: string) => void;
  onUpdateSettings: (settings: GlobalSettings) => void;
}

export const SuperAdmin: React.FC<SuperAdminProps> = ({ 
    stores, invoices, settings, 
    onAddStore, onUpdateStore, onSelectStore, onUpdateSettings 
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Local state for Settings Form
  const [localSettings, setLocalSettings] = useState<GlobalSettings>(settings);

  const [currentStore, setCurrentStore] = useState<Partial<Store>>({
    currency: Currency.USD,
    isActive: true,
    timezone: 'UTC',
    activeUpiIdType: 'PRIMARY'
  });

  // Sync settings prop to local state when modal opens
  useEffect(() => {
     setLocalSettings(settings);
  }, [settings, isSettingsOpen]);

  // --- Analytics ---
  const { totalRevenue, activeStoresCount, chartData, recentTransactions } = useMemo(() => {
    // 1. Revenue & Active Count
    const revenue = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0); 
    const active = stores.filter(s => s.isActive).length;

    // 2. Chart Data (Last 14 Days Global)
    const days = 14;
    const dateMap = new Map<string, number>();
    
    // Initialize last 14 days with 0
    for(let i=days-1; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dateMap.set(d.toLocaleDateString(), 0);
    }

    invoices.forEach(inv => {
        const d = new Date(inv.date).toLocaleDateString();
        if(dateMap.has(d)) {
            dateMap.set(d, dateMap.get(d)! + inv.grandTotal);
        }
    });

    const data = Array.from(dateMap.entries()).map(([date, sales]) => ({
        date: date.slice(0, 5), // simplified date
        sales
    }));

    // 3. Recent Transactions (Last 5)
    const recent = [...invoices]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return { totalRevenue: revenue, activeStoresCount: active, chartData: data, recentTransactions: recent };
  }, [stores, invoices]);

  // --- Handlers ---
  const openCreateModal = () => {
    setIsEditMode(false);
    setCurrentStore({ currency: Currency.USD, isActive: true, timezone: 'UTC', activeUpiIdType: 'PRIMARY' });
    setModalOpen(true);
  };

  const openEditModal = (store: Store) => {
    setIsEditMode(true);
    setCurrentStore({ ...store });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore.name || !currentStore.ownerName) return;
    
    const storeData: Store = {
        id: isEditMode && currentStore.id ? currentStore.id : `store_${Date.now()}`,
        name: currentStore.name,
        ownerName: currentStore.ownerName,
        currency: currentStore.currency || Currency.USD,
        address: currentStore.address || '',
        gstNumber: currentStore.gstNumber,
        primaryUpiId: currentStore.primaryUpiId,
        secondaryUpiId: currentStore.secondaryUpiId,
        activeUpiIdType: currentStore.activeUpiIdType || 'PRIMARY',
        isActive: currentStore.isActive !== undefined ? currentStore.isActive : true,
        email: currentStore.email,
        mobile: currentStore.mobile,
        logoUrl: currentStore.logoUrl,
        timezone: currentStore.timezone
    };

    if (isEditMode) {
        onUpdateStore(storeData);
    } else {
        onAddStore(storeData);
    }
    setModalOpen(false);
  };

  const handleSettingsSave = () => {
      onUpdateSettings(localSettings);
      setSettingsOpen(false);
  };

  const addPreset = () => {
      const val = prompt("Enter new tax rate (%):");
      if (val && !isNaN(Number(val))) {
          const newRate = Number(val);
          if (!localSettings.defaultTaxPresets.includes(newRate)) {
              setLocalSettings({
                  ...localSettings,
                  defaultTaxPresets: [...localSettings.defaultTaxPresets, newRate].sort((a, b) => a - b)
              });
          }
      }
  };

  const removePreset = (rate: number) => {
      setLocalSettings({
          ...localSettings,
          defaultTaxPresets: localSettings.defaultTaxPresets.filter(r => r !== rate)
      });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Super Admin Dashboard</h2>
          <p className="text-slate-500">Overview of global performance and store management.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSettingsOpen(true)} className="flex items-center gap-2">
                <Settings size={18} /> Global Settings
            </Button>
            <Button onClick={openCreateModal} className="flex items-center gap-2">
                <Plus size={18} /> Add New Store
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600">
            <StoreIcon size={24} />
          </div>
          <div>
            <div className="text-sm text-slate-500">Total Stores</div>
            <div className="text-2xl font-bold">{stores.length}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-green-500">
          <div className="p-3 rounded-full bg-green-50 text-green-600">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-sm text-slate-500">Active Stores</div>
            <div className="text-2xl font-bold">{activeStoresCount}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-purple-500">
          <div className="p-3 rounded-full bg-purple-50 text-purple-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-sm text-slate-500">Global Revenue</div>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          </div>
        </Card>
      </div>

      {/* Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="text-lg font-bold text-slate-800 mb-6">Global Revenue Trend</h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
        </div>

        {/* Recent Transactions */}
        <Card title="Recent Activity" className="lg:col-span-1">
             <div className="space-y-4">
                 {recentTransactions.length === 0 ? (
                     <p className="text-slate-400 text-sm">No recent transactions.</p>
                 ) : (
                     recentTransactions.map(inv => {
                         const storeName = stores.find(s => s.id === inv.storeId)?.name || 'Unknown Store';
                         return (
                             <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                 <div>
                                     <div className="font-medium text-sm text-slate-800">{storeName}</div>
                                     <div className="text-xs text-slate-500 flex items-center gap-1">
                                         <Clock size={10} /> {new Date(inv.date).toLocaleTimeString()}
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <div className="font-bold text-sm text-indigo-600">{inv.grandTotal.toFixed(2)}</div>
                                     <Badge color="blue">{inv.paymentMethod}</Badge>
                                 </div>
                             </div>
                         );
                     })
                 )}
             </div>
        </Card>
      </div>

      {/* Stores List */}
      <div className="pt-4">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Registered Stores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map(store => (
            <Card key={store.id} className="hover:shadow-md transition-all relative overflow-hidden group pb-4">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                  <button 
                      onClick={() => openEditModal(store)}
                      className="p-1.5 bg-white rounded-lg shadow-sm hover:text-indigo-600 border border-slate-200 text-slate-500 transition-colors"
                      title="Edit Store Details"
                  >
                      <Edit2 size={16} />
                  </button>
                  <Button variant="secondary" className="text-xs py-1 px-3 shadow-sm h-[32px]" onClick={() => onSelectStore(store.id)}>Manage</Button>
                </div>
                
                <div className="flex items-start gap-4 mb-4 pr-16">
                    {store.logoUrl ? (
                        <img src={store.logoUrl} alt={store.name} className="w-14 h-14 rounded-xl object-cover border border-slate-100" />
                    ) : (
                        <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                            <StoreIcon size={28} />
                        </div>
                    )}
                    <div>
                         <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2 line-clamp-1" title={store.name}>{store.name}</h3>
                         <label className="inline-flex items-center cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={store.isActive}
                                onChange={() => onUpdateStore({ ...store, isActive: !store.isActive })}
                            />
                            <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className={`ms-2 text-xs font-semibold ${store.isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {store.isActive ? 'Active' : 'Suspended'}
                            </span>
                        </label>
                    </div>
                </div>

                <div className="space-y-2 border-t pt-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 truncate">
                        <Mail size={14} className="shrink-0" /> <span className="truncate">{store.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 truncate">
                        <Phone size={14} className="shrink-0" /> <span className="truncate">{store.mobile || 'No mobile'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 truncate">
                         <Globe size={14} className="shrink-0" /> <span className="truncate">{store.currency} • {store.timezone || 'UTC'}</span>
                    </div>
                </div>
            </Card>
            ))}
        </div>
      </div>

      {/* Store Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={isEditMode ? "Edit Store Details" : "Onboard New Store"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Store Name" 
            value={currentStore.name || ''} 
            onChange={e => setCurrentStore({...currentStore, name: e.target.value})} 
            placeholder="e.g. Downtown Bakery" 
            required 
          />
          <div className="grid grid-cols-2 gap-4">
             <Input 
                label="Owner Name" 
                value={currentStore.ownerName || ''} 
                onChange={e => setCurrentStore({...currentStore, ownerName: e.target.value})} 
                placeholder="e.g. John Doe" 
                required 
            />
             <Input 
                label="Mobile" 
                value={currentStore.mobile || ''} 
                onChange={e => setCurrentStore({...currentStore, mobile: e.target.value})} 
                placeholder="+1 234 567 890" 
            />
          </div>
          <Input 
            label="Email Address" 
            type="email"
            value={currentStore.email || ''} 
            onChange={e => setCurrentStore({...currentStore, email: e.target.value})} 
            placeholder="store@example.com" 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Currency" 
              value={currentStore.currency} 
              onChange={e => setCurrentStore({...currentStore, currency: e.target.value as Currency})}
            >
              {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input 
              label="Timezone" 
              value={currentStore.timezone || ''} 
              onChange={e => setCurrentStore({...currentStore, timezone: e.target.value})} 
              placeholder="e.g. America/New_York" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input 
                label="Primary UPI ID" 
                value={currentStore.primaryUpiId || ''} 
                onChange={e => setCurrentStore({...currentStore, primaryUpiId: e.target.value})} 
                placeholder="primary@upi" 
            />
             <Input 
                label="Secondary UPI ID" 
                value={currentStore.secondaryUpiId || ''} 
                onChange={e => setCurrentStore({...currentStore, secondaryUpiId: e.target.value})} 
                placeholder="secondary@upi" 
            />
          </div>
          <Input 
                label="GST / Tax ID" 
                value={currentStore.gstNumber || ''} 
                onChange={e => setCurrentStore({...currentStore, gstNumber: e.target.value})} 
                placeholder="Tax Identification No." 
            />

          <Input 
            label="Address" 
            value={currentStore.address || ''} 
            onChange={e => setCurrentStore({...currentStore, address: e.target.value})} 
            placeholder="Full physical address" 
          />

          <Input 
            label="Logo URL" 
            value={currentStore.logoUrl || ''} 
            onChange={e => setCurrentStore({...currentStore, logoUrl: e.target.value})} 
            placeholder="https://..." 
          />
          
          {isEditMode && (
             <div className="flex items-center gap-2 pt-2 bg-slate-50 p-3 rounded-lg">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={currentStore.isActive} 
                  onChange={e => setCurrentStore({...currentStore, isActive: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Store Active Status</label>
             </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{isEditMode ? "Save Changes" : "Onboard Store"}</Button>
          </div>
        </form>
      </Modal>

      {/* Global Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} title="Global Configuration">
         <div className="space-y-6">
             {/* 1. Database Configuration */}
             <div className="space-y-3 pb-6 border-b border-slate-200">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Database size={18} /> Data Source Configuration
                </h4>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                    <Select 
                        label="Active Data Source" 
                        value={localSettings.dataSource}
                        onChange={e => setLocalSettings({...localSettings, dataSource: e.target.value as DataSource})}
                    >
                        <option value="LOCAL_STORAGE">Local Storage (Browser Only)</option>
                        <option value="FIREBASE">Firebase Cloud Firestore</option>
                        <option value="MYSQL_API">MySQL (via REST API)</option>
                    </Select>
                    
                    {localSettings.dataSource === 'MYSQL_API' && (
                         <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                             <Input 
                                label="MySQL REST API Endpoint"
                                value={localSettings.mysqlApiUrl || ''}
                                onChange={e => setLocalSettings({...localSettings, mysqlApiUrl: e.target.value})}
                                placeholder="https://api.yourdomain.com/v1"
                                icon={<Server size={16} />}
                             />
                             <p className="text-xs text-amber-600 mt-2">
                                ⚠ Ensure the API endpoint is reachable and CORS is enabled.
                             </p>
                         </div>
                    )}
                    
                    {localSettings.dataSource === 'FIREBASE' && (
                        <p className="text-xs text-green-600">
                             ✓ Using Firebase configuration defined in source code.
                        </p>
                    )}
                </div>
             </div>

             {/* 2. Tax Configuration */}
             <div>
                 <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                     <Settings size={18} /> Tax Presets
                 </h4>
                 <div className="flex flex-wrap gap-2">
                     {localSettings.defaultTaxPresets.map(rate => (
                         <div key={rate} className="px-3 py-1 bg-slate-100 rounded border border-slate-300 text-sm font-medium flex items-center gap-2">
                             {rate}%
                             <button onClick={() => removePreset(rate)} className="text-slate-400 hover:text-red-500 font-bold">&times;</button>
                         </div>
                     ))}
                     <button onClick={addPreset} className="px-3 py-1 text-indigo-600 text-sm font-medium hover:bg-indigo-50 rounded border border-dashed border-indigo-200">+ Add Rate</button>
                 </div>
             </div>

             <div className="pt-4 border-t flex justify-end gap-2">
                 <Button variant="secondary" onClick={() => setSettingsOpen(false)}>Cancel</Button>
                 <Button onClick={handleSettingsSave}>Save Configuration</Button>
             </div>
         </div>
      </Modal>
    </div>
  );
};