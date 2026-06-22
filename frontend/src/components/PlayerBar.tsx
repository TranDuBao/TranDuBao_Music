import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMusicStore } from '../store/useMusicStore';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Repeat1, Disc } from 'lucide-react';
import { getAbsoluteUrl } from '../config';

export default function PlayerBar() {
  const { t } = useTranslation();
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
    toggleRepeat
  } = useMusicStore();

  const [preMuteVolume, setPreMuteVolume] = useState(0.7);

  const duration = currentTrack ? currentTrack.duration : 0;

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgress(Number(e.target.value));
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
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const volumePercent = volume * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 sm:h-24 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-between px-4 sm:px-6 z-40 select-none">
      {/* 1. Left: Current song info */}
      <div className="flex items-center gap-2.5 flex-1 sm:flex-initial sm:w-[30%] min-w-0">
        {currentTrack ? (
          <>
            <div className={`w-10 h-10 sm:w-14 sm:h-14 overflow-hidden bg-zinc-800 border border-white/10 relative flex-shrink-0 flex items-center justify-center transition-all duration-500 ${
              isPlaying ? 'rounded-full' : 'rounded-lg sm:rounded-xl'
            }`}>
              <img
                src={getAbsoluteUrl(currentTrack.cover_url)}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  isPlaying ? 'rotate-animation rounded-full' : ''
                }`}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 bg-zinc-950 rounded-full border border-purple-400" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate hover:text-purple-400 cursor-pointer">
                {currentTrack.title}
              </h4>
              <p className="text-[10px] sm:text-xs text-zinc-400 truncate mt-0.5">{currentTrack.artist}</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-zinc-900 border border-dashed border-white/5 flex-shrink-0 flex items-center justify-center">
              <Disc className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-700" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-zinc-500">{t('player.noSong')}</h4>
              <p className="text-[10px] sm:text-xs text-zinc-600 mt-0.5">{t('player.selectSong')}</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Center: Controls & Timeline */}
      <div className="flex flex-col items-center gap-1 sm:gap-2.5 flex-shrink-0 sm:w-[40%] sm:max-w-[500px]">
        {/* Control Buttons */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button 
            onClick={toggleShuffle}
            disabled={!currentTrack}
            className={`transition-all p-1 disabled:opacity-30 hidden sm:block ${isShuffle ? 'text-purple-500 hover:text-purple-400' : 'text-zinc-500 hover:text-white'}`} 
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          
          <button
            onClick={playPrevious}
            disabled={!currentTrack}
            className="text-zinc-400 hover:text-white transition-all disabled:opacity-30 p-1"
          >
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>
          
          <button
            onClick={togglePlay}
            disabled={!currentTrack}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={playNext}
            disabled={!currentTrack}
            className="text-zinc-400 hover:text-white transition-all disabled:opacity-30 p-1"
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>

          <button 
            onClick={toggleRepeat}
            disabled={!currentTrack}
            className={`transition-all p-1 disabled:opacity-30 hidden sm:block ${repeatMode !== 'none' ? 'text-purple-500 hover:text-purple-400' : 'text-zinc-500 hover:text-white'}`} 
            title="Repeat"
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="absolute top-0 left-0 right-0 sm:relative sm:top-auto sm:left-auto sm:right-auto sm:w-full flex items-center gap-3 px-0 sm:px-0">
          <span className="text-[10px] font-semibold text-zinc-500 w-8 text-right hidden sm:inline-block">
            {formatTime(progress)}
          </span>
          <div className="flex-1 relative group py-0 sm:py-2">
            <input
              type="range"
              min="0"
              max={duration}
              value={progress}
              onChange={handleProgressChange}
              disabled={!currentTrack}
              style={{
                background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${progressPercent}%, #27272a ${progressPercent}%, #27272a 100%)`
              }}
              className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer outline-none transition-all accent-purple-500 disabled:opacity-30 rounded-none sm:rounded-full"
            />
          </div>
          <span className="text-[10px] font-semibold text-zinc-500 w-8 hidden sm:inline-block">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. Right: Volume and actions */}
      <div className="hidden sm:flex items-center gap-3.5 sm:w-[30%] justify-end min-w-0">
        <button
          onClick={toggleMute}
          disabled={!currentTrack}
          className="text-zinc-400 hover:text-white transition-all disabled:opacity-50"
        >
          {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <div className="w-24 py-2">
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
            className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer outline-none transition-all accent-purple-500 disabled:opacity-30"
          />
        </div>
      </div>

      {/* CSS Spin style for cover art rotation */}
      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotate-animation {
          animation: rotate 12s linear infinite;
        }
      `}</style>
    </div>
  );
}
