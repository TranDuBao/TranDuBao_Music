import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { useMusicStore } from '../store/useMusicStore';
import { useModalStore } from '../store/useModalStore';
import Avatar from '../components/Avatar';
import axios from 'axios';
import ImageCropperModal from '../components/ImageCropperModal';

import {
  User, Lock, Clock, Music, ListMusic, Camera, Save,
  CheckCircle2, AlertCircle, Trash2, Play, Heart, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import { API_BASE, getAbsoluteUrl } from '../config';
const API = API_BASE;

type Tab = 'info' | 'security' | 'history' | 'favorites' | 'uploads' | 'playlists';

export default function UserProfilePage() {
  const { t } = useTranslation();
  const { user, token } = useAuthStore();
  const [tab, setTab] = useState<Tab>('info');
  const authH = { Authorization: `Bearer ${token}` };

  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'info',      label: t('userProfile.personalInfo'), icon: <User className="w-4 h-4" /> },
    { id: 'security',  label: t('userProfile.security'),     icon: <Lock className="w-4 h-4" /> },
    { id: 'history',   label: t('userProfile.listenHistory'),icon: <Clock className="w-4 h-4" /> },
    { id: 'favorites', label: t('userProfile.favorites'),    icon: <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" /> },
    { id: 'uploads',   label: t('userProfile.myUploadedMusic'), icon: <Music className="w-4 h-4" /> },
    { id: 'playlists', label: t('userProfile.myPlaylists'), icon: <ListMusic className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profile Header */}
      <ProfileHeader user={user} token={token} authH={authH} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar inside settings */}
        <div className="md:col-span-1 flex flex-col gap-1 p-2 bg-zinc-950/60 border border-white/5 rounded-2xl">
          <p className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('userProfile.accountSettings')}</p>
          {tabs.map(tItem => (
            <button
              key={tItem.id}
              onClick={() => setTab(tItem.id)}
              className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                tab === tItem.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {tItem.icon}
                <span>{tItem.label}</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${tab === tItem.id ? 'opacity-100' : ''}`} />
            </button>
          ))}
        </div>

        {/* Tab Content Display Area */}
        <div className="md:col-span-3 bg-zinc-950/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
          {tab === 'info'      && <InfoTab user={user} authH={authH} />}
          {tab === 'security'  && <SecurityTab user={user} authH={authH} />}
          {tab === 'history'   && <HistoryTab authH={authH} />}
          {tab === 'favorites' && <FavoritesTab authH={authH} />}
          {tab === 'uploads'   && <UploadsTab authH={authH} />}
          {tab === 'playlists' && <PlaylistsTab authH={authH} />}
        </div>
      </div>
    </div>
  );
}

// ── Profile Header (Avatar + basic info) ──────────────────────────
function ProfileHeader({ user, token, authH }: any) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const { initAuth } = useAuthStore();
  const { showConfirm, showAlert } = useModalStore();

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState('');

  useEffect(() => {
    setAvatarUrl(user.avatar_url || '');
  }, [user.avatar_url]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropperSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedAvatar = async (croppedBlob: Blob) => {
    setCropperOpen(false);
    setUploading(true);
    const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
    const fd = new FormData();
    fd.append('avatar', croppedFile);
    try {
      const { data } = await axios.put(`${API}/auth/avatar`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        setAvatarUrl(data.avatar_url);
        await initAuth();
        showAlert(t('common.success'), t('userProfile.updateAvatarSuccess'), 'success');
      }
    } catch (err: any) {
      showAlert(t('common.error'), err.response?.data?.message || t('common.failed'), 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleAvatarDelete = () => {
    showConfirm(
      t('userProfile.deleteAvatarTitle'),
      t('userProfile.deleteAvatarConfirm'),
      async () => {
        setUploading(true);
        try {
          const { data } = await axios.delete(`${API}/auth/avatar`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (data.success) {
            setAvatarUrl('');
            await initAuth();
            showAlert(t('common.success'), t('userProfile.deleteAvatarSuccess'), 'success');
          }
        } catch (err: any) {
          showAlert(t('common.error'), err.response?.data?.message || t('common.failed'), 'error');
        } finally {
          setUploading(false);
        }
      }
    );
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-purple-900/20 via-indigo-950/10 to-zinc-950 p-8 shadow-2xl flex flex-col sm:flex-row items-center gap-6">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-84 h-84 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative flex-shrink-0">
        <div className="w-28 h-28 rounded-full overflow-hidden bg-zinc-900 border-4 border-purple-500/20 shadow-xl relative group flex items-center justify-center">
          <Avatar src={avatarUrl} name={user.name} className="w-full h-full" />
        </div>
        
        {avatarUrl && (
          <button
            onClick={handleAvatarDelete}
            disabled={uploading}
            className="absolute bottom-1 left-1 w-9 h-9 bg-rose-600/90 hover:bg-rose-600 hover:scale-105 active:scale-95 rounded-full flex items-center justify-center border-4 border-zinc-950 shadow-lg transition-all cursor-pointer text-white"
            title={t('userProfile.deleteAvatar')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-1 right-1 w-9 h-9 bg-gradient-to-tr from-purple-600 to-pink-500 hover:scale-105 active:scale-95 rounded-full flex items-center justify-center border-4 border-zinc-950 shadow-lg transition-all cursor-pointer"
          title={t('userProfile.changeAvatar')}
        >
          {uploading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Camera className="w-4 h-4 text-white" />
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      </div>

      <div className="flex-1 text-center sm:text-left space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{user.name}</h1>
          <div className="inline-flex justify-center sm:justify-start">
            <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${
              user.role === 'admin' 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
            }`}>
              {user.role === 'admin' ? '👑 Admin' : `🎵 ${t('userProfile.normalUser')}`}
            </span>
          </div>
        </div>
        <p className="text-sm text-zinc-400">{user.email || 'OAuth Account'}</p>
        <p className="text-sm text-zinc-500 italic max-w-lg">
          {user.bio ? `"${user.bio}"` : t('userProfile.normalUserDesc')}
        </p>
      </div>

      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperSrc}
        aspectRatio={1}
        cropShape="round"
        title={t('userProfile.changeAvatar')}
        onCrop={handleCroppedAvatar}
        onClose={() => {
          setCropperOpen(false);
          if (fileRef.current) fileRef.current.value = '';
        }}
      />
    </div>
  );
}

