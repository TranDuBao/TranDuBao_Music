import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { Shield, Users, Music, FolderOpen, BarChart2, Star, Edit2, Disc } from 'lucide-react';
import { UsersTab } from './admin/UsersTab';
import { TracksTab } from './admin/TracksTab';
import { CategoriesTab } from './admin/CategoriesTab';
import { ArtistsTab } from './admin/ArtistsTab';
import { AlbumsTab } from './admin/AlbumsTab';
import { SettingsTab } from './admin/SettingsTab';
import { StatsTab } from './admin/StatsTab';

type AdminTab = 'users' | 'tracks' | 'categories' | 'artists' | 'albums' | 'stats' | 'settings';

export default function AdminPanel() {
  const { t, i18n } = useTranslation();
  const { token } = useAuthStore();
  const [tab, setTab] = useState<AdminTab>('users');
  const authH = { Authorization: `Bearer ${token}` };

  const tabs = [
    { id: 'users' as const,      label: t('admin.users'), icon: <Users className="w-4 h-4" /> },
    { id: 'tracks' as const,     label: t('admin.tracks'), icon: <Music className="w-4 h-4" /> },
    { id: 'categories' as const, label: t('admin.categories'), icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'artists' as const,    label: i18n.language === 'vi' ? 'Nghệ sĩ' : 'Artists', icon: <Star className="w-4 h-4" /> },
    { id: 'albums' as const,     label: t('admin.albums'), icon: <Disc className="w-4 h-4" /> },
    { id: 'settings' as const,   label: i18n.language === 'vi' ? 'Giao diện' : 'Appearance', icon: <Edit2 className="w-4 h-4" /> },
    { id: 'stats' as const,      label: t('admin.stats'), icon: <BarChart2 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{t('admin.panelTitle')}</h2>
          <p className="text-xs text-zinc-500">{i18n.language === 'vi' ? 'Quản lý toàn bộ hệ thống MusicStream' : 'Manage the entire MusicStream system'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-zinc-900/60 border border-white/5 rounded-2xl overflow-x-auto scrollbar-none max-w-full">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 sm:flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.id ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg font-semibold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'users'      && <UsersTab authH={authH} />}
      {tab === 'tracks'     && <TracksTab authH={authH} />}
      {tab === 'categories' && <CategoriesTab authH={authH} />}
      {tab === 'artists'    && <ArtistsTab authH={authH} />}
      {tab === 'albums'     && <AlbumsTab authH={authH} />}
      {tab === 'settings'   && <SettingsTab authH={authH} />}
      {tab === 'stats'      && <StatsTab authH={authH} />}
    </div>
  );
}
