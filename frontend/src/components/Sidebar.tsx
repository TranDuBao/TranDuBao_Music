import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMusicStore } from '../store/useMusicStore';
import { useAuthStore } from '../store/useAuthStore';
import Avatar from './Avatar';
import Logo from './Logo';
import {
  Music2, PlayCircle, Plus, Trash2,
  ListMusic, LogOut, Upload, Shield, Globe, ChevronDown,
  UserCircle2, Music
} from 'lucide-react';

interface SidebarProps {
  view: 'all' | 'mine' | 'admin' | 'profile';
  setView: (v: 'all' | 'mine' | 'admin' | 'profile') => void;
  onUploadClick: () => void;
}

export default function Sidebar({ view, setView, onUploadClick }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { playlists, currentPlaylist, setCurrentPlaylist, createPlaylist, deletePlaylist } = useMusicStore();
  const { user, logout, isAdmin } = useAuthStore();

  const [newName, setNewName]   = useState('');
  const [showInput, setShowInput] = useState(false);
  const [showLang, setShowLang]   = useState(false);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createPlaylist(newName, '');
    setNewName('');
    setShowInput(false);
  };

  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang);
    setShowLang(false);
  };

  const handleNavClick = (v: 'all' | 'mine' | 'admin' | 'profile') => {
    setView(v);
    setCurrentPlaylist(null);
  };

  return (
    <aside className="w-64 panel-glass border-r border-white/5 flex flex-col h-full select-none">
      {/* Brand */}
      <button
        onClick={() => {
          setView('all');
          setCurrentPlaylist(null);
        }}
        className="p-5 flex items-center gap-3 border-b border-white/5 w-full text-left hover:bg-white/[0.02] transition-all"
      >
        <Logo className="w-9 h-9 flex-shrink-0" />
        <div>
          <h1 className="font-bold text-base brand-text-gradient tracking-tight">MusicStream</h1>
          <span className="text-[10px] text-zinc-600">MVC Web Audio</span>
        </div>
      </button>

      {/* User Profile */}
      {user && (
        <div className="px-4 py-3 flex items-center gap-2.5 border-b border-white/5 bg-white/[0.01]">
          <button onClick={() => setView('profile')} className="hover:ring-2 ring-purple-500/50 rounded-full transition-all">
            <Avatar src={user.avatar_url} name={user.name} className="w-8 h-8" />
          </button>
          <button onClick={() => setView('profile')} className="min-w-0 flex-1 text-left hover:opacity-80 transition-all">
            <p className="text-xs font-semibold text-zinc-200 truncate">{user.name}</p>
            <p className="text-[10px] text-zinc-500 truncate">{user.role === 'admin' ? '👑 Admin' : '🎵 User'}</p>
          </button>
          <button onClick={logout}
            className="text-zinc-500 hover:text-rose-400 p-1 rounded-lg hover:bg-white/5 transition-all"
            title={t('auth.logout')}>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="px-3 pt-4 pb-2">
        <p className="px-2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">{t('nav.discover')}</p>
        <nav className="space-y-0.5">
          <NavBtn
            active={view === 'all' && !currentPlaylist}
            icon={<PlayCircle className="w-4 h-4" />}
            label={t('nav.allSongs')}
            onClick={() => handleNavClick('all')}
          />
          <NavBtn
            active={view === 'mine' && !currentPlaylist}
            icon={<Music className="w-4 h-4" />}
            label={t('nav.myMusic')}
            onClick={() => handleNavClick('mine')}
          />
          {isAdmin() && (
            <NavBtn
              active={view === 'admin'}
              icon={<Shield className="w-4 h-4" />}
              label={t('nav.adminPanel')}
              onClick={() => handleNavClick('admin')}
            />
          )}
        </nav>
      </div>



      {/* Playlists */}
      <div className="flex-1 px-3 py-2 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{t('nav.playlists')}</p>
          <button
            onClick={() => setShowInput(!showInput)}
            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-white/5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {showInput && (
          <form onSubmit={handleCreatePlaylist} className="px-2 mb-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={t('playlists.name')}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 placeholder-zinc-600"
              autoFocus
            />
            <div className="flex justify-end gap-1.5 mt-1.5">
              <button type="button" onClick={() => setShowInput(false)} className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1.5">{t('playlists.cancel')}</button>
              <button type="submit" className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded px-2.5 py-0.5">{t('playlists.create')}</button>
            </div>
          </form>
        )}

        <div className="space-y-0.5">
          {playlists.length === 0
            ? <p className="text-xs text-zinc-600 px-2 py-2 italic">{t('playlists.noPlaylists')}</p>
            : playlists.map(pl => {
                const active = currentPlaylist?.id === pl.id;
                return (
                  <div key={pl.id} className={`group flex items-center rounded-lg transition-all ${active ? 'bg-purple-600/10' : 'hover:bg-white/5'}`}>
                    <button
                      onClick={() => setCurrentPlaylist(pl)}
                      className={`flex-1 flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left ${active ? 'text-purple-400' : 'text-zinc-400 group-hover:text-zinc-200'}`}
                    >
                      <ListMusic className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate max-w-[110px]">{pl.name}</span>
                    </button>
                    <button
                      onClick={() => deletePlaylist(pl.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* Language Switcher */}
      <div className="p-3 border-t border-white/5 relative">
        <button
          onClick={() => setShowLang(!showLang)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            <span>{i18n.language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLang ? 'rotate-180' : ''}`} />
        </button>

        {showLang && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl z-10">
            <button onClick={() => switchLang('vi')} className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/5 transition-all ${i18n.language === 'vi' ? 'text-purple-400' : 'text-zinc-300'}`}>
              🇻🇳 Tiếng Việt
            </button>
            <button onClick={() => switchLang('en')} className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/5 transition-all ${i18n.language === 'en' ? 'text-purple-400' : 'text-zinc-300'}`}>
              🇬🇧 English
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavBtn({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-purple-600/10 text-purple-400 border-l-2 border-purple-500 pl-2.5'
          : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