// ── Info Tab ──────────────────────────────────────────────────────
function InfoTab({ user, authH }: any) {
  const { t } = useTranslation();
  const { initAuth } = useAuthStore();
  const [form, setForm]     = useState({ name: user.name || '', bio: user.bio || '' });
  const [status, setStatus] = useState<'idle'|'ok'|'err'>('idle');
  const [msg, setMsg]       = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ name: user.name || '', bio: user.bio || '' });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.put(`${API}/auth/profile`, form, { headers: authH });
      if (data.success) { 
        setStatus('ok'); 
        setMsg(t('userProfile.infoUpdateSuccess')); 
        await initAuth(); 
      }
      else { setStatus('err'); setMsg(data.message); }
    } catch (e: any) { 
      setStatus('err'); 
      setMsg(e.response?.data?.message || t('common.error')); 
    } finally {
      setSaving(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-white">{t('userProfile.personalInfo')}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={t('userProfile.fullName')} value={form.name} onChange={(v: string) => setForm({...form, name: v})} required />
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">{t('userProfile.emailAddress')}</label>
          <input value={user.email || 'OAuth Account'} disabled
            className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-xl px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Bio</label>
        <textarea
          value={form.bio}
          onChange={e => setForm({...form, bio: e.target.value})}
          rows={3}
          className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-purple-500/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-600 resize-none transition-all"
        />
      </div>

      <StatusMsg status={status} msg={msg} />

      <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 active:scale-95 text-white font-bold rounded-xl text-xs transition-all cursor-pointer">
        {saving ? <div className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? t('userProfile.saving') : t('userProfile.saveChanges')}
      </button>
    </form>
  );
}

