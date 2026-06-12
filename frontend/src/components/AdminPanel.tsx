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
    { id: 'users' as const,      label: i18n.language === 'vi' ? 'Người dùng' : 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'tracks' as const,     label: i18n.language === 'vi' ? 'Quản lý nhạc' : 'Music', icon: <Music className="w-4 h-4" /> },
    { id: 'categories' as const, label: i18n.language === 'vi' ? 'Danh mục' : 'Categories', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'artists' as const,    label: i18n.language === 'vi' ? 'Nghệ sĩ' : 'Artists', icon: <Star className="w-4 h-4" /> },
    { id: 'albums' as const,     label: i18n.language === 'vi' ? 'Quản lý Album' : 'Albums', icon: <Disc className="w-4 h-4" /> },
    { id: 'settings' as const,   label: i18n.language === 'vi' ? 'Giao diện' : 'Appearance', icon: <Edit2 className="w-4 h-4" /> },
    { id: 'stats' as const,      label: i18n.language === 'vi' ? 'Thống kê' : 'Statistics', icon: <BarChart2 className="w-4 h-4" /> },
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
          <p className="text-xs text-zinc-500">{i18n.language === 'vi' ? 'Quản lý toàn bộ hệ thống MusicStream' : 'Manage the entire MusicStream system'}</p>
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

