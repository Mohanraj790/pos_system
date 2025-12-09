import React, { useState, useMemo } from 'react';
import { Store, Product, Category, Invoice, Currency } from '../types';
import { Card, Button, Input, Modal, Badge, Select } from '../components/UI';
import { 
  LayoutDashboard, Package, Tag, Users, Settings, Plus, Edit2, Trash2, 
  Download, FileText, TrendingUp, AlertTriangle, Search, BarChart2, Clock
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StoreAdminProps {
  store: Store;
  categories: Category[];
  products: Product[];
  invoices: Invoice[];
  onAddCategory: (cat: Category) => void;
  onUpdateCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProductStock: (id: string, qty: number) => void;
  onUpdateStore: (store: Store) => void;
}

type Tab = 'DASHBOARD' | 'PRODUCTS' | 'CATEGORIES' | 'SETTINGS';
type TimeRange = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const StoreAdmin: React.FC<StoreAdminProps> = ({ 
  store, categories, products, invoices, 
  onAddCategory, onUpdateCategory, onDeleteCategory,
  onAddProduct, onUpdateProduct, onDeleteProduct, onUpdateProductStock,
  onUpdateStore
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [timeRange, setTimeRange] = useState<TimeRange>('WEEK');
  
  // Modals
  const [isCatModalOpen, setCatModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({});
  const [isProdModalOpen, setProdModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  
  // Search
  const [productSearch, setProductSearch] = useState('');

  // Settings Local State
  const [settingsForm, setSettingsForm] = useState<Partial<Store>>({});
  
  // Initialize settings form when tab changes or store updates
  React.useEffect(() => {
     setSettingsForm({ ...store });
  }, [store]);

  // --- ANALYTICS LOGIC ---
  const analyticsData = useMemo(() => {
    const now = new Date();
    const filteredInvoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        if (timeRange === 'TODAY') return d.toDateString() === now.toDateString();
        if (timeRange === 'WEEK') {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            return d >= weekAgo;
        }
        if (timeRange === 'MONTH') {
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            return d >= monthAgo;
        }
        return true;
    });

    const totalSales = filteredInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
    const totalOrders = filteredInvoices.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Sales Trend (Group by Date)
    const salesByDateMap = new Map<string, number>();
    filteredInvoices.forEach(inv => {
        const dateKey = new Date(inv.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        salesByDateMap.set(dateKey, (salesByDateMap.get(dateKey) || 0) + inv.grandTotal);
    });
    
    const trendData = Array.from(salesByDateMap.entries()).map(([date, sales]) => ({ date, sales })); 

    // Category Sales
    const categorySalesMap = new Map<string, number>();
    filteredInvoices.forEach(inv => {
        inv.items.forEach(item => {
            const catName = categories.find(c => c.id === item.categoryId)?.name || 'Unknown';
            categorySalesMap.set(catName, (categorySalesMap.get(catName) || 0) + item.lineTotal);
        });
    });
    const categoryData = Array.from(categorySalesMap.entries()).map(([name, value]) => ({ name, value }));

    // Payment Method Split
    const paymentMap = new Map<string, number>();
    filteredInvoices.forEach(inv => {
        paymentMap.set(inv.paymentMethod, (paymentMap.get(inv.paymentMethod) || 0) + 1);
    });
    const paymentData = Array.from(paymentMap.entries()).map(([name, value]) => ({ name, value }));

    // --- NEW KPIs ---

    // Top Selling Products (By Quantity)
    const productQtyMap = new Map<string, number>();
    filteredInvoices.forEach(inv => {
        inv.items.forEach(item => {
            productQtyMap.set(item.name, (productQtyMap.get(item.name) || 0) + item.quantity);
        });
    });
    const topProductsData = Array.from(productQtyMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

    // Sales by Hour
    const hoursMap = new Array(24).fill(0);
    filteredInvoices.forEach(inv => {
        const d = new Date(inv.date);
        const hour = d.getHours();
        hoursMap[hour] += inv.grandTotal;
    });
    const hourlySalesData = hoursMap.map((sales, hour) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        sales
    }));

    // Lowest Stock Products (Absolute lowest count)
    const lowestStockData = [...products]
        .sort((a, b) => a.stockQty - b.stockQty)
        .slice(0, 5)
        .map(p => ({
            ...p,
            categoryName: categories.find(c => c.id === p.categoryId)?.name || 'Unknown'
        }));

    return { 
        totalSales, totalOrders, avgOrderValue, 
        trendData, categoryData, paymentData, 
        topProductsData, hourlySalesData, lowestStockData,
        filteredInvoices 
    };
  }, [invoices, timeRange, categories, products]);


  // --- HANDLERS ---

  const handleDownloadReport = () => {
     const headers = ['Invoice No', 'Date', 'Time', 'Total', 'Tax', 'Discount', 'Payment Method', 'Items Count'];
     const rows = analyticsData.filteredInvoices.map(inv => [
         inv.invoiceNumber,
         new Date(inv.date).toLocaleDateString(),
         new Date(inv.date).toLocaleTimeString(),
         inv.grandTotal.toFixed(2),
         inv.taxTotal.toFixed(2),
         inv.discountTotal.toFixed(2),
         inv.paymentMethod,
         inv.items.length
     ]);

     const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `${store.name}_Sales_Report_${timeRange}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(`${store.name} - Sales Report`, 14, 22);
    
    // Sub-header
    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleDateString();
    doc.text(`Generated on: ${dateStr} | Period: ${timeRange}`, 14, 30);
    
    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 35, 196, 35);
    
    // Summary Section
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Summary', 14, 45);
    
    doc.setFontSize(10);
    doc.text(`Total Revenue: ${store.currency} ${analyticsData.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 14, 53);
    doc.text(`Total Orders: ${analyticsData.totalOrders}`, 80, 53);
    doc.text(`Avg Order Value: ${store.currency} ${analyticsData.avgOrderValue.toFixed(2)}`, 140, 53);

    // Table
    const tableColumn = ["Invoice No", "Date", "Items", "Method", "Total", "Tax"];
    const tableRows = analyticsData.filteredInvoices.map(inv => [
        inv.invoiceNumber,
        new Date(inv.date).toLocaleDateString(),
        inv.items.length,
        inv.paymentMethod,
        `${store.currency} ${inv.grandTotal.toFixed(2)}`,
        `${store.currency} ${inv.taxTotal.toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' }, // Indigo-600
        alternateRowStyles: { fillColor: [249, 250, 251] }, // Slate-50
        foot: [[
            'TOTAL', 
            '', 
            '', 
            '', 
            `${store.currency} ${analyticsData.totalSales.toFixed(2)}`, 
            ''
        ]],
        footStyles: { fillColor: [241, 245, 249], textColor: 0, fontStyle: 'bold' }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: 'right' });
        doc.text('Generated by UniBill POS', 14, 290);
    }

    doc.save(`${store.name}_Report_${timeRange}.pdf`);
  };

  // Category Handlers
  const saveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory.name) return;
    const cat: Category = {
        id: currentCategory.id || `cat_${Date.now()}`,
        storeId: store.id,
        name: currentCategory.name,
        defaultGST: Number(currentCategory.defaultGST) || 0,
        defaultDiscount: Number(currentCategory.defaultDiscount) || 0,
        lowStockThreshold: Number(currentCategory.lowStockThreshold) || 5
    };
    if (currentCategory.id) onUpdateCategory(cat);
    else onAddCategory(cat);
    setCatModalOpen(false);
  };

  // Product Handlers
  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct.name || !currentProduct.categoryId) return;
    const prod: Product = {
        id: currentProduct.id || `prod_${Date.now()}`,
        storeId: store.id,
        name: currentProduct.name,
        categoryId: currentProduct.categoryId,
        price: Number(currentProduct.price) || 0,
        stockQty: Number(currentProduct.stockQty) || 0,
        sku: currentProduct.sku || '',
        imageUrl: currentProduct.imageUrl || '',
        taxOverride: currentProduct.taxOverride === undefined ? null : currentProduct.taxOverride
    };
    if (currentProduct.id) onUpdateProduct(prod);
    else onAddProduct(prod);
    setProdModalOpen(false);
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStore({ ...store, ...settingsForm });
    alert("Settings updated successfully!");
  };

  const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* --- Top Bar: Tabs --- */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
            <TabButton active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} icon={LayoutDashboard} label="Overview" />
            <TabButton active={activeTab === 'PRODUCTS'} onClick={() => setActiveTab('PRODUCTS')} icon={Package} label="Products" />
            <TabButton active={activeTab === 'CATEGORIES'} onClick={() => setActiveTab('CATEGORIES')} icon={Tag} label="Categories" />
            <TabButton active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} icon={Settings} label="Settings" />
        </div>
        
        {activeTab === 'DASHBOARD' && (
             <div className="flex gap-2 items-center">
                 <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value as TimeRange)} className="w-32">
                     <option value="TODAY">Today</option>
                     <option value="WEEK">This Week</option>
                     <option value="MONTH">This Month</option>
                     <option value="ALL">All Time</option>
                 </Select>
                 <Button onClick={handleDownloadReport} variant="secondary" className="flex items-center gap-2">
                     <Download size={16} /> CSV
                 </Button>
                 <Button onClick={handleDownloadPDF} variant="secondary" className="flex items-center gap-2">
                     <FileText size={16} /> PDF
                 </Button>
             </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        
        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-indigo-500">
                    <div className="text-sm text-slate-500 mb-1">Total Sales ({timeRange.toLowerCase()})</div>
                    <div className="text-3xl font-bold text-slate-800">{store.currency} {analyticsData.totalSales.toLocaleString()}</div>
                </Card>
                <Card className="border-l-4 border-green-500">
                    <div className="text-sm text-slate-500 mb-1">Total Orders</div>
                    <div className="text-3xl font-bold text-slate-800">{analyticsData.totalOrders}</div>
                </Card>
                <Card className="border-l-4 border-amber-500">
                    <div className="text-sm text-slate-500 mb-1">Avg. Order Value</div>
                    <div className="text-3xl font-bold text-slate-800">{store.currency} {analyticsData.avgOrderValue.toFixed(2)}</div>
                </Card>
            </div>

            {/* Row 1: Sales Trend (Line) & Top Selling Products (Bar) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} /> Sales Trend
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analyticsData.trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                <ReTooltip />
                                <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <BarChart2 size={20} /> Top Selling (Qty)
                    </h3>
                    <div className="h-72">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData.topProductsData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                                <ReTooltip />
                                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                         </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 2: Sales by Hour (Bar) & Payment Methods (Pie) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Clock size={20} /> Sales by Hour (Peak Times)
                    </h3>
                    <div className="h-72">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData.hourlySalesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="hour" tick={{fontSize: 10}} />
                                <YAxis tick={{fontSize: 12}} />
                                <ReTooltip />
                                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                         </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-4">Payment Methods</h3>
                    <div className="h-72">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={analyticsData.paymentData} 
                                    cx="50%" cy="50%" 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {analyticsData.paymentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <ReTooltip />
                                <Legend />
                            </PieChart>
                         </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 3: Category Sales (Bar) & Lowest Stock Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-4">Sales by Category</h3>
                    <div className="h-72">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData.categoryData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                                <ReTooltip />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                         </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                         <AlertTriangle size={20} className="text-red-500" /> Lowest Stock Products
                     </h3>
                     <div className="overflow-y-auto h-72">
                         <table className="w-full text-sm text-left">
                             <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                                 <tr>
                                     <th className="px-3 py-2">Product</th>
                                     <th className="px-3 py-2">Category</th>
                                     <th className="px-3 py-2 text-right">Stock</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {analyticsData.lowestStockData.map(p => (
                                     <tr key={p.id} className="border-b">
                                         <td className="px-3 py-2 font-medium">{p.name}</td>
                                         <td className="px-3 py-2 text-slate-500">{p.categoryName}</td>
                                         <td className={`px-3 py-2 text-right font-bold ${p.stockQty <= 5 ? 'text-red-600' : 'text-slate-700'}`}>
                                             {p.stockQty}
                                         </td>
                                     </tr>
                                 ))}
                                 {products.length === 0 && (
                                     <tr><td colSpan={3} className="text-center p-4 text-slate-400">No products found.</td></tr>
                                 )}
                             </tbody>
                         </table>
                     </div>
                </div>
            </div>
          </div>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'PRODUCTS' && (
           <div className="space-y-4">
               <div className="flex justify-between items-center">
                   <div className="relative w-full max-w-sm">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <Input 
                         placeholder="Search products..." 
                         className="pl-10" 
                         value={productSearch}
                         onChange={e => setProductSearch(e.target.value)}
                       />
                   </div>
                   <Button onClick={() => { setCurrentProduct({stockQty: 0, price: 0}); setProdModalOpen(true); }} className="flex gap-2">
                       <Plus size={18} /> Add Product
                   </Button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {filteredProducts.map(p => {
                       const cat = categories.find(c => c.id === p.categoryId);
                       const lowLimit = cat?.lowStockThreshold ?? 5;
                       const isLowStock = p.stockQty <= lowLimit;

                       return (
                           <div key={p.id} className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all ${isLowStock ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'}`}>
                               <div className="flex justify-between items-start mb-2">
                                   <Badge color="blue">{cat?.name}</Badge>
                                   <div className="flex gap-1">
                                       <button onClick={() => { setCurrentProduct(p); setProdModalOpen(true); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Edit2 size={14} /></button>
                                       <button onClick={() => { if(confirm('Delete?')) onDeleteProduct(p.id) }} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
                                   </div>
                               </div>
                               
                               {p.imageUrl && (
                                   <div className="h-32 bg-slate-100 rounded mb-3 overflow-hidden">
                                       <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                   </div>
                               )}
                               
                               <h4 className="font-bold text-slate-800 mb-1">{p.name}</h4>
                               <p className="text-xs text-slate-500 mb-3">SKU: {p.sku || 'N/A'}</p>
                               
                               <div className="flex justify-between items-center pt-3 border-t">
                                   <span className="font-bold text-indigo-600">{store.currency} {p.price}</span>
                                   <div className="flex items-center gap-2">
                                       <button onClick={() => onUpdateProductStock(p.id, -1)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600">-</button>
                                       <span className={`text-sm font-medium w-8 text-center ${isLowStock ? 'text-red-600 font-bold' : ''}`}>{p.stockQty}</span>
                                       <button onClick={() => onUpdateProductStock(p.id, 1)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600">+</button>
                                   </div>
                               </div>
                               {isLowStock && <div className="text-[10px] text-red-500 font-bold mt-2 flex items-center gap-1"><AlertTriangle size={10} /> Low Stock (Limit: {lowLimit})</div>}
                           </div>
                       );
                   })}
               </div>
           </div>
        )}

        {/* --- CATEGORIES TAB --- */}
        {activeTab === 'CATEGORIES' && (
            <div className="space-y-4 max-w-4xl">
                <div className="flex justify-end">
                    <Button onClick={() => { setCurrentCategory({defaultGST: 0, defaultDiscount: 0, lowStockThreshold: 5}); setCatModalOpen(true); }} className="flex gap-2">
                        <Plus size={18} /> Add Category
                    </Button>
                </div>
                <Card className="p-0 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 text-sm font-medium border-b">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Default Tax (GST)</th>
                                <th className="p-4">Default Discount</th>
                                <th className="p-4">Low Stock Alert</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {categories.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-800">{c.name}</td>
                                    <td className="p-4 text-slate-600">{c.defaultGST}%</td>
                                    <td className="p-4 text-slate-600">{c.defaultDiscount || 0}%</td>
                                    <td className="p-4 text-slate-600 flex items-center gap-2">
                                        <div className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-bold border border-amber-100">
                                            &le; {c.lowStockThreshold || 5} units
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => { setCurrentCategory(c); setCatModalOpen(true); }}>Edit</Button>
                                            <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => onDeleteCategory(c.id)}>Delete</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No categories found.</td></tr>}
                        </tbody>
                    </table>
                </Card>
            </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'SETTINGS' && (
            <div className="max-w-2xl space-y-6">
                <Card title="Store Configuration">
                    <form onSubmit={saveSettings} className="space-y-4">
                        <Input label="Store Name" value={settingsForm.name || ''} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} />
                        <Input label="Currency" value={settingsForm.currency || ''} disabled className="bg-slate-50 cursor-not-allowed" />
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                          ℹ Currency is locked and cannot be changed. Changing it would cause all historical transaction amounts to display incorrectly.
                        </div>
                        <Input 
                            label="Global Discount % (Seasonal)" 
                            type="number" 
                            value={settingsForm.globalDiscount || 0}
                            onChange={e => setSettingsForm({ ...settingsForm, globalDiscount: Number(e.target.value) })}
                        />
                        <div className="pt-4">
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </Card>

                <Card title="Payment Configuration">
                    <form onSubmit={saveSettings} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                                label="Primary UPI ID" 
                                value={settingsForm.primaryUpiId || ''} 
                                onChange={e => setSettingsForm({ ...settingsForm, primaryUpiId: e.target.value })}
                                placeholder="primary@upi"
                            />
                            <Input 
                                label="Secondary UPI ID" 
                                value={settingsForm.secondaryUpiId || ''} 
                                onChange={e => setSettingsForm({ ...settingsForm, secondaryUpiId: e.target.value })}
                                placeholder="secondary@upi"
                            />
                        </div>
                        
                        <div>
                           <label className="text-sm font-medium text-slate-700 block mb-2">Select Active Payment Account</label>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <label 
                                 className={`
                                   flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all
                                   ${settingsForm.activeUpiIdType === 'PRIMARY' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:bg-slate-50'}
                                 `}
                               >
                                  <input 
                                    type="radio" 
                                    name="upiType" 
                                    value="PRIMARY" 
                                    checked={settingsForm.activeUpiIdType === 'PRIMARY' || !settingsForm.activeUpiIdType} 
                                    onChange={() => setSettingsForm({ ...settingsForm, activeUpiIdType: 'PRIMARY' })}
                                    className="w-4 h-4 text-indigo-600"
                                  />
                                  <div>
                                      <div className="font-bold text-slate-800">Primary Account</div>
                                      <div className="text-xs text-slate-500 font-mono mt-0.5">{settingsForm.primaryUpiId || 'Not Configured'}</div>
                                  </div>
                               </label>

                               <label 
                                 className={`
                                   flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all
                                   ${settingsForm.activeUpiIdType === 'SECONDARY' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:bg-slate-50'}
                                 `}
                               >
                                  <input 
                                    type="radio" 
                                    name="upiType" 
                                    value="SECONDARY" 
                                    checked={settingsForm.activeUpiIdType === 'SECONDARY'} 
                                    onChange={() => setSettingsForm({ ...settingsForm, activeUpiIdType: 'SECONDARY' })}
                                    className="w-4 h-4 text-indigo-600"
                                  />
                                  <div>
                                      <div className="font-bold text-slate-800">Secondary Account</div>
                                      <div className="text-xs text-slate-500 font-mono mt-0.5">{settingsForm.secondaryUpiId || 'Not Configured'}</div>
                                  </div>
                               </label>
                           </div>
                           <p className="text-xs text-slate-500 mt-2">
                             The selected account's QR code will be displayed on customer invoices and the checkout screen.
                           </p>
                        </div>
                        
                        <div className="pt-2">
                            <Button type="submit">Update Payment Settings</Button>
                        </div>
                    </form>
                </Card>
            </div>
        )}

      </div>

      {/* --- MODALS --- */}
      
      {/* Category Modal */}
      <Modal isOpen={isCatModalOpen} onClose={() => setCatModalOpen(false)} title={currentCategory.id ? "Edit Category" : "New Category"}>
          <form onSubmit={saveCategory} className="space-y-4">
              <Input 
                label="Category Name" 
                value={currentCategory.name || ''} 
                onChange={e => setCurrentCategory({...currentCategory, name: e.target.value})} 
                required 
              />
              <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Default Tax %" 
                    type="number"
                    value={currentCategory.defaultGST} 
                    onChange={e => setCurrentCategory({...currentCategory, defaultGST: Number(e.target.value)})} 
                  />
                   <Input 
                    label="Default Discount %" 
                    type="number"
                    value={currentCategory.defaultDiscount} 
                    onChange={e => setCurrentCategory({...currentCategory, defaultDiscount: Number(e.target.value)})} 
                  />
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <Input 
                    label="Low Stock Alert Threshold" 
                    type="number"
                    value={currentCategory.lowStockThreshold ?? ''} 
                    onChange={e => setCurrentCategory({...currentCategory, lowStockThreshold: Number(e.target.value)})} 
                    placeholder="Default: 5"
                  />
                  <p className="text-xs text-amber-700 mt-2">Products in this category will be flagged as "Low Stock" when quantity drops below this number.</p>
              </div>
              <Button type="submit" className="w-full mt-4">Save Category</Button>
          </form>
      </Modal>

      {/* Product Modal */}
      <Modal isOpen={isProdModalOpen} onClose={() => setProdModalOpen(false)} title={currentProduct.id ? "Edit Product" : "New Product"}>
          <form onSubmit={saveProduct} className="space-y-4">
              <Input 
                label="Product Name" 
                value={currentProduct.name || ''} 
                onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} 
                required 
              />
              <div className="grid grid-cols-2 gap-4">
                  <Select 
                    label="Category"
                    value={currentProduct.categoryId || ''}
                    onChange={e => setCurrentProduct({...currentProduct, categoryId: e.target.value})}
                    required
                  >
                      <option value="">Select...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <Input 
                    label="SKU" 
                    value={currentProduct.sku || ''} 
                    onChange={e => setCurrentProduct({...currentProduct, sku: e.target.value})} 
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Price" 
                    type="number"
                    value={currentProduct.price} 
                    onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})} 
                    required 
                  />
                  <Input 
                    label="Initial Stock" 
                    type="number"
                    value={currentProduct.stockQty} 
                    onChange={e => setCurrentProduct({...currentProduct, stockQty: Number(e.target.value)})} 
                    required 
                  />
              </div>
              <Input 
                label="Image URL" 
                value={currentProduct.imageUrl || ''} 
                onChange={e => setCurrentProduct({...currentProduct, imageUrl: e.target.value})} 
              />
              <Button type="submit" className="w-full mt-4">Save Product</Button>
          </form>
      </Modal>

    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
        ${active ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
    >
        <Icon size={16} /> {label}
    </button>
);