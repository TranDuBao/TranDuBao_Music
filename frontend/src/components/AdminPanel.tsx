import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { Shield, Users, Music, FolderOpen, BarChart2, Trash2, Crown, UserIcon, RefreshCw, Plus, Edit2, Star, Heart, TrendingUp, Lock, Unlock, Disc, Calendar, Clock, GripVertical, Globe, Activity, Eye } from 'lucide-react';
import axios from 'axios';
import { useModalStore } from '../store/useModalStore';
import ImageUploadWithCrop from './ImageUploadWithCrop';
import { formatCount, formatPlays, formatPlaysShort, formatDateLabel } from '../utils/format';
import { API_BASE, getAbsoluteUrl } from '../config';
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
                  {u.avatar_url ? <img src={getAbsoluteUrl(u.avatar_url)} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-zinc-400">{u.name.charAt(0).toUpperCase()}</span>}
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
              <img src={getAbsoluteUrl(t.cover_url) || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-lg object-cover" />
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

  const { showConfirm, showAlert } = useModalStore();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API}/categories/${editing}`, form, { headers: authH });
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Cập nhật danh mục thành công!' : 'Category updated successfully!', 'success');
      } else {
        await axios.post(`${API}/categories`, form, { headers: authH });
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Thêm danh mục mới thành công!' : 'Category created successfully!', 'success');
      }
      setForm({ name:'', description:'', color:'#7c3aed', icon:'🎵' });
      setEditing(null);
      fetch();
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Có lỗi xảy ra khi lưu danh mục' : 'An error occurred while saving the category'), 'error');
    }
  };

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
// ── Stats Tab ─────────────────────────────────────────────────────
function StatsTab({ authH }: any) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryTracks, setCategoryTracks] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(false);

  // Plays history state
  const [historyView, setHistoryView] = useState<'day' | 'month' | 'year'>('day');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [historyDetails, setHistoryDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Custom date filter state
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Website visits state
  const [visitsView, setVisitsView] = useState<'day' | 'month'>('day');
  const [visitsData, setVisitsData] = useState<any[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(false);

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

  const fetchHistoryStats = async (view: 'day' | 'month' | 'year', start?: string, end?: string) => {
    setHistoryLoading(true);
    try {
      let url = `${API}/stats/history?view=${view}`;
      if (start && end) {
        url += `&startDate=${start}&endDate=${end}`;
      }
      const { data } = await axios.get(url, { headers: authH });
      if (data.success) {
        setHistoryData(data.data.aggregated || []);
        // Reset details when view changes
        setSelectedPeriod(null);
        setHistoryDetails(null);
      }
    } catch (err) {
      console.error('History stats error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchVisitsStats = async (view: 'day' | 'month') => {
    setVisitsLoading(true);
    try {
      const { data } = await axios.get(`${API}/stats/visits?view=${view}`, { headers: authH });
      if (data.success) {
        setVisitsData(data.data || []);
      }
    } catch (err) {
      console.error('Visits stats error:', err);
    } finally {
      setVisitsLoading(false);
    }
  };

  const fetchPeriodDetails = async (periodLabel: string) => {
    setSelectedPeriod(periodLabel);
    setDetailsLoading(true);
    try {
      const { data } = await axios.get(`${API}/stats/history?date=${periodLabel}`, { headers: authH });
      if (data.success) {
        setHistoryDetails(data.data);
      }
    } catch (err) {
      console.error('Period details error:', err);
      setHistoryDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleClearFilter = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    fetchHistoryStats(historyView);
  };

  const refreshAll = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    fetchStats();
    fetchHistoryStats(historyView);
    fetchVisitsStats(visitsView);
    setSelectedPeriod(null);
    setHistoryDetails(null);
  };

  useEffect(() => {
    fetchStats();
    fetchHistoryStats(historyView);
    fetchVisitsStats(visitsView);
  }, []);

  const handleHistoryViewChange = (view: 'day' | 'month' | 'year') => {
    setHistoryView(view);
    setCustomStartDate('');
    setCustomEndDate('');
    fetchHistoryStats(view);
  };

  const handleVisitsViewChange = (view: 'day' | 'month') => {
    setVisitsView(view);
    fetchVisitsStats(view);
  };

  const fetchCategoryTracks = async (cat: any) => {
    setSelectedCategory(cat);
    setCatLoading(true);
    try {
      const catId = cat.categoryId ?? 'null';
      const { data } = await axios.get(`${API}/stats/category-tracks?categoryId=${catId}`, { headers: authH });
      if (data.success) setCategoryTracks(data.data);
    } catch { setCategoryTracks([]); }
    finally { setCatLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!stats) return (
    <div className="text-center py-20 space-y-3">
      <p className="text-zinc-500 text-sm">{isVi ? 'Không thể tải thống kê.' : 'Could not load statistics.'}</p>
      <button onClick={refreshAll} className="text-amber-400 hover:text-amber-300 text-xs underline">
        {isVi ? 'Thử lại' : 'Retry'}
      </button>
    </div>
  );

  // Plays history chart math
  const maxHistory = Math.max(1, ...historyData.map((d: any) => Number(d.count)));

  // Visitor stats math
  const maxVisitsVal = Math.max(1, ...visitsData.map((v: any) => Math.max(Number(v.unique_visitors), Number(v.total_visits))));
  const totalVisitsCount = visitsData.reduce((acc, curr) => acc + Number(curr.total_visits), 0);
  const totalUniqueVisitors = visitsData.reduce((acc, curr) => acc + Number(curr.unique_visitors), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-amber-400 animate-pulse" />
          {isVi ? 'Thống kê hệ thống' : 'System Statistics'}
        </h3>
        <button onClick={refreshAll} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/5 transition-all">
          <RefreshCw className="w-3.5 h-3.5" />
          {isVi ? 'Làm mới' : 'Refresh'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { label: isVi ? 'Người dùng' : 'Users', value: stats.totalUsers ?? 0, icon: '👤', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.05)]' },
          { label: isVi ? 'Bài hát' : 'Tracks', value: stats.totalTracks ?? 0, icon: '🎵', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20 shadow-[0_4px_20px_rgba(168,85,247,0.05)]' },
          { label: isVi ? 'Lượt nghe' : 'Total Plays', value: formatCount(Number(stats.totalPlays ?? 0)), icon: '▶️', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.05)]' },
          { label: isVi ? 'Yêu thích' : 'Favorites', value: stats.totalFavorites ?? 0, icon: '❤️', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20 shadow-[0_4px_20px_rgba(244,63,94,0.05)]' },
        ] as const).map(card => (
          <div key={card.label} className={`rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02] ${card.bg}`}>
            <div className="text-2xl mb-1">{card.icon}</div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Plays History Section */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col gap-4 mb-5 border-b border-white/5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                {isVi ? 'Biểu đồ hoạt động nghe nhạc' : 'Music Streaming Activities'}
              </h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {isVi ? 'Bấm vào cột mốc để xem báo cáo chi tiết hoặc chọn lọc ngày tùy ý' : 'Click on any bar to drill down or filter by custom dates'}
              </p>
            </div>
            <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-white/5 self-start sm:self-auto">
              {(['day', 'month', 'year'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => handleHistoryViewChange(v)}
                  className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all ${
                    historyView === v
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {v === 'day' ? (isVi ? 'Ngày' : 'Day') : v === 'month' ? (isVi ? 'Tháng' : 'Month') : (isVi ? 'Năm' : 'Year')}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Picker Inputs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 text-xs">
            <span className="text-zinc-400 text-[10px] font-semibold">{isVi ? 'Lọc theo ngày tự chọn:' : 'Custom date filter:'}</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-zinc-950 border border-white/10 rounded px-2.5 py-1.5 text-white text-xs sm:text-[10px] focus:outline-none focus:border-indigo-500/50"
              />
              <span className="text-zinc-600 text-[10px]">—</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-zinc-950 border border-white/10 rounded px-2.5 py-1.5 text-white text-xs sm:text-[10px] focus:outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={() => fetchHistoryStats(historyView, customStartDate, customEndDate)}
                disabled={!customStartDate || !customEndDate}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-[10px] font-bold px-3 py-1.5 sm:py-1 rounded transition-all cursor-pointer"
              >
                {isVi ? 'Lọc' : 'Filter'}
              </button>
              {(customStartDate || customEndDate) && (
                <button
                  onClick={handleClearFilter}
                  className="text-zinc-400 hover:text-white text-xs sm:text-[10px] underline px-1 py-1 cursor-pointer"
                >
                  {isVi ? 'Xóa lọc' : 'Clear'}
                </button>
              )}
            </div>
          </div>
        </div>

        {historyLoading ? (
          <div className="h-36 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : historyData.length > 0 ? (
          <div className="relative h-44 flex flex-col justify-end">
            {/* Gridlines */}
            <div className="absolute inset-x-0 bottom-6 top-2 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="w-full border-t border-dashed border-white/40" />
              <div className="w-full border-t border-dashed border-white/40" />
              <div className="w-full border-t border-dashed border-white/40" />
            </div>

            <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              <div className="min-w-[600px] sm:min-w-0 flex items-end gap-2.5 h-36 z-10">
                {historyData.map((d: any, i: number) => {
                  const cnt = Number(d.count);
                  const pct = Math.max(5, Math.round((cnt / maxHistory) * 100));
                  const label = formatDateLabel(String(d.label || ''), historyView);
                  const isSelected = selectedPeriod === d.label;

                  return (
                    <div
                      key={i}
                      onClick={() => fetchPeriodDetails(d.label)}
                      className="flex-1 h-full flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <span className={`text-[9px] font-bold transition-all duration-300 ${
                        isSelected ? 'text-indigo-400 scale-110' : 'text-zinc-400 opacity-0 group-hover:opacity-100'
                      }`}>
                        {cnt}
                      </span>
                      <div className="w-full flex-1 flex items-end justify-center">
                        <div
                          className={`w-3 md:w-4 rounded-t-md transition-all duration-300 bg-gradient-to-t ${
                            isSelected
                              ? 'from-indigo-400 to-fuchsia-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-indigo-300/20'
                              : 'from-indigo-600 to-violet-500 group-hover:from-indigo-500 group-hover:to-violet-400 hover:shadow-[0_0_12px_rgba(99,102,241,0.5)] border border-transparent'
                          }`}
                          style={{ height: `${pct}%` }}
                          title={`${label}: ${cnt} ${isVi ? 'lượt nghe' : 'plays'}`}
                        />
                      </div>
                      <span className={`text-[9px] truncate w-full text-center transition-colors ${
                        isSelected ? 'text-indigo-400 font-bold' : 'text-zinc-500 group-hover:text-zinc-300'
                      }`}>
                        {label.length > 7 ? label.slice(0, 5) : label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-36 flex items-center justify-center text-zinc-600 text-sm">
            {isVi ? 'Chưa có dữ liệu lượt nghe.' : 'No play data yet.'}
          </div>
        )}
      </div>

      {/* Plays Drill-down Details Card */}
      {selectedPeriod && (
        <div className="bg-zinc-900/60 border border-violet-500/20 rounded-xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md transition-all duration-300 animate-fadeIn">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-pink-400 animate-pulse" />
              <h4 className="text-sm font-bold text-white">
                {isVi ? 'Chi tiết hoạt động: ' : 'Activity Details: '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-300">
                  {formatDateLabel(selectedPeriod, historyView)}
                </span>
              </h4>
            </div>
            <button
              onClick={() => { setSelectedPeriod(null); setHistoryDetails(null); }}
              className="text-zinc-500 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
            >
              ✕ {isVi ? 'Đóng' : 'Close'}
            </button>
          </div>

          {detailsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : historyDetails ? (
            <div className="space-y-6">
              {/* Top details cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total plays */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 font-bold">
                    ▶
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">{isVi ? 'Tổng lượt nghe' : 'Total Plays'}</p>
                    <p className="text-lg font-bold text-white">{historyDetails.totalPlays ?? 0}</p>
                  </div>
                </div>

                {/* Date range descriptor */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                    📅
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">{isVi ? 'Thời gian' : 'Period'}</p>
                    <p className="text-sm font-bold text-white capitalize">
                      {historyView === 'day' ? (isVi ? 'Ngày đơn lẻ' : 'Single Day') : historyView === 'month' ? (isVi ? 'Toàn bộ tháng' : 'Entire Month') : (isVi ? 'Toàn bộ năm' : 'Entire Year')}
                    </p>
                  </div>
                </div>

                {/* Unique played tracks count */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold">
                    🎵
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">{isVi ? 'Số bài hát phát sinh' : 'Unique Tracks Played'}</p>
                    <p className="text-lg font-bold text-white">{(historyDetails.topTracks || []).length}</p>
                  </div>
                </div>
              </div>

              {/* Detail graphs & tables grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Distribution chart */}
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-zinc-300 mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
                    {historyDetails.distributionLabel === 'hour'
                      ? (isVi ? 'Biểu đồ phân bổ theo giờ' : 'Hourly Distribution')
                      : historyDetails.distributionLabel === 'day'
                        ? (isVi ? 'Biểu đồ phân bổ theo ngày' : 'Daily Distribution')
                        : (isVi ? 'Biểu đồ phân bổ theo tháng' : 'Monthly Distribution')}
                  </h5>
                  {historyDetails.distributionStats && historyDetails.distributionStats.length > 0 ? (
                    <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      <div className="min-w-[480px] sm:min-w-0 flex items-end gap-1.5 h-32 pt-4">
                        {(() => {
                          const maxDist = Math.max(1, ...historyDetails.distributionStats.map((x: any) => Number(x.count)));
                          return historyDetails.distributionStats.map((item: any, idx: number) => {
                            const distPct = Math.max(6, Math.round((Number(item.count) / maxDist) * 100));
                            let label = item.period;
                            if (historyDetails.distributionLabel === 'hour') label = `${item.period}h`;
                            else if (historyDetails.distributionLabel === 'day') label = label.slice(8, 10) + '/' + label.slice(5, 7);
                            else if (historyDetails.distributionLabel === 'month') label = label.slice(5, 7);
                            
                            return (
                              <div key={idx} className="flex-1 h-full flex flex-col items-center justify-end gap-1 group cursor-default">
                                <span className="text-[8px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.count}
                                </span>
                                <div className="w-full flex-1 flex items-end justify-center">
                                  <div
                                    className="w-1.5 md:w-2 rounded-t-sm bg-gradient-to-t from-pink-600 to-rose-400 group-hover:from-pink-500 group-hover:to-orange-400 transition-all"
                                    style={{ height: `${distPct}%` }}
                                    title={`${label}: ${item.count}`}
                                  />
                                </div>
                                <span className="text-[8px] text-zinc-500 truncate w-full text-center">
                                  {label}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    <p className="text-zinc-600 text-xs py-8 text-center">{isVi ? 'Không có dữ liệu phân bổ.' : 'No distribution data.'}</p>
                  )}
                </div>

                {/* Top tracks during this period */}
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-zinc-300 mb-3 flex items-center gap-1.5">
                    🔥 {isVi ? 'Top bài nghe nhiều nhất thời kỳ này' : 'Most Played Tracks in this Period'}
                  </h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {(historyDetails.topTracks || []).map((t: any, i: number) => (
                      <div key={t.id} className="flex items-center gap-2.5">
                        <span className="text-[9px] text-zinc-600 w-4 text-right flex-shrink-0 font-bold">{i + 1}</span>
                        {t.cover_url ? (
                          <img src={getAbsoluteUrl(t.cover_url)} className="w-7 h-7 rounded object-cover flex-shrink-0" alt="" />
                        ) : (
                          <div className="w-7 h-7 rounded bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                            <Music className="w-3 h-3 text-zinc-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-zinc-200 truncate">{t.title}</p>
                          <p className="text-[9px] text-zinc-500 truncate">{t.artist}</p>
                        </div>
                        <span className="text-[10px] text-pink-400 font-bold flex-shrink-0">{t.plays} {isVi ? 'lượt' : 'plays'}</span>
                      </div>
                    ))}
                    {!(historyDetails.topTracks || []).length && (
                      <p className="text-xs text-zinc-600 text-center py-8">{isVi ? 'Chưa có bài hát nào được phát.' : 'No tracks played.'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity log list */}
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4">
                <h5 className="text-xs font-bold text-zinc-300 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {isVi ? 'Nhật ký lượt nghe thời kỳ này' : 'Play Activity Log in this Period'}
                </h5>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {(historyDetails.playsList || []).map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/[0.02] last:border-0 text-[11px]">
                      <span className="text-zinc-500 flex-shrink-0 w-24 truncate">
                        {new Date(a.played_at).toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(a.played_at).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' })}
                      </span>
                      <span className="text-zinc-300 flex-1 truncate font-medium">{a.title}</span>
                      <span className="text-zinc-500 truncate max-w-[90px] hidden sm:block">{a.artist}</span>
                      <span className="text-purple-400 flex-shrink-0 truncate max-w-[80px]">{a.user_name || 'Guest'}</span>
                    </div>
                  ))}
                  {!(historyDetails.playsList || []).length && (
                    <p className="text-xs text-zinc-600 text-center py-6">{isVi ? 'Chưa có nhật ký.' : 'No activity logs.'}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-6 text-zinc-500 text-xs">{isVi ? 'Không thể tải chi tiết.' : 'Could not fetch details.'}</p>
          )}
        </div>
      )}

      {/* Website Traffic Statistics Section */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              {isVi ? 'Thống kê lượng người truy cập Web' : 'Website Traffic Statistics'}
            </h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {isVi ? 'Phân tích số khách và tổng số lượt truy cập' : 'Analysis of unique visitors and total page visits'}
            </p>
          </div>
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-white/5 self-start sm:self-auto">
            {(['day', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => handleVisitsViewChange(v)}
                className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all ${
                  visitsView === v
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {v === 'day' ? (isVi ? 'Ngày' : 'Day') : (isVi ? 'Tháng' : 'Month')}
              </button>
            ))}
          </div>
        </div>

        {/* Traffic small summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500">{isVi ? 'Tổng lượt truy cập' : 'Total Page Visits'}</p>
              <p className="text-sm font-bold text-white">{totalVisitsCount}</p>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500">{isVi ? 'Số khách duy nhất (IP)' : 'Unique Visitors (IP)'}</p>
              <p className="text-sm font-bold text-white">{totalUniqueVisitors}</p>
            </div>
          </div>
        </div>

        {visitsLoading ? (
          <div className="h-36 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visitsData.length > 0 ? (
          <div className="relative h-44 flex flex-col justify-end pt-4">
            {/* Gridlines */}
            <div className="absolute inset-x-0 bottom-6 top-2 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="w-full border-t border-dashed border-white/40" />
              <div className="w-full border-t border-dashed border-white/40" />
              <div className="w-full border-t border-dashed border-white/40" />
            </div>

            <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              <div className="min-w-[600px] sm:min-w-0 flex items-end gap-3 h-32 z-10 px-2">
                {visitsData.map((v: any, i: number) => {
                  const uniqCount = Number(v.unique_visitors);
                  const totalCount = Number(v.total_visits);
                  
                  const uniqPct = Math.max(6, Math.round((uniqCount / maxVisitsVal) * 100));
                  const totalPct = Math.max(6, Math.round((totalCount / maxVisitsVal) * 100));
                  const label = formatDateLabel(String(v.label || ''), visitsView === 'day' ? 'day' : 'month');

                  return (
                    <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1 group cursor-default relative">
                      {/* Hover tooltip text */}
                      <div className="absolute bottom-full mb-1 bg-zinc-950/95 border border-white/10 rounded-lg p-2 text-[9px] shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap space-y-0.5">
                        <p className="font-bold text-white">{label}</p>
                        <p className="text-teal-400">{isVi ? `Khách duy nhất: ${uniqCount}` : `Unique: ${uniqCount}`}</p>
                        <p className="text-indigo-400">{isVi ? `Tổng lượt xem: ${totalCount}` : `Total: ${totalCount}`}</p>
                      </div>

                      <div className="w-full flex-1 flex items-end justify-center gap-1.5 h-full">
                        {/* Unique Visitors Bar (Teal) */}
                        <div
                          className="w-1.5 md:w-2 rounded-t-sm bg-gradient-to-t from-teal-600 to-emerald-400 group-hover:from-teal-500 group-hover:to-green-300 transition-all shadow-[0_0_8px_rgba(20,184,166,0.15)]"
                          style={{ height: `${uniqPct}%` }}
                        />
                        {/* Total Visits Bar (Indigo) */}
                        <div
                          className="w-1.5 md:w-2 rounded-t-sm bg-gradient-to-t from-indigo-600 to-blue-400 group-hover:from-indigo-500 group-hover:to-cyan-400 transition-all shadow-[0_0_8px_rgba(99,102,241,0.15)]"
                          style={{ height: `${totalPct}%` }}
                        />
                      </div>

                      <span className="text-[9px] text-zinc-500 group-hover:text-zinc-300 truncate w-full text-center mt-1">
                        {label.length > 7 ? label.slice(0, 5) : label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend indicators */}
            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-teal-600 to-emerald-400" />
                <span>{isVi ? 'Số người truy cập (IP)' : 'Unique Visitors (IP)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-indigo-600 to-blue-400" />
                <span>{isVi ? 'Tổng số lượt truy cập' : 'Total Visits'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-36 flex items-center justify-center text-zinc-600 text-sm">
            {isVi ? 'Chưa có dữ liệu truy cập.' : 'No traffic data yet.'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top tracks */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
          <h4 className="text-sm font-bold text-white mb-3">
            {isVi ? '🔥 Top bài nghe nhiều nhất' : '🔥 Most Played Tracks'}
          </h4>
          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {(stats.topTracks || []).slice(0, 8).map((t: any, i: number) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="text-[10px] text-zinc-600 w-5 text-right flex-shrink-0 font-bold">{i + 1}</span>
                {t.cover_url ? (
                  <img src={getAbsoluteUrl(t.cover_url)} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                    <Music className="w-3.5 h-3.5 text-zinc-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{t.title}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{t.artist}</p>
                </div>
                <span className="text-[10px] text-amber-400 font-bold flex-shrink-0">{formatCount(Number(t.play_count || 0))}</span>
              </div>
            ))}
            {!(stats.topTracks || []).length && (
              <p className="text-xs text-zinc-600 text-center py-6">{isVi ? 'Chưa có lượt nghe.' : 'No plays yet.'}</p>
            )}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            {isVi ? 'Theo danh mục' : 'By Category'}
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {(stats.genreStats || []).map((g: any, i: number) => {
              const maxPlays = Math.max(1, ...(stats.genreStats || []).map((x: any) => Number(x.plays)));
              const pct = Math.round((Number(g.plays) / maxPlays) * 100);
              return (
                <button key={i} onClick={() => fetchCategoryTracks(g)}
                  className={`w-full text-left rounded-lg p-2 transition-all hover:bg-white/5 ${selectedCategory?.genre === g.genre ? 'ring-1 ring-amber-500/40 bg-amber-500/5' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-300 truncate">{g.genre}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-zinc-500">{g.count} {isVi ? 'bài' : 'tracks'}</span>
                      <span className="text-[10px] text-amber-400 font-bold">{formatCount(Number(g.plays))}</span>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: g.color || '#7c3aed' }} />
                  </div>
                </button>
              );
            })}
            {!(stats.genreStats || []).length && (
              <p className="text-xs text-zinc-600 text-center py-6">{isVi ? 'Chưa có danh mục.' : 'No categories.'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Category tracks drill-down */}
      {selectedCategory && (
        <div className="bg-zinc-900/60 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white">
              {isVi ? 'Bài hát trong: ' : 'Tracks in: '}
              <span style={{ color: selectedCategory.color || '#a78bfa' }}>{selectedCategory.genre}</span>
            </h4>
            <button onClick={() => { setSelectedCategory(null); setCategoryTracks([]); }}
              className="text-zinc-500 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/5 transition-all">✕</button>
          </div>
          {catLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {categoryTracks.map((t: any, i: number) => (
                <div key={t.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/[0.03]">
                  <span className="text-[10px] text-zinc-600 w-4">{i + 1}</span>
                  {t.cover_url ? (
                    <img src={getAbsoluteUrl(t.cover_url)} className="w-7 h-7 rounded-md object-cover flex-shrink-0" alt="" />
                  ) : (
                    <div className="w-7 h-7 rounded-md bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                      <Music className="w-3 h-3 text-zinc-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{t.title}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{t.artist}</p>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold flex-shrink-0">{formatCount(Number(t.plays || 0))}</span>
                </div>
              ))}
              {!categoryTracks.length && (
                <p className="text-xs text-zinc-600 text-center py-4">{isVi ? 'Chưa có bài hát.' : 'No tracks.'}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          {isVi ? 'Hoạt động gần đây' : 'Recent Activity'}
        </h4>
        <div className="space-y-1 max-h-52 overflow-y-auto">
          {(stats.recentActivity || []).map((a: any, i: number) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/[0.03] last:border-0 text-xs">
              <span className="text-[10px] text-zinc-600 flex-shrink-0 w-28 truncate">
                {new Date(a.played_at).toLocaleString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
              </span>
              <span className="text-zinc-200 flex-1 truncate font-medium">{a.title}</span>
              <span className="text-[10px] text-zinc-500 truncate max-w-[80px] hidden md:block">{a.artist}</span>
              <span className="text-[10px] text-purple-400 flex-shrink-0 truncate max-w-[80px]">{a.user_name || 'Guest'}</span>
            </div>
          ))}
          {!(stats.recentActivity || []).length && (
            <p className="text-xs text-zinc-600 text-center py-4">{isVi ? 'Chưa có hoạt động.' : 'No recent activity.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Artists Tab ───────────────────────────────────────────────────
function ArtistsTab({ authH }: any) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { showConfirm, showAlert } = useModalStore();
  const [artists, setArtists] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', genre: '', listeners: '', popular_track: '', bio: '' });
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

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

      let res;
      if (editing) {
        res = await axios.put(`${API}/artists/${editing}`, formData, {
          headers: {
            ...authH,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        res = await axios.post(`${API}/artists`, formData, {
          headers: {
            ...authH,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      if (res.data.success) {
        showAlert(
          isVi ? 'Thành công' : 'Success',
          editing 
            ? (isVi ? 'Cập nhật thông tin nghệ sĩ thành công!' : 'Artist updated successfully!') 
            : (isVi ? 'Thêm nghệ sĩ thành công!' : 'Artist added successfully!'),
          'success'
        );
        setForm({ name: '', genre: '', listeners: '', popular_track: '', bio: '' });
        setFile(null);
        setImageUrl('');
        setEditing(null);
        fetchArtists();
        window.dispatchEvent(new CustomEvent('reload-artists'));
      }
    } catch (err: any) {
      showAlert(
        isVi ? 'Thất bại' : 'Failed',
        err.response?.data?.message || (isVi ? 'Có lỗi xảy ra khi lưu nghệ sĩ' : 'An error occurred while saving the artist'),
        'error'
      );
    }
  };

  const handleEdit = (artist: any) => {
    setEditing(artist.id);
    setForm({
      name: artist.name,
      genre: artist.genre,
      listeners: artist.listeners,
      popular_track: artist.popular_track,
      bio: artist.bio
    });
    setFile(null);
    setImageUrl(artist.image_url || '');
    const element = document.getElementById('artist-form-container');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: '', genre: '', listeners: '', popular_track: '', bio: '' });
    setFile(null);
    setImageUrl('');
  };

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
      <div id="artist-form-container" className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          {editing ? <Edit2 className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-purple-400" />}
          {editing ? (isVi ? 'Chỉnh sửa thông tin nghệ sĩ' : 'Edit Featured Artist') : (isVi ? 'Thêm nghệ sĩ tiêu biểu mới' : 'Add New Featured Artist')}
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
            <ImageUploadWithCrop
              label={isVi ? 'Ảnh chân dung nghệ sĩ (Upload file)' : 'Artist portrait photo (Upload file)'}
              aspectRatio={1}
              cropShape="round"
              placeholder={isVi ? 'Chọn và cắt ảnh chân dung...' : 'Choose and crop portrait...'}
              onFileCropped={(croppedFile) => setFile(croppedFile)}
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Hoặc dán URL ảnh' : 'Or paste image URL'}</label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} disabled={!!file}
                placeholder="http://example.com/image.png"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700 disabled:opacity-40" />
            </div>
          </div>

          <div className="flex gap-3">
            {editing && (
              <button type="button" onClick={cancelEdit} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-all">
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
            )}
            <button type="submit" className="flex-[2] py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
              {editing ? (isVi ? 'Lưu thay đổi' : 'Save Changes') : (isVi ? 'Thêm nghệ sĩ' : 'Add Artist')}
            </button>
          </div>
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
              <img src={getAbsoluteUrl(artist.image_url)} alt={artist.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-white/5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-zinc-200">{artist.name}</span>
                  <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">{artist.listeners} {isVi ? 'lượt nghe/tháng' : 'listeners/month'}</span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5"><span className="text-zinc-500">{isVi ? 'Thể loại:' : 'Genre:'}</span> {artist.genre} · <span className="text-zinc-500">{isVi ? 'Bài hát nổi bật:' : 'Popular track:'}</span> {artist.popular_track}</p>
                <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1">{artist.bio}</p>
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                <button onClick={() => handleEdit(artist)} className="p-2 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => del(artist.id)} className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
  const { showConfirm, showAlert } = useModalStore();
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
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Lưu album thành công!' : 'Album saved successfully!', 'success');
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
            <ImageUploadWithCrop
              label={isVi ? 'Ảnh bìa Album (Upload file)' : 'Album Cover Photo (Upload file)'}
              aspectRatio={1}
              cropShape="rect"
              placeholder={isVi ? 'Chọn và cắt ảnh bìa Album...' : 'Choose and crop Album cover...'}
              onFileCropped={(croppedFile) => setFile(croppedFile)}
            />

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
              <img src={getAbsoluteUrl(album.cover_url)} alt={album.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-white/5" />
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
  const [backdrops, setBackdrops] = useState<any[]>([]);
  const [bannerSlides, setBannerSlides] = useState<any[]>([]);
  const [youtubeCookies, setYoutubeCookies] = useState('');
  const [loading, setLoading] = useState(false);

  // Drag and Drop reordering state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [draggedType, setDraggedType] = useState<'backdrop' | 'banner' | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number, type: 'backdrop' | 'banner') => {
    setDraggedIdx(index);
    setDraggedType(type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number, type: 'backdrop' | 'banner') => {
    e.preventDefault();
    if (draggedIdx === null || draggedType !== type || draggedIdx === index) return;

    if (type === 'backdrop') {
      const list = [...backdrops];
      const draggedItem = list[draggedIdx];
      list.splice(draggedIdx, 1);
      list.splice(index, 0, draggedItem);
      setBackdrops(list);
      setDraggedIdx(index);
    } else {
      const list = [...bannerSlides];
      const draggedItem = list[draggedIdx];
      list.splice(draggedIdx, 1);
      list.splice(index, 0, draggedItem);
      setBannerSlides(list);
      setDraggedIdx(index);
    }
  };

  const handleDragEnd = async (type: 'backdrop' | 'banner') => {
    setDraggedIdx(null);
    setDraggedType(null);
    try {
      if (type === 'backdrop') {
        const ids = backdrops.map(b => b.id);
        await axios.put(`${API}/settings/backdrops/reorder`, { ids }, { headers: authH });
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Cập nhật thứ tự hình nền thành công!' : 'Backdrop order updated successfully!', 'success');
        window.dispatchEvent(new CustomEvent('reload-settings'));
      } else {
        const ids = bannerSlides.map(s => s.id);
        await axios.put(`${API}/settings/banner-slides/reorder`, { ids }, { headers: authH });
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Cập nhật thứ tự banner thành công!' : 'Banner order updated successfully!', 'success');
        window.dispatchEvent(new CustomEvent('reload-settings'));
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', isVi ? 'Lỗi khi cập nhật thứ tự.' : 'Failed to update order.', 'error');
    }
  };

  // Form states for background (backdrop)
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgUrl, setBgUrl] = useState('');

  // Form states for banner slide
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [slideUrl, setSlideUrl] = useState('');

  const { showConfirm, showAlert } = useModalStore();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const bgRes = await axios.get(`${API}/settings/backdrops`);
      if (bgRes.data.success) {
        setBackdrops(bgRes.data.data || []);
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
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi tải cấu hình.' : 'Failed to load configuration.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddBackdrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bgFile && !bgUrl.trim()) {
      showAlert(isVi ? 'Chú ý' : 'Warning', isVi ? 'Vui lòng tải lên tệp ảnh hoặc điền link ảnh.' : 'Please upload an image file or enter an image URL.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (bgFile) {
        formData.append('cover', bgFile);
      } else {
        formData.append('image_url', bgUrl);
      }

      const res = await axios.post(`${API}/settings/backdrops`, formData, {
        headers: { ...authH, 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setBackdrops([res.data.data, ...backdrops]);
        setBgFile(null);
        setBgUrl('');
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Thêm ảnh nền thành công!' : 'Backdrop added successfully!', 'success');
        window.dispatchEvent(new CustomEvent('reload-settings'));
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi thêm ảnh nền.' : 'Failed to add backdrop.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackdrop = async (id: number) => {
    showConfirm(
      isVi ? 'Xác nhận xóa' : 'Confirm Delete',
      isVi ? 'Bạn có chắc chắn muốn xóa ảnh nền này?' : 'Are you sure you want to delete this backdrop?',
      async () => {
        setLoading(true);
        try {
          const res = await axios.delete(`${API}/settings/backdrops/${id}`, { headers: authH });
          if (res.data.success) {
            setBackdrops(backdrops.filter(b => b.id !== id));
            showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Xóa ảnh nền thành công!' : 'Backdrop deleted successfully!', 'success');
            window.dispatchEvent(new CustomEvent('reload-settings'));
          }
        } catch (err: any) {
          showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi xóa ảnh nền.' : 'Failed to delete backdrop.'), 'error');
        } finally {
          setLoading(false);
        }
      }
    );
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

  const handleUpdateCookies = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/settings/youtube-cookies`, { value: youtubeCookies }, { headers: authH });
      if (res.data.success) {
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Cập nhật YouTube Cookies thành công!' : 'YouTube Cookies updated successfully!', 'success');
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi cập nhật Cookies.' : 'Failed to update Cookies.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Background Section */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            🖼️ {isVi ? 'Quản lý nhiều hình nền (Backdrop Backgrounds)' : 'Backdrop Backgrounds Management'}
          </h3>
          <p className="text-xs text-zinc-500">
            {isVi 
              ? 'Tải lên nhiều hình nền để hiển thị dọc theo độ dài của trang chủ, tự động tạo khoảng cách chuyển tiếp đẹp mắt.' 
              : 'Upload multiple backdrops to display along the length of the homepage, automatically spacing out beautifully.'}
          </p>
        </div>

        {/* Hint for drag and drop */}
        {backdrops.length > 0 && (
          <p className="text-[11px] text-amber-500/90 bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
            💡 {isVi ? 'Nhấn giữ và kéo thả các ảnh để sắp xếp thứ tự hiển thị của hình nền trang chủ.' : 'Click and drag images to rearrange the home backdrop display order.'}
          </p>
        )}

        {/* List of current backdrops */}
        {backdrops.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {backdrops.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index, 'backdrop')}
                onDragOver={(e) => handleDragOver(e, index, 'backdrop')}
                onDragEnd={() => handleDragEnd('backdrop')}
                className={`group relative aspect-[16/9] rounded-xl overflow-hidden border bg-zinc-900 shadow-md cursor-grab active:cursor-grabbing transition-all duration-300 ${
                  draggedIdx === index && draggedType === 'backdrop'
                    ? 'opacity-40 border-amber-500 scale-95 z-50 shadow-amber-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <img src={getAbsoluteUrl(item.image_url)} alt="Backdrop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                
                {/* Drag Handle Indicator */}
                <div className="absolute top-2 left-2 p-1 bg-black/60 rounded text-zinc-400 opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none">
                  <GripVertical className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold text-zinc-300">#{index + 1}</span>
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleDeleteBackdrop(item.id)}
                    className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg transition-transform transform scale-90 group-hover:scale-100 cursor-pointer"
                    title={isVi ? 'Xóa hình nền này' : 'Delete this backdrop'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddBackdrop} className="space-y-4 max-w-xl border-t border-white/5 pt-4">
          <h4 className="text-xs font-bold text-zinc-400">{isVi ? 'Thêm hình nền mới' : 'Add New Backdrop'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUploadWithCrop
              label={isVi ? 'Tải file ảnh lên' : 'Upload image file'}
              aspectRatio={16 / 9}
              cropShape="rect"
              placeholder={isVi ? 'Chọn và cắt ảnh nền backdrop...' : 'Choose and crop backdrop...'}
              onFileCropped={(croppedFile) => {
                setBgFile(croppedFile);
                setBgUrl('');
              }}
            />
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
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isVi ? 'Thêm hình nền' : 'Add Backdrop'}
          </button>
        </form>
      </div>

      {/* Cookies Section */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          🔑 {isVi ? 'Cấu hình YouTube Cookies (Vượt chặn tải nhạc)' : 'YouTube Cookies (Bypass Bot Check)'}
        </h3>
        <p className="text-xs text-zinc-500">
          {isVi 
            ? 'Nhập nội dung tập tin Cookies (định dạng Netscape) để yt-dlp có thể vượt qua kiểm tra bot của YouTube trên Render.' 
            : 'Enter Cookies file content (Netscape format) to allow yt-dlp to bypass YouTube bot protection on Render.'}
        </p>
        <div className="text-xs text-amber-500/90 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 space-y-1">
          <p className="font-bold">💡 {isVi ? 'Cách lấy Cookies:' : 'How to export Cookies:'}</p>
          <ul className="list-disc pl-4 space-y-0.5 text-zinc-400">
            <li>{isVi ? "Cài đặt tiện ích Chrome 'Get cookies.txt LOCALLY' hoặc 'Cookie-Editor'." : "Install Chrome extension 'Get cookies.txt LOCALLY' or 'Cookie-Editor'."}</li>
            <li>{isVi ? 'Mở trang youtube.com (đảm bảo đã đăng nhập một tài khoản phụ).' : 'Go to youtube.com (make sure you are logged in on a dummy/secondary account).'}</li>
            <li>{isVi ? 'Xuất Cookies dưới dạng Netscape/text rồi dán toàn bộ nội dung vào ô dưới đây.' : 'Export cookies as Netscape format, copy the full text, and paste below.'}</li>
          </ul>
        </div>

        <form onSubmit={handleUpdateCookies} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              {isVi ? 'Nội dung Cookies (Netscape Text)' : 'Cookies Content (Netscape Text)'}
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
            {isVi ? 'Lưu cấu hình Cookies' : 'Save Cookies Configuration'}
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
            <ImageUploadWithCrop
              label={isVi ? 'Tải file ảnh lên' : 'Upload image file'}
              aspectRatio={16 / 9}
              cropShape="rect"
              placeholder={isVi ? 'Chọn và cắt ảnh banner...' : 'Choose and crop banner...'}
              onFileCropped={(croppedFile) => {
                setSlideFile(croppedFile);
                setSlideUrl('');
              }}
            />
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-zinc-300">{isVi ? `Danh sách ảnh banner hiện tại (${bannerSlides.length})` : `Current banner image list (${bannerSlides.length})`}</h4>
            {bannerSlides.length > 0 && (
              <p className="text-[11px] text-amber-500/90 bg-amber-500/5 border border-amber-500/10 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 self-start">
                💡 {isVi ? 'Nhấn giữ và kéo thả để thay đổi thứ tự trình chiếu slideshow.' : 'Click and drag to rearrange the slideshow sequence.'}
              </p>
            )}
          </div>
          {bannerSlides.length === 0 ? (
            <p className="text-xs text-zinc-600">{isVi ? 'Chưa có ảnh banner nào. Hệ thống sẽ hiển thị các slide mặc định.' : 'No banner images yet. Default slides will be shown.'}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {bannerSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index, 'banner')}
                  onDragOver={(e) => handleDragOver(e, index, 'banner')}
                  onDragEnd={() => handleDragEnd('banner')}
                  className={`relative group rounded-xl overflow-hidden border bg-zinc-900 aspect-[16/9] cursor-grab active:cursor-grabbing transition-all duration-300 ${
                    draggedIdx === index && draggedType === 'banner'
                      ? 'opacity-40 border-amber-500 scale-95 z-50 shadow-amber-500/10'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <img src={getAbsoluteUrl(slide.image_url)} alt="Banner slide" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-300" />
                  
                  {/* Drag Handle Indicator */}
                  <div className="absolute top-2 left-2 p-1 bg-black/60 rounded text-zinc-400 opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none">
                    <GripVertical className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold text-zinc-300">#{index + 1}</span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteBannerSlide(slide.id)}
                        className="p-1.5 bg-red-600/95 hover:bg-red-500 text-white rounded-lg transition-all cursor-pointer"
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