// ── Users Tab ─────────────────────────────────────────────────────
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
      isVi ? 'Xác nhận xóa' : 'Confirm Delete',
      isVi ? 'Bạn có chắc chắn muốn xóa người dùng này khỏi hệ thống?' : 'Are you sure you want to delete this user from the system?',
      async () => {
        try {
          await axios.delete(`${API}/auth/users/${id}`, { headers: authH });
          showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Đã xóa người dùng thành công.' : 'User deleted successfully.', 'success');
          fetchUsers();
        } catch (err: any) {
          showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể xóa người dùng.' : 'Failed to delete user.'), 'error');
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
      showAlert(isVi ? 'Thành công' : 'Success', isVi ? `Đã khóa tài khoản ${banTarget.name} thành công.` : `Successfully banned ${banTarget.name}.`, 'success');
      setBanTarget(null);
      fetchUsers();
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể khóa tài khoản.' : 'Failed to ban account.'), 'error');
    }
  };

  const unbanUser = async (u: any) => {
    try {
      await axios.put(`${API}/auth/users/${u.id}/ban`, { type: 'unban' }, { headers: authH });
      showAlert(isVi ? 'Thành công' : 'Success', isVi ? `Đã mở khóa tài khoản ${u.name}.` : `Successfully unbanned ${u.name}.`, 'success');
      fetchUsers();
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể mở khóa.' : 'Failed to unban.'), 'error');
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
    if (isPermanentBan(u)) return isVi ? 'Khóa vĩnh viễn' : 'Permanently banned';
    const d = new Date(u.banned_until);
    return isVi ? `Khóa đến ${d.toLocaleDateString('vi-VN')}` : `Banned until ${d.toLocaleDateString('en-US')}`;
  };

  const isOnline = (u: any) => {
    if (!u.last_active_at) return false;
    const lastActive = new Date(u.last_active_at);
    const now = new Date();
    return (now.getTime() - lastActive.getTime()) < 5 * 60 * 1000;
  };

  const lastActiveLabel = (u: any) => {
    if (!u.last_active_at) return isVi ? 'Chưa rõ' : 'Unknown';
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
                <h3 className="text-base font-bold text-white">{isVi ? 'Khóa tài khoản' : 'Ban Account'}</h3>
                <p className="text-sm text-zinc-400 mt-0.5">{isVi ? 'Khóa tài khoản' : 'Ban account'} <span className="text-white font-semibold">{banTarget.name}</span></p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBanType('days')}
                  className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                    banType === 'days' ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' : 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >{isVi ? '⏱ Theo ngày' : '⏱ By days'}</button>
                <button
                  onClick={() => setBanType('permanent')}
                  className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                    banType === 'permanent' ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' : 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >{isVi ? '🔒 Vĩnh viễn' : '🔒 Permanent'}</button>
              </div>

              {banType === 'days' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Số ngày khóa' : 'Days to ban'}</label>
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
                    <span className="text-xs text-zinc-500">{isVi ? 'Hoặc nhập số ngày:' : 'Or enter days:'}</span>
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
                  {isVi ? '⚠️ Người dùng sẽ không thể đăng nhập mãi mãi cho đến khi admin mở khóa.' : '⚠️ User will not be able to log in until they are unbanned.'}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBanTarget(null)}
                className="px-4 py-2 border border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
              >{isVi ? 'Hủy' : 'Cancel'}</button>
              <button
                onClick={applyBan}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all"
              >{isVi ? 'Xác nhận khóa' : 'Confirm Ban'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[[isVi ? 'Tổng' : 'Total', users.length, 'text-blue-400','bg-blue-500/10'],['Admin', admins,'text-amber-400','bg-amber-500/10'],[isVi ? 'Người dùng' : 'User', regular,'text-purple-400','bg-purple-500/10'],[isVi ? 'Bị khóa' : 'Banned', banned,'text-rose-400','bg-rose-500/10']].map(([l,v,tc,bg]) => (
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
          <h3 className="text-sm font-semibold text-zinc-300">{isVi ? 'Danh sách người dùng' : 'User List'}</h3>
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
                  title={isOnline(u) ? (isVi ? 'Đang hoạt động' : 'Active') : (isVi ? `Hoạt động lần cuối: ${lastActiveLabel(u)}` : `Last active: ${lastActiveLabel(u)}`)}
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
                <p className="text-xs text-zinc-500 truncate">{u.email || '—'} · {u.provider}</p>
              </div>
              <span className="text-xs text-zinc-600 hidden md:block">{new Date(u.created_at).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}</span>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                {isBanned(u) ? (
                  <button
                    onClick={() => unbanUser(u)}
                    title={isVi ? 'Mở khóa tài khoản' : 'Unban account'}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  >
                    <Unlock className="w-3 h-3" /> {isVi ? 'Mở khóa' : 'Unban'}
                  </button>
                ) : (
                  <button
                    onClick={() => { setBanTarget(u); setBanType('days'); setBanDays(7); }}
                    title={isVi ? 'Khóa tài khoản' : 'Ban account'}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                  >
                    <Lock className="w-3 h-3" /> {isVi ? 'Khóa' : 'Ban'}
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

// ── Tracks Tab ────────────────────────────────────────────────────
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
      isVi ? 'Xác nhận xóa' : 'Confirm Delete',
      isVi ? 'Bạn có chắc chắn muốn xóa bài hát này khỏi hệ thống?' : 'Are you sure you want to delete this song from the system?',
      async () => {
        try {
          await axios.delete(`${API}/tracks/${id}`, { headers: authH });
          showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Đã xóa bài hát thành công.' : 'Song deleted successfully.', 'success');
          setTracks(t => t.filter(x => x.id !== id));
        } catch (err: any) {
          showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể xóa bài hát.' : 'Failed to delete song.'), 'error');
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
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Đã cập nhật bài hát thành công.' : 'Song updated successfully.', 'success');
        setEditingTrack(null);
        fetch();
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể cập nhật bài hát.' : 'Failed to update song.'), 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isVi ? "Tìm bài hát..." : "Search songs..."}
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
          {isVi ? 'Bài mới (24h)' : 'New (24h)'}
        </button>

        <span className="text-xs text-zinc-500">{displayedTracks.length} / {tracks.length} {isVi ? 'bài' : 'tracks'}</span>
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
                      {t.category_icon || '🎵'} {t.category_name}
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
                {t.is_public ? (isVi ? 'Công khai' : 'Public') : (isVi ? 'Riêng tư' : 'Private')}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => setEditingTrack({ ...t })}
                  className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                  title={isVi ? "Chỉnh sửa bài hát" : "Edit song"}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => del(t.id)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  title={isVi ? "Xóa bài hát" : "Delete song"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {displayedTracks.length === 0 && (
            <div className="p-8 text-center text-zinc-600 text-sm">
              {isVi ? 'Không tìm thấy bài hát nào.' : 'No tracks found.'}
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
                {isVi ? 'Chỉnh sửa bài hát' : 'Edit Song'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTrack(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Tiêu đề bài hát *' : 'Song Title *'}</label>
                <input
                  type="text"
                  required
                  value={editingTrack.title}
                  onChange={e => setEditingTrack({ ...editingTrack, title: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Nghệ sĩ *' : 'Artist *'}</label>
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
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Danh mục nhạc' : 'Music Category'}</label>
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
                    <option value="">{isVi ? '-- Chọn danh mục --' : '-- Select Category --'}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Thể loại chi tiết' : 'Detailed Genre'}</label>
                  <input
                    type="text"
                    value={editingTrack.genre || ''}
                    onChange={e => setEditingTrack({ ...editingTrack, genre: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Hiển thị' : 'Visibility'}</label>
                  <select
                    value={editingTrack.is_public}
                    onChange={e => setEditingTrack({ ...editingTrack, is_public: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="1">{isVi ? 'Công khai' : 'Public'}</option>
                    <option value="0">{isVi ? 'Riêng tư' : 'Private'}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrack(null)}
                  className="px-4 py-2 border border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
                >{isVi ? 'Hủy' : 'Cancel'}</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl text-xs transition-all"
                >{isVi ? 'Lưu' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Categories Tab ────────────────────────────────────────────────
const PRESET_EMOJIS = [
  { char: '🎵', tags: 'music song note nhạc nốt' },
  { char: '🎶', tags: 'music notes melody nhạc giai điệu' },
  { char: '📻', tags: 'radio lofi đài phát thanh' },
  { char: '🎸', tags: 'guitar rock instrument đàn ghita' },
  { char: '🎹', tags: 'piano classical instrument đàn dương cầm' },
  { char: '🎻', tags: 'violin classical instrument vĩ cầm' },
  { char: '🎷', tags: 'saxophone jazz instrument kèn' },
  { char: '🎺', tags: 'trumpet instrument kèn' },
  { char: '🎤', tags: 'microphone mic sing vocal hát micro' },
  { char: '🎧', tags: 'headphone dj music nghe nhạc tai nghe' },
  { char: '🇻🇳', tags: 'vietnam vpop viet nam cờ việt nam' },
  { char: '🇺🇸', tags: 'usa us uk english cờ mỹ' },
  { char: '🇰🇷', tags: 'korea kpop cờ hàn quốc' },
  { char: '🇯🇵', tags: 'japan jpop cờ nhật bản' },
  { char: '🇬🇧', tags: 'uk britain english cờ anh' },
  { char: '🇨🇳', tags: 'china cpop cờ trung quốc' },
  { char: '⚡', tags: 'electric edm thunder flash điện sét' },
  { char: '🌌', tags: 'synthwave galaxy space space vũ trụ dải ngân hà' },
  { char: '🔥', tags: 'hiphop hot rap fire lửa nhiệt' },
  { char: '💃', tags: 'dance latin girl khiêu vũ nhảy' },
  { char: '🕺', tags: 'dance disco boy khiêu vũ nhảy' },
  { char: '☕', tags: 'coffee acoustic lofi tea cà phê trà' },
  { char: '💤', tags: 'sleep lofi relax ngủ thư giãn' },
  { char: '🌊', tags: 'wave chill ocean biển sóng' },
  { char: '🌴', tags: 'palm summer beach nhiệt đới cây dừa' },
  { char: '🍂', tags: 'autumn sad ballad lá rụng mùa thu buồn' },
  { char: '🎮', tags: 'gaming game chiptune trò chơi' },
  { char: '📼', tags: 'retro tape cassette băng nhạc' },
  { char: '💿', tags: 'cd dvd disc vinyl đĩa nhạc' },
  { char: '🎭', tags: 'theater drama opera classical nghệ thuật kịch' },
  { char: '⭐', tags: 'star favorite ngôi sao' },
  { char: '✨', tags: 'sparkles magic lấp lánh ảo thuật' },
  { char: '❤️', tags: 'love heart tim yêu' },
  { char: '💔', tags: 'broken heart buồn sad chia tay' },
  { char: '🎉', tags: 'party celebrate party lễ hội tiệc' },
  { char: '🔊', tags: 'sound speaker volume loa âm thanh' },
  { char: '🥁', tags: 'drum beats trống gõ' },
  { char: '🎼', tags: 'score stave music khuông nhạc' },
  { char: '📣', tags: 'megaphone announcement loa phát thanh' },
  { char: '🔔', tags: 'bell notification chuông' },
  { char: '🪐', tags: 'saturn space sao thổ vũ trụ' },
  { char: '🌙', tags: 'moon night lofi trăng đêm' },
  { char: '☀️', tags: 'sun bright day mặt trời nắng' },
  { char: '☁️', tags: 'cloud chill mây' },
  { char: '🌧️', tags: 'rain sad ballad mưa buồn' },
  { char: '❄️', tags: 'snow cold winter tuyết lạnh' },
  { char: '🌈', tags: 'rainbow cầu vồng' },
  { char: '🔮', tags: 'crystal magic quả cầu pha lê' },
  { char: '🎈', tags: 'balloon bóng bay' },
  { char: '🧸', tags: 'bear toy lofi gấu bông' },
  { char: '🐱', tags: 'cat meow mèo' },
  { char: '🐶', tags: 'dog woof chó' },
  { char: '🦊', tags: 'fox cáo' },
  { char: '🦄', tags: 'unicorn kỳ lân' },
  { char: '🦁', tags: 'lion sư tử' },
  { char: '🌸', tags: 'flower spring hoa anh đào' },
  { char: '🌹', tags: 'rose flower hoa hồng' },
  { char: '🍀', tags: 'lucky cỏ 4 lá may mắn' },
  { char: '🌵', tags: 'cactus xương rồng' },
  { char: '🌍', tags: 'earth world quả địa cầu' },
  { char: '🚀', tags: 'rocket space bay tên lửa' },
  { char: '🛸', tags: 'ufo alien đĩa bay' },
  { char: '💎', tags: 'diamond kim cương' },
  { char: '👑', tags: 'crown king queen vương miện' },
  { char: '💡', tags: 'idea light bóng đèn ý tưởng' },
  { char: '📚', tags: 'book study sách' },
  { char: '✉️', tags: 'mail letter thư' },
  { char: '🗺️', tags: 'map bản đồ' },
  { char: '🧭', tags: 'compass la bàn' },
  { char: '⏰', tags: 'clock time đồng hồ báo thức' },
  { char: '💰', tags: 'money gold tiền vàng' },
  { char: '🎁', tags: 'gift present quà' },
  { char: '🎨', tags: 'art paint palette bảng màu mỹ thuật' },
  { char: '🎬', tags: 'movie cinema clapperboard điện ảnh phim' },
  { char: '📷', tags: 'camera photo máy ảnh' },
  { char: '🔍', tags: 'search find kính lúp' },
  { char: '🔑', tags: 'key mật mã chìa khóa' },
  { char: '🧁', tags: 'cupcake cake bánh ngọt' },
  { char: '🍭', tags: 'lollipop kẹo mút' },
  { char: '🍎', tags: 'apple táo' },
  { char: '🍉', tags: 'watermelon dưa hấu' },
  { char: '🍓', tags: 'strawberry dâu tây' },
  { char: '🍋', tags: 'lemon chanh' },
  { char: '🍷', tags: 'wine rượu vang' },
  { char: '🍺', tags: 'beer bia' },
  { char: '🍹', tags: 'cocktail nước ngọt' },
  { char: '🍕', tags: 'pizza' },
  { char: '🍟', tags: 'fries khoai tây chiên' },
  { char: '🍔', tags: 'burger bánh mì kẹp' },
  { char: '🛫', tags: 'plane travel máy bay cất cánh' },
  { char: '🚗', tags: 'car xe hơi' },
  { char: '🚲', tags: 'bicycle xe đạp' },
  { char: '⚓', tags: 'anchor mỏ neo' },
  { char: '⛰️', tags: 'mountain núi' },
  { char: '⛺', tags: 'tent camping lều cắm trại' },
  { char: '🏠', tags: 'home house nhà' },
  { char: '🏙️', tags: 'city thành phố' },
  { char: '⛲', tags: 'fountain đài phun nước' },
  { char: '🎢', tags: 'rollercoaster tàu lượn siêu tốc' },
  { char: '🎠', tags: 'carousel ngựa gỗ' },
  { char: '🎡', tags: 'ferris wheel vòng quay' },
  { char: '🎪', tags: 'circus rạp xiếc' },
  { char: '🎟️', tags: 'ticket vé' },
  { char: '🏆', tags: 'trophy cup cúp vô địch' },
  { char: '🎯', tags: 'target bullseye mục tiêu' },
  { char: '🧩', tags: 'puzzle mảnh ghép' },
  { char: '🕶️', tags: 'sunglasses kính mát' }
];

function CategoriesTab({ authH }: any) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [cats, setCats]   = useState<any[]>([]);
  const [form, setForm]   = useState({ name:'', description:'', color:'#7c3aed', icon:'🎵' });
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
    setForm({ name:'', description:'', color:'#7c3aed', icon:'🎵' }); setEditing(null); fetch();
  };
  const { showConfirm, showAlert } = useModalStore();

  const del = async (id: number) => {
    showConfirm(
      isVi ? 'Xác nhận xóa' : 'Confirm Delete',
      isVi ? 'Bạn có chắc chắn muốn xóa danh mục này? Tất cả bài hát trong danh mục sẽ được gán lại.' : 'Are you sure you want to delete this category? All songs in this category will be reassigned.',
      async () => {
        try {
          await axios.delete(`${API}/categories/${id}`, { headers: authH });
          showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Đã xóa danh mục thành công.' : 'Category deleted successfully.', 'success');
          fetch();
        } catch (err: any) {
          showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể xóa danh mục.' : 'Failed to delete category.'), 'error');
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
        <h3 className="text-sm font-bold text-white mb-3">{editing ? (isVi ? 'Chỉnh sửa danh mục' : 'Edit Category') : (isVi ? 'Thêm danh mục mới' : 'Add New Category')}</h3>
        <form onSubmit={save} className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <input
              required
              value={form.icon}
              onChange={e => setForm({ ...form, icon: e.target.value })}
              onClick={() => setShowEmojiPicker(true)}
              placeholder="🎵"
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
                    placeholder={isVi ? "Tìm biểu tượng..." : "Search icon..."}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-zinc-500"
                    autoFocus
                  />
                  <div className="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {filteredEmojis.length === 0 ? (
                      <span className="col-span-5 text-[10px] text-zinc-500 text-center py-4">{isVi ? 'Không tìm thấy' : 'Not found'}</span>
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
          <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder={isVi ? "Tên danh mục" : "Category Name"}
            className="flex-1 min-w-[120px] bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600" />
          <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder={isVi ? "Mô tả..." : "Description..."}
            className="flex-1 min-w-[200px] bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600" />
          <input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})}
            className="w-10 h-9 rounded-lg border border-zinc-800 cursor-pointer bg-zinc-900 p-0.5" />
          <button type="submit" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-lg text-sm">
            {editing ? (isVi ? 'Cập nhật' : 'Update') : (isVi ? 'Thêm' : 'Add')}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({name:'',description:'',color:'#7c3aed',icon:'🎵'}); }}
            className="px-3 py-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-lg text-sm">{isVi ? 'Hủy' : 'Cancel'}</button>}
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
              <p className="text-xs text-zinc-500">{c.track_count} {isVi ? 'bài hát' : 'songs'}</p>
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
  const [loading, setLoading] = useState(true);

  // Play history parameters
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('day');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [historyData, setHistoryData] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [refreshingGeneral, setRefreshingGeneral] = useState(false);

  // Category tracks drilldown
  const [selectedCategoryForTracks, setSelectedCategoryForTracks] = useState<any>(null);
  const [categoryTracks, setCategoryTracks] = useState<any[]>([]);
  const [loadingCategoryTracks, setLoadingCategoryTracks] = useState(false);
  const [categoryTracksLimit, setCategoryTracksLimit] = useState(10);

  useEffect(() => {
    if (!selectedCategoryForTracks) {
      setCategoryTracks([]);
      return;
    }
    setLoadingCategoryTracks(true);
    axios.get(`${API}/stats/category-tracks?categoryId=${selectedCategoryForTracks.id}`, { headers: authH })
      .then(r => {
        if (r.data.success) {
          setCategoryTracks(r.data.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingCategoryTracks(false));
  }, [selectedCategoryForTracks]);

  // Load general stats
  const fetchGeneralStats = (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshingGeneral(true);
    
    axios.get(`${API}/stats`, { headers: authH })
      .then(r => { if (r.data.success) setStats(r.data.data); })
      .finally(() => {
        if (!isSilent) setLoading(false);
        else setRefreshingGeneral(false);
      });
  };

  useEffect(() => {
    fetchGeneralStats();
  }, []);

  // Load play history stats
  const fetchPlayHistory = () => {
    setLoadingHistory(true);
    let url = `${API}/stats/history?view=${viewMode}`;
    if (selectedDate) {
      const cleanDate = selectedDate.includes('T') ? selectedDate.split('T')[0] : (selectedDate.includes(' ') ? selectedDate.split(' ')[0] : selectedDate);
      url += `&date=${cleanDate}`;
    } else {
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
    }

    axios.get(url, { headers: authH })
      .then(r => {
        if (r.data.success) {
          setHistoryData(r.data.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    fetchPlayHistory();
  }, [viewMode, selectedDate, startDate, endDate]);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!stats)  return <p className="text-zinc-500 text-sm">{isVi ? 'Không thể tải thống kê' : 'Failed to load statistics'}</p>;

  const statCards = [
    { label: isVi ? 'Người dùng' : 'Users',   value: stats.totalUsers,     icon: <Users className="w-5 h-5" />,    color: 'from-blue-600 to-blue-500' },
    { label: isVi ? 'Bài hát' : 'Songs',      value: stats.totalTracks,    icon: <Music className="w-5 h-5" />,    color: 'from-purple-600 to-pink-500' },
    { label: isVi ? 'Tổng lượt nghe' : 'Total Plays', value: stats.totalPlays,    icon: <TrendingUp className="w-5 h-5" />,color: 'from-emerald-600 to-green-500' },
    { label: isVi ? 'Yêu thích' : 'Favorites',    value: stats.totalFavorites, icon: <Heart className="w-5 h-5" />,    color: 'from-rose-600 to-pink-500' },
    { label: isVi ? 'Đánh giá' : 'Ratings',     value: stats.totalRatings,   icon: <Star className="w-5 h-5" />,     color: 'from-amber-600 to-yellow-500' },
    { label: isVi ? 'Điểm TB' : 'Avg Rating',      value: `${stats.avgRating}⭐`,icon: <Star className="w-5 h-5" />,    color: 'from-amber-500 to-orange-400' },
  ];

  const maxPlays = Math.max(...(stats.topTracks || []).map((t: any) => t.play_count || 0), 1);

  // Compute max count for custom aggregated chart
  const aggregatedList = historyData?.aggregated || [];
  const maxAggregatedCount = Math.max(...aggregatedList.map((item: any) => item.count || 0), 1);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="rounded-xl border border-white/5 p-4 bg-white/[0.02] flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}>
              {React.cloneElement(s.icon as any, { className: 'w-4 h-4 text-white' })}
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-tight">{s.value}</p>
              <p className="text-[10px] text-zinc-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Play History Time Series & Date Selector Section */}
      <div className="rounded-xl border border-white/5 p-5 bg-white/[0.02] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white">{isVi ? 'Thống kê lượt nghe chi tiết' : 'Detailed Play Statistics'}</h3>
              <p className="text-xs text-zinc-500">{isVi ? 'Phân tích tần suất và số lượt phát nhạc' : 'Analyze play count and frequency'}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode select */}
            <select
              value={viewMode}
              onChange={(e) => {
                setViewMode(e.target.value as any);
                setSelectedDate(''); // reset specific date
              }}
              disabled={!!selectedDate}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="day">{isVi ? 'Theo ngày' : 'By Day'}</option>
              <option value="month">{isVi ? 'Theo tháng' : 'By Month'}</option>
              <option value="year">{isVi ? 'Theo năm' : 'By Year'}</option>
            </select>

            {/* Date range inputs (only when not showing specific date) */}
            {!selectedDate && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onClick={(e) => { try { e.currentTarget.showPicker(); } catch (_) {} }}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  placeholder={isVi ? "Từ ngày" : "Start date"}
                />
                <span className="text-zinc-600 text-xs">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onClick={(e) => { try { e.currentTarget.showPicker(); } catch (_) {} }}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  placeholder={isVi ? "Đến ngày" : "End date"}
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {isVi ? 'Xóa lọc' : 'Clear filter'}
                  </button>
                )}
              </div>
            )}

            {/* Specific Date selector */}
            <div className="flex items-center gap-2 border-l border-white/5 pl-3">
              <span className="text-[11px] text-zinc-400">{isVi ? 'Chọn ngày cụ thể:' : 'Select specific date:'}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                }}
                onClick={(e) => { try { e.currentTarget.showPicker(); } catch (_) {} }}
                className="bg-zinc-900 border border-purple-900/40 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-colors"
                  title={isVi ? "Quay lại thống kê chung" : "Back to general stats"}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chart Content Area */}
        {loadingHistory ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : historyData?.mode === 'specific_date' ? (
          // Specific selected date report view
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-950/10 border border-purple-900/20 p-4 rounded-xl flex flex-col justify-center">
                <p className="text-xs text-purple-300 font-semibold">{isVi ? `Lượt nghe ngày ${formatDateLabel(selectedDate, 'day')}` : `Plays on ${formatDateLabel(selectedDate, 'day')}`}</p>
                <p className="text-3xl font-extrabold text-white mt-1">{formatCount(historyData.totalPlays || 0)} <span className="text-sm font-normal text-zinc-400">{(historyData.totalPlays || 0) === 1 ? (isVi ? 'lượt nghe' : 'play') : (isVi ? 'lượt nghe' : 'plays')}</span></p>
              </div>

              {/* Hourly Stats Chart */}
              <div className="col-span-2 bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" /> {isVi ? 'Phân bố lượt nghe theo giờ' : 'Hourly Play Distribution'}
                </h4>
                {historyData.hourlyStats?.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">{isVi ? 'Không có dữ liệu lượt nghe cho ngày này.' : 'No play data for this day.'}</p>
                ) : (
                  <div className="flex items-end justify-between h-28 pt-2 px-2 gap-1 overflow-x-auto">
                    {Array.from({ length: 24 }).map((_, hourNum) => {
                      const hrStr = String(hourNum).padStart(2, '0');
                      const match = historyData.hourlyStats.find((h: any) => h.hour === hrStr);
                      const count = match ? match.count : 0;
                      const maxHourCount = Math.max(...historyData.hourlyStats.map((h: any) => h.count), 1);
                      const pct = (count / maxHourCount) * 100;
                      return (
                         <div key={hrStr} className="flex-1 flex flex-col items-center group">
                          <div className="w-full relative flex justify-center h-20 items-end">
                            <div
                              style={{ height: `${pct}%` }}
                              className="w-full max-w-[14px] bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-sm group-hover:from-purple-500 group-hover:to-pink-400 transition-all duration-300"
                              title={`${hourNum}h: ${formatPlaysShort(count, isVi)}`}
                            />
                            <span className="absolute -top-5 bg-zinc-950 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              {formatPlaysShort(count, isVi)}
                            </span>
                          </div>
                          <span className="text-[9px] text-zinc-500 mt-1.5">{hrStr}h</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Top Tracks for the day */}
              <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-white mb-3">{isVi ? 'Top bài hát nghe nhiều nhất trong ngày' : 'Top played songs of the day'}</h4>
                {historyData.topTracks?.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">{isVi ? 'Không có dữ liệu bài hát.' : 'No song data.'}</p>
                ) : (
                  <div className="space-y-2.5">
                    {historyData.topTracks.map((t: any, i: number) => (
                      <div key={t.id} className="flex items-center justify-between gap-3 text-xs p-1.5 rounded-lg hover:bg-white/[0.02] transition-all">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-zinc-500 w-4 font-semibold">{i+1}</span>
                          <img src={t.cover_url} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-zinc-200 font-bold truncate">{t.title}</p>
                            <p className="text-zinc-500 text-[10px] truncate">{t.artist}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">{formatPlaysShort(t.plays || 0, isVi)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed logs for the day */}
              <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-white mb-3">{isVi ? 'Nhật ký phát nhạc trong ngày' : 'Play log of the day'}</h4>
                <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {historyData.playsList?.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-6 text-center">{isVi ? 'Chưa phát bài nào.' : 'No songs played yet.'}</p>
                  ) : (
                    historyData.playsList.map((p: any, i: number) => {
                      const timeStr = p.played_at ? p.played_at.split(' ')[1]?.slice(0, 5) || '--:--' : '--:--';
                      return (
                        <div key={i} className="flex items-center justify-between gap-2 text-[11px] p-2 rounded-lg bg-zinc-950/30 hover:bg-zinc-900/30 transition-all border border-white/[0.01]">
                          <span className="text-zinc-500 font-medium flex-shrink-0">{timeStr}</span>
                          <span className="text-zinc-300 truncate flex-1 pl-1">
                            <span className="text-zinc-400 font-semibold">{p.user_name || (isVi ? 'Khách' : 'Guest')}</span> {isVi ? 'đã nghe' : 'listened to'} <span className="text-purple-300 font-bold">{p.title}</span> - {p.artist}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Aggregated statistics chart view (Day / Month / Year)
          <div className="space-y-4">
            {aggregatedList.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xs text-zinc-500">{isVi ? 'Không có dữ liệu thống kê trong khoảng thời gian này.' : 'No statistics data for this period.'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">{isVi ? 'Bấm vào các cột ngày để xem chi tiết danh sách phát của ngày đó.' : 'Click on date columns to see details.'}</p>
                <div className="flex items-end justify-between h-44 pt-4 px-2 gap-2 overflow-x-auto min-w-max">
                  {aggregatedList.map((item: any) => {
                    const pct = (item.count / maxAggregatedCount) * 100;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          // If viewMode is day, allow drilling down into specific date
                          if (viewMode === 'day') {
                            const cleanDate = item.label.includes('T') ? item.label.split('T')[0] : (item.label.includes(' ') ? item.label.split(' ')[0] : item.label);
                            setSelectedDate(cleanDate);
                          }
                        }}
                        className={`flex-1 flex flex-col items-center group focus:outline-none transition-all ${
                          viewMode === 'day' ? 'cursor-pointer hover:scale-[1.03]' : 'cursor-default'
                        }`}
                      >
                        <div className="w-full relative flex justify-center h-32 items-end">
                          <div
                            style={{ height: `${pct}%` }}
                            className="w-full max-w-[20px] bg-gradient-to-t from-purple-600 to-pink-500 rounded-t group-hover:from-purple-500 group-hover:to-pink-400 transition-all duration-300 shadow-lg shadow-purple-950/40"
                          />
                          <span className="absolute -top-6 bg-zinc-950 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {formatPlaysShort(item.count || 0, isVi)}
                          </span>
                        </div>
                        <span className="text-[10px] text-purple-400 mt-2 font-bold whitespace-nowrap">{formatDateLabel(item.label, viewMode)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top tracks */}
        <div className="rounded-xl border border-white/5 p-4 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" /> {isVi ? 'Top bài nghe nhiều nhất' : 'Top Played Songs'}
            </h3>
            <button 
              onClick={() => fetchGeneralStats(true)} 
              className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all"
              title={isVi ? "Làm mới" : "Refresh"}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingGeneral ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="space-y-3">
            {(stats.topTracks || []).slice(0,7).map((t: any, i: number) => (
              <div key={t.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300 truncate max-w-[180px]">
                    <span className="text-zinc-600 mr-1">{i+1}.</span>{t.title}
                  </span>
                  <span className="text-xs text-zinc-500 flex-shrink-0">{t.play_count}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-700"
                    style={{ width: `${((t.play_count||0)/maxPlays)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Genre stats */}
        <div className="rounded-xl border border-white/5 p-4 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-amber-400" /> {isVi ? 'Thống kê theo danh mục' : 'Category Statistics'}
            </h3>
            <button 
              onClick={() => fetchGeneralStats(true)} 
              className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all"
              title={isVi ? "Làm mới" : "Refresh"}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingGeneral ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {(stats.genreStats || []).map((g: any) => (
              <div 
                key={g.genre} 
                onClick={() => {
                  setSelectedCategoryForTracks({
                    id: g.categoryId || 'null',
                    name: g.genre,
                    color: g.color,
                    count: g.count,
                    plays: g.plays
                  });
                  setCategoryTracksLimit(10);
                }}
                className="flex items-center justify-between p-1 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: g.color || '#7c3aed' }} 
                  />
                  <span className="text-xs text-zinc-300 font-medium">{g.genre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">{g.count} {isVi ? 'bài' : 'songs'}</span>
                  <span className="text-xs text-zinc-600">·</span>
                  <span className="text-xs text-amber-400 font-semibold">{formatPlaysShort(g.plays || 0, isVi)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-white/5 p-4 bg-white/[0.02]">
        <h3 className="text-sm font-bold text-white mb-3">{isVi ? 'Hoạt động gần đây' : 'Recent Activity'}</h3>
        <div className="space-y-2">
          {(stats.recentActivity || []).slice(0,8).map((a: any, i: number) => {
              // played_at is already stored as Vietnam time (UTC+7), parse as local
              const raw = a.played_at?.replace(' ', 'T') ?? '';
              const d = raw ? new Date(raw) : null;
              const timeLabel = d && !isNaN(d.getTime())
                ? d.toLocaleString(isVi ? 'vi-VN' : 'en-US', {
                    day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                    hour12: false
                  })
                : '--:--';
              return (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-zinc-600 flex-shrink-0 min-w-[100px]">{timeLabel}</span>
                  <span className="text-zinc-400 truncate">
                    <span className="text-purple-400">{a.user_name || (isVi ? 'Khách' : 'Guest')}</span> {isVi ? 'nghe' : 'listened to'} <span className="text-zinc-200">{a.title}</span> - {a.artist}
                  </span>
                </div>
              );
            })}
          {(stats.recentActivity||[]).length === 0 && <p className="text-xs text-zinc-600">{isVi ? 'Chưa có hoạt động nào' : 'No activity yet'}</p>}
        </div>
      </div>

      {/* Category Tracks Drilldown Modal */}
      {selectedCategoryForTracks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse"
                  style={{ backgroundColor: selectedCategoryForTracks.color || '#7c3aed' }} 
                />
                <h3 className="text-sm font-bold text-white">
                  {isVi ? `Danh mục: ${selectedCategoryForTracks.name}` : `Category: ${selectedCategoryForTracks.name}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCategoryForTracks(null)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              <div className="flex items-center justify-between text-xs text-zinc-400 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                <span>{isVi ? `Số lượng bài hát: ` : `Number of songs: `}<strong className="text-white">{selectedCategoryForTracks.count} {isVi ? 'bài' : 'songs'}</strong></span>
                <span>{isVi ? `Tổng lượt nghe: ` : `Total plays: `}<strong className="text-amber-400">{formatPlaysShort(selectedCategoryForTracks.plays || 0, isVi)}</strong></span>
              </div>

              {loadingCategoryTracks ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : categoryTracks.length === 0 ? (
                <p className="text-xs text-zinc-500 py-8 text-center italic">{isVi ? 'Không có bài hát nào trong danh mục này.' : 'No songs in this category.'}</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">{isVi ? 'Danh sách bài hát (Xắp xếp theo lượt nghe)' : 'Song list (Sorted by play count)'}</p>
                  {categoryTracks.slice(0, categoryTracksLimit).map((track: any, index: number) => (
                    <div key={track.id} className="flex items-center justify-between gap-3 text-xs p-2 rounded-lg bg-zinc-900/40 hover:bg-zinc-850 border border-white/5 transition-all">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-zinc-500 w-4 font-semibold text-center">{index + 1}</span>
                        <img src={track.cover_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-zinc-200 font-bold truncate">{track.title}</p>
                          <p className="text-zinc-500 text-[10px] truncate">{track.artist}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                        {formatPlaysShort(track.plays || 0, isVi)}
                      </span>
                    </div>
                  ))}

                  {categoryTracks.length > categoryTracksLimit && (
                    <button
                      onClick={() => setCategoryTracksLimit(prev => prev + 10)}
                      className="w-full py-2 mt-2 text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/5 hover:bg-purple-500/10 rounded-lg transition-all border border-purple-500/10"
                    >
                      {isVi ? `Xem thêm (Còn ${categoryTracks.length - categoryTracksLimit} bài)` : `Load more (${categoryTracks.length - categoryTracksLimit} songs left)`}
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 bg-white/[0.01] border-t border-white/5 flex justify-end">
              <button
                onClick={() => setSelectedCategoryForTracks(null)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                {isVi ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Artists Tab ───────────────────────────────────────────────────
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
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Có lỗi xảy ra khi thêm nghệ sĩ' : 'An error occurred while adding the artist'), 'error');
    }
  };

  const { showConfirm, showAlert } = useModalStore();

  const del = async (id: number) => {
    showConfirm(
      isVi ? 'Xác nhận xóa' : 'Confirm Delete',
      isVi ? 'Bạn có chắc chắn muốn xóa nghệ sĩ tiêu biểu này?' : 'Are you sure you want to delete this featured artist?',
      async () => {
        try {
          await axios.delete(`${API}/artists/${id}`, { headers: authH });
          showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Đã xóa nghệ sĩ thành công.' : 'Artist deleted successfully.', 'success');
          fetchArtists();
          window.dispatchEvent(new CustomEvent('reload-artists'));
        } catch (err: any) {
          showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể xóa nghệ sĩ.' : 'Failed to delete artist.'), 'error');
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Form thêm nghệ sĩ */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-purple-400" /> {isVi ? 'Thêm nghệ sĩ tiêu biểu mới' : 'Add New Featured Artist'}
        </h3>
        
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Tên nghệ sĩ' : 'Artist Name'}</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={isVi ? "Ví dụ: The Weeknd" : "E.g., The Weeknd"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Thể loại' : 'Genre'}</label>
              <input required value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })}
                placeholder={isVi ? "Ví dụ: R&B / Synthwave / Pop" : "E.g., R&B / Synthwave / Pop"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Lượt nghe hàng tháng' : 'Monthly Listeners'}</label>
              <input required value={form.listeners} onChange={e => setForm({ ...form, listeners: e.target.value })}
                placeholder={isVi ? "Ví dụ: 115.4M" : "E.g., 115.4M"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Bài hát nổi bật' : 'Popular Track'}</label>
              <input required value={form.popular_track} onChange={e => setForm({ ...form, popular_track: e.target.value })}
                placeholder={isVi ? "Ví dụ: Blinding Lights" : "E.g., Blinding Lights"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Mô tả tiểu sử' : 'Bio description'}</label>
            <textarea required rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder={isVi ? "Thông tin giới thiệu chi tiết về cuộc đời, sự nghiệp của ca sĩ..." : "Detailed introduction about the singer's life, career..."}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700 resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Ảnh chân dung nghệ sĩ (Upload file)' : 'Artist portrait photo (Upload file)'}</label>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Hoặc dán URL ảnh' : 'Or paste image URL'}</label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} disabled={!!file}
                placeholder="http://example.com/image.png"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700 disabled:opacity-40" />
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
            {isVi ? 'Thêm nghệ sĩ' : 'Add Artist'}
          </button>
        </form>
      </div>

      {/* Danh sách nghệ sĩ */}
      <div className="rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-zinc-300">{isVi ? 'Danh sách nghệ sĩ tiêu biểu hiện có' : 'Featured Artist List'}</h3>
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
                  <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">{artist.listeners} {isVi ? 'lượt nghe/tháng' : 'listeners/month'}</span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5"><span className="text-zinc-500">{isVi ? 'Thể loại:' : 'Genre:'}</span> {artist.genre} · <span className="text-zinc-500">{isVi ? 'Bài hát nổi bật:' : 'Popular track:'}</span> {artist.popular_track}</p>
                <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1">{artist.bio}</p>
              </div>
              <button onClick={() => del(artist.id)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {artists.length === 0 && !loading && (
            <div className="p-8 text-center text-zinc-600 text-sm">{isVi ? 'Chưa có nghệ sĩ nào. Vui lòng thêm bằng biểu mẫu trên.' : 'No artists yet. Please add using the form above.'}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Albums Tab ───────────────────────────────────────────────────
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
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Có lỗi xảy ra khi lưu album' : 'An error occurred while saving the album'), 'error');
    }
  };

  const { showConfirm, showAlert } = useModalStore();

  const del = async (id: number) => {
    showConfirm(
      isVi ? 'Xác nhận xóa' : 'Confirm Delete',
      isVi ? 'Bạn có chắc chắn muốn xóa album này? Các bài hát trong album sẽ không bị xóa nhưng sẽ không còn thuộc album này.' : 'Are you sure you want to delete this album? Songs in this album will not be deleted but will no longer belong to this album.',
      async () => {
        try {
          await axios.delete(`${API}/albums/${id}`, { headers: authH });
          showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Đã xóa album thành công.' : 'Album deleted successfully.', 'success');
          fetchAlbums();
          window.dispatchEvent(new CustomEvent('reload-settings'));
        } catch (err: any) {
          showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể xóa album.' : 'Failed to delete album.'), 'error');
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
      {/* Form thêm/sửa album */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          {editing ? <Edit2 className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-purple-400" />}
          {editing ? (isVi ? 'Chỉnh sửa album' : 'Edit Album') : (isVi ? 'Tạo album mới' : 'Create New Album')}
        </h3>
        
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Tên album' : 'Album Name'}</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={isVi ? "Ví dụ: Starboy" : "E.g., Starboy"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Tên ca sĩ' : 'Artist Name'}</label>
              <input required value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })}
                placeholder={isVi ? "Ví dụ: The Weeknd" : "E.g., The Weeknd"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Mô tả album' : 'Album Description'}</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder={isVi ? "Thông tin giới thiệu ngắn về album..." : "Short introduction about the album..."}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700 resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Ảnh bìa Album (Upload file)' : 'Album Cover Photo (Upload file)'}</label>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Hoặc dán URL ảnh bìa' : 'Or paste cover URL'}</label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} disabled={!!file}
                placeholder="http://example.com/cover.png"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700 disabled:opacity-40" />
            </div>
          </div>

          {/* Chọn bài hát vào album */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? `Danh sách bài hát thuộc album (${form.trackIds.length})` : `Song list belonging to the album (${form.trackIds.length})`}</label>
              <input
                type="text"
                value={trackSearch}
                onChange={e => setTrackSearch(e.target.value)}
                placeholder={isVi ? "Tìm bài hát..." : "Search song..."}
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
                <div className="col-span-full py-6 text-center text-zinc-600 text-xs">{isVi ? 'Không tìm thấy bài hát nào' : 'No songs found'}</div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
              {editing ? (isVi ? 'Cập nhật Album' : 'Update Album') : (isVi ? 'Tạo Album' : 'Create Album')}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-sm transition-all">
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Danh sách album */}
      <div className="rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-zinc-300">{isVi ? 'Danh sách album hiện có' : 'Existing Albums'}</h3>
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
                  <span className="text-xs text-zinc-500">{isVi ? `bởi ${album.artist}` : `by ${album.artist}`}</span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5"><span className="text-zinc-500">{isVi ? 'Mô tả:' : 'Description:'}</span> {album.description || (isVi ? 'Không có mô tả' : 'No description')} · <span className="text-zinc-500">{isVi ? 'Bài hát:' : 'Songs:'}</span> {album.tracks?.length || 0} {isVi ? 'bài' : 'songs'}</p>
                {album.tracks && album.tracks.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {album.tracks.slice(0, 5).map((t: any) => (
                      <span key={t.id} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md truncate max-w-[120px]" title={t.title}>
                        {t.title}
                      </span>
                    ))}
                    {album.tracks.length > 5 && (
                      <span className="text-[10px] text-zinc-500 px-1 py-0.5">+{album.tracks.length - 5} {isVi ? 'bài khác' : 'other songs'}</span>
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
            <div className="p-8 text-center text-zinc-600 text-sm">{isVi ? 'Chưa có album nào. Vui lòng thêm bằng biểu mẫu trên.' : 'No albums yet. Please add using the form above.'}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────
function SettingsTab({ authH }: any) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [background, setBackground] = useState('');
  const [bannerSlides, setBannerSlides] = useState<any[]>([]);
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
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi tải cấu hình.' : 'Failed to load configuration.'), 'error');
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
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Cập nhật hình nền thành công!' : 'Backdrop updated successfully!', 'success');
        window.dispatchEvent(new CustomEvent('reload-settings'));
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi cập nhật hình nền.' : 'Failed to update backdrop.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBannerSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideFile && !slideUrl.trim()) {
      showAlert(isVi ? 'Chú ý' : 'Warning', isVi ? 'Vui lòng tải lên tệp ảnh hoặc điền link ảnh.' : 'Please upload an image file or enter an image URL.', 'warning');
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
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Thêm ảnh banner thành công!' : 'Banner image added successfully!', 'success');
        window.dispatchEvent(new CustomEvent('reload-settings'));
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi thêm banner.' : 'Failed to add banner image.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBannerSlide = async (id: number) => {
    showConfirm(
      isVi ? 'Xác nhận xóa' : 'Confirm Delete',
      isVi ? 'Bạn có chắc chắn muốn xóa ảnh banner này?' : 'Are you sure you want to delete this banner image?',
      async () => {
        setLoading(true);
        try {
          const res = await axios.delete(`${API}/settings/banner-slides/${id}`, { headers: authH });
          if (res.data.success) {
            setBannerSlides(bannerSlides.filter(s => s.id !== id));
            showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Xóa ảnh banner thành công!' : 'Banner image deleted successfully!', 'success');
            window.dispatchEvent(new CustomEvent('reload-settings'));
          }
        } catch (err: any) {
          showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi xóa banner.' : 'Failed to delete banner image.'), 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Background Section */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          🖼️ {isVi ? 'Cấu hình hình nền ca sĩ (Backdrop Background)' : 'Artist Backdrop Configuration'}
        </h3>
        <p className="text-xs text-zinc-500">
          {isVi ? 'Hình nền hiển thị mờ ảo phía sau giao diện nghe nhạc. Mặc định là ảnh ca sĩ The Weeknd.' : 'The backdrop displayed blurred behind the music player. Default is The Weeknd.'}
        </p>

        {background && (
          <div className="relative w-full max-w-sm aspect-[21/9] rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
            <img src={background} alt="Current backdrop" className="w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
            <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-zinc-400">
              {isVi ? 'Đang hiển thị' : 'Currently Displaying'}
            </span>
          </div>
        )}

        <form onSubmit={handleUpdateBackground} className="space-y-3 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Tải file ảnh lên' : 'Upload image file'}</label>
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
              <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Hoặc đường dẫn ảnh (URL)' : 'Or image URL'}</label>
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
            {isVi ? 'Lưu hình nền mới' : 'Save New Backdrop'}
          </button>
        </form>
      </div>

      {/* Banner Section */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            🎞️ {isVi ? 'Quản lý hình ảnh Banner Slideshow' : 'Banner Slideshow Management'}
          </h3>
          <p className="text-xs text-zinc-500">
            {isVi ? 'Thêm, xem danh sách và xóa các ảnh trình chiếu trên banner chào mừng "Xin chào, Dũ!".' : 'Add, view, and delete images on the welcoming slide banner "Hello, Du!".'}
          </p>
        </div>

        {/* Add Banner Form */}
        <form onSubmit={handleAddBannerSlide} className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 space-y-3 max-w-xl">
          <h4 className="text-xs font-bold text-zinc-300">{isVi ? 'Thêm ảnh banner mới' : 'Add New Banner Image'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Tải file ảnh lên' : 'Upload image file'}</label>
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
              <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Hoặc đường dẫn ảnh (URL)' : 'Or image URL'}</label>
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
            {isVi ? 'Thêm vào slideshow' : 'Add to Slideshow'}
          </button>
        </form>

        {/* Banner List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-zinc-300">{isVi ? `Danh sách ảnh banner hiện tại (${bannerSlides.length})` : `Current banner image list (${bannerSlides.length})`}</h4>
          {bannerSlides.length === 0 ? (
            <p className="text-xs text-zinc-600">{isVi ? 'Chưa có ảnh banner nào. Hệ thống sẽ hiển thị các slide mặc định.' : 'No banner images yet. Default slides will be shown.'}</p>
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
