import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppLink, AppCategory } from './types';
import { Icons, CATEGORIES, STORAGE_KEY, INITIAL_APPS, SYNC_KEY_STORAGE } from './constants';

// --- Internal Sync & Storage Service ---
const syncService = {
  getSyncKey: () => localStorage.getItem(SYNC_KEY_STORAGE),
  setSyncKey: (key: string) => localStorage.setItem(SYNC_KEY_STORAGE, key),
  
  // Using keyvalue.xyz as a simple free public JSON store for multi-device sync
  fetchCloudApps: async (syncKey: string): Promise<AppLink[] | null> => {
    try {
      const response = await fetch(`https://keyvalue.xyz/1/${syncKey}`);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : null;
      }
      return null;
    } catch (e) {
      console.error('Cloud pull failed', e);
      return null;
    }
  },
  
  pushCloudApps: async (syncKey: string, apps: AppLink[]): Promise<boolean> => {
    try {
      const response = await fetch(`https://keyvalue.xyz/1/${syncKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apps)
      });
      return response.ok;
    } catch (e) {
      console.error('Cloud push failed', e);
      return false;
    }
  }
};

const storageService = {
  getApps: (): AppLink[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return INITIAL_APPS;
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_APPS;
    }
  },
  saveApps: (apps: AppLink[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  }
};

// --- Sub-Component: AppCard ---
interface AppCardProps {
  app: AppLink;
  isAdmin: boolean;
  // Fixed: 'app' was being used as a type name here, changed to 'AppLink'
  onEdit: (app: AppLink) => void;
}

const AppCard: React.FC<AppCardProps> = ({ app, isAdmin, onEdit }) => {
  return (
    <div className="group relative flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-slate-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden ring-1 ring-slate-100">
      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-tighter border border-slate-100 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-500 group-hover:border-indigo-100">
        <Icons.Tag />
        {app.category}
      </div>

      <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mt-6 mb-4 shadow-inner overflow-hidden border border-slate-100 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
        {app.icon ? (
          <img 
            src={app.icon} 
            alt={app.name} 
            className="w-14 h-14 object-contain"
            onError={(e) => {
               (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=random&size=128`;
            }}
          />
        ) : (
          <div className="w-14 h-14 bg-indigo-50 text-indigo-500 flex items-center justify-center rounded-2xl font-black text-2xl uppercase">
            {app.name.charAt(0)}
          </div>
        )}
      </div>
      
      <h3 className="text-slate-900 font-black text-center mb-1.5 line-clamp-1 px-2 text-sm tracking-tight">{app.name}</h3>
      <p className="text-[11px] text-slate-400 line-clamp-1 truncate w-full text-center mb-6 px-2 font-bold uppercase tracking-tight">
        {app.url.replace(/^https?:\/\//, '').split('/')[0]}
      </p>
      
      <div className="flex gap-2.5 w-full mt-auto">
        <a href={app.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-2xl bg-indigo-600 text-white text-[11px] font-black hover:bg-indigo-700 transition-all shadow-md active:scale-95 tracking-wider">
          <Icons.External /> OPEN
        </a>
        
        {isAdmin && (
          <button type="button" onClick={() => onEdit(app)} className="w-10 h-10 flex-shrink-0 rounded-2xl border-2 border-amber-100 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-sm flex items-center justify-center active:scale-90">
            <Icons.Edit />
          </button>
        )}
      </div>
    </div>
  );
};

// --- Sub-Component: SyncModal ---
interface SyncModalProps {
  onClose: () => void;
  syncKey: string | null;
  onSetKey: (key: string) => void;
  onForcePull: () => void;
}

const SyncModal: React.FC<SyncModalProps> = ({ onClose, syncKey, onSetKey, onForcePull }) => {
  const [inputKey, setInputKey] = useState(syncKey || '');
  
  const handleGenerate = () => {
    const newKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setInputKey(newKey);
    onSetKey(newKey);
  };

  const handleApply = () => {
    if (inputKey.trim()) {
      onSetKey(inputKey.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Cloud Sync Settings</h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Multi-Device Connectivity</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-7 space-y-6">
          <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-sm leading-relaxed">
            <p className="font-bold mb-1">How it works:</p>
            Enter this unique key on any device to link your App Hubs. Changes made on one device will automatically appear on others.
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Your Unique Sync Key</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={inputKey} 
                onChange={(e) => setInputKey(e.target.value)} 
                placeholder="Paste key or generate..." 
                className="flex-1 px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-800 text-sm" 
              />
              <button onClick={handleGenerate} className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
                <Icons.Refresh />
              </button>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button onClick={handleApply} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest text-xs">
              Connect & Sync Hub
            </button>
            {syncKey && (
              <button onClick={() => { onForcePull(); onClose(); }} className="w-full py-3 border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                <Icons.Refresh /> Force Pull From Cloud
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Component: AppFormModal ---
interface AppFormModalProps {
  onSave: (app: Omit<AppLink, 'id' | 'createdAt'> | AppLink) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  initialData: AppLink | null;
}

const AppFormModal: React.FC<AppFormModalProps> = ({ onSave, onDelete, onClose, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [icon, setIcon] = useState(initialData?.icon || '');
  const [category, setCategory] = useState<AppCategory>(initialData?.category || 'General');
  const [preview, setPreview] = useState<string | null>(initialData?.icon || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setUrl(initialData.url);
      setIcon(initialData.icon);
      setCategory(initialData.category);
      setPreview(initialData.icon);
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setIcon(base64);
        setPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    let validatedUrl = url.startsWith('http') ? url : 'https://' + url;
    if (initialData) {
      onSave({ ...initialData, name, url: validatedUrl, icon, category });
    } else {
      onSave({ name, url: validatedUrl, icon, category });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300 ring-1 ring-white/20">
        <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{!!initialData ? 'Edit Application' : 'Add New App'}</h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mt-0.5">Manage Repository Item</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><Icons.Trash /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-7 space-y-5 max-h-[75vh] overflow-y-auto no-scrollbar">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider ml-1">App Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My Dashboard" className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-800" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider ml-1">URL</label>
            <input type="text" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="e.g. example.com" className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-800" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as AppCategory)} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-800 appearance-none">
              {CATEGORIES.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Icon</label>
            <div className="flex items-center gap-5 p-4 rounded-3xl bg-slate-50 border border-slate-200">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {preview ? <img src={preview} alt="Preview" className="w-16 h-16 object-contain" /> : <div className="text-slate-300"><Icons.Plus /></div>}
              </div>
              <div className="flex-1 space-y-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-600 hover:bg-indigo-50 transition-all shadow-sm">UPLOAD IMAGE</button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              </div>
            </div>
            <input type="text" value={icon && !icon.startsWith('data:') ? icon : ''} onChange={(e) => { setIcon(e.target.value); setPreview(e.target.value); }} placeholder="Or paste icon URL..." className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold outline-none focus:border-indigo-500 transition-all" />
          </div>
          <div className="pt-4 space-y-3">
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95 text-xs uppercase tracking-widest">{!!initialData ? 'Save Changes' : 'Add App'}</button>
            {!!initialData && (
              <button type="button" onClick={() => { if(window.confirm('Delete this app?')) onDelete(initialData.id); }} className="w-full py-3 bg-red-50 text-red-500 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                <Icons.Trash /> Remove Hub Item
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main App Component ---
const App: React.FC = () => {
  const [apps, setApps] = useState<AppLink[]>(() => storageService.getApps());
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('app_hub_is_admin') === 'true');
  const [syncKey, setSyncKey] = useState<string | null>(() => syncService.getSyncKey());
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<AppCategory>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppLink | null>(null);

  // Auto-Pull from Cloud on Load
  useEffect(() => {
    if (syncKey) {
      const pull = async () => {
        setIsSyncing(true);
        const cloudData = await syncService.fetchCloudApps(syncKey);
        if (cloudData) {
          setApps(cloudData);
          storageService.saveApps(cloudData);
        }
        setIsSyncing(false);
      };
      pull();
    }
  }, [syncKey]);

  // Save to Local & Push to Cloud on change
  const updateApps = useCallback(async (newApps: AppLink[]) => {
    setApps(newApps);
    storageService.saveApps(newApps);
    
    if (syncKey) {
      setIsSyncing(true);
      await syncService.pushCloudApps(syncKey, newApps);
      setIsSyncing(false);
    }
  }, [syncKey]);

  useEffect(() => {
    sessionStorage.setItem('app_hub_is_admin', isAdmin.toString());
  }, [isAdmin]);

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || app.url.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || app.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [apps, searchQuery, activeCategory]);

  const handleSaveApp = (appData: Omit<AppLink, 'id' | 'createdAt'> | AppLink) => {
    let nextApps;
    if ('id' in appData) {
      nextApps = apps.map(app => app.id === appData.id ? (appData as AppLink) : app);
    } else {
      const newApp: AppLink = { ...appData, id: crypto.randomUUID(), createdAt: Date.now() };
      nextApps = [newApp, ...apps];
    }
    updateApps(nextApps);
    setIsModalOpen(false);
    setEditingApp(null);
  };

  const handleDeleteApp = (id: string) => {
    updateApps(apps.filter(app => app.id !== id));
    setIsModalOpen(false);
    setEditingApp(null);
  };

  const handleSetSyncKey = (key: string) => {
    setSyncKey(key);
    syncService.setSyncKey(key);
  };

  const forcePull = async () => {
    if (syncKey) {
      setIsSyncing(true);
      const data = await syncService.fetchCloudApps(syncKey);
      if (data) updateApps(data);
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-[#f8fafc]">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-white bg-slate-100">
              <img src="Md Masrul Mollah.jpg" alt="Admin" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Md+Masrul+Mollah&background=4F46E5&color=fff`; }} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">App Hub</h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Repository</p>
            </div>
          </div>

          <div className="flex flex-1 max-w-xl mx-auto w-full relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-indigo-500"><Icons.Search /></div>
            <input type="text" placeholder="Search repository..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none text-sm transition-all" />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSyncModalOpen(true)}
              className={`p-2.5 rounded-xl border transition-all active:scale-95 ${syncKey ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}
              title="Cloud Sync Settings"
            >
              <div className={isSyncing ? 'animate-pulse' : ''}><Icons.Cloud /></div>
            </button>
            <button onClick={() => setIsAdmin(!isAdmin)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${isAdmin ? 'bg-amber-500 text-white border-amber-600 shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}>
              {isAdmin ? <Icons.Shield /> : <Icons.User />}
              {isAdmin ? 'ADMIN' : 'LOGIN'}
            </button>
            <button onClick={() => { setEditingApp(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
              <Icons.Plus /> ADD
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 overflow-x-auto no-scrollbar sticky top-[89px] z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex gap-2.5">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-xl text-[11px] font-black transition-all flex-shrink-0 border-2 uppercase tracking-wider ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-transparent hover:text-indigo-600'}`}>
              {cat}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-10 md:px-8">
        {isAdmin && !syncKey && (
          <div className="mb-8 p-5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 flex items-center justify-between gap-4 animate-in slide-in-from-top-4">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-indigo-200 rounded-xl text-indigo-700"><Icons.Cloud /></div>
               <div>
                  <p className="font-black text-sm uppercase tracking-tight">Synchronize Devices</p>
                  <p className="text-sm opacity-80">Enable Cloud Sync to see your apps on your phone and laptop.</p>
               </div>
             </div>
             <button onClick={() => setIsSyncModalOpen(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-700">Set Up Sync</button>
          </div>
        )}

        {filteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-300">
            <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center mb-6"><Icons.Search /></div>
            <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest">Repository Empty</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
            {filteredApps.map(app => (
              <AppCard key={app.id} app={app} isAdmin={isAdmin} onEdit={(a) => { setEditingApp(a); setIsModalOpen(true); }} />
            ))}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${syncKey ? 'bg-green-500' : 'bg-slate-300'}`}></span>
            {syncKey ? 'Cloud Connected' : 'Local Only Mode'}
          </div>
          <div className="flex items-center gap-6">
             <span className="flex items-center gap-2"><span className="text-indigo-500">{apps.length}</span> Total Apps</span>
          </div>
        </div>
      </footer>

      {isModalOpen && <AppFormModal onSave={handleSaveApp} onDelete={handleDeleteApp} onClose={() => { setIsModalOpen(false); setEditingApp(null); }} initialData={editingApp} />}
      {isSyncModalOpen && <SyncModal onClose={() => setIsSyncModalOpen(false)} syncKey={syncKey} onSetKey={handleSetSyncKey} onForcePull={forcePull} />}
    </div>
  );
};

export default App;