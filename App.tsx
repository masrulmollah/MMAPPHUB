
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLink, AppCategory } from './types';
import { Icons, CATEGORIES } from './constants';
import { storageService } from './services/storageService';
import AppCard from './components/AppCard';
import AppFormModal from './components/AddAppModal';

const App: React.FC = () => {
  const [apps, setApps] = useState<AppLink[]>(() => storageService.getApps());
  
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('app_hub_is_admin') === 'true';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<AppCategory>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppLink | null>(null);

  useEffect(() => {
    storageService.saveApps(apps);
  }, [apps]);

  useEffect(() => {
    sessionStorage.setItem('app_hub_is_admin', isAdmin.toString());
  }, [isAdmin]);

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesSearch = 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.url.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'All' || app.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [apps, searchQuery, activeCategory]);

  const handleSaveApp = useCallback((appData: Omit<AppLink, 'id' | 'createdAt'> | AppLink) => {
    if ('id' in appData) {
      setApps(prev => prev.map(app => app.id === appData.id ? (appData as AppLink) : app));
    } else {
      const newApp: AppLink = {
        ...(appData as Omit<AppLink, 'id' | 'createdAt'>),
        id: crypto.randomUUID(),
        createdAt: Date.now()
      };
      setApps(prev => [newApp, ...prev]);
    }
    setIsModalOpen(false);
    setEditingApp(null);
  }, []);

  const handleDeleteApp = useCallback((id: string) => {
    setApps(prev => prev.filter(app => app.id !== id));
    setIsModalOpen(false);
    setEditingApp(null);
  }, []);

  const handleOpenEdit = useCallback((app: AppLink) => {
    setEditingApp(app);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingApp(null);
  }, []);

  return (
    <div className="min-h-screen pb-32 bg-[#f8fafc]">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-white ring-1 ring-slate-200 flex-shrink-0 bg-slate-100">
              <img 
                src="Md Masrul Mollah.jpg" 
                alt="Md Masrul Mollah" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://ui-avatars.com/api/?name=Md+Masrul+Mollah&background=4F46E5&color=fff&size=128";
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none text-nowrap">App Hub</h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">Repository</p>
            </div>
          </div>

          <div className="flex flex-1 max-w-xl mx-auto w-full relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <Icons.Search />
            </div>
            <input 
              type="text" 
              placeholder="Search repository..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none text-sm transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAdmin(!isAdmin)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 ${
                isAdmin 
                ? 'bg-amber-500 text-white border border-amber-600 ring-4 ring-amber-500/10' 
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {isAdmin ? <Icons.Shield /> : <Icons.User />}
              {isAdmin ? 'ADMIN ACTIVE' : 'ADMIN LOGIN'}
            </button>
            
            <button 
              onClick={() => { setEditingApp(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <Icons.Plus />
              ADD APP
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 overflow-x-auto no-scrollbar sticky top-[89px] z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex gap-2.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-xl text-[11px] font-black transition-all flex-shrink-0 border-2 uppercase tracking-wider ${
                activeCategory === cat
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white text-slate-500 border-transparent hover:text-indigo-600 hover:border-indigo-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-10 md:px-8">
        {isAdmin && (
          <div className="mb-10 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-4 animate-in slide-in-from-top-6 duration-500 shadow-sm">
             <div className="p-3 bg-amber-200 rounded-xl text-amber-700 shadow-inner"><Icons.Shield /></div>
             <div>
                <p className="font-black text-sm uppercase tracking-tight">Repository Manager Active</p>
                <p className="text-sm opacity-80">Use the amber pencil icon to edit or remove any application from the hub.</p>
             </div>
          </div>
        )}

        {filteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-300">
            <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Icons.Search />
            </div>
            <h3 className="text-2xl font-black text-slate-400">Empty View</h3>
            <p className="text-sm mt-1">No applications found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
            {filteredApps.map(app => (
              <AppCard 
                key={app.id} 
                app={app} 
                isAdmin={isAdmin} 
                onEdit={handleOpenEdit}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            App Hub Repository
          </div>
          <div className="flex items-center gap-6">
             <span className="flex items-center gap-2"><span className="text-indigo-500">{apps.length}</span> Total Apps</span>
             <span className="text-slate-200 hidden md:inline">|</span>
             <span className="hidden md:inline">Showing: <span className="text-slate-600">{activeCategory}</span></span>
          </div>
        </div>
      </footer>

      {isModalOpen && (
        <AppFormModal 
          onSave={handleSaveApp} 
          onDelete={handleDeleteApp}
          onClose={handleCloseModal} 
          initialData={editingApp}
        />
      )}
    </div>
  );
};

export default App;
