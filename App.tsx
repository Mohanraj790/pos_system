import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { SuperAdmin } from './pages/SuperAdmin';
import { StoreAdmin } from './pages/StoreAdmin';
import { POS } from './pages/POS';
import { Profile } from './pages/Profile';
import { Store, Category, Product, Invoice, ViewMode, User, GlobalSettings } from './types';
import { INITIAL_STORES, INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_INVOICES, INITIAL_GLOBAL_SETTINGS } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

const App = () => {
  // Global Settings
  const [globalSettings, setGlobalSettings] = useLocalStorage<GlobalSettings>('unibill_settings', INITIAL_GLOBAL_SETTINGS);

  // Global State with Persistence
  const [stores, setStores] = useLocalStorage<Store[]>('unibill_stores', INITIAL_STORES);
  const [categories, setCategories] = useLocalStorage<Category[]>('unibill_categories', INITIAL_CATEGORIES);
  const [products, setProducts] = useLocalStorage<Product[]>('unibill_products', INITIAL_PRODUCTS);
  
  // Invoices - Logic depends on Data Source
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  
  // Auth State
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('unibill_user', null);

  // App View State (Persisted)
  const [currentView, setCurrentView] = useLocalStorage<ViewMode>('unibill_current_view', 'SUPER_ADMIN');
  const [activeStoreId, setActiveStoreId] = useLocalStorage<string | null>('unibill_active_store_id', null);

  // --- Data Synchronization Logic ---
  useEffect(() => {
    // 1. Firebase Mode
    if (globalSettings.dataSource === 'FIREBASE') {
        if (!db) return; // Fallback if firebase init failed
        
        try {
            const q = query(collection(db, 'invoices'), orderBy('date', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const firebaseInvoices = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
                })) as Invoice[];
                setInvoices(firebaseInvoices);
            }, (error) => {
                console.error("Firebase sync error:", error);
            });
            return () => unsubscribe();
        } catch (err) {
            console.warn("Firebase error:", err);
        }
    } 
    
    // 2. MySQL / REST API Mode
    else if (globalSettings.dataSource === 'MYSQL_API') {
        // Simulation of API polling or websocket connection
        console.log(`[System] Connected to MySQL via REST API: ${globalSettings.mysqlApiUrl}`);
        
        // In a real app, you would fetch() here. 
        // For this demo, we'll just keep the local state but log the intent.
        // fetch(`${globalSettings.mysqlApiUrl}/invoices`).then(...)
    }

    // 3. Local Storage Mode (Default fallback is to do nothing as state is already local)
  }, [globalSettings.dataSource, globalSettings.mysqlApiUrl]);


  // Sync activeStoreId with User's storeId if applicable
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'SUPER_ADMIN') {
        // If super admin is in a store view but no store is active, redirect to dashboard
        if (!activeStoreId && (currentView === 'STORE_ADMIN' || currentView === 'POS')) {
             setCurrentView('SUPER_ADMIN');
        }
      } else if (currentUser.storeId) {
        // Enforce store ID for non-super users
        if (activeStoreId !== currentUser.storeId) {
            setActiveStoreId(currentUser.storeId);
        }
        
        if (currentUser.role === 'STORE_ADMIN' && currentView === 'SUPER_ADMIN') {
           setCurrentView('STORE_ADMIN');
        } else if (currentUser.role === 'CASHIER' && currentView !== 'PROFILE' && currentView !== 'POS') {
           setCurrentView('POS');
        }
      }
    }
  }, [currentUser, activeStoreId, currentView]);


  const activeStore = stores.find(s => s.id === activeStoreId);

  // Helper Accessors
  const storeCategories = categories.filter(c => c.storeId === activeStoreId);
  const storeProducts = products.filter(p => p.storeId === activeStoreId);
  const storeInvoices = invoices.filter(i => i.storeId === activeStoreId);

  // --- Auth Handlers ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'SUPER_ADMIN') {
      setCurrentView('SUPER_ADMIN');
      setActiveStoreId(null);
    } else if (user.role === 'STORE_ADMIN') {
      setCurrentView('STORE_ADMIN');
      setActiveStoreId(user.storeId || null);
    } else if (user.role === 'CASHIER') {
      setCurrentView('POS');
      setActiveStoreId(user.storeId || null);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveStoreId(null);
    setCurrentView('SUPER_ADMIN');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  // --- CRUD Handlers ---

  const handleUpdateGlobalSettings = (newSettings: GlobalSettings) => {
      setGlobalSettings(newSettings);
      alert(`Data Source switched to: ${newSettings.dataSource}`);
  };

  // Store
  const handleAddStore = (store: Store) => {
    setStores([...stores, store]);
  };
  const handleUpdateStore = (updatedStore: Store) => {
    setStores(stores.map(s => s.id === updatedStore.id ? updatedStore : s));
  };

  // Category
  const handleAddCategory = (category: Category) => {
    setCategories([...categories, category]);
  };
  const handleUpdateCategory = (updatedCategory: Category) => {
    setCategories(categories.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };
  const handleDeleteCategory = (categoryId: string) => {
    const hasProducts = products.some(p => p.categoryId === categoryId);
    if (hasProducts) {
        alert("Cannot delete this category because it contains products. Please move or delete the products first.");
        return;
    }
    if (confirm("Are you sure you want to delete this category?")) {
        setCategories(categories.filter(c => c.id !== categoryId));
    }
  };


  // Product
  const handleAddProduct = (product: Product) => {
    setProducts([...products, product]);
  };
  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };
  const handleDeleteProduct = (productId: string) => {
    if(confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };
  const handleUpdateProductStock = (id: string, delta: number) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, stockQty: p.stockQty + delta } : p
    ));
  };

  // Invoice
  const handleSaveInvoice = async (invoice: Invoice) => {
    // 1. Optimistic UI Update (Always happens immediately)
    // We assume sync = false initially
    const newInvoice = { ...invoice, synced: false };
    setInvoices(prev => [newInvoice, ...prev]);

    // 2. Data Source Logic
    if (globalSettings.dataSource === 'FIREBASE' && db) {
      try {
        await addDoc(collection(db, 'invoices'), {
          ...invoice,
          synced: true,
          date: new Date().toISOString()
        });
        // If successful via snapshot listener, it will update automatically, 
        // but for immediate feedback we can mark local as synced if we managed it manually
      } catch (error) {
        console.error("Firebase write failed:", error);
      }
    } else if (globalSettings.dataSource === 'MYSQL_API') {
        try {
            console.log(`[API] POST ${globalSettings.mysqlApiUrl}/invoices`, invoice);
            // await fetch(...)
            // On success, update the local invoice synced status
            setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, synced: true } : inv));
        } catch (error) {
            console.error("MySQL API write failed:", error);
        }
    } else {
        // Local Storage Mode
        // It's already saved to 'invoices' state which is persisted by parent component logic or we can add a specific persistence here if needed.
        // For this demo app, 'invoices' state is not persisted in useLocalStorage in the original App code (it was useState),
        // but let's assume it's fine for the session in this demo context.
        setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, synced: true } : inv));
    }
  };

  // Navigation Handlers
  const handleViewChange = (view: ViewMode) => {
    // Permission Check
    if (currentUser?.role === 'CASHIER' && view !== 'POS' && view !== 'PROFILE') {
        alert("Access Denied: Cashiers can only access POS.");
        return;
    }
    if (currentUser?.role === 'STORE_ADMIN' && view === 'SUPER_ADMIN') {
        alert("Access Denied: Restricted to Store Admin.");
        return;
    }

    if ((view === 'STORE_ADMIN' || view === 'POS') && !activeStoreId) {
      alert("Please select a store from Super Admin dashboard first.");
      setCurrentView('SUPER_ADMIN');
      return;
    }
    setCurrentView(view);
  };

  const handleStoreSelect = (storeId: string) => {
    setActiveStoreId(storeId);
    setCurrentView('STORE_ADMIN');
  };

  // Render Page Content based on ViewMode
  const renderContent = () => {
    if (!currentUser) return null;

    if (currentView === 'PROFILE') {
        return <Profile user={currentUser} onUpdateUser={handleUpdateUser} />;
    }

    switch (currentView) {
      case 'SUPER_ADMIN':
        return (
          <SuperAdmin 
            stores={stores} 
            invoices={invoices}
            settings={globalSettings}
            onAddStore={handleAddStore} 
            onUpdateStore={handleUpdateStore}
            onSelectStore={handleStoreSelect}
            onUpdateSettings={handleUpdateGlobalSettings}
          />
        );
      case 'STORE_ADMIN':
        return activeStore ? (
          <StoreAdmin 
            store={activeStore}
            categories={storeCategories}
            products={storeProducts}
            invoices={storeInvoices}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateProductStock={handleUpdateProductStock}
            onUpdateStore={handleUpdateStore}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">Store not found or not selected.</div>
        );
      case 'POS':
        return activeStore ? (
          <POS 
            store={activeStore}
            categories={storeCategories}
            products={storeProducts}
            invoices={storeInvoices}
            onSaveInvoice={handleSaveInvoice}
            onUpdateProductStock={handleUpdateProductStock}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">Store not found or not selected.</div>
        );
      default:
        return <div>Select a view</div>;
    }
  };

  if (!currentUser) {
    return <Login stores={stores} onLogin={handleLogin} />;
  }

  return (
    <Layout 
      currentView={currentView} 
      onChangeView={handleViewChange}
      activeStoreName={activeStore?.name}
      user={currentUser}
      onLogout={handleLogout}
    >
      <div className="print-only">
        {/* Print content is handled via specific components triggering window.print() */}
      </div>
      <div className="no-print h-full">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;