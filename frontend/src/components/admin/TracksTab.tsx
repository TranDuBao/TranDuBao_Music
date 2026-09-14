import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Play, Check, X, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useModalStore } from '../../store/useModalStore';
import { useMusicStore } from '../../store/useMusicStore';
import { formatPlaysShort, getCategoryIcon } from '../../utils/format';
import { API_BASE, getAbsoluteUrl } from '../../config';
import { TrackHoverPreview } from '../TrackHoverPreview';

const API = API_BASE;

export function TracksTab({ authH }: { authH: Record<string, string> }) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { playTrack } = useMusicStore();
  const [tracks, setTracks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingTrack, setEditingTrack] = useState<any | null>(null);
  const [onlyRecent, setOnlyRecent] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'rejected'>('all');

  const fetch = async () => {
    setLoading(true);
    try {
      const url = `${API}/tracks?search=${encodeURIComponent(search)}`;
      const { data } = await axios.get(url, { headers: authH });
      if (data.success) setTracks(data.data);
    } finally {
      setLoading(false);
    }
  };

  const displayedTracks = tracks.filter(t => {
    if (statusFilter === 'all') {
      if (t.status && t.status !== 'approved') return false;
    } else if (statusFilter === 'pending') {
      if (t.status !== 'pending') return false;
    } else if (statusFilter === 'rejected') {
      if (t.status !== 'rejected') return false;
    }
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

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const res = await axios.put(`${API}/tracks/${id}/status`, { status }, { headers: authH });
      if (res.data.success) {
        showAlert(
          isVi ? 'Thành công' : 'Success',
          status === 'approved'
            ? (isVi ? 'Đã duyệt bài hát thành công!' : 'Song approved successfully!')
            : (isVi ? 'Đã từ chối bài hát!' : 'Song rejected!'),
          'success'
        );
        fetch();
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi xử lý bài hát.' : 'Failed to update song status.'), 'error');
    }
  };

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isVi ? "Tìm bài hát..." : "Search songs..."}
          className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2 text-sm text-white focus:outline-none placeholder-zinc-600" />
        
        <button
          type="button"
          onClick={() => setOnlyRecent(prev => !prev)}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
            onlyRecent 
              ? 'bg-purple-500/25 border-purple-500/40 text-purple-400 shadow-md shadow-purple-500/10'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          {isVi ? 'Bài mới (24h)' : 'New (24h)'}
        </button>

        <span className="text-xs text-zinc-500 text-right">{displayedTracks.length} / {tracks.length} {isVi ? 'bài' : 'tracks'}</span>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          { key: 'all',      label: isVi ? 'Tất cả' : 'All',        icon: '🎵', count: tracks.filter(t => t.status === 'approved' || !t.status).length, activeClass: 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/25 border-transparent' },
          { key: 'pending',  label: isVi ? 'Chờ duyệt' : 'Pending', icon: '⏳', count: tracks.filter(t => t.status === 'pending').length,  activeClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 border-transparent' },
          { key: 'rejected', label: isVi ? 'Từ chối' : 'Rejected',  icon: '❌', count: tracks.filter(t => t.status === 'rejected').length, activeClass: 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/25 border-transparent' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
              statusFilter === tab.key
                ? tab.activeClass
                : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/8 overflow-hidden shadow-2xl">
        {/* Table Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-zinc-900 to-zinc-900/80 border-b border-white/8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          <span className="w-6 text-center flex-shrink-0">#</span>
          <span className="flex-1 min-w-0">{isVi ? 'BÀI HÁT' : 'SONG'}</span>
          <span className="hidden md:block w-36 flex-shrink-0 text-left">{isVi ? 'NGƯỜI ĐĂNG' : 'UPLOADER'}</span>
          <span className="w-28 flex-shrink-0 text-center">{isVi ? 'TRẠNG THÁI' : 'STATUS'}</span>
          {statusFilter !== 'pending' && (
            <span className="hidden sm:block w-20 flex-shrink-0 text-right">{isVi ? 'NGHE' : 'PLAYS'}</span>
          )}
          <span className="w-52 flex-shrink-0 text-right">{isVi ? 'THAO TÁC' : 'ACTIONS'}</span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/[0.03]">
          {displayedTracks.map((t, i) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-5 py-3 transition-all group relative ${
                t.status === 'rejected'
                  ? 'bg-rose-950/10 hover:bg-rose-950/20'
                  : t.status === 'pending'
                  ? 'bg-amber-950/10 hover:bg-amber-950/20'
                  : 'hover:bg-white/[0.025]'
              }`}
            >
              {/* Status accent bar on left */}
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${
                t.status === 'approved' || !t.status ? 'bg-emerald-500' :
                t.status === 'pending' ? 'bg-amber-500' :
                t.status === 'rejected' ? 'bg-rose-500' : 'bg-transparent'
              } opacity-0 group-hover:opacity-100 transition-opacity`} />

              {/* Index */}
              <span className="text-xs text-zinc-600 font-bold w-6 text-center flex-shrink-0">{i + 1}</span>

              {/* Track Info */}
              <TrackHoverPreview track={t}>
                <div className="flex items-center gap-3 min-w-0 cursor-pointer flex-1">
                  <div className="relative group/play flex-shrink-0">
                    <img
                      src={getAbsoluteUrl(t.cover_url) || 'https://via.placeholder.com/40'}
                      className="w-11 h-11 rounded-xl object-cover border border-white/10 shadow-md group-hover:border-white/20 transition-all"
                    />
                    <button
                      onClick={() => playTrack(t, displayedTracks)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover/play:opacity-100 flex items-center justify-center rounded-xl transition-all"
                    >
                      <Play className="w-4 h-4 fill-white text-white drop-shadow-lg" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-100 truncate leading-tight" title={`${t.title} - ${t.artist}`}>{t.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[11px] text-zinc-400 truncate" title={t.artist}>{t.artist}</span>
                      {t.category_name && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 font-bold whitespace-nowrap">
                          {getCategoryIcon(t.category_name, t.category_icon)} {t.category_name}
                        </span>
                      )}
                      {t.created_at && (
                        <span className="text-[9px] text-zinc-600 flex items-center gap-0.5 whitespace-nowrap">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(t.created_at).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </TrackHoverPreview>

              {/* Uploader Column */}
              <div className="hidden md:flex w-36 flex-shrink-0 items-center">
                {t.uploader_name ? (
                  <span className="text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-1 rounded-full font-bold truncate max-w-[135px] inline-flex items-center gap-1" title={`Người đăng: ${t.uploader_name}`}>
                    <span>👤</span>
                    <span className="truncate">{t.uploader_name}</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-700 italic">MusicStream</span>
                )}
              </div>

              {/* Status Badge */}
              <div className="w-28 flex-shrink-0 flex items-center justify-center">
                {t.status === 'pending' && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 font-bold animate-pulse">
                    ⏳ {isVi ? 'Chờ duyệt' : 'Pending'}
                  </span>
                )}
                {t.status === 'rejected' && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25 font-bold">
                    ✕ {isVi ? 'Từ chối' : 'Rejected'}
                  </span>
                )}
                {(t.status === 'approved' || !t.status) && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold">
                    ✓ {isVi ? 'Đã duyệt' : 'Approved'}
                  </span>
                )}
              </div>

              {/* Plays */}
              {statusFilter !== 'pending' && (
                <div className="hidden sm:flex w-20 flex-shrink-0 items-center justify-end">
                  <span className="text-xs text-zinc-500 font-semibold tabular-nums">
                    {formatPlaysShort(t.play_count || 0, isVi)}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="w-52 flex-shrink-0 flex items-center justify-end gap-1">
                {t.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'approved')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-emerald-500/25 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20"
                    title={isVi ? 'Duyệt bài hát này' : 'Approve this song'}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isVi ? 'Duyệt' : 'Approve'}</span>
                  </button>
                )}

                {t.status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'rejected')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-rose-500/20 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/20"
                    title={isVi ? 'Từ chối bài hát này' : 'Reject this song'}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{isVi ? 'Từ chối' : 'Reject'}</span>
                  </button>
                )}

                <button
                  onClick={() => setEditingTrack({ ...t })}
                  className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                  title={isVi ? 'Chỉnh sửa' : 'Edit'}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => del(t.id)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  title={isVi ? 'Xóa bài hát' : 'Delete song'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {displayedTracks.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🎵</div>
              <p className="text-zinc-500 text-sm font-medium">{isVi ? 'Không tìm thấy bài hát nào.' : 'No tracks found.'}</p>
              <p className="text-zinc-700 text-xs mt-1">{isVi ? 'Thử thay đổi bộ lọc hoặc tìm kiếm khác.' : 'Try changing the filter or search term.'}</p>
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
