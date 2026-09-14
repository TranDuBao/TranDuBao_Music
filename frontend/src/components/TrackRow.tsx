import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMusicStore } from '../store/useMusicStore';
import { useAuthStore } from '../store/useAuthStore';
import { useModalStore } from '../store/useModalStore';
import type { Track } from '../store/useMusicStore';
import { Play, Trash2, Plus, Music, Disc, Heart, GripVertical, Check, X } from 'lucide-react';
import axios from 'axios';
import { getAbsoluteUrl, API_BASE } from '../config';
import { getCategoryIcon } from '../utils/format';
import { TrackHoverPreview } from './TrackHoverPreview';

interface TrackRowProps {
  track: Track;
  index: number;
  showDelete?: boolean;
  tracksContext?: Track[];
  // Drag-and-drop props (optional — only passed when dragMode is enabled)
  dragMode?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: () => void;
}

export default function TrackRow({
  track, index, showDelete, tracksContext,
  dragMode, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd
}: TrackRowProps) {
  const { t, i18n } = useTranslation();
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    playlists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    currentPlaylist,
    deleteTrack,
    favorites,
    toggleFavorite,
    fetchTracks
  } = useMusicStore();
  const { isAdmin, token } = useAuthStore();
  const { showAlert } = useModalStore();

  const handleAdminApprove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await axios.put(`${API_BASE}/tracks/${track.id}/status`, { status: 'approved' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showAlert(
          i18n.language === 'vi' ? 'Thành công' : 'Success',
          i18n.language === 'vi' ? 'Đã duyệt bài hát thành công!' : 'Song approved successfully!',
          'success'
        );
        fetchTracks();
      }
    } catch (err: any) {
      showAlert(i18n.language === 'vi' ? 'Thất bại' : 'Failed', err.response?.data?.message || 'Lỗi khi duyệt bài hát', 'error');
    }
  };

  const handleAdminReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await axios.put(`${API_BASE}/tracks/${track.id}/status`, { status: 'rejected' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showAlert(
          i18n.language === 'vi' ? 'Thành công' : 'Success',
          i18n.language === 'vi' ? 'Đã từ chối bài hát!' : 'Song rejected!',
          'success'
        );
        fetchTracks();
      }
    } catch (err: any) {
      showAlert(i18n.language === 'vi' ? 'Thất bại' : 'Failed', err.response?.data?.message || 'Lỗi khi từ chối bài hát', 'error');
    }
  };

  const [showPlaylists, setShowPlaylists] = useState(false);
  const isFavorited = (favorites || []).includes(track.id);

  const isActive = currentTrack?.id === track.id;

  const handlePlayClick = () => {
    if (isActive) {
      togglePlay();
    } else {
      playTrack(track, tracksContext);
    }
  };

  const formatDuration = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleAddToPlaylist = async (playlistId: number) => {
    await addTrackToPlaylist(playlistId, track.id);
    setShowPlaylists(false);
  };

  const handleRemoveFromPlaylist = async () => {
    if (currentPlaylist) {
      await removeTrackFromPlaylist(currentPlaylist.id, track.id);
    }
  };

  return (
    <div
      className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 border ${isDragOver
          ? 'border-purple-500/60 bg-purple-950/20 scale-[1.01] shadow-lg shadow-purple-500/10'
          : isActive
            ? 'bg-purple-950/20 border-purple-500/20 shadow-sm'
            : 'hover:bg-white/5 border-transparent'
        } ${dragMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
      draggable={dragMode}
      onDragStart={dragMode ? (e) => onDragStart?.(e, index) : undefined}
      onDragOver={dragMode ? (e) => { e.preventDefault(); onDragOver?.(e, index); } : undefined}
      onDrop={dragMode ? (e) => onDrop?.(e, index) : undefined}
      onDragEnd={dragMode ? onDragEnd : undefined}
    >
      {/* Column 1: Info (DragHandle, Index, Cover, Title/Artist) */}
      <div className="flex items-center gap-4 flex-1 min-w-0 pr-8">
        {/* Drag Handle (only visible in drag mode) */}
        {dragMode && (
          <div className="flex-shrink-0 text-zinc-600 hover:text-purple-400 transition-colors cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Index/Play Button */}
        <div className="w-8 flex items-center justify-center flex-shrink-0">
          {isActive ? (
            <button
              onClick={handlePlayClick}
              className="text-purple-400 hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <div className="flex gap-0.5 items-end justify-center h-5 w-5">
                  <div className="sound-bar"></div>
                  <div className="sound-bar"></div>
                  <div className="sound-bar"></div>
                  <div className="sound-bar"></div>
                </div>
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </button>
          ) : (
            <>
              <span className="text-zinc-600 text-sm group-hover:hidden">{index + 1}</span>
              <button
                onClick={handlePlayClick}
                className="hidden group-hover:flex text-zinc-300 hover:text-white transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            </>
          )}
        </div>

        {/* Cover Art & Title wrapped with Hover Preview */}
        <TrackHoverPreview track={track}>
          <div className="flex items-center gap-3.5 min-w-0 cursor-pointer">
            {/* Cover Art */}
            <div className="w-11 h-11 rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center relative flex-shrink-0 border border-white/5 shadow-sm">
              {track.cover_url ? (
                <img src={getAbsoluteUrl(track.cover_url)} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <Music className="text-zinc-600 w-5 h-5" />
              )}
              {isActive && isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Disc className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              )}
            </div>

            {/* Title, Artist */}
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-semibold truncate ${isActive ? 'text-purple-400' : 'text-zinc-200'}`}
                title={`${track.title} - ${track.artist}`}
              >
                {track.title}
              </p>
              <p className="text-xs text-zinc-400 truncate mt-0.5" title={track.artist}>{track.artist}</p>
            </div>
          </div>
        </TrackHoverPreview>
      </div>

      {/* Dedicated Uploader Column (Aligned vertically) */}
      <div className="hidden md:flex w-40 flex-shrink-0 items-center">
        {track.uploader_name ? (
          <span className="text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-semibold truncate max-w-[150px] inline-flex items-center gap-1.5" title={`Người đăng: ${track.uploader_name}`}>
            <span className="text-xs">👤</span>
            <span className="truncate">{track.uploader_name}</span>
          </span>
        ) : (
          <span className="text-[11px] text-zinc-600 italic">--</span>
        )}
      </div>

      {/* Column 2: Album / Source (Hidden on small screen) */}
      <div className="hidden lg:block w-28 flex-shrink-0 text-xs text-zinc-400 truncate">
        {track.album}
      </div>

      {/* Column 3: Category & Genre Tags & Status Badge (Hidden on mobile) */}
      <div className="hidden sm:flex w-48 flex-shrink-0 items-center gap-1.5 flex-wrap">
        {track.status === 'pending' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold animate-pulse">
            ⏳ {i18n.language === 'vi' ? 'Chờ duyệt' : 'Pending'}
          </span>
        )}
        {track.status === 'rejected' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold">
            ❌ {i18n.language === 'vi' ? 'Bị từ chối' : 'Rejected'}
          </span>
        )}
        {track.category_name && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full border font-bold"
            style={{
              backgroundColor: `${track.category_color || '#7c3aed'}15`,
              borderColor: `${track.category_color || '#7c3aed'}30`,
              color: track.category_color || '#a78bfa'
            }}
          >
            {getCategoryIcon(track.category_name, track.category_icon)} {track.category_name}
          </span>
        )}
        {track.genre && track.genre !== track.category_name && (
          <span className="text-[10px] bg-zinc-800/80 text-zinc-400 px-2 py-0.5 rounded-full border border-white/5">
            {track.genre}
          </span>
        )}
      </div>

      {/* Right section: Duration, More controls */}
      <div className="flex items-center gap-4 ml-4 flex-shrink-0">
        <span className="text-xs text-zinc-500 font-medium">{formatDuration(track.duration)}</span>

        {/* Action buttons */}
        <div className="flex items-center gap-2 relative">
          {/* Admin Approval Buttons */}
          {isAdmin() && track.status !== 'approved' && (
            <div className="flex items-center gap-1.5 mr-1">
              <button
                onClick={handleAdminApprove}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all shadow-sm"
                title={i18n.language === 'vi' ? 'Xác nhận duyệt bài hát' : 'Approve song'}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{i18n.language === 'vi' ? 'Duyệt' : 'Approve'}</span>
              </button>
              <button
                onClick={handleAdminReject}
                className="flex items-center gap-1 px-2 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold transition-all"
                title={i18n.language === 'vi' ? 'Từ chối bài hát' : 'Reject song'}
              >
                <X className="w-3.5 h-3.5" />
                <span>{i18n.language === 'vi' ? 'Từ chối' : 'Reject'}</span>
              </button>
            </div>
          )}
          {/* Favorite button */}
          <button
            onClick={() => toggleFavorite(track.id)}
            className={`p-2 rounded-lg hover:bg-white/5 transition-all ${isFavorited ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-400'}`}
            title={isFavorited ? (i18n.language === 'vi' ? 'Bỏ yêu thích' : 'Unfavorite') : (i18n.language === 'vi' ? 'Yêu thích' : 'Favorite')}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
          </button>

          {/* Add to playlist / Remove from playlist button */}
          {currentPlaylist ? (
            <button
              onClick={handleRemoveFromPlaylist}
              className="text-zinc-500 hover:text-rose-400 p-2 rounded-lg hover:bg-white/5 transition-all"
              title={t('tracks.removeFromPlaylist')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowPlaylists(!showPlaylists)}
                className="text-zinc-500 hover:text-purple-400 p-2 rounded-lg hover:bg-white/5 transition-all"
                title={t('tracks.addToPlaylist')}
              >
                <Plus className="w-4 h-4" />
              </button>

              {showPlaylists && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowPlaylists(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl py-1 z-20">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      {t('tracks.addToPlaylist')}
                    </p>
                    {playlists.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-zinc-600 italic">{t('playlists.noPlaylists')}</p>
                    ) : (
                      playlists.map((pl) => (
                        <button
                          key={pl.id}
                          onClick={() => handleAddToPlaylist(pl.id)}
                          className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-purple-600 hover:text-white transition-all truncate"
                        >
                          {pl.name}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Delete track entirely if permitted */}
          {showDelete && !currentPlaylist && (
            <button
              onClick={() => deleteTrack(track.id)}
              className="text-zinc-500 hover:text-rose-500 p-2 rounded-lg hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
              title={t('tracks.deleteSong')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
