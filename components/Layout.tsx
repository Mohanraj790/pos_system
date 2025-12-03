import React from 'react';
import { ViewMode, User } from '../types';
import { 
  LayoutDashboard, 
  Store, 
  ShoppingCart, 
  LogOut, 
  Menu,
  UserCircle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  activeStoreName?: string;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, activeStoreName, user, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label, disabled = false }: { view: ViewMode, icon: any, label: string, disabled?: boolean }) => {
    if (disabled) return null;
    return (
      <button
        onClick={() => {
          onChangeView(view);
          setSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          currentView === view 
            ? 'bg-indigo-50 text-indigo-600' 
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  // RBAC for Navigation
  const canSeeSuperAdmin = user.role === 'SUPER_ADMIN';
  const canSeeStoreAdmin = user.role === 'SUPER_ADMIN' || user.role === 'STORE_ADMIN';
  const canSeePOS = true; // Everyone can essentially see POS if they are assigned to a store

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">U</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">UniBill</h1>
          </div>
          {activeStoreName ? (
             <div className="mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              {activeStoreName}
             </div>
          ) : (
             <div className="mt-2 text-xs font-semibold text-indigo-500 uppercase tracking-wider truncate">
              Global Admin
             </div>
          )}
        </div>

        <nav className="p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4">Modules</div>
          
          <NavItem 
            view="SUPER_ADMIN" 
            icon={LayoutDashboard} 
            label="Super Admin" 
            disabled={!canSeeSuperAdmin}
          />
          
          <NavItem 
            view="STORE_ADMIN" 
            icon={Store} 
            label="Store Admin" 
            disabled={!canSeeStoreAdmin} 
          />
          
          <NavItem 
            view="POS" 
            icon={ShoppingCart} 
            label="Cashier POS" 
            disabled={!canSeePOS}
          />

          <div className="pt-4 mt-4 border-t border-slate-100">
             <NavItem 
              view="PROFILE" 
              icon={UserCircle} 
              label="My Profile" 
            />
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-slate-50">
           <div className="flex items-center gap-3 mb-4 px-2 cursor-pointer" onClick={() => onChangeView('PROFILE')}>
              {user.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-indigo-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 text-xs">
                    {user.username.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-slate-800 truncate">{user.username}</div>
                <div className="text-xs text-slate-500 truncate">{user.role.replace('_', ' ')}</div>
              </div>
           </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-slate-500 hover:text-red-600 px-4 py-2 w-full transition-colors rounded-lg hover:bg-red-50"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8">
          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4 ml-auto">
             <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
               {new Date().toLocaleDateString()}
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};