// ── Security Tab ──────────────────────────────────────────────────
function SecurityTab({ user, authH }: any) {
  const { t } = useTranslation();
  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow]     = useState(false);
  const [status, setStatus] = useState<'idle'|'ok'|'err'>('idle');
  const [msg, setMsg]       = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setStatus('err'); setMsg(t('userProfile.passwordMismatch')); return;
    }
    setSaving(true);
    try {
      const { data } = await axios.put(`${API}/auth/password`,
        { currentPassword: form.currentPassword, newPassword: form.newPassword },
        { headers: authH });
      if (data.success) { 
        setStatus('ok'); 
        setMsg(t('userProfile.passwordSuccess')); 
        setForm({ currentPassword:'', newPassword:'', confirm:'' }); 
      }
      else { setStatus('err'); setMsg(data.message); }
    } catch (e: any) { 
      setStatus('err'); 
      setMsg(e.response?.data?.message || t('auth.invalidCredentials')); 
    } finally {
      setSaving(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (user.provider !== 'local') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
          <Lock className="w-5 h-5 text-zinc-500" />
        </div>
        <div>
          <p className="text-zinc-300 font-bold text-sm">{t('userProfile.security')}</p>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">{t('userProfile.socialAccountNote')}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-white">{t('userProfile.changePassword')}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label={t('userProfile.currentPassword')} value={form.currentPassword} onChange={(v:string)=>setForm({...form, currentPassword:v})} type={show?'text':'password'} required />
        <Field label={t('userProfile.newPassword')}      value={form.newPassword}      onChange={(v:string)=>setForm({...form, newPassword:v})}      type={show?'text':'password'} required />
        <Field label={t('userProfile.confirmNewPassword')} value={form.confirm}     onChange={(v:string)=>setForm({...form, confirm:v})}          type={show?'text':'password'} required />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {show ? 'Hide Password' : 'Show Password'}
        </button>
      </div>

      <StatusMsg status={status} msg={msg} />

      <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 active:scale-95 text-white font-bold rounded-xl text-xs transition-all cursor-pointer">
        {saving ? <div className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
        {t('userProfile.updatePasswordBtn')}
      </button>
    </form>
  );
}

// ── History Tab ───────────────────────────────────────────────────
function HistoryTab({ authH }: any) {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useMusicStore();

  useEffect(() => {
    axios.get(`${API}/history`, { headers: authH })
      .then(r => {
        if (r.data.success) {
          const mapped = r.data.data.map((h: any) => ({
            ...h,
            id: h.track_id,
            history_id: h.id
          }));
          setHistory(mapped);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (history.length === 0) return <EmptyState icon={<Clock />} msg={t('userProfile.noHistory')} />;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white">{t('userProfile.historyTitle')}</h3>
        <p className="text-xs text-zinc-500">{t('userProfile.historyDesc')}</p>
      </div>

      <div className="divide-y divide-white/[0.03] max-h-[400px] overflow-y-auto pr-1">
        {history.map((h, i) => (
          <div key={h.history_id || h.id} className="flex items-center gap-4 py-3 group hover:bg-white/[0.02] px-2 rounded-xl transition-all">
            <span className="text-xs text-zinc-600 w-5 text-center font-bold">{i+1}</span>
            <img src={getAbsoluteUrl(h.cover_url) || 'https://via.placeholder.com/48'} className="w-12 h-12 rounded-lg object-cover border border-white/5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200 truncate">{h.title}</p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">{h.artist}</p>
            </div>
            <p className="text-[10px] text-zinc-600 hidden sm:block">{new Date(h.played_at).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</p>
            <button
              onClick={() => playTrack(h, history)}
              className="w-8 h-8 rounded-full bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 flex items-center justify-center hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Favorites Tab (Đã thích) ──────────────────────────────────────
function FavoritesTab({ authH }: any) {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, toggleFavorite, favorites: storeFavs } = useMusicStore();

  useEffect(() => {
    axios.get(`${API}/favorites`, { headers: authH })
      .then(r => {
        if (r.data.success) {
          setFavorites(r.data.data || []);
        }
      })
      .finally(() => setLoading(false));
  }, [storeFavs]);

  const handleUnfavorite = async (e: React.MouseEvent, trackId: number) => {
    e.stopPropagation();
    await toggleFavorite(trackId);
    setFavorites(prev => prev.filter(tItem => tItem.id !== trackId));
  };

  if (loading) return <LoadingSpinner />;
  if (favorites.length === 0) return <EmptyState icon={<Heart className="text-rose-500 w-10 h-10" />} msg={t('userProfile.noFavorites')} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{t('userProfile.likedTitle')}</span>
            <span className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
              {favorites.length}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">{t('userProfile.likedDesc')}</p>
        </div>
      </div>

      <div className="divide-y divide-white/[0.03] max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
        {favorites.map((f, i) => (
          <div
            key={f.id}
            onClick={() => playTrack(f, favorites)}
            className="flex items-center gap-4 py-3 group hover:bg-white/[0.02] px-2 rounded-xl transition-all cursor-pointer"
          >
            <span className="text-xs text-zinc-600 w-5 text-center font-bold">{i + 1}</span>
            <img src={getAbsoluteUrl(f.cover_url) || 'https://via.placeholder.com/48'} className="w-12 h-12 rounded-lg object-cover border border-white/5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200 truncate group-hover:text-purple-400 transition-colors">{f.title}</p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">{f.artist}</p>
            </div>
            <button
              onClick={(e) => handleUnfavorite(e, f.id)}
              className="p-2 text-rose-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all"
            >
              <Heart className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); playTrack(f, favorites); }}
              className="w-8 h-8 rounded-full bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 flex items-center justify-center hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Uploads Tab ───────────────────────────────────────────────────
function UploadsTab({ authH }: any) {
  const { t } = useTranslation();
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useMusicStore();
  const { showConfirm } = useModalStore();

  useEffect(() => {
    axios.get(`${API}/auth/my-uploads`, { headers: authH })
      .then(r => { if (r.data.success) setTracks(r.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const deleteTrack = (id: number) => {
    showConfirm(
      t('tracks.deleteSong'),
      t('tracks.deleteSongConfirm') || 'Are you sure you want to delete this track?',
      async () => {
        await axios.delete(`${API}/tracks/${id}`, { headers: authH });
        setTracks(tList => tList.filter(x => x.id !== id));
      }
    );
  };

  if (loading) return <LoadingSpinner />;
  if (tracks.length === 0) return <EmptyState icon={<Music />} msg={t('userProfile.noUploads')} />;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white">{t('userProfile.uploadedTitle')}</h3>
        <p className="text-xs text-zinc-500">{t('userProfile.uploadedDesc')}</p>
      </div>

      <div className="space-y-2">
        {tracks.map((tItem, i) => (
          <div key={tItem.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/[0.01] transition-all group">
            <span className="text-xs font-bold text-zinc-600 w-5 text-center">{i+1}</span>
            <img src={getAbsoluteUrl(tItem.cover_url) || 'https://via.placeholder.com/48'} className="w-12 h-12 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200 truncate">{tItem.title}</p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">{tItem.artist} · <span className="text-zinc-600">{tItem.genre}</span></p>
            </div>
            
            <div className="flex items-center gap-3">
              {tItem.status === 'pending' ? (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/20 text-amber-400">
                  ⏳ {t('tracks.pending')}
                </span>
              ) : tItem.status === 'rejected' ? (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-rose-500/10 border-rose-500/20 text-rose-400">
                  ❌ {t('tracks.rejected')}
                </span>
              ) : (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  tItem.is_public ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                }`}>
                  {tItem.is_public ? t('tracks.public') : t('tracks.private')}
                </span>
              )}
              <span className="text-xs text-zinc-500 hidden sm:block">{tItem.play_count || 0} {t('admin.playsCount')}</span>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => playTrack(tItem, tracks)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    tItem.status === 'rejected'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 opacity-60 hover:opacity-100'
                      : tItem.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 opacity-70 hover:opacity-100'
                        : 'bg-purple-600/10 hover:bg-purple-600/20 text-purple-400'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
                <button 
                  onClick={() => deleteTrack(tItem.id)} 
                  className="w-8 h-8 rounded-full bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Playlists Tab ─────────────────────────────────────────────────
function PlaylistsTab({ authH }: any) {
  const { t } = useTranslation();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [expanded, setExpanded]   = useState<number|null>(null);
  const [tracks, setTracks]       = useState<Record<number,any[]>>({});
  const [loading, setLoading]     = useState(true);
  const { playTrack } = useMusicStore();

  useEffect(() => {
    axios.get(`${API}/playlists`, { headers: authH })
      .then(r => { if (r.data.success) setPlaylists(r.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const expand = async (id: number) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!tracks[id]) {
      const r = await axios.get(`${API}/playlists/${id}/tracks`, { headers: authH });
      if (r.data.success) setTracks(prev => ({ ...prev, [id]: r.data.data }));
    }
  };

  if (loading) return <LoadingSpinner />;
  if (playlists.length === 0) return <EmptyState icon={<ListMusic />} msg={t('playlists.noPlaylists')} />;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white">{t('userProfile.playlistsTitle')}</h3>
        <p className="text-xs text-zinc-500">{t('userProfile.playlistsDesc')}</p>
      </div>

      <div className="space-y-3">
        {playlists.map(pl => (
          <div key={pl.id} className="border border-white/5 rounded-2xl overflow-hidden bg-zinc-900/20 hover:border-white/10 transition-all">
            <button
              onClick={() => expand(pl.id)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/10">
                  <ListMusic className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{pl.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{pl.description || t('playlists.empty')}</p>
                </div>
              </div>
            </button>

            {expanded === pl.id && (
              <div className="border-t border-white/5 divide-y divide-white/[0.02] bg-black/20 p-2 space-y-1">
                {(tracks[pl.id] || []).length === 0 ? (
                  <p className="text-xs text-zinc-600 p-3 italic">{t('playlists.empty')}</p>
                ) : (
                  (tracks[pl.id] || []).map((tItem, i) => (
                    <div key={tItem.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] group">
                      <span className="text-xs text-zinc-600 w-4 font-bold">{i+1}</span>
                      <img src={getAbsoluteUrl(tItem.cover_url)} className="w-9 h-9 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-300 truncate">{tItem.title}</p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{tItem.artist}</p>
                      </div>
                      <button
                        onClick={() => playTrack(tItem, tracks[pl.id])}
                        className="w-7 h-7 rounded-full bg-purple-600/10 text-purple-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reusable components ───────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', required = false }: any) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-zinc-400">{label}</label>
      <input
        type={type} value={value} required={required}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-purple-500/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-600 transition-all"
      />
    </div>
  );
}

function StatusMsg({ status, msg }: { status: string; msg: string }) {
  if (status === 'idle') return null;
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
      status === 'ok' 
        ? 'bg-green-500/5 border-green-500/20 text-green-400' 
        : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
    }`}>
      {status === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      <p className="text-xs font-semibold">{msg}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ icon, msg }: { icon: React.ReactNode; msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-zinc-500 space-y-2">
      <div className="w-10 h-10 opacity-30">{icon}</div>
      <p className="text-xs font-medium">{msg}</p>
    </div>
  );
}
