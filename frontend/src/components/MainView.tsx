import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMusicStore } from '../store/useMusicStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { Search, Plus, Music, Play, ChevronLeft, ChevronRight, Flame, TrendingUp, ArrowUpDown, Shuffle } from 'lucide-react';
import Avatar from './Avatar';
import TrackRow from './TrackRow';
import AddTrackModal from './AddTrackModal';
import AdminPanel from './AdminPanel';
import UserProfilePage from '../pages/UserProfilePage';
import FeaturedArtists from './FeaturedArtists';
import { formatCount } from '../utils/format';
import { BACKEND_URL, API_BASE, getAbsoluteUrl } from '../config';

interface Album {
  name: string;
  artist: string;
  cover_url: string;
  tracks: any[];
}

interface MainViewProps {
  view: 'all' | 'mine' | 'admin' | 'profile';
  setView: (v: 'all' | 'mine' | 'admin' | 'profile') => void;
  onUploadClick: () => void;
}

export default function MainView({ view, setView, onUploadClick }: MainViewProps) {
  const { t, i18n } = useTranslation();
  const { tracks, currentPlaylist, currentPlaylistTracks, searchQuery, setSearchQuery, fetchTracks, playTrack, currentTrack } = useMusicStore();
  const { user } = useAuthStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [backdrops, setBackdrops] = useState<string[]>([getAbsoluteUrl('/uploads/img/the_weeknd.png')]);
  const [bannerSlides, setBannerSlides] = useState<string[]>([
    `${BACKEND_URL}/uploads/img/banner_slide_1.png`,
    `${BACKEND_URL}/uploads/img/banner_slide_2.png`,
    `${BACKEND_URL}/uploads/img/banner_slide_3.png`,
    `${BACKEND_URL}/uploads/img/banner_slide_4.png`,
    `${BACKEND_URL}/uploads/img/banner_slide_5.png`
  ]);
  const [topWeekly, setTopWeekly] = useState<any[]>([]);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);

  const extendedBackdrops = React.useMemo(() => {
    return backdrops;
  }, [backdrops]);

  useEffect(() => {
    fetch(`${API_BASE}/tracks/recent-uploads`)
      .then(r => r.json())
      .then(json => { if (json.success) setRecentUploads(json.data); })
      .catch(() => { });
  }, [tracks]);

  const fetchAlbums = async () => {
    try {
      const res = await fetch(`${API_BASE}/albums`);
      const data = await res.json();
      if (data.success) {
        setAlbums(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch albums:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const bgRes = await fetch(`${API_BASE}/settings/backdrops`);
      const bgData = await bgRes.json();
      if (bgData.success && bgData.data) {
        const urls = bgData.data.map((item: any) => getAbsoluteUrl(item.image_url));
        if (urls.length > 0) {
          setBackdrops(urls);
        } else {
          setBackdrops([getAbsoluteUrl('/uploads/img/the_weeknd.png')]);
        }
      }

      const slidesRes = await fetch(`${API_BASE}/settings/banner-slides`);
      const slidesData = await slidesRes.json();
      if (slidesData.success && slidesData.data) {
        const urls = slidesData.data.map((item: any) => getAbsoluteUrl(item.image_url));
        if (urls.length > 0) {
          setBannerSlides(urls);
        } else {
          setBannerSlides([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAlbums();
    const handleReload = () => {
      fetchSettings();
      fetchAlbums();
    };
    window.addEventListener('reload-settings', handleReload);
    return () => window.removeEventListener('reload-settings', handleReload);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/tracks/top-weekly`)
      .then(r => r.json())
      .then(json => { if (json.success) setTopWeekly(json.data); })
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then(r => r.json())
      .then(json => { if (json.success) setCategories(json.data); })
      .catch(() => { });
  }, []);

  useEffect(() => {
    setSelectedCategoryId(null);
    setSelectedArtist(null);
    setSelectedAlbum(null);
  }, [currentPlaylist, view]);

  useEffect(() => {
    if (bannerSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerSlides]);

  useEffect(() => {
    if (view === 'admin' || view === 'profile') return;
    const delay = setTimeout(() => {
      if (!currentPlaylist) {
        fetchTracks(searchQuery, view === 'mine', selectedCategoryId);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery, currentPlaylist, view, fetchTracks, selectedCategoryId]);

  // Determine active tracks and labels
  const activeTracks = currentPlaylist ? currentPlaylistTracks : tracks;
  const listTitle = selectedAlbum
    ? `Album: ${selectedAlbum.name}`
    : selectedArtist
      ? (i18n.language === 'vi' ? `Bài hát của ${selectedArtist}` : `Songs by ${selectedArtist}`)
      : currentPlaylist
        ? currentPlaylist.name
        : view === 'mine'
          ? t('tracks.myTracks')
          : t('tracks.allTracks');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const mainRef = React.useRef<HTMLElement>(null);

  // ── Drag-and-drop reordering (only for 'mine' view) ──────────────
  const [dragOrderIds, setDragOrderIds] = useState<number[]>([]);
  const [dragMode, setDragMode] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragSourceIdx = React.useRef<number | null>(null);

  // Sync dragOrderIds whenever tracks change (reset custom order)
  useEffect(() => {
    if (view === 'mine') {
      setDragOrderIds(tracks.map(t => t.id));
    }
  }, [tracks, view]);

  // Compute the displayed tracks in drag order
  const orderedMineTracks = React.useMemo(() => {
    if (view !== 'mine' || dragOrderIds.length === 0) return activeTracks;
    const map = new Map(tracks.map(t => [t.id, t]));
    return dragOrderIds.map(id => map.get(id)).filter(Boolean) as typeof tracks;
  }, [view, dragOrderIds, tracks, activeTracks]);

  const filteredByArtist = React.useMemo(() => {
    let list = activeTracks;
    if (selectedAlbum) {
      const albumTrackIds = new Set(selectedAlbum.tracks?.map((t: any) => t.id) || []);
      list = list.filter(t => albumTrackIds.has(t.id));
    } else if (selectedArtist) {
      list = list.filter(t => t.artist.toLowerCase().includes(selectedArtist.toLowerCase()));
    }
    return list;
  }, [activeTracks, selectedArtist, selectedAlbum]);

  // Shuffle logic: each user gets a uniquely shuffled list by default.
  // Clicking "Shuffle" reshuffles the list to another random permutation.
  const [shuffleSeed, setShuffleSeed] = useState<number>(() => {
    const seed = user ? `${user.id || ''}_${user.name || ''}` : 'guest';
    let seedNum = 0;
    for (let i = 0; i < seed.length; i++) {
      seedNum += seed.charCodeAt(i);
    }
    return seedNum;
  });

  const handleShuffleClick = () => {
    setShuffleSeed(Math.random() * 10000000);
  };

  const shuffledTracks = React.useMemo(() => {
    const arr = [...filteredByArtist];
    let seedNum = shuffleSeed;
    
    // Linear Congruential Generator (LCG) for deterministic pseudo-random sequence per seed
    const lcg = () => {
      seedNum = (seedNum * 1664525 + 1013904223) % 4294967296;
      return seedNum / 4294967296;
    };

    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(lcg() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [filteredByArtist, shuffleSeed]);

  const displayedTracks = (view === 'mine' && !currentPlaylist)
    ? orderedMineTracks
    : (!currentPlaylist)
      ? shuffledTracks
      : filteredByArtist;

  const handleDragStart = (_e: React.DragEvent, idx: number) => {
    dragSourceIdx.current = idx;
  };
  const handleDragOver = (_e: React.DragEvent, idx: number) => {
    setDragOverIdx(idx);
  };
  const handleDrop = (_e: React.DragEvent, dropIdx: number) => {
    const srcIdx = dragSourceIdx.current;
    if (srcIdx === null || srcIdx === dropIdx) return;
    const newOrder = [...dragOrderIds];
    const [moved] = newOrder.splice(srcIdx, 1);
    newOrder.splice(dropIdx, 0, moved);
    setDragOrderIds(newOrder);
    dragSourceIdx.current = null;
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    dragSourceIdx.current = null;
    setDragOverIdx(null);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [currentPlaylist, view, searchQuery]);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [currentPage, view, currentPlaylist, searchQuery]);

  const totalPages = Math.ceil(displayedTracks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTracks = displayedTracks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (view === 'profile') {
    return (
      <main className="flex-1 flex flex-col h-full overflow-y-auto pb-32">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} disableSearch setView={setView} searchPlaceholder={i18n.language === 'vi' ? 'Không khả dụng ở phần này' : 'Not available in this section'} />
        <div className="p-8 max-w-5xl w-full mx-auto">
          <UserProfilePage />
        </div>
      </main>
    );
  }

  if (view === 'admin') {
    return (
      <main className="flex-1 flex flex-col h-full overflow-y-auto pb-32">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} disableSearch setView={setView} searchPlaceholder={i18n.language === 'vi' ? 'Không khả dụng ở phần này' : 'Not available in this section'} />
        <div className="p-8 max-w-5xl w-full mx-auto">
          <AdminPanel />
        </div>
      </main>
    );
  }

  return (
    <main ref={mainRef as any} className="flex-1 flex flex-col h-full overflow-y-auto pb-32 relative">
      <div className="relative w-full flex-1 flex flex-col min-h-full">
        {/* Sequential Background Images distributed vertically with spacing */}
        {extendedBackdrops.map((url, index) => (
          <div
            key={url + index}
            className="absolute left-0 right-0 h-[650px] bg-cover bg-center opacity-[0.20] transition-all duration-1000 z-0 pointer-events-none"
            style={{
              top: `${index * 1150}px`,
              backgroundImage: `url('${url}')`,
              maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
            }}
          />
        ))}

      {/* Dynamic blurred ambient glow from playing song */}
      {currentTrack && (
        <div
          className="fixed inset-0 bg-cover bg-center opacity-[0.10] blur-[100px] pointer-events-none transition-all duration-1000 ease-in-out scale-110 z-0"
          style={{ backgroundImage: `url('${getAbsoluteUrl(currentTrack.cover_url)}')` }}
        />
      )}

      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} disableSearch={!!currentPlaylist} setView={setView} />

      <div className="p-8 max-w-5xl w-full mx-auto space-y-8 relative z-10">
        {/* Hero Banner with Auto-rotating 5 animated video background */}
        <div className="theme-dark-always relative rounded-3xl overflow-hidden bg-zinc-950 p-8 md:p-10 border border-purple-500/15 shadow-2xl">
          {/* Slideshow background */}
          <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-br from-purple-900/20 via-indigo-950/10 to-zinc-950">
            {bannerSlides.map((src, index) => (
              <img
                key={src}
                src={src}
                alt={`Banner Slide ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${index === currentSlide ? 'opacity-35 scale-100 animate-kenburns' : 'opacity-0 scale-105'
                  }`}
              />
            ))}
            {/* Ambient glows and gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-transparent z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none z-10" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-pink-500/8 rounded-full blur-3xl pointer-events-none z-10" />
          </div>

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-20">
            <div className="space-y-3 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/15 px-3 py-1 rounded-full border border-purple-500/20">
                {view === 'mine' ? t('tracks.myTracks') : 'Premium Lofi Streaming'}
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {user ? (i18n.language === 'vi' ? `Xin chào, ${user.name.split(' ')[0]}! 👋` : `Hello, ${user.name.split(' ')[0]}! 👋`) : 'Your Sound, Reimagined.'}
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {view === 'mine'
                  ? (i18n.language === 'vi' ? 'Quản lý và phát lại những bài nhạc bạn đã tải lên.' : 'Manage and playback music you have uploaded.')
                  : (i18n.language === 'vi' ? 'Khám phá kho nhạc đa dạng, tạo playlist, và upload nhạc cá nhân của bạn.' : 'Discover diverse music, create playlists, and upload your personal music.')}
              </p>
              <div className="flex items-center gap-3">
                {view !== 'mine' && (
                  <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold rounded-full text-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    {t('tracks.addSong')}
                  </button>
                )}
                <button
                  onClick={onUploadClick}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-full text-sm transition-all shadow-lg"
                >
                  {t('tracks.uploadSong')}
                </button>
              </div>
            </div>
            <div className="hidden md:flex w-28 h-28 rounded-2xl bg-white/5 border border-white/10 items-center justify-center rotate-6 hover:rotate-0 transition-all duration-300">
              <Music className="w-14 h-14 text-purple-400 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Category filter bar (only show in 'all' or 'mine' view, not inside a playlist) */}
        {!currentPlaylist && categories.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">{i18n.language === 'vi' ? 'Danh mục bài hát' : 'Music Categories'}</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedCategoryId(null);
                  setSelectedArtist(null);
                  setSelectedAlbum(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${selectedCategoryId === null
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
                  }`}
              >
                <span>🌍</span>
                <span>{i18n.language === 'vi' ? 'Tất cả' : 'All'}</span>
              </button>
              {categories.map(c => {
                const active = selectedCategoryId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategoryId(c.id);
                      setSelectedArtist(null);
                      setSelectedAlbum(null);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer"
                    style={{
                      backgroundColor: active ? `${c.color}20` : undefined,
                      borderColor: active ? c.color : undefined,
                      color: active ? '#ffffff' : undefined,
                      boxShadow: active ? `0 4px 12px 0 ${c.color}25` : undefined
                    }}
                  >
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Track list header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{listTitle}</span>
              {(selectedArtist || selectedAlbum) && (
                <button
                  onClick={() => {
                    setSelectedArtist(null);
                    setSelectedAlbum(null);
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 hover:bg-purple-500/20 hover:text-white transition-all cursor-pointer"
                  title={i18n.language === 'vi' ? 'Xóa bộ lọc' : 'Clear filter'}
                >
                  ✕
                </button>
              )}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">{displayedTracks.length} {i18n.language === 'vi' ? 'bài hát' : 'songs'}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Drag-to-reorder toggle (only in 'mine' view, not inside a playlist) */}
            {view === 'mine' && !currentPlaylist && (
              <button
                onClick={() => setDragMode(prev => !prev)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all ${dragMode
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                  }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                {dragMode ? (i18n.language === 'vi' ? 'Xong' : 'Done') : (i18n.language === 'vi' ? 'Sắp xếp' : 'Sort')}
              </button>
            )}
            {/* Shuffle button (only outside playlist/mine views) */}
            {!currentPlaylist && view !== 'mine' && (
              <button
                onClick={handleShuffleClick}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border border-purple-500/25 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:text-white transition-all cursor-pointer shadow-lg shadow-purple-500/10"
              >
                <Shuffle className="w-4 h-4" />
                {i18n.language === 'vi' ? 'Xáo trộn bài hát' : 'Shuffle Songs'}
              </button>
            )}
            {displayedTracks.length > 0 && (
              <button
                onClick={() => playTrack(displayedTracks[0], displayedTracks)}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full text-sm transition-all self-start sm:self-auto cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                {t('tracks.playAll')}
              </button>
            )}
          </div>
        </div>

        {/* Track Rows */}
        <div className="space-y-1.5">
          {displayedTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-white/5 bg-white/[0.01]">
              <Music className="w-12 h-12 text-zinc-700 mb-4 animate-pulse" />
              <h3 className="font-semibold text-zinc-400">{t('tracks.noTracks')}</h3>
              <p className="text-xs text-zinc-600 max-w-xs mt-1 text-center">{t('tracks.noTracksDesc')}</p>
            </div>
          ) : (
            paginatedTracks.map((track, idx) => {
              const absoluteIdx = startIndex + idx;
              return (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={absoluteIdx}
                  showDelete={view === 'mine'}
                  dragMode={dragMode && view === 'mine' && !currentPlaylist}
                  isDragOver={dragOverIdx === absoluteIdx}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  tracksContext={displayedTracks}
                />
              );
            })
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900/60 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${currentPage === page
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25 border border-purple-500/20'
                  : 'bg-zinc-900/60 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900/60 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top 5 Weekly Tracks - only on home 'all' view, not playlist/mine */}
        {view === 'all' && !currentPlaylist && topWeekly.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-orange-500 to-rose-500 rounded-lg">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">{i18n.language === 'vi' ? 'Top 5 bài hát tuần này' : 'Top 5 Weekly Tracks'}</h2>
              <span className="text-xs bg-orange-500/15 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-semibold">{i18n.language === 'vi' ? 'HOT 🔥' : 'TRENDING 🔥'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {topWeekly.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track, topWeekly)}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/5 hover:border-orange-500/30 hover:bg-zinc-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/10 text-left"
                >
                  {/* Rank badge */}
                  <div className={`absolute top-2 left-2 z-10 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black shadow-lg ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black' :
                    i === 1 ? 'bg-gradient-to-br from-zinc-300 to-zinc-400 text-black' :
                      i === 2 ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white' :
                        'bg-zinc-800/90 text-zinc-400 border border-white/10'
                    }`}>
                    {i + 1}
                  </div>

                  {/* Cover art */}
                  <div className="relative w-full aspect-square overflow-hidden bg-zinc-800">
                    {track.cover_url
                      ? <img src={getAbsoluteUrl(track.cover_url)} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center"><Music className="w-10 h-10 text-zinc-600" /></div>
                    }
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40">
                        <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-0.5">
                    <p className="text-sm font-bold text-white truncate group-hover:text-orange-400 transition-colors">{track.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                    <div className="flex items-center gap-1 pt-1">
                      <TrendingUp className="w-3 h-3 text-orange-400" />
                      <span className="text-[10px] text-orange-400 font-semibold">{formatCount(track.weekly_plays || 0)} {i18n.language === 'vi' ? 'lượt / tuần' : ((track.weekly_plays || 0) === 1 ? 'play / week' : 'plays / week')}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Uploads (last 24h) - only on home 'all' view, not playlist/mine */}
        {view === 'all' && !currentPlaylist && recentUploads.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Music className="w-4 h-4 text-white animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-white">{i18n.language === 'vi' ? 'Nhạc mới tải lên (24h qua)' : 'Newly Uploaded (Last 24h)'}</h2>
              <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-semibold">{i18n.language === 'vi' ? 'MỚI ⚡' : 'NEW ⚡'}</span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {recentUploads.map((track) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track, recentUploads)}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/5 hover:border-green-500/30 hover:bg-zinc-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/10 text-left w-[170px] sm:w-[190px] flex-shrink-0"
                >
                  {/* Cover art */}
                  <div className="relative w-full aspect-square overflow-hidden bg-zinc-800">
                    {track.cover_url
                      ? <img src={getAbsoluteUrl(track.cover_url)} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center"><Music className="w-10 h-10 text-zinc-600" /></div>
                    }
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40">
                        <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-0.5 min-w-0 w-full">
                    <p className="text-sm font-bold text-white truncate group-hover:text-green-400 transition-colors">{track.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 truncate">{i18n.language === 'vi' ? `Tải lên bởi: ${track.uploader_name || 'Hệ thống'}` : `Uploaded by: ${track.uploader_name || 'System'}`}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Singer's Albums - only on home 'all' view, not playlist/mine */}
        {view === 'all' && !currentPlaylist && albums.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Music className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">{i18n.language === 'vi' ? 'Album nổi bật' : 'Featured Albums'}</h2>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {albums.map((album) => (
                <button
                  key={`${album.name}-${album.artist}`}
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setSelectedArtist(null);
                    setSelectedAlbum(album);
                    if (mainRef.current) {
                      mainRef.current.scrollTo({ top: 320, behavior: 'smooth' });
                    }
                  }}
                  className="flex-shrink-0 w-36 group text-left space-y-2 cursor-pointer focus:outline-none"
                >
                  {/* Album Cover */}
                  <div className="relative w-36 h-36 rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-purple-500/30 transition-all duration-300 shadow-lg group-hover:shadow-purple-500/10">
                    <img
                      src={getAbsoluteUrl(album.cover_url)}
                      alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/40 transform scale-90 group-hover:scale-100 transition-all duration-300">
                        <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  {/* Details */}
                  <div className="space-y-0.5 px-1">
                    <p className="text-sm font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                      {album.name}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {album.artist}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {album.tracks.length} {i18n.language === 'vi' ? 'bài hát' : 'songs'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured Artists Section */}
        {view === 'all' && (
          <FeaturedArtists
            onArtistClick={(name) => {
              setSelectedCategoryId(null);
              setSearchQuery('');
              setSelectedArtist(name);
              setSelectedAlbum(null);
              if (mainRef.current) {
                mainRef.current.scrollTo({ top: 320, behavior: 'smooth' });
              }
            }}
          />
        )}
      </div>

      <AddTrackModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      </div>
    </main>
  );
}

// Reusable header subcomponent
function Header({ searchQuery, setSearchQuery, disableSearch, setView, searchPlaceholder }: { searchQuery: string; setSearchQuery: (v: string) => void; disableSearch: boolean; setView: (v: 'all' | 'mine' | 'admin' | 'profile') => void; searchPlaceholder?: string }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  return (
    <header className="px-5 py-3 flex items-center justify-between border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 shadow-md">
      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
        <input
          type="text"
          placeholder={searchPlaceholder || (disableSearch ? t('tracks.searchDisabledInPlaylist') : t('tracks.searchPlaceholder'))}
          disabled={disableSearch}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/80 border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all disabled:opacity-40"
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">

        {/* Dark / Light mode toggle */}
        <button
          onClick={toggleTheme}
          title={
            isDark
              ? (i18n.language === 'vi' ? 'Chuyển sang Light Mode' : 'Switch to Light Mode')
              : (i18n.language === 'vi' ? 'Chuyển sang Dark Mode' : 'Switch to Dark Mode')
          }
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900/80 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
        >
          {isDark
            ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          }
        </button>

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          title={t('common.language')}
          className="h-9 px-3 flex items-center gap-1.5 rounded-xl bg-zinc-900/80 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium"
        >
          <span className="text-base leading-none">{i18n.language === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
          <span className="text-xs hidden sm:block">{i18n.language === 'vi' ? 'VI' : 'EN'}</span>
        </button>

        {/* User / Login */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-2 h-9 px-3 rounded-xl bg-zinc-900/80 border border-white/5 hover:bg-zinc-800 transition-all"
            >
              <Avatar src={user.avatar_url} name={user.name} className="w-6 h-6" />
              <span className="text-sm text-zinc-300 hidden sm:block max-w-[80px] truncate">{user.name}</span>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-1.5 z-20">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'}`}>
                      {user.role === 'admin' ? '👑 Admin' : '🎵 User'}
                    </span>
                  </div>
                  <button
                    onClick={() => { setView('profile'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-all text-left"
                  >
                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {i18n.language === 'vi' ? 'Thông tin cá nhân' : 'Personal Profile'}
                  </button>
                  <button
                    onClick={() => { logout(); setShowUserMenu(false); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-all text-left"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    {t('auth.logout')}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="h-9 px-4 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-semibold text-sm transition-all shadow-lg"
          >
            {t('auth.login')}
          </button>
        )}
      </div>
    </header>
  );
}

