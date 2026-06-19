import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { Shield, Users, Music, FolderOpen, BarChart2, Trash2, Crown, UserIcon, RefreshCw, Plus, Edit2, Star, Heart, TrendingUp, Lock, Unlock, Disc, Calendar, Clock } from 'lucide-react';
import axios from 'axios';
import { useModalStore } from '../store/useModalStore';
import { formatCount, formatPlays, formatPlaysShort, formatDateLabel } from '../utils/format';
import { API_BASE } from '../config';
const API = API_BASE;
type AdminTab = 'users' | 'tracks' | 'categories' | 'artists' | 'albums' | 'stats' | 'settings';

export default function AdminPanel() {
  const { t, i18n } = useTranslation();
  const { token } = useAuthStore();
  const [tab, setTab] = useState<AdminTab>('users');
  const authH = { Authorization: `Bearer ${token}` };

  const tabs = [
    { id: 'users' as const,      label: i18n.language === 'vi' ? 'NgÆ°á»i dĂ¹ng' : 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'tracks' as const,     label: i18n.language === 'vi' ? 'Quáº£n lĂ½ nháº¡c' : 'Music', icon: <Music className="w-4 h-4" /> },
    { id: 'categories' as const, label: i18n.language === 'vi' ? 'Danh má»¥c' : 'Categories', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'artists' as const,    label: i18n.language === 'vi' ? 'Nghá»‡ sÄ©' : 'Artists', icon: <Star className="w-4 h-4" /> },
    { id: 'albums' as const,     label: i18n.language === 'vi' ? 'Quáº£n lĂ½ Album' : 'Albums', icon: <Disc className="w-4 h-4" /> },
    { id: 'settings' as const,   label: i18n.language === 'vi' ? 'Giao diá»‡n' : 'Appearance', icon: <Edit2 className="w-4 h-4" /> },
    { id: 'stats' as const,      label: i18n.language === 'vi' ? 'Thá»‘ng kĂª' : 'Statistics', icon: <BarChart2 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
          <p className="text-xs text-zinc-500">{i18n.language === 'vi' ? 'Quáº£n lĂ½ toĂ n bá»™ há»‡ thá»‘ng MusicStream' : 'Manage the entire MusicStream system'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900/60 border border-white/5 rounded-2xl">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
              tab === t.id ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
            {t.icon}<span className="hidden sm:block">{t.label}</span>
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

// â”€â”€ Users Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UsersTab({ authH }: any) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [users, setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [banTarget, setBanTarget] = useState<any | null>(null); // user to ban
  const [banType, setBanType] = useState<'days' | 'permanent'>('days');
  const [banDays, setBanDays] = useState(7);

  const fetchUsers = async () => {
    setLoading(true);
    try { const { data } = await axios.get(`${API}/auth/users`, { headers: authH }); if (data.success) setUsers(data.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchUsers(); }, []);


  const { showConfirm, showAlert } = useModalStore();

  const deleteUser = async (id: number) => {
    showConfirm(
      isVi ? 'XĂ¡c nháº­n xĂ³a' : 'Confirm Delete',
      isVi ? 'Báº¡n cĂ³ cháº¯c cháº¯n muá»‘n xĂ³a ngÆ°á»i dĂ¹ng nĂ y khá»i há»‡ thá»‘ng?' : 'Are you sure you want to delete this user from the system?',
      async () => {
        try {
          await axios.delete(`${API}/auth/users/${id}`, { headers: authH });
          showAlert(isVi ? 'ThĂ nh cĂ´ng' : 'Success', isVi ? 'ÄĂ£ xĂ³a ngÆ°á»i dĂ¹ng thĂ nh cĂ´ng.' : 'User deleted successfully.', 'success');
          fetchUsers();
        } catch (err: any) {
          showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'KhĂ´ng thá»ƒ xĂ³a ngÆ°á»i dĂ¹ng.' : 'Failed to delete user.'), 'error');
        }
      }
    );
  };

  const applyBan = async () => {
    if (!banTarget) return;
    try {
      const payload = banType === 'permanent'
        ? { type: 'permanent' }
        : { type: 'days', days: banDays };
      await axios.put(`${API}/auth/users/${banTarget.id}/ban`, payload, { headers: authH });
      showAlert(isVi ? 'ThĂ nh cĂ´ng' : 'Success', isVi ? `ÄĂ£ khĂ³a tĂ i khoáº£n ${banTarget.name} thĂ nh cĂ´ng.` : `Successfully banned ${banTarget.name}.`, 'success');
      setBanTarget(null);
      fetchUsers();
    } catch (err: any) {
      showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'KhĂ´ng thá»ƒ khĂ³a tĂ i khoáº£n.' : 'Failed to ban account.'), 'error');
    }
  };

  const unbanUser = async (u: any) => {
    try {
      await axios.put(`${API}/auth/users/${u.id}/ban`, { type: 'unban' }, { headers: authH });
      showAlert(isVi ? 'ThĂ nh cĂ´ng' : 'Success', isVi ? `ÄĂ£ má»Ÿ khĂ³a tĂ i khoáº£n ${u.name}.` : `Successfully unbanned ${u.name}.`, 'success');
      fetchUsers();
    } catch (err: any) {
      showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'KhĂ´ng thá»ƒ má»Ÿ khĂ³a.' : 'Failed to unban.'), 'error');
    }
  };

  // Helper: check if user is currently banned
  const isBanned = (u: any) => {
    if (!u.banned_until) return false;
    return new Date(u.banned_until) > new Date();
  };
  const isPermanentBan = (u: any) => u.banned_until && new Date(u.banned_until).getFullYear() >= 9999;
  const banLabel = (u: any) => {
    if (!isBanned(u)) return null;
    if (isPermanentBan(u)) return isVi ? 'KhĂ³a vÄ©nh viá»…n' : 'Permanently banned';
    const d = new Date(u.banned_until);
    return isVi ? `KhĂ³a Ä‘áº¿n ${d.toLocaleDateString('vi-VN')}` : `Banned until ${d.toLocaleDateString('en-US')}`;
  };

  const isOnline = (u: any) => {
    if (!u.last_active_at) return false;
    const lastActive = new Date(u.last_active_at);
    const now = new Date();
    return (now.getTime() - lastActive.getTime()) < 5 * 60 * 1000;
  };

  const lastActiveLabel = (u: any) => {
    if (!u.last_active_at) return isVi ? 'ChÆ°a rĂµ' : 'Unknown';
    const lastActive = new Date(u.last_active_at);
    return lastActive.toLocaleString(isVi ? 'vi-VN' : 'en-US');
  };

  const admins = users.filter(u => u.role === 'admin').length;
  const regular = users.filter(u => u.role === 'user').length;
  const banned  = users.filter(u => isBanned(u)).length;

  return (
    <div className="space-y-4">
      {/* Ban Modal */}
      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-950 border border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.15)] rounded-2xl p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 flex-shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{isVi ? 'KhĂ³a tĂ i khoáº£n' : 'Ban Account'}</h3>
                <p className="text-sm text-zinc-400 mt-0.5">{isVi ? 'KhĂ³a tĂ i khoáº£n' : 'Ban account'} <span className="text-white font-semibold">{banTarget.name}</span></p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBanType('days')}
                  className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                    banType === 'days' ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' : 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >{isVi ? 'â± Theo ngĂ y' : 'â± By days'}</button>
                <button
                  onClick={() => setBanType('permanent')}
                  className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                    banType === 'permanent' ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' : 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >{isVi ? 'đŸ”’ VÄ©nh viá»…n' : 'đŸ”’ Permanent'}</button>
              </div>

              {banType === 'days' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Sá»‘ ngĂ y khĂ³a' : 'Days to ban'}</label>
                  <div className="flex items-center gap-2">
                    {[1, 3, 7, 14, 30].map(d => (
                      <button
                        key={d}
                        onClick={() => setBanDays(d)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          banDays === d ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' : 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >{d}d</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{isVi ? 'Hoáº·c nháº­p sá»‘ ngĂ y:' : 'Or enter days:'}</span>
                    <input
                      type="number" min={1} max={365}
                      value={banDays}
                      onChange={e => setBanDays(Number(e.target.value))}
                      className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              )}

              {banType === 'permanent' && (
                <p className="text-xs text-zinc-500 bg-rose-500/5 border border-rose-500/10 rounded-xl px-3 py-2">
                  {isVi ? 'â ï¸ NgÆ°á»i dĂ¹ng sáº½ khĂ´ng thá»ƒ Ä‘Äƒng nháº­p mĂ£i mĂ£i cho Ä‘áº¿n khi admin má»Ÿ khĂ³a.' : 'â ï¸ User will not be able to log in until they are unbanned.'}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBanTarget(null)}
                className="px-4 py-2 border border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
              >{isVi ? 'Há»§y' : 'Cancel'}</button>
              <button
                onClick={applyBan}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all"
              >{isVi ? 'XĂ¡c nháº­n khĂ³a' : 'Confirm Ban'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[[isVi ? 'Tá»•ng' : 'Total', users.length, 'text-blue-400','bg-blue-500/10'],['Admin', admins,'text-amber-400','bg-amber-500/10'],[isVi ? 'NgÆ°á»i dĂ¹ng' : 'User', regular,'text-purple-400','bg-purple-500/10'],[isVi ? 'Bá»‹ khĂ³a' : 'Banned', banned,'text-rose-400','bg-rose-500/10']].map(([l,v,tc,bg]) => (
          <div key={l as string} className={`rounded-xl border border-white/5 p-4 ${bg} flex items-center gap-3`}>
            <div>
              <p className={`text-xl font-bold ${tc}`}>{v as number}</p>
              <p className="text-xs text-zinc-500">{l as string}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-zinc-300">{isVi ? 'Danh sĂ¡ch ngÆ°á»i dĂ¹ng' : 'User List'}</h3>
          <button onClick={fetchUsers} className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {users.map(u => (
            <div key={u.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] group ${
              isBanned(u) ? 'bg-rose-950/10' : ''
            }`}>
              <div className="relative flex-shrink-0">
                <div className={`w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center ${
                  isBanned(u) ? 'ring-1 ring-rose-500/40 opacity-60' : ''
                }`}>
                  {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-zinc-400">{u.name.charAt(0).toUpperCase()}</span>}
                </div>
                <div 
                  className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-zinc-950 ${
                    isOnline(u) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-500'
                  }`}
                  title={isOnline(u) ? (isVi ? 'Äang hoáº¡t Ä‘á»™ng' : 'Active') : (isVi ? `Hoáº¡t Ä‘á»™ng láº§n cuá»‘i: ${lastActiveLabel(u)}` : `Last active: ${lastActiveLabel(u)}`)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold truncate ${isBanned(u) ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{u.name}</span>
                  {u.role === 'admin' && <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>}
                  {isBanned(u) && <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> {banLabel(u)}
                  </span>}
                </div>
                <p className="text-xs text-zinc-500 truncate">{u.email || 'â€”'} Â· {u.provider}</p>
              </div>
              <span className="text-xs text-zinc-600 hidden md:block">{new Date(u.created_at).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}</span>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                {isBanned(u) ? (
                  <button
                    onClick={() => unbanUser(u)}
                    title={isVi ? 'Má»Ÿ khĂ³a tĂ i khoáº£n' : 'Unban account'}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  >
                    <Unlock className="w-3 h-3" /> {isVi ? 'Má»Ÿ khĂ³a' : 'Unban'}
                  </button>
                ) : (
                  <button
                    onClick={() => { setBanTarget(u); setBanType('days'); setBanDays(7); }}
                    title={isVi ? 'KhĂ³a tĂ i khoáº£n' : 'Ban account'}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                  >
                    <Lock className="w-3 h-3" /> {isVi ? 'KhĂ³a' : 'Ban'}
                  </button>
                )}

                <button onClick={() => deleteUser(u.id)} className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Tracks Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TracksTab({ authH }: any) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [tracks, setTracks]   = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(false);
  const [editingTrack, setEditingTrack] = useState<any | null>(null);
  const [onlyRecent, setOnlyRecent] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await axios.get(`${API}/tracks?search=${search}`, { headers: authH }); if (data.success) setTracks(data.data); }
    finally { setLoading(false); }
  };

  const displayedTracks = tracks.filter(t => {
    if (onlyRecent) {
      if (!t.created_at) return false;
      const created = new Date(t.created_at);
      const now = new Date();
      return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
    }
    return true;
  });
  
  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${API}/categories`, { headers: authH });
      if (data.success) setCategories(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetch(); }, [search]);
  useEffect(() => { fetchCategories(); }, []);

  const { showConfirm, showAlert } = useModalStore();

  const del = async (id: number) => {
    showConfirm(
      isVi ? 'XĂ¡c nháº­n xĂ³a' : 'Confirm Delete',
      isVi ? 'Báº¡n cĂ³ cháº¯c cháº¯n muá»‘n xĂ³a bĂ i hĂ¡t nĂ y khá»i há»‡ thá»‘ng?' : 'Are you sure you want to delete this song from the system?',
      async () => {
        try {
          await axios.delete(`${API}/tracks/${id}`, { headers: authH });
          showAlert(isVi ? 'ThĂ nh cĂ´ng' : 'Success', isVi ? 'ÄĂ£ xĂ³a bĂ i hĂ¡t thĂ nh cĂ´ng.' : 'Song deleted successfully.', 'success');
          setTracks(t => t.filter(x => x.id !== id));
        } catch (err: any) {
          showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'KhĂ´ng thá»ƒ xĂ³a bĂ i hĂ¡t.' : 'Failed to delete song.'), 'error');
        }
      }
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API}/tracks/${editingTrack.id}`, {
        title: editingTrack.title,
        artist: editingTrack.artist,
        album: editingTrack.album,
        genre: editingTrack.genre,
        category_id: editingTrack.category_id || null,
        is_public: Number(editingTrack.is_public)
      }, { headers: authH });
      if (res.data.success) {
        showAlert(isVi ? 'ThĂ nh cĂ´ng' : 'Success', isVi ? 'ÄĂ£ cáº­p nháº­t bĂ i hĂ¡t thĂ nh cĂ´ng.' : 'Song updated successfully.', 'success');
        setEditingTrack(null);
        fetch();
      }
    } catch (err: any) {
      showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'KhĂ´ng thá»ƒ cáº­p nháº­t bĂ i hĂ¡t.' : 'Failed to update song.'), 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isVi ? "TĂ¬m bĂ i hĂ¡t..." : "Search songs..."}
          className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2 text-sm text-white focus:outline-none placeholder-zinc-600" />
        
        <button
          type="button"
          onClick={() => setOnlyRecent(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
            onlyRecent 
              ? 'bg-purple-500/25 border-purple-500/40 text-purple-400 shadow-md shadow-purple-500/10'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          {isVi ? 'BĂ i má»›i (24h)' : 'New (24h)'}
        </button>

        <span className="text-xs text-zinc-500">{displayedTracks.length} / {tracks.length} {isVi ? 'bĂ i' : 'tracks'}</span>
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/[0.03]">
          {displayedTracks.map((t, i) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] group">
              <span className="text-xs text-zinc-600 w-6 text-center">{i+1}</span>
              <img src={t.cover_url || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-200 truncate">{t.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-zinc-500 truncate">{t.artist}</span>
                  {t.category_name && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border bg-purple-500/10 border-purple-500/20 text-purple-400 font-bold">
                      {t.category_icon || 'đŸµ'} {t.category_name}
                    </span>
                  )}
                  {t.genre && t.genre !== t.category_name && (
                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full border border-white/5 font-semibold">
                      {t.genre}
                    </span>
                  )}
                  {t.created_at && (
                    <span className="text-[9px] text-zinc-600 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(t.created_at).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-zinc-600">{formatPlaysShort(t.play_count || 0, isVi)}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${t.is_public ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                {t.is_public ? (isVi ? 'CĂ´ng khai' : 'Public') : (isVi ? 'RiĂªng tÆ°' : 'Private')}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => setEditingTrack({ ...t })}
                  className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                  title={isVi ? "Chá»‰nh sá»­a bĂ i hĂ¡t" : "Edit song"}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => del(t.id)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  title={isVi ? "XĂ³a bĂ i hĂ¡t" : "Delete song"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {displayedTracks.length === 0 && (
            <div className="p-8 text-center text-zinc-600 text-sm">
              {isVi ? 'KhĂ´ng tĂ¬m tháº¥y bĂ i hĂ¡t nĂ o.' : 'No tracks found.'}
            </div>
          )}
        </div>
      </div>

      {/* Edit Track Modal */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                {isVi ? 'Chá»‰nh sá»­a bĂ i hĂ¡t' : 'Edit Song'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTrack(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                âœ•
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'TiĂªu Ä‘á» bĂ i hĂ¡t *' : 'Song Title *'}</label>
                <input
                  type="text"
                  required
                  value={editingTrack.title}
                  onChange={e => setEditingTrack({ ...editingTrack, title: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Nghá»‡ sÄ© *' : 'Artist *'}</label>
                <input
                  type="text"
                  required
                  value={editingTrack.artist}
                  onChange={e => setEditingTrack({ ...editingTrack, artist: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Album' : 'Album'}</label>
                  <input
                    type="text"
                    value={editingTrack.album || ''}
                    onChange={e => setEditingTrack({ ...editingTrack, album: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Danh má»¥c nháº¡c' : 'Music Category'}</label>
                  <select
                    value={editingTrack.category_id || ''}
                    onChange={e => {
                      const catId = e.target.value;
                      const selectedCat = categories.find(c => String(c.id) === String(catId));
                      setEditingTrack({
                        ...editingTrack,
                        category_id: catId,
                        genre: selectedCat ? selectedCat.name : editingTrack.genre
                      });
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="">{isVi ? '-- Chá»n danh má»¥c --' : '-- Select Category --'}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Thá»ƒ loáº¡i chi tiáº¿t' : 'Detailed Genre'}</label>
                  <input
                    type="text"
                    value={editingTrack.genre || ''}
                    onChange={e => setEditingTrack({ ...editingTrack, genre: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Hiá»ƒn thá»‹' : 'Visibility'}</label>
                  <select
                    value={editingTrack.is_public}
                    onChange={e => setEditingTrack({ ...editingTrack, is_public: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="1">{isVi ? 'CĂ´ng khai' : 'Public'}</option>
                    <option value="0">{isVi ? 'RiĂªng tÆ°' : 'Private'}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrack(null)}
                  className="px-4 py-2 border border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
                >{isVi ? 'Há»§y' : 'Cancel'}</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl text-xs transition-all"
                >{isVi ? 'LÆ°u' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ Categories Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PRESET_EMOJIS = [
  { char: 'đŸµ', tags: 'music song note nháº¡c ná»‘t' },
  { char: 'đŸ¶', tags: 'music notes melody nháº¡c giai Ä‘iá»‡u' },
  { char: 'đŸ“»', tags: 'radio lofi Ä‘Ă i phĂ¡t thanh' },
  { char: 'đŸ¸', tags: 'guitar rock instrument Ä‘Ă n ghita' },
  { char: 'đŸ¹', tags: 'piano classical instrument Ä‘Ă n dÆ°Æ¡ng cáº§m' },
  { char: 'đŸ»', tags: 'violin classical instrument vÄ© cáº§m' },
  { char: 'đŸ·', tags: 'saxophone jazz instrument kĂ¨n' },
  { char: 'đŸº', tags: 'trumpet instrument kĂ¨n' },
  { char: 'đŸ¤', tags: 'microphone mic sing vocal hĂ¡t micro' },
  { char: 'đŸ§', tags: 'headphone dj music nghe nháº¡c tai nghe' },
  { char: 'đŸ‡»đŸ‡³', tags: 'vietnam vpop viet nam cá» viá»‡t nam' },
  { char: 'đŸ‡ºđŸ‡¸', tags: 'usa us uk english cá» má»¹' },
  { char: 'đŸ‡°đŸ‡·', tags: 'korea kpop cá» hĂ n quá»‘c' },
  { char: 'đŸ‡¯đŸ‡µ', tags: 'japan jpop cá» nháº­t báº£n' },
  { char: 'đŸ‡¬đŸ‡§', tags: 'uk britain english cá» anh' },
  { char: 'đŸ‡¨đŸ‡³', tags: 'china cpop cá» trung quá»‘c' },
  { char: 'â¡', tags: 'electric edm thunder flash Ä‘iá»‡n sĂ©t' },
  { char: 'đŸŒŒ', tags: 'synthwave galaxy space space vÅ© trá»¥ dáº£i ngĂ¢n hĂ ' },
  { char: 'đŸ”¥', tags: 'hiphop hot rap fire lá»­a nhiá»‡t' },
  { char: 'đŸ’ƒ', tags: 'dance latin girl khiĂªu vÅ© nháº£y' },
  { char: 'đŸ•º', tags: 'dance disco boy khiĂªu vÅ© nháº£y' },
  { char: 'â˜•', tags: 'coffee acoustic lofi tea cĂ  phĂª trĂ ' },
  { char: 'đŸ’¤', tags: 'sleep lofi relax ngá»§ thÆ° giĂ£n' },
  { char: 'đŸŒ', tags: 'wave chill ocean biá»ƒn sĂ³ng' },
  { char: 'đŸŒ´', tags: 'palm summer beach nhiá»‡t Ä‘á»›i cĂ¢y dá»«a' },
  { char: 'đŸ‚', tags: 'autumn sad ballad lĂ¡ rá»¥ng mĂ¹a thu buá»“n' },
  { char: 'đŸ®', tags: 'gaming game chiptune trĂ² chÆ¡i' },
  { char: 'đŸ“¼', tags: 'retro tape cassette bÄƒng nháº¡c' },
  { char: 'đŸ’¿', tags: 'cd dvd disc vinyl Ä‘Ä©a nháº¡c' },
  { char: 'đŸ­', tags: 'theater drama opera classical nghá»‡ thuáº­t ká»‹ch' },
  { char: 'â­', tags: 'star favorite ngĂ´i sao' },
  { char: 'âœ¨', tags: 'sparkles magic láº¥p lĂ¡nh áº£o thuáº­t' },
  { char: 'â¤ï¸', tags: 'love heart tim yĂªu' },
  { char: 'đŸ’”', tags: 'broken heart buá»“n sad chia tay' },
  { char: 'đŸ‰', tags: 'party celebrate party lá»… há»™i tiá»‡c' },
  { char: 'đŸ”', tags: 'sound speaker volume loa Ă¢m thanh' },
  { char: 'đŸ¥', tags: 'drum beats trá»‘ng gĂµ' },
  { char: 'đŸ¼', tags: 'score stave music khuĂ´ng nháº¡c' },
  { char: 'đŸ“£', tags: 'megaphone announcement loa phĂ¡t thanh' },
  { char: 'đŸ””', tags: 'bell notification chuĂ´ng' },
  { char: 'đŸª', tags: 'saturn space sao thá»• vÅ© trá»¥' },
  { char: 'đŸŒ™', tags: 'moon night lofi trÄƒng Ä‘Ăªm' },
  { char: 'â˜€ï¸', tags: 'sun bright day máº·t trá»i náº¯ng' },
  { char: 'â˜ï¸', tags: 'cloud chill mĂ¢y' },
  { char: 'đŸŒ§ï¸', tags: 'rain sad ballad mÆ°a buá»“n' },
  { char: 'â„ï¸', tags: 'snow cold winter tuyáº¿t láº¡nh' },
  { char: 'đŸŒˆ', tags: 'rainbow cáº§u vá»“ng' },
  { char: 'đŸ”®', tags: 'crystal magic quáº£ cáº§u pha lĂª' },
  { char: 'đŸˆ', tags: 'balloon bĂ³ng bay' },
  { char: 'đŸ§¸', tags: 'bear toy lofi gáº¥u bĂ´ng' },
  { char: 'đŸ±', tags: 'cat meow mĂ¨o' },
  { char: 'đŸ¶', tags: 'dog woof chĂ³' },
  { char: 'đŸ¦', tags: 'fox cĂ¡o' },
  { char: 'đŸ¦„', tags: 'unicorn ká»³ lĂ¢n' },
  { char: 'đŸ¦', tags: 'lion sÆ° tá»­' },
  { char: 'đŸŒ¸', tags: 'flower spring hoa anh Ä‘Ă o' },
  { char: 'đŸŒ¹', tags: 'rose flower hoa há»“ng' },
  { char: 'đŸ€', tags: 'lucky cá» 4 lĂ¡ may máº¯n' },
  { char: 'đŸŒµ', tags: 'cactus xÆ°Æ¡ng rá»“ng' },
  { char: 'đŸŒ', tags: 'earth world quáº£ Ä‘á»‹a cáº§u' },
  { char: 'đŸ€', tags: 'rocket space bay tĂªn lá»­a' },
  { char: 'đŸ›¸', tags: 'ufo alien Ä‘Ä©a bay' },
  { char: 'đŸ’', tags: 'diamond kim cÆ°Æ¡ng' },
  { char: 'đŸ‘‘', tags: 'crown king queen vÆ°Æ¡ng miá»‡n' },
  { char: 'đŸ’¡', tags: 'idea light bĂ³ng Ä‘Ă¨n Ă½ tÆ°á»Ÿng' },
  { char: 'đŸ“', tags: 'book study sĂ¡ch' },
  { char: 'âœ‰ï¸', tags: 'mail letter thÆ°' },
  { char: 'đŸ—ºï¸', tags: 'map báº£n Ä‘á»“' },
  { char: 'đŸ§­', tags: 'compass la bĂ n' },
  { char: 'â°', tags: 'clock time Ä‘á»“ng há»“ bĂ¡o thá»©c' },
  { char: 'đŸ’°', tags: 'money gold tiá»n vĂ ng' },
  { char: 'đŸ', tags: 'gift present quĂ ' },
  { char: 'đŸ¨', tags: 'art paint palette báº£ng mĂ u má»¹ thuáº­t' },
  { char: 'đŸ¬', tags: 'movie cinema clapperboard Ä‘iá»‡n áº£nh phim' },
  { char: 'đŸ“·', tags: 'camera photo mĂ¡y áº£nh' },
  { char: 'đŸ”', tags: 'search find kĂ­nh lĂºp' },
  { char: 'đŸ”‘', tags: 'key máº­t mĂ£ chĂ¬a khĂ³a' },
  { char: 'đŸ§', tags: 'cupcake cake bĂ¡nh ngá»t' },
  { char: 'đŸ­', tags: 'lollipop káº¹o mĂºt' },
  { char: 'đŸ', tags: 'apple tĂ¡o' },
  { char: 'đŸ‰', tags: 'watermelon dÆ°a háº¥u' },
  { char: 'đŸ“', tags: 'strawberry dĂ¢u tĂ¢y' },
  { char: 'đŸ‹', tags: 'lemon chanh' },
  { char: 'đŸ·', tags: 'wine rÆ°á»£u vang' },
  { char: 'đŸº', tags: 'beer bia' },
  { char: 'đŸ¹', tags: 'cocktail nÆ°á»›c ngá»t' },
  { char: 'đŸ•', tags: 'pizza' },
  { char: 'đŸŸ', tags: 'fries khoai tĂ¢y chiĂªn' },
  { char: 'đŸ”', tags: 'burger bĂ¡nh mĂ¬ káº¹p' },
  { char: 'đŸ›«', tags: 'plane travel mĂ¡y bay cáº¥t cĂ¡nh' },
  { char: 'đŸ—', tags: 'car xe hÆ¡i' },
  { char: 'đŸ²', tags: 'bicycle xe Ä‘áº¡p' },
  { char: 'â“', tags: 'anchor má» neo' },
  { char: 'â›°ï¸', tags: 'mountain nĂºi' },
  { char: 'â›º', tags: 'tent camping lá»u cáº¯m tráº¡i' },
  { char: 'đŸ ', tags: 'home house nhĂ ' },
  { char: 'đŸ™ï¸', tags: 'city thĂ nh phá»‘' },
  { char: 'â›²', tags: 'fountain Ä‘Ă i phun nÆ°á»›c' },
  { char: 'đŸ¢', tags: 'rollercoaster tĂ u lÆ°á»£n siĂªu tá»‘c' },
  { char: 'đŸ ', tags: 'carousel ngá»±a gá»—' },
  { char: 'đŸ¡', tags: 'ferris wheel vĂ²ng quay' },
  { char: 'đŸª', tags: 'circus ráº¡p xiáº¿c' },
  { char: 'đŸŸï¸', tags: 'ticket vĂ©' },
  { char: 'đŸ†', tags: 'trophy cup cĂºp vĂ´ Ä‘á»‹ch' },
  { char: 'đŸ¯', tags: 'target bullseye má»¥c tiĂªu' },
  { char: 'đŸ§©', tags: 'puzzle máº£nh ghĂ©p' },
  { char: 'đŸ•¶ï¸', tags: 'sunglasses kĂ­nh mĂ¡t' }
];

function CategoriesTab({ authH }: any) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [cats, setCats]   = useState<any[]>([]);
  const [form, setForm]   = useState({ name:'', description:'', color:'#7c3aed', icon:'đŸµ' });
  const [editing, setEditing] = useState<number|null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await axios.get(`${API}/categories`, { headers: authH }); if (data.success) setCats(data.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) { await axios.put(`${API}/categories/${editing}`, form, { headers: authH }); }
    else { await axios.post(`${API}/categories`, form, { headers: authH }); }
    setForm({ name:'', description:'', color:'#7c3aed', icon:'đŸµ' }); setEditing(null); fetch();
  };
  const { showConfirm, showAlert } = useModalStore();

  const del = async (id: number) => {
    showConfirm(
      isVi ? 'XĂ¡c nháº­n xĂ³a' : 'Confirm Delete',
      isVi ? 'Báº¡n cĂ³ cháº¯c cháº¯n muá»‘n xĂ³a danh má»¥c nĂ y? Táº¥t cáº£ bĂ i hĂ¡t trong danh má»¥c sáº½ Ä‘Æ°á»£c gĂ¡n láº¡i.' : 'Are you sure you want to delete this category? All songs in this category will be reassigned.',
      async () => {
        try {
          await axios.delete(`${API}/categories/${id}`, { headers: authH });
          showAlert(isVi ? 'ThĂ nh cĂ´ng' : 'Success', isVi ? 'ÄĂ£ xĂ³a danh má»¥c thĂ nh cĂ´ng.' : 'Category deleted successfully.', 'success');
          fetch();
        } catch (err: any) {
          showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'KhĂ´ng thá»ƒ xĂ³a danh má»¥c.' : 'Failed to delete category.'), 'error');
        }
      }
    );
  };
  const startEdit = (c: any) => { setEditing(c.id); setForm({ name:c.name, description:c.description||'', color:c.color, icon:c.icon }); };

  const filteredEmojis = PRESET_EMOJIS.filter(e => 
    e.tags.toLowerCase().includes(emojiSearch.toLowerCase()) || 
    e.char.includes(emojiSearch)
  );

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
        <h3 className="text-sm font-bold text-white mb-3">{editing ? (isVi ? 'Chá»‰nh sá»­a danh má»¥c' : 'Edit Category') : (isVi ? 'ThĂªm danh má»¥c má»›i' : 'Add New Category')}</h3>
        <form onSubmit={save} className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <input
              required
              value={form.icon}
              onChange={e => setForm({ ...form, icon: e.target.value })}
              onClick={() => setShowEmojiPicker(true)}
              placeholder="đŸµ"
              className="w-14 bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-2 py-2 text-xl text-center focus:outline-none cursor-pointer"
            />
            {showEmojiPicker && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => {
                    setShowEmojiPicker(false);
                    setEmojiSearch('');
                  }} 
                />
                <div className="absolute top-full left-0 mt-1.5 p-2 bg-zinc-950/95 border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-40 w-56 flex flex-col gap-2">
                  <input
                    type="text"
                    value={emojiSearch}
                    onChange={e => setEmojiSearch(e.target.value)}
                    placeholder={isVi ? "TĂ¬m biá»ƒu tÆ°á»£ng..." : "Search icon..."}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-zinc-500"
                    autoFocus
                  />
                  <div className="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {filteredEmojis.length === 0 ? (
                      <span className="col-span-5 text-[10px] text-zinc-500 text-center py-4">{isVi ? 'KhĂ´ng tĂ¬m tháº¥y' : 'Not found'}</span>
                    ) : (
                      filteredEmojis.map(emoji => (
                        <button
                          key={emoji.char}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, icon: emoji.char });
                            setShowEmojiPicker(false);
                            setEmojiSearch('');
                          }}
                          className="text-xl p-1 hover:bg-white/10 rounded-lg transition-colors text-center active:scale-90"
                          title={emoji.tags}
                        >
                          {emoji.char}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder={isVi ? "TĂªn danh má»¥c" : "Category Name"}
            className="flex-1 min-w-[120px] bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600" />
          <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder={isVi ? "MĂ´ táº£..." : "Description..."}
            className="flex-1 min-w-[200px] bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600" />
          <input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})}
            className="w-10 h-9 rounded-lg border border-zinc-800 cursor-pointer bg-zinc-900 p-0.5" />
          <button type="submit" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-lg text-sm">
            {editing ? (isVi ? 'Cáº­p nháº­t' : 'Update') : (isVi ? 'ThĂªm' : 'Add')}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({name:'',description:'',color:'#7c3aed',icon:'đŸµ'}); }}
            className="px-3 py-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-lg text-sm">{isVi ? 'Há»§y' : 'Cancel'}</button>}
        </form>
      </div>

      {/* Category List */}
      <div className="grid grid-cols-2 gap-3">
        {cats.map(c => (
          <div key={c.id} className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] group hover:bg-white/[0.04] transition-all">
            <span className="text-2xl">{c.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <p className="text-sm font-semibold text-zinc-200">{c.name}</p>
              </div>
              <p className="text-xs text-zinc-500">{c.track_count} {isVi ? 'bĂ i hĂ¡t' : 'songs'}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => startEdit(c)} className="p-1.5 text-zinc-500 hover:text-purple-400 rounded-lg hover:bg-white/5"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => del(c.id)}    className="p-1.5 text-zinc-500 hover:text-rose-400  rounded-lg hover:bg-rose-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────
function StatsTab({ authH }: any) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryTracks, setCategoryTracks] = useState<any[]>([]);
  const [catTracksLoading, setCatTracksLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/stats`, { headers: authH });
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const fetchCategoryTracks = async (cat: any) => {
    setSelectedCategory(cat);
    setCatTracksLoading(true);
    try {
      const catId = cat.categoryId ?? 'null';
      const { data } = await axios.get(`${API}/stats/category-tracks?categoryId=${catId}`, { headers: authH });
      if (data.success) setCategoryTracks(data.data);
    } catch { setCategoryTracks([]); }
    finally { setCatTracksLoading(false); }
  };

  const maxDailyPlays = Math.max(1, ...(stats?.dailyPlays || []).map((d: any) => d.count));

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!stats) return (
    <div className="text-center py-16 text-zinc-500 text-sm">
      {isVi ? 'Không thể tải thống kê.' : 'Could not load statistics.'}
      <button onClick={fetchStats} className="block mx-auto mt-3 text-amber-400 hover:text-amber-300 text-xs">
        {isVi ? 'Thử lại' : 'Retry'}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-amber-400" />
          {isVi ? 'Thống kê hệ thống' : 'System Statistics'}
        </h3>
        <button onClick={fetchStats} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all border border-white/5">
          <RefreshCw className="w-3.5 h-3.5" /> {isVi ? 'Làm mới' : 'Refresh'}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isVi ? 'Người dùng' : 'Users', value: stats.totalUsers ?? 0, icon: '👤', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: isVi ? 'Bài hát' : 'Tracks', value: stats.totalTracks ?? 0, icon: '🎵', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { label: isVi ? 'Lượt nghe' : 'Total Plays', value: formatCount(stats.totalPlays ?? 0), icon: '▶️', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: isVi ? 'Yêu thích' : 'Favorites', value: stats.totalFavorites ?? 0, icon: '❤️', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
        ].map(card => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.bg}`}>
            <div className="text-2xl mb-1">{card.icon}</div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-5">
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          {isVi ? 'Lượt nghe 7 ngày gần nhất' : 'Plays — Last 7 Days'}
        </h4>
        {stats.dailyPlays && stats.dailyPlays.length > 0 ? (
          <div className="flex items-end gap-2 h-32">
            {stats.dailyPlays.map((d: any, i: number) => {
              const pct = Math.max(4, Math.round((d.count / maxDailyPlays) * 100));
              const label = formatDateLabel(d.day, 'day');
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
                  <span className="text-[9px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-400 group-hover:from-amber-500 group-hover:to-yellow-300 transition-all"
                    style={{ height: `${pct}%` }} title={`${label}: ${d.count}`} />
                  <span className="text-[9px] text-zinc-600 truncate w-full text-center">{label.slice(0, 5)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
            {isVi ? 'Chưa có dữ liệu lượt nghe.' : 'No play data yet.'}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
          <h4 className="text-sm font-bold text-white mb-3">
            🔥 {isVi ? 'Top bài nghe nhiều nhất' : 'Most Played Tracks'}
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(stats.topTracks || []).slice(0, 8).map((t: any, i: number) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="text-[10px] text-zinc-600 w-5 text-right flex-shrink-0 font-bold">{i + 1}</span>
                <img src={t.cover_url || 'https://via.placeholder.com/32'} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt={t.title} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{t.title}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{t.artist}</p>
                </div>
                <span className="text-[10px] text-amber-400 font-bold flex-shrink-0">{formatCount(t.play_count || 0)}</span>
              </div>
            ))}
            {(!stats.topTracks || stats.topTracks.length === 0) && (
              <p className="text-xs text-zinc-600 text-center py-6">{isVi ? 'Chưa có lượt nghe.' : 'No plays yet.'}</p>
            )}
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            {isVi ? 'Theo danh mục (click để xem)' : 'By Category (click for details)'}
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {(stats.genreStats || []).map((g: any, i: number) => {
              const maxPlays = Math.max(1, ...(stats.genreStats || []).map((x: any) => x.plays));
              const pct = Math.round((g.plays / maxPlays) * 100);
              return (
                <button key={i} onClick={() => fetchCategoryTracks(g)}
                  className={`w-full text-left rounded-lg p-2 transition-all hover:bg-white/5 ${selectedCategory?.genre === g.genre ? 'bg-amber-500/10 border border-amber-500/20' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-300 truncate">{g.genre}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-zinc-500">{g.count} {isVi ? 'bài' : 'tracks'}</span>
                      <span className="text-[10px] text-amber-400 font-bold">{formatCount(g.plays)}</span>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: g.color || '#7c3aed' }} />
                  </div>
                </button>
              );
            })}
            {(!stats.genreStats || stats.genreStats.length === 0) && (
              <p className="text-xs text-zinc-600 text-center py-6">{isVi ? 'Chưa có danh mục.' : 'No categories.'}</p>
            )}
          </div>
        </div>
      </div>
      {selectedCategory && (
        <div className="bg-zinc-900/60 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white">
              {isVi ? 'Bài trong: ' : 'Tracks in: '}
              <span style={{ color: selectedCategory.color || '#a78bfa' }}>{selectedCategory.genre}</span>
            </h4>
            <button onClick={() => { setSelectedCategory(null); setCategoryTracks([]); }}
              className="text-zinc-500 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/5 transition-all">✕</button>
          </div>
          {catTracksLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {categoryTracks.map((t: any, i: number) => (
                <div key={t.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/[0.03]">
                  <span className="text-[10px] text-zinc-600 w-4">{i + 1}</span>
                  <img src={t.cover_url || 'https://via.placeholder.com/28'} className="w-7 h-7 rounded-md object-cover flex-shrink-0" alt={t.title} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{t.title}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{t.artist}</p>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold flex-shrink-0">{formatCount(t.plays || 0)}</span>
                </div>
              ))}
              {categoryTracks.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-4">{isVi ? 'Chưa có bài hát.' : 'No tracks.'}</p>
              )}
            </div>
          )}
        </div>
      )}
      <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          {isVi ? 'Hoạt động gần đây' : 'Recent Listening Activity'}
        </h4>
        <div className="space-y-1 max-h-52 overflow-y-auto">
          {(stats.recentActivity || []).map((a: any, i: number) => (
            <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-white/[0.03] last:border-0">
              <span className="text-zinc-600 flex-shrink-0 w-28 truncate text-[10px]">
                {new Date(a.played_at).toLocaleString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
              </span>
              <span className="text-zinc-200 flex-1 truncate font-medium">{a.title}</span>
              <span className="text-zinc-500 truncate max-w-[80px] hidden md:block">{a.artist}</span>
              <span className="text-purple-400 flex-shrink-0 truncate max-w-[80px] text-[10px]">{a.user_name || 'Guest'}</span>
            </div>
          ))}
          {(!stats.recentActivity || stats.recentActivity.length === 0) && (
            <p className="text-xs text-zinc-600 text-center py-4">{isVi ? 'Chưa có hoạt động.' : 'No recent activity.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ArtistsTab({ authH }: any) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [artists, setArtists] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', genre: '', listeners: '', popular_track: '', bio: '' });
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/artists`);
      if (data.success) setArtists(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('genre', form.genre);
      formData.append('listeners', form.listeners);
      formData.append('bio', form.bio);
      formData.append('popular_track', form.popular_track);
      if (file) {
        formData.append('cover', file);
      } else if (imageUrl) {
        formData.append('image_url', imageUrl);
      }

      const { data } = await axios.post(`${API}/artists`, formData, {
        headers: {
          ...authH,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (data.success) {
        setForm({ name: '', genre: '', listeners: '', popular_track: '', bio: '' });
        setFile(null);
        setImageUrl('');
        fetchArtists();
        window.dispatchEvent(new CustomEvent('reload-artists'));
      }
    } catch (err: any) {
      showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'CĂ³ lá»—i xáº£y ra khi thĂªm nghá»‡ sÄ©' : 'An error occurred while adding the artist'), 'error');
    }
  };

  const { showConfirm, showAlert } = useModalStore();

  const del = async (id: number) => {
    showConfirm(
      isVi ? 'XĂ¡c nháº­n xĂ³a' : 'Confirm Delete',
      isVi ? 'Báº¡n cĂ³ cháº¯c cháº¯n muá»‘n xĂ³a nghá»‡ sÄ© tiĂªu biá»ƒu nĂ y?' : 'Are you sure you want to delete this featured artist?',
      async () => {
        try {
          await axios.delete(`${API}/artists/${id}`, { headers: authH });
          showAlert(isVi ? 'ThĂ nh cĂ´ng' : 'Success', isVi ? 'ÄĂ£ xĂ³a nghá»‡ sÄ© thĂ nh cĂ´ng.' : 'Artist deleted successfully.', 'success');
          fetchArtists();
          window.dispatchEvent(new CustomEvent('reload-artists'));
        } catch (err: any) {
          showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'KhĂ´ng thá»ƒ xĂ³a nghá»‡ sÄ©.' : 'Failed to delete artist.'), 'error');
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Form thĂªm nghá»‡ sÄ© */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-purple-400" /> {isVi ? 'ThĂªm nghá»‡ sÄ© tiĂªu biá»ƒu má»›i' : 'Add New Featured Artist'}
        </h3>
        
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'TĂªn nghá»‡ sÄ©' : 'Artist Name'}</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={isVi ? "VĂ­ dá»¥: The Weeknd" : "E.g., The Weeknd"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Thá»ƒ loáº¡i' : 'Genre'}</label>
              <input required value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })}
                placeholder={isVi ? "VĂ­ dá»¥: R&B / Synthwave / Pop" : "E.g., R&B / Synthwave / Pop"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'LÆ°á»£t nghe hĂ ng thĂ¡ng' : 'Monthly Listeners'}</label>
              <input required value={form.listeners} onChange={e => setForm({ ...form, listeners: e.target.value })}
                placeholder={isVi ? "VĂ­ dá»¥: 115.4M" : "E.g., 115.4M"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'BĂ i hĂ¡t ná»•i báº­t' : 'Popular Track'}</label>
              <input required value={form.popular_track} onChange={e => setForm({ ...form, popular_track: e.target.value })}
                placeholder={isVi ? "VĂ­ dá»¥: Blinding Lights" : "E.g., Blinding Lights"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">{isVi ? 'MĂ´ táº£ tiá»ƒu sá»­' : 'Bio description'}</label>
            <textarea required rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder={isVi ? "ThĂ´ng tin giá»›i thiá»‡u chi tiáº¿t vá» cuá»™c Ä‘á»i, sá»± nghiá»‡p cá»§a ca sÄ©..." : "Detailed introduction about the singer's life, career..."}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700 resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'áº¢nh chĂ¢n dung nghá»‡ sÄ© (Upload file)' : 'Artist portrait photo (Upload file)'}</label>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Hoáº·c dĂ¡n URL áº£nh' : 'Or paste image URL'}</label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} disabled={!!file}
                placeholder="http://example.com/image.png"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700 disabled:opacity-40" />
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
            {isVi ? 'ThĂªm nghá»‡ sÄ©' : 'Add Artist'}
          </button>
        </form>
      </div>

      {/* Danh sĂ¡ch nghá»‡ sÄ© */}
      <div className="rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-zinc-300">{isVi ? 'Danh sĂ¡ch nghá»‡ sÄ© tiĂªu biá»ƒu hiá»‡n cĂ³' : 'Featured Artist List'}</h3>
          <button onClick={fetchArtists} className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="divide-y divide-white/[0.03]">
          {artists.map((artist) => (
            <div key={artist.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.01] group">
              <img src={artist.image_url} alt={artist.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-white/5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-zinc-200">{artist.name}</span>
                  <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">{artist.listeners} {isVi ? 'lÆ°á»£t nghe/thĂ¡ng' : 'listeners/month'}</span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5"><span className="text-zinc-500">{isVi ? 'Thá»ƒ loáº¡i:' : 'Genre:'}</span> {artist.genre} Â· <span className="text-zinc-500">{isVi ? 'BĂ i hĂ¡t ná»•i báº­t:' : 'Popular track:'}</span> {artist.popular_track}</p>
                <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1">{artist.bio}</p>
              </div>
              <button onClick={() => del(artist.id)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {artists.length === 0 && !loading && (
            <div className="p-8 text-center text-zinc-600 text-sm">{isVi ? 'ChÆ°a cĂ³ nghá»‡ sÄ© nĂ o. Vui lĂ²ng thĂªm báº±ng biá»ƒu máº«u trĂªn.' : 'No artists yet. Please add using the form above.'}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Albums Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AlbumsTab({ authH }: any) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [albums, setAlbums] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const [form, setForm] = useState({ name: '', artist: '', description: '', trackIds: [] as number[] });
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  
  // Track search filter within the album builder form
  const [trackSearch, setTrackSearch] = useState('');

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/albums`);
      if (data.success) setAlbums(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTracks = async () => {
    try {
      const { data } = await axios.get(`${API}/tracks`);
      if (data.success) setTracks(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlbums();
    fetchTracks();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('artist', form.artist);
      formData.append('description', form.description);
      // Append track IDs as a JSON string
      formData.append('trackIds', JSON.stringify(form.trackIds));

      if (file) {
        formData.append('cover', file);
      } else if (imageUrl) {
        formData.append('cover_url', imageUrl);
      }

      let res;
      if (editing) {
        res = await axios.put(`${API}/albums/${editing}`, formData, {
          headers: { ...authH, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post(`${API}/albums`, formData, {
          headers: { ...authH, 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        setForm({ name: '', artist: '', description: '', trackIds: [] });
        setFile(null);
        setImageUrl('');
        setEditing(null);
        fetchAlbums();
        window.dispatchEvent(new CustomEvent('reload-settings'));
      }
    } catch (err: any) {
      showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'CĂ³ lá»—i xáº£y ra khi lÆ°u album' : 'An error occurred while saving the album'), 'error');
    }
  };

  const { showConfirm, showAlert } = useModalStore();

  const del = async (id: number) => {
    showConfirm(
      isVi ? 'XĂ¡c nháº­n xĂ³a' : 'Confirm Delete',
      isVi ? 'Báº¡n cĂ³ cháº¯c cháº¯n muá»‘n xĂ³a album nĂ y? CĂ¡c bĂ i hĂ¡t trong album sáº½ khĂ´ng bá»‹ xĂ³a nhÆ°ng sáº½ khĂ´ng cĂ²n thuá»™c album nĂ y.' : 'Are you sure you want to delete this album? Songs in this album will not be deleted but will no longer belong to this album.',
      async () => {
        try {
          await axios.delete(`${API}/albums/${id}`, { headers: authH });
          showAlert(isVi ? 'ThĂ nh cĂ´ng' : 'Success', isVi ? 'ÄĂ£ xĂ³a album thĂ nh cĂ´ng.' : 'Album deleted successfully.', 'success');
          fetchAlbums();
          window.dispatchEvent(new CustomEvent('reload-settings'));
        } catch (err: any) {
          showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'KhĂ´ng thá»ƒ xĂ³a album.' : 'Failed to delete album.'), 'error');
        }
      }
    );
  };

  const startEdit = (album: any) => {
    setEditing(album.id);
    const existingTrackIds = album.tracks?.map((t: any) => t.id) || [];
    setForm({
      name: album.name,
      artist: album.artist,
      description: album.description || '',
      trackIds: existingTrackIds
    });
    setFile(null);
    setImageUrl(album.cover_url || '');
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: '', artist: '', description: '', trackIds: [] });
    setFile(null);
    setImageUrl('');
  };

  const toggleTrack = (trackId: number) => {
    setForm(prev => {
      const idx = prev.trackIds.indexOf(trackId);
      if (idx === -1) {
        return { ...prev, trackIds: [...prev.trackIds, trackId] };
      } else {
        return { ...prev, trackIds: prev.trackIds.filter(id => id !== trackId) };
      }
    });
  };

  const filteredTracks = tracks.filter(t =>
    t.title.toLowerCase().includes(trackSearch.toLowerCase()) ||
    t.artist.toLowerCase().includes(trackSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Form thĂªm/sá»­a album */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          {editing ? <Edit2 className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-purple-400" />}
          {editing ? (isVi ? 'Chá»‰nh sá»­a album' : 'Edit Album') : (isVi ? 'Táº¡o album má»›i' : 'Create New Album')}
        </h3>
        
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'TĂªn album' : 'Album Name'}</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={isVi ? "VĂ­ dá»¥: Starboy" : "E.g., Starboy"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'TĂªn ca sÄ©' : 'Artist Name'}</label>
              <input required value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })}
                placeholder={isVi ? "VĂ­ dá»¥: The Weeknd" : "E.g., The Weeknd"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">{isVi ? 'MĂ´ táº£ album' : 'Album Description'}</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder={isVi ? "ThĂ´ng tin giá»›i thiá»‡u ngáº¯n vá» album..." : "Short introduction about the album..."}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700 resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'áº¢nh bĂ¬a Album (Upload file)' : 'Album Cover Photo (Upload file)'}</label>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Hoáº·c dĂ¡n URL áº£nh bĂ¬a' : 'Or paste cover URL'}</label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} disabled={!!file}
                placeholder="http://example.com/cover.png"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700 disabled:opacity-40" />
            </div>
          </div>

          {/* Chá»n bĂ i hĂ¡t vĂ o album */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? `Danh sĂ¡ch bĂ i hĂ¡t thuá»™c album (${form.trackIds.length})` : `Song list belonging to the album (${form.trackIds.length})`}</label>
              <input
                type="text"
                value={trackSearch}
                onChange={e => setTrackSearch(e.target.value)}
                placeholder={isVi ? "TĂ¬m bĂ i hĂ¡t..." : "Search song..."}
                className="w-48 bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none placeholder-zinc-700"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-zinc-800 bg-zinc-950/40 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {filteredTracks.map(t => {
                const checked = form.trackIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTrack(t.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border text-xs cursor-pointer ${
                      checked
                        ? 'bg-purple-600/10 border-purple-500/35 text-white'
                        : 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    <input type="checkbox" checked={checked} readOnly className="rounded border-zinc-800 text-purple-600 focus:ring-purple-500" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{t.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{t.artist}</p>
                    </div>
                  </button>
                );
              })}
              {filteredTracks.length === 0 && (
                <div className="col-span-full py-6 text-center text-zinc-600 text-xs">{isVi ? 'KhĂ´ng tĂ¬m tháº¥y bĂ i hĂ¡t nĂ o' : 'No songs found'}</div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
              {editing ? (isVi ? 'Cáº­p nháº­t Album' : 'Update Album') : (isVi ? 'Táº¡o Album' : 'Create Album')}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-sm transition-all">
                {isVi ? 'Há»§y' : 'Cancel'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Danh sĂ¡ch album */}
      <div className="rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-zinc-300">{isVi ? 'Danh sĂ¡ch album hiá»‡n cĂ³' : 'Existing Albums'}</h3>
          <button onClick={fetchAlbums} className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="divide-y divide-white/[0.03]">
          {albums.map((album) => (
            <div key={album.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.01] group">
              <img src={album.cover_url} alt={album.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-white/5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-zinc-200">{album.name}</span>
                  <span className="text-xs text-zinc-500">{isVi ? `bá»Ÿi ${album.artist}` : `by ${album.artist}`}</span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5"><span className="text-zinc-500">{isVi ? 'MĂ´ táº£:' : 'Description:'}</span> {album.description || (isVi ? 'KhĂ´ng cĂ³ mĂ´ táº£' : 'No description')} Â· <span className="text-zinc-500">{isVi ? 'BĂ i hĂ¡t:' : 'Songs:'}</span> {album.tracks?.length || 0} {isVi ? 'bĂ i' : 'songs'}</p>
                {album.tracks && album.tracks.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {album.tracks.slice(0, 5).map((t: any) => (
                      <span key={t.id} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md truncate max-w-[120px]" title={t.title}>
                        {t.title}
                      </span>
                    ))}
                    {album.tracks.length > 5 && (
                      <span className="text-[10px] text-zinc-500 px-1 py-0.5">+{album.tracks.length - 5} {isVi ? 'bĂ i khĂ¡c' : 'other songs'}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                <button onClick={() => startEdit(album)} className="p-2 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => del(album.id)} className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {albums.length === 0 && !loading && (
            <div className="p-8 text-center text-zinc-600 text-sm">{isVi ? 'ChÆ°a cĂ³ album nĂ o. Vui lĂ²ng thĂªm báº±ng biá»ƒu máº«u trĂªn.' : 'No albums yet. Please add using the form above.'}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Settings Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SettingsTab({ authH }: any) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [background, setBackground] = useState('');
  const [bannerSlides, setBannerSlides] = useState<any[]>([]);
  const [youtubeCookies, setYoutubeCookies] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states for background
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgUrl, setBgUrl] = useState('');

  // Form states for banner slide
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [slideUrl, setSlideUrl] = useState('');

  const { showConfirm, showAlert } = useModalStore();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const bgRes = await axios.get(`${API}/settings/background`);
      if (bgRes.data.success) {
        setBackground(bgRes.data.value);
        setBgUrl(bgRes.data.value);
      }

      const slidesRes = await axios.get(`${API}/settings/banner-slides`);
      if (slidesRes.data.success) {
        setBannerSlides(slidesRes.data.data || []);
      }

      const cookiesRes = await axios.get(`${API}/settings/youtube-cookies`, { headers: authH });
      if (cookiesRes.data.success) {
        setYoutubeCookies(cookiesRes.data.value || '');
      }
    } catch (err: any) {
      showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'Lá»—i khi táº£i cáº¥u hĂ¬nh.' : 'Failed to load configuration.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateBackground = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      if (bgFile) {
        formData.append('cover', bgFile);
      } else {
        formData.append('background_image_url', bgUrl);
      }

      const res = await axios.post(`${API}/settings/background`, formData, {
        headers: { ...authH, 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setBackground(res.data.value);
        setBgFile(null);
        showAlert(isVi ? 'ThĂ nh cĂ´ng' : 'Success', isVi ? 'Cáº­p nháº­t hĂ¬nh ná»n thĂ nh cĂ´ng!' : 'Backdrop updated successfully!', 'success');
        window.dispatchEvent(new CustomEvent('reload-settings'));
      }
    } catch (err: any) {
      showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'Lá»—i khi cáº­p nháº­t hĂ¬nh ná»n.' : 'Failed to update backdrop.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBannerSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideFile && !slideUrl.trim()) {
      showAlert(isVi ? 'ChĂº Ă½' : 'Warning', isVi ? 'Vui lĂ²ng táº£i lĂªn tá»‡p áº£nh hoáº·c Ä‘iá»n link áº£nh.' : 'Please upload an image file or enter an image URL.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (slideFile) {
        formData.append('cover', slideFile);
      } else {
        formData.append('image_url', slideUrl);
      }

      const res = await axios.post(`${API}/settings/banner-slides`, formData, {
        headers: { ...authH, 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setBannerSlides([res.data.data, ...bannerSlides]);
        setSlideFile(null);
        setSlideUrl('');
        showAlert(isVi ? 'ThĂ nh cĂ´ng' : 'Success', isVi ? 'ThĂªm áº£nh banner thĂ nh cĂ´ng!' : 'Banner image added successfully!', 'success');
        window.dispatchEvent(new CustomEvent('reload-settings'));
      }
    } catch (err: any) {
      showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'Lá»—i khi thĂªm banner.' : 'Failed to add banner image.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBannerSlide = async (id: number) => {
    showConfirm(
      isVi ? 'XĂ¡c nháº­n xĂ³a' : 'Confirm Delete',
      isVi ? 'Báº¡n cĂ³ cháº¯c cháº¯n muá»‘n xĂ³a áº£nh banner nĂ y?' : 'Are you sure you want to delete this banner image?',
      async () => {
        setLoading(true);
        try {
          const res = await axios.delete(`${API}/settings/banner-slides/${id}`, { headers: authH });
          if (res.data.success) {
            setBannerSlides(bannerSlides.filter(s => s.id !== id));
            showAlert(isVi ? 'ThĂ nh cĂ´ng' : 'Success', isVi ? 'XĂ³a áº£nh banner thĂ nh cĂ´ng!' : 'Banner image deleted successfully!', 'success');
            window.dispatchEvent(new CustomEvent('reload-settings'));
          }
        } catch (err: any) {
          showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'Lá»—i khi xĂ³a banner.' : 'Failed to delete banner image.'), 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleUpdateCookies = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/settings/youtube-cookies`, { value: youtubeCookies }, { headers: authH });
      if (res.data.success) {
        showAlert(isVi ? 'ThĂ nh cĂ´ng' : 'Success', isVi ? 'Cáº­p nháº­t YouTube Cookies thĂ nh cĂ´ng!' : 'YouTube Cookies updated successfully!', 'success');
      }
    } catch (err: any) {
      showAlert(isVi ? 'Tháº¥t báº¡i' : 'Failed', err.response?.data?.message || (isVi ? 'Lá»—i khi cáº­p nháº­t Cookies.' : 'Failed to update Cookies.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Background Section */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          đŸ–¼ï¸ {isVi ? 'Cáº¥u hĂ¬nh hĂ¬nh ná»n ca sÄ© (Backdrop Background)' : 'Artist Backdrop Configuration'}
        </h3>
        <p className="text-xs text-zinc-500">
          {isVi ? 'HĂ¬nh ná»n hiá»ƒn thá»‹ má» áº£o phĂ­a sau giao diá»‡n nghe nháº¡c. Máº·c Ä‘á»‹nh lĂ  áº£nh ca sÄ© The Weeknd.' : 'The backdrop displayed blurred behind the music player. Default is The Weeknd.'}
        </p>

        {background && (
          <div className="relative w-full max-w-sm aspect-[21/9] rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
            <img src={background} alt="Current backdrop" className="w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
            <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-zinc-400">
              {isVi ? 'Äang hiá»ƒn thá»‹' : 'Currently Displaying'}
            </span>
          </div>
        )}

        <form onSubmit={handleUpdateBackground} className="space-y-3 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Táº£i file áº£nh lĂªn' : 'Upload image file'}</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  if (e.target.files?.[0]) {
                    setBgFile(e.target.files[0]);
                    setBgUrl('');
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none file:bg-zinc-800 file:border-none file:text-white file:px-2 file:py-1 file:rounded-md file:text-xs file:cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Hoáº·c Ä‘Æ°á»ng dáº«n áº£nh (URL)' : 'Or image URL'}</label>
              <input
                type="text"
                placeholder="http://localhost:1005/..."
                value={bgUrl}
                disabled={!!bgFile}
                onChange={e => setBgUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none placeholder-zinc-600 disabled:opacity-50"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
          >
            {isVi ? 'LÆ°u hĂ¬nh ná»n má»›i' : 'Save New Backdrop'}
          </button>
        </form>
      </div>

      {/* Cookies Section */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          đŸ”‘ {isVi ? 'Cáº¥u hĂ¬nh YouTube Cookies (VÆ°á»£t cháº·n táº£i nháº¡c)' : 'YouTube Cookies (Bypass Bot Check)'}
        </h3>
        <p className="text-xs text-zinc-500">
          {isVi 
            ? 'Nháº­p ná»™i dung táº­p tin Cookies (Ä‘á»‹nh dáº¡ng Netscape) Ä‘á»ƒ yt-dlp cĂ³ thá»ƒ vÆ°á»£t qua kiá»ƒm tra bot cá»§a YouTube trĂªn Render.' 
            : 'Enter Cookies file content (Netscape format) to allow yt-dlp to bypass YouTube bot protection on Render.'}
        </p>
        <div className="text-xs text-amber-500/90 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 space-y-1">
          <p className="font-bold">đŸ’¡ {isVi ? 'CĂ¡ch láº¥y Cookies:' : 'How to export Cookies:'}</p>
          <ul className="list-disc pl-4 space-y-0.5 text-zinc-400">
            <li>{isVi ? "CĂ i Ä‘áº·t tiá»‡n Ă­ch Chrome 'Get cookies.txt LOCALLY' hoáº·c 'Cookie-Editor'." : "Install Chrome extension 'Get cookies.txt LOCALLY' or 'Cookie-Editor'."}</li>
            <li>{isVi ? 'Má»Ÿ trang youtube.com (Ä‘áº£m báº£o Ä‘Ă£ Ä‘Äƒng nháº­p má»™t tĂ i khoáº£n phá»¥).' : 'Go to youtube.com (make sure you are logged in on a dummy/secondary account).'}</li>
            <li>{isVi ? 'Xuáº¥t Cookies dÆ°á»›i dáº¡ng Netscape/text rá»“i dĂ¡n toĂ n bá»™ ná»™i dung vĂ o Ă´ dÆ°á»›i Ä‘Ă¢y.' : 'Export cookies as Netscape format, copy the full text, and paste below.'}</li>
          </ul>
        </div>

        <form onSubmit={handleUpdateCookies} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              {isVi ? 'Ná»™i dung Cookies (Netscape Text)' : 'Cookies Content (Netscape Text)'}
            </label>
            <textarea
              rows={8}
              value={youtubeCookies}
              onChange={e => setYoutubeCookies(e.target.value)}
              placeholder="# Netscape HTTP Cookie File&#10;.youtube.com&#10;..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white focus:outline-none placeholder-zinc-700 font-mono resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
          >
            {isVi ? 'LÆ°u cáº¥u hĂ¬nh Cookies' : 'Save Cookies Configuration'}
          </button>
        </form>
      </div>

      {/* Banner Section */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            đŸï¸ {isVi ? 'Quáº£n lĂ½ hĂ¬nh áº£nh Banner Slideshow' : 'Banner Slideshow Management'}
          </h3>
          <p className="text-xs text-zinc-500">
            {isVi ? 'ThĂªm, xem danh sĂ¡ch vĂ  xĂ³a cĂ¡c áº£nh trĂ¬nh chiáº¿u trĂªn banner chĂ o má»«ng "Xin chĂ o, DÅ©!".' : 'Add, view, and delete images on the welcoming slide banner "Hello, Du!".'}
          </p>
        </div>

        {/* Add Banner Form */}
        <form onSubmit={handleAddBannerSlide} className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 space-y-3 max-w-xl">
          <h4 className="text-xs font-bold text-zinc-300">{isVi ? 'ThĂªm áº£nh banner má»›i' : 'Add New Banner Image'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Táº£i file áº£nh lĂªn' : 'Upload image file'}</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  if (e.target.files?.[0]) {
                    setSlideFile(e.target.files[0]);
                    setSlideUrl('');
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none file:bg-zinc-800 file:border-none file:text-white file:px-2 file:py-1 file:rounded-md file:text-xs file:cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Hoáº·c Ä‘Æ°á»ng dáº«n áº£nh (URL)' : 'Or image URL'}</label>
              <input
                type="text"
                placeholder="http://localhost:1005/..."
                value={slideUrl}
                disabled={!!slideFile}
                onChange={e => setSlideUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none placeholder-zinc-600 disabled:opacity-50"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
          >
            {isVi ? 'ThĂªm vĂ o slideshow' : 'Add to Slideshow'}
          </button>
        </form>

        {/* Banner List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-zinc-300">{isVi ? `Danh sĂ¡ch áº£nh banner hiá»‡n táº¡i (${bannerSlides.length})` : `Current banner image list (${bannerSlides.length})`}</h4>
          {bannerSlides.length === 0 ? (
            <p className="text-xs text-zinc-600">{isVi ? 'ChÆ°a cĂ³ áº£nh banner nĂ o. Há»‡ thá»‘ng sáº½ hiá»ƒn thá»‹ cĂ¡c slide máº·c Ä‘á»‹nh.' : 'No banner images yet. Default slides will be shown.'}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {bannerSlides.map(slide => (
                <div key={slide.id} className="relative group rounded-xl overflow-hidden border border-white/5 bg-zinc-900 aspect-[16/9]">
                  <img src={slide.image_url} alt="Banner slide" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteBannerSlide(slide.id)}
                        className="p-1.5 bg-red-600/95 hover:bg-red-500 text-white rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-400 truncate bg-black/40 px-1.5 py-0.5 rounded self-start max-w-full">
                      {slide.image_url}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
