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
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const duration = currentTrack ? currentTrack.duration : 0;

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
    <div className="fixed bottom-0 left-0 right-0 h-20 sm:h-24 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-between px-4 sm:px-6 z-40 select-none">
      {/* 1. Left: Current song info */}
      <div className="flex items-center gap-2.5 flex-1 sm:flex-initial sm:w-[30%] min-w-0">
        {currentTrack ? (
          <>
            <div className={`w-10 h-10 sm:w-14 sm:h-14 overflow-hidden bg-zinc-800 border border-white/10 relative flex-shrink-0 flex items-center justify-center transition-all duration-500 ${
              isPlaying ? 'rounded-full rotate-animation' : 'rounded-lg sm:rounded-xl'
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
              <h4 className="text-xs sm:text-sm font-semibold text-white truncate hover:underline cursor-pointer">
                {currentTrack.title}
              </h4>
              <p className="text-[10px] sm:text-xs text-zinc-400 truncate">
                {currentTrack.artist}
              </p>
            </div>
          </>
        ) : (
          <div className="text-left">
            <h4 className="text-xs sm:text-sm font-semibold text-zinc-400">{t('player.noSongSelected')}</h4>
            <p className="text-[10px] sm:text-xs text-zinc-600">{t('player.chooseSong')}</p>
          </div>
        )}
      </div>

      {/* 2. Middle: Player Controls */}
      <div className="flex flex-col items-center justify-center w-[40%] max-w-xl">
        <div className="flex items-center gap-4 sm:gap-6 mb-1.5">
          <button 
            onClick={toggleShuffle} 
            className={`transition-all p-1 hidden sm:block ${isShuffle ? 'text-purple-500 hover:text-purple-400' : 'text-zinc-500 hover:text-white'}`} 
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button 
            onClick={playPrevious}
            disabled={!currentTrack}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30 p-1"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button 
            onClick={togglePlay}
            disabled={!currentTrack}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 flex-shrink-0"
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
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30 p-1"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button 
            onClick={toggleRepeat} 
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
          <span className="text-[10px] font-semibold text-zinc-500 w-8 text-right hidden sm:inline-block leading-none select-none">
            {formatTime(activeProgress)}
          </span>
          <div className="flex-1 relative group py-0 sm:py-2 flex items-center">
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
              className="w-full music-slider"
            />
          </div>
          <span className="text-[10px] font-semibold text-zinc-500 w-8 hidden sm:inline-block leading-none select-none">
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
