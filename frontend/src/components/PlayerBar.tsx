import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMusicStore } from '../store/useMusicStore';
import { useThemeStore } from '../store/useThemeStore';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Repeat1, Disc, Heart, ChevronDown, Maximize2 } from 'lucide-react';
import { getAbsoluteUrl } from '../config';

export default function PlayerBar() {
  const { t } = useTranslation();
  const { isDark } = useThemeStore();
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    progress,
    setProgress,
    volume,
    setVolume,
    playNext,
    playPrevious,
    isShuffle,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    favorites,
    toggleFavorite
  } = useMusicStore();

  const [preMuteVolume, setPreMuteVolume] = useState(0.7);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [showMobileVolume, setShowMobileVolume] = useState(false);

  const duration = currentTrack ? currentTrack.duration : 0;
  const isFavorited = currentTrack ? (favorites || []).includes(currentTrack.id) : false;

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSeeking(true);
    setSeekValue(Number(e.target.value));
  };

  const handleSeekCommit = (val?: number) => {
    const target = val !== undefined ? val : seekValue;
    setIsSeeking(false);
    setProgress(target);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPreMuteVolume(volume);
      setVolume(0);
    } else {
      setVolume(preMuteVolume);
    }
  };

  // Calculate percentages for sliders
  const activeProgress = isSeeking ? seekValue : progress;
  const progressPercent = duration > 0 ? (activeProgress / duration) * 100 : 0;
  const volumePercent = volume * 100;

  return (
    <>
      {/* ── 1. MAIN PLAYER BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 w-full max-w-full h-16 sm:h-22 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-3 sm:px-6 z-40 select-none overflow-hidden box-border shadow-2xl">

        {/* ── Top Edge Progress Bar for Mobile (< sm) ── */}
        <div className="absolute top-0 left-0 right-0 w-full sm:hidden h-[2.5px] z-50">
          <input
            type="range"
            min="0"
            max={duration}
            value={activeProgress}
            onChange={handleSeekChange}
            onMouseUp={() => handleSeekCommit()}
            onTouchEnd={() => handleSeekCommit()}
            onKeyUp={() => handleSeekCommit()}
            disabled={!currentTrack}
            style={{
              background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${progressPercent}%, #27272a ${progressPercent}%, #27272a 100%)`
            }}
            className="w-full music-slider-mobile cursor-pointer"
          />
        </div>

        {/* ── MOBILE VIEW (< sm): Perfectly Centered 3-Column Player Bar Layout ── */}
        <div className="relative flex sm:hidden items-center justify-between w-full h-full px-3">
          {/* 1. Left: Track Info & Artwork (Click to expand full screen player) */}
          <div
            onClick={() => currentTrack && setIsMobileExpanded(true)}
            className="flex items-center gap-2 min-w-0 max-w-[calc(50vw-82px)] cursor-pointer py-1 z-10"
          >
            {currentTrack ? (
              <>
                <div className={`w-9.5 h-9.5 overflow-hidden bg-zinc-800 border border-white/10 relative flex-shrink-0 flex items-center justify-center transition-all duration-500 shadow-md ${isPlaying ? 'rounded-full rotate-animation' : 'rounded-xl'
                  }`}>
                  <img
                    src={getAbsoluteUrl(currentTrack.cover_url)}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover rounded-full"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Disc className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left pr-1">
                  <h4 className="text-xs font-bold text-white truncate leading-tight">
                    {currentTrack.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                    {currentTrack.artist}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-left min-w-0">
                <h4 className="text-xs font-semibold text-zinc-400 truncate">{t('player.noSongSelected')}</h4>
                <p className="text-[10px] text-zinc-600 truncate">{t('player.chooseSong')}</p>
              </div>
            )}
          </div>

          {/* 2. Middle: Playback Controls (100% DEAD CENTER of the screen) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center gap-2 z-20">
            <button
              onClick={(e) => { e.stopPropagation(); playPrevious(); }}
              disabled={!currentTrack}
              className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30 p-1"
              title="Previous"
            >
              <SkipBack className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              disabled={!currentTrack}
              className="w-9.5 h-9.5 rounded-full bg-white text-black flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-50 flex-shrink-0"
              title="Play/Pause"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); playNext(); }}
              disabled={!currentTrack}
              className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30 p-1"
              title="Next"
            >
              <SkipForward className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* 3. Right: Interaction & Speaker Volume Popup (Favorite | Speaker Toggle) */}
          <div className="flex items-center justify-end gap-1.5 z-10 max-w-[calc(50vw-82px)] flex-shrink-0">
            {/* Heart Favorite Button */}
            <button
              onClick={(e) => { e.stopPropagation(); currentTrack && toggleFavorite(currentTrack.id); }}
              disabled={!currentTrack}
              className={`p-1 transition-all disabled:opacity-30 ${isFavorited ? 'text-purple-400 scale-110' : 'text-zinc-400 hover:text-white'}`}
              title="Favorite"
            >
              <Heart className={`w-4.5 h-4.5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>

            {/* Speaker Button -> Toggles Mobile Volume Popup */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowMobileVolume(v => !v); }}
              disabled={!currentTrack}
              className={`p-1 transition-all disabled:opacity-30 ${showMobileVolume ? 'text-purple-400 scale-110' : 'text-zinc-400 hover:text-white'}`}
              title="Volume"
            >
              {volume === 0 ? <VolumeX className="w-4.5 h-4.5 text-rose-400" /> : <Volume2 className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Floating Mobile Volume Popover Overlay */}
        {showMobileVolume && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMobileVolume(false)}
            />
            <div className="absolute bottom-16 right-3 bg-zinc-900/95 border border-white/10 backdrop-blur-xl px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={toggleMute}
                className="text-zinc-400 hover:text-white"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${volumePercent}%, #27272a ${volumePercent}%, #27272a 100%)`
                }}
                className="w-24 music-slider cursor-pointer"
              />
              <span className="text-[11px] font-bold text-purple-300 w-7 text-right select-none">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </>
        )}

        {/* ── DESKTOP VIEW (>= sm): Standard Expanded Player Bar ── */}
        <div className="hidden sm:flex items-center justify-between w-full h-full">
          {/* 1. Left: Current song info */}
          <div className="flex items-center gap-3 w-[30%] min-w-0 pr-2">
            {currentTrack ? (
              <>
                <div className={`w-13 h-13 overflow-hidden bg-zinc-800 border border-white/10 relative flex-shrink-0 flex items-center justify-center transition-all duration-500 ${isPlaying ? 'rounded-full rotate-animation' : 'rounded-xl'
                  }`}>
                  <img
                    src={getAbsoluteUrl(currentTrack.cover_url)}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover rounded-full"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Disc className="w-5 h-5 text-purple-400 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="text-sm font-bold text-white truncate hover:underline cursor-pointer leading-tight">
                    {currentTrack.title}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {currentTrack.artist}
                  </p>
                </div>
                <button
                  onClick={() => toggleFavorite(currentTrack.id)}
                  className={`p-1.5 transition-all ${isFavorited ? 'text-purple-400 scale-110' : 'text-zinc-500 hover:text-white'}`}
                  title="Favorite"
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              </>
            ) : (
              <div className="text-left min-w-0">
                <h4 className="text-sm font-semibold text-zinc-400 truncate">{t('player.noSongSelected')}</h4>
                <p className="text-xs text-zinc-600 truncate">{t('player.chooseSong')}</p>
              </div>
            )}
          </div>

          {/* 2. Middle: Player Controls & Timeline */}
          <div className="flex flex-col items-center justify-center w-[40%] max-w-xl h-full py-1">
            <div className="flex items-center gap-6 my-auto">
              <button
                onClick={toggleShuffle}
                className={`transition-all p-1 ${isShuffle ? 'text-purple-500 hover:text-purple-400' : 'text-zinc-500 hover:text-white'}`}
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={playPrevious}
                disabled={!currentTrack}
                className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30 p-1.5"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                disabled={!currentTrack}
                className="w-11 h-11 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                disabled={!currentTrack}
                className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30 p-1.5"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`transition-all p-1 disabled:opacity-30 ${repeatMode !== 'none' ? 'text-purple-500 hover:text-purple-400' : 'text-zinc-500 hover:text-white'}`}
                title="Repeat"
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Desktop Timeline Slider */}
            <div className="flex w-full items-center gap-3 mt-1">
              <span className="text-[10px] font-semibold text-zinc-500 w-8 text-right leading-none select-none">
                {formatTime(activeProgress)}
              </span>
              <div className="flex-1 relative group py-2 flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={activeProgress}
                  onChange={handleSeekChange}
                  onMouseUp={() => handleSeekCommit()}
                  onTouchEnd={() => handleSeekCommit()}
                  onKeyUp={() => handleSeekCommit()}
                  disabled={!currentTrack}
                  style={{
                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${progressPercent}%, ${isDark ? '#27272a' : '#cbd5e1'} ${progressPercent}%, ${isDark ? '#27272a' : '#cbd5e1'} 100%)`
                  }}
                  className="w-full music-slider"
                />
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 w-8 leading-none select-none">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* 3. Right: Desktop Volume Slider */}
          <div className="flex items-center gap-3.5 w-[30%] justify-end min-w-0">
            <button
              onClick={toggleMute}
              disabled={!currentTrack}
              className="text-zinc-400 hover:text-white transition-all disabled:opacity-50"
            >
              {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="w-24 py-2 flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                disabled={!currentTrack}
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${volumePercent}%, #27272a ${volumePercent}%, #27272a 100%)`
                }}
                className="w-full music-slider"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. FULL-SCREEN MOBILE PLAYER OVERLAY (< sm) ── */}
      {isMobileExpanded && currentTrack && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black flex flex-col justify-between p-6 sm:hidden animate-in fade-in duration-200 select-none">
          {/* Top Bar: Close Chevron & Title */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setIsMobileExpanded(false)}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-900/80 rounded-full border border-white/10"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              {t('player.nowPlaying') || 'Đang Phát'}
            </span>
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className={`p-2 rounded-full border border-white/10 ${isFavorited ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-400 bg-zinc-900/80'}`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Album Cover Art */}
          <div className="my-auto py-6 flex flex-col items-center">
            <div className={`w-64 h-64 sm:w-72 sm:h-72 overflow-hidden bg-zinc-800 border-2 border-white/10 shadow-2xl relative flex items-center justify-center transition-all duration-700 ${isPlaying ? 'rounded-full rotate-animation shadow-purple-500/20' : 'rounded-3xl'
              }`}>
              <img
                src={getAbsoluteUrl(currentTrack.cover_url)}
                alt={currentTrack.title}
                className="w-full h-full object-cover rounded-full"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Disc className="w-12 h-12 text-purple-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Song Title & Artist */}
            <div className="text-center mt-6 max-w-xs">
              <h2 className="text-xl font-extrabold text-white truncate leading-tight">
                {currentTrack.title}
              </h2>
              <p className="text-sm font-medium text-zinc-400 truncate mt-1">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Mobile Full Progress Bar */}
          <div className="w-full space-y-2 mb-4">
            <input
              type="range"
              min="0"
              max={duration}
              value={activeProgress}
              onChange={handleSeekChange}
              onMouseUp={() => handleSeekCommit()}
              onTouchEnd={() => handleSeekCommit()}
              onKeyUp={() => handleSeekCommit()}
              style={{
                background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${progressPercent}%, #27272a ${progressPercent}%, #27272a 100%)`
              }}
              className="w-full music-slider cursor-pointer"
            />
            <div className="flex justify-between text-xs font-semibold text-zinc-400 px-0.5">
              <span>{formatTime(activeProgress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Full Player Main Controls */}
          <div className="flex items-center justify-between px-4 pb-6">
            <button
              onClick={toggleShuffle}
              className={`p-2 transition-all ${isShuffle ? 'text-purple-400 scale-110' : 'text-zinc-500'}`}
            >
              <Shuffle className="w-6 h-6" />
            </button>

            <button
              onClick={playPrevious}
              className="p-3 text-white active:scale-90 transition-transform"
            >
              <SkipBack className="w-8 h-8" />
            </button>

            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
              )}
            </button>

            <button
              onClick={playNext}
              className="p-3 text-white active:scale-90 transition-transform"
            >
              <SkipForward className="w-8 h-8" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`p-2 transition-all ${repeatMode !== 'none' ? 'text-purple-400 scale-110' : 'text-zinc-500'}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-6 h-6" /> : <Repeat className="w-6 h-6" />}
            </button>
          </div>
        </div>
      )}

      {/* ── CSS Animations & Custom Sliders ── */}
      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotate-animation {
          animation: rotate 12s linear infinite;
        }
        input[type="range"].music-slider-mobile {
          -webkit-appearance: none;
          appearance: none;
          background: #27272a;
          height: 2.5px;
          width: 100%;
          margin: 0;
          padding: 0;
          outline: none;
          display: block;
        }
        input[type="range"].music-slider-mobile::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          width: 8px;
          border-radius: 50%;
          background: #ffffff;
          border: 1.5px solid #a855f7;
          box-shadow: 0 0 6px rgba(168, 85, 247, 0.8);
          cursor: pointer;
        }
        input[type="range"].music-slider-mobile::-moz-range-thumb {
          height: 8px;
          width: 8px;
          border-radius: 50%;
          background: #ffffff;
          border: 1.5px solid #a855f7;
          box-shadow: 0 0 6px rgba(168, 85, 247, 0.8);
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
