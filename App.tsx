
import React, { useState, useEffect, useMemo } from 'react';
import { AppLink, AppCategory } from './types';
import { Icons, CATEGORIES } from './constants';
import { storageService } from './services/storageService';
import AppCard from './components/AppCard';
import AddAppModal from './components/AddAppModal';

const App: React.FC = () => {
  const [apps, setApps] = useState<AppLink[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<AppCategory>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize apps from storage
  useEffect(() => {
    const savedApps = storageService.getApps();
    setApps(savedApps);
  }, []);

  // Save apps when they change
  useEffect(() => {
    if (apps.length > 0) {
      storageService.saveApps(apps);
    }
  }, [apps]);

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesSearch = 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.url.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'All' || app.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [apps, searchQuery, activeCategory]);

  const handleAddApp = (newAppData: Omit<AppLink, 'id' | 'createdAt'>) => {
    const newApp: AppLink = {
      ...newAppData,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    setApps(prev => [newApp, ...prev]);
  };

  const handleDeleteApp = (id: string) => {
    if (confirm('Are you sure you want to remove this app from the repository?')) {
      setApps(prev => prev.filter(app => app.id !== id));
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border-2 border-white ring-1 ring-slate-100 flex-shrink-0">
              <img 
                src="Md Masrul Mollah.jpg" 
                alt="Md Masrul Mollah" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://ui-avatars.com/api/?name=Md+Masrul+Mollah&background=4F46E5&color=fff";
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">App Hub</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Repository</p>
            </div>
          </div>

          <div className="flex flex-1 max-w-xl mx-auto w-full relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icons.Search />
            </div>
            <input 
              type="text" 
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAdmin(!isAdmin)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isAdmin 
                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              {isAdmin ? <Icons.Shield /> : <Icons.User />}
              {isAdmin ? 'ADMIN' : 'USER'}
            </button>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Icons.Plus />
              ADD APP
            </button>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="bg-white border-b border-slate-100 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 flex gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 border ${
                activeCategory === cat
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        {isAdmin && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
             <div className="p-2 bg-amber-200 rounded-lg"><Icons.Shield /></div>
             <div className="text-sm">
                <span className="font-bold">Administrator Privileges Active:</span> You can manage the repository entries. All users can add new items.
             </div>
          </div>
        )}

        {filteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Icons.Search />
            </div>
            <p className="text-xl font-bold text-slate-400">No matching apps</p>
            <p className="text-sm">Try changing your filters or category selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredApps.map(app => (
              <AppCard 
                key={app.id} 
                app={app} 
                isAdmin={isAdmin} 
                onDelete={handleDeleteApp}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer / Stats */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <div>&copy; 2024 App Hub Repository</div>
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> {apps.length} Total Apps</span>
             <span className="text-slate-300">|</span>
             <span>Category: {activeCategory}</span>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {isModalOpen && (
        <AddAppModal 
          onAdd={handleAddApp} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
