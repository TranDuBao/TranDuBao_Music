import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Clock, Music } from 'lucide-react';
import { getAbsoluteUrl } from '../config';
import { getCategoryIcon } from '../utils/format';

interface TrackHoverPreviewProps {
  track: {
    id: number;
    title: string;
    artist: string;
    album?: string;
    cover_url?: string;
    genre?: string;
    category_name?: string;
    category_icon?: string;
    category_color?: string;
    uploader_name?: string;
    status?: string;
    duration?: number;
    play_count?: number;
  };
  children: React.ReactNode;
}

export const TrackHoverPreview: React.FC<TrackHoverPreviewProps> = ({ track, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean }>({ top: 0, left: 0, placeAbove: true });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatDuration = (secs?: number) => {
    if (!secs) return '3:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const cardWidth = 270;
    const cardHeight = 280;

    let left = rect.left;
    if (left + cardWidth > window.innerWidth - 20) {
      left = window.innerWidth - cardWidth - 20;
    }
    if (left < 20) left = 20;

    let placeAbove = true;
    let top = rect.top - cardHeight - 8;
    if (top < 10) {
      placeAbove = false;
      top = rect.bottom + 8;
    }

    setCoords({ top, left, placeAbove });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  const cardContent = isVisible ? (
    <div
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 9999,
      }}
      className="w-64 p-3.5 bg-zinc-950/95 border border-purple-500/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-2xl flex flex-col gap-2.5 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Cover Art */}
      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-lg group/img">
        {track.cover_url ? (
          <img
            src={getAbsoluteUrl(track.cover_url)}
            alt={track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-purple-950/30 text-purple-400">
            <Music className="w-10 h-10 opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

        {/* Status Badge overlay */}
        <div className="absolute top-2 left-2">
          {track.status === 'pending' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/90 text-white border-amber-400 font-bold backdrop-blur-md shadow-lg">
              ⏳ Chờ duyệt
            </span>
          )}
          {track.status === 'rejected' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-rose-500/90 text-white border-rose-400 font-bold backdrop-blur-md shadow-lg">
              ❌ Bị từ chối
            </span>
          )}
          {(track.status === 'approved' || !track.status) && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/90 text-white border-emerald-400 font-bold backdrop-blur-md shadow-lg">
              ✓ Đã duyệt
            </span>
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="space-y-1">
        <h4 className="text-sm font-extrabold text-white leading-tight break-words line-clamp-2">
          {track.title}
        </h4>
        <p className="text-xs font-semibold text-purple-400 truncate">
          🎤 {track.artist}
        </p>
        {track.album && track.album !== 'Single' && (
          <p className="text-[11px] text-zinc-400 truncate">
            💿 Album: <span className="text-zinc-300 font-medium">{track.album}</span>
          </p>
        )}
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between gap-1 pt-2 border-t border-white/10 text-[10px]">
        {track.uploader_name ? (
          <span className="text-amber-300 font-semibold truncate max-w-[120px]" title={`Người up: ${track.uploader_name}`}>
            👤 {track.uploader_name}
          </span>
        ) : (
          <span className="text-zinc-500">MusicStream</span>
        )}

        <div className="flex items-center gap-1.5">
          {track.category_name && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
              {getCategoryIcon(track.category_name, track.category_icon)} {track.category_name}
            </span>
          )}
          <span className="text-zinc-400 flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {formatDuration(track.duration)}
          </span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex-1 min-w-0"
    >
      {children}
      {typeof document !== 'undefined' && cardContent ? ReactDOM.createPortal(cardContent, document.body) : null}
    </div>
  );
};
