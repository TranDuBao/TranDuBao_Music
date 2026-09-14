import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useModalStore } from './useModalStore';

export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover_url: string;
  audio_url: string;
  genre: string;
  created_at?: string;
  status?: 'pending' | 'approved' | 'rejected' | string;
  uploader_name?: string;
  category_id?: number | null;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
}

export interface Playlist {
  id: number;
  name: string;
  description: string;
  created_at?: string;
}

interface MusicStore {
  // State
  tracks: Track[];
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  currentPlaylistTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  queue: Track[];
  queueIndex: number;
  searchQuery: string;
  audio: HTMLAudioElement | null;
  favorites: number[];
  lastFetchParams: { search: string; mine: boolean; categoryId: number | null; statusFilter?: string | null } | null;

  // Custom players
  ytPlayer: any | null;
  progressInterval: any | null;
  initYoutubePlayer: (callback?: () => void) => void;

  // API Fetch actions
  fetchTracks: (search?: string, mine?: boolean, categoryId?: number | null, statusFilter?: string | null) => Promise<void>;
  fetchPlaylists: () => Promise<void>;
  fetchPlaylistTracks: (playlistId: number) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (trackId: number) => Promise<void>;

  // Track actions
  addTrack: (trackData: Omit<Track, 'id'>) => Promise<boolean>;
  updateTrack: (id: number, trackData: Omit<Track, 'id'>) => Promise<boolean>;
  deleteTrack: (id: number) => Promise<boolean>;

  // Playlist actions
  createPlaylist: (name: string, description: string) => Promise<boolean>;
  deletePlaylist: (id: number) => Promise<boolean>;
  addTrackToPlaylist: (playlistId: number, trackId: number) => Promise<boolean>;
  removeTrackFromPlaylist: (playlistId: number, trackId: number) => Promise<boolean>;

  isShuffle: boolean;
  repeatMode: 'none' | 'all' | 'one';
  toggleShuffle: () => void;
  toggleRepeat: () => void;

  // Player control actions
  initAudio: () => void;
  playTrack: (track: Track, customQueue?: Track[], forceIndex?: number) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  setProgress: (time: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setSearchQuery: (query: string) => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  resetPlayer: () => void;
  handleTrackRemoved: (trackId: number, title?: string) => void;
  handleTrackStatusChanged: (trackId: number, status: string, updatedTrack?: any) => void;
}

import { API_BASE, getAbsoluteUrl } from '../config';

const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  if (url.startsWith('youtube:')) {
    return url.replace('youtube:', '');
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const loadYoutubeAPI = (onReady: () => void) => {
  if ((window as any).YT && (window as any).YT.Player) {
    onReady();
    return;
  }
  
  const prevCallback = (window as any).onYouTubeIframeAPIReady;
  (window as any).onYouTubeIframeAPIReady = () => {
    if (prevCallback) prevCallback();
    onReady();
  };

  if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }
  }
};

export const useMusicStore = create<MusicStore>((set, get) => ({
  tracks: [],
  playlists: [],
  currentPlaylist: null,
  currentPlaylistTracks: [],
  currentTrack: null,
  isPlaying: false,
  volume: 0.7,
  progress: 0,
  queue: [],
  queueIndex: -1,
  searchQuery: '',
  audio: null,
  favorites: [],
  lastFetchParams: null,

  isShuffle: false,
  repeatMode: 'none',

  toggleShuffle: () => {
    set({ isShuffle: !get().isShuffle });
  },

  toggleRepeat: () => {
    const current = get().repeatMode;
    let next: 'none' | 'all' | 'one' = 'none';
    if (current === 'none') next = 'all';
    else if (current === 'all') next = 'one';
    set({ repeatMode: next });
  },

  ytPlayer: null,
  progressInterval: null,

  initAudio: () => {
    if (get().audio) return;

    const audio = new Audio();
    audio.volume = get().volume;

    audio.addEventListener('timeupdate', () => {
      set({ progress: audio.currentTime });
    });

    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && isFinite(audio.duration)) {
        const exactSec = Math.floor(audio.duration);
        const currentTrack = get().currentTrack;
        if (exactSec > 0 && currentTrack && currentTrack.duration !== exactSec) {
          set({
            currentTrack: {
              ...currentTrack,
              duration: exactSec
            }
          });
          const token = localStorage.getItem('ms_token');
          fetch(`${API_BASE}/tracks/${currentTrack.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ duration: exactSec })
          }).catch(() => {});
        }
      }
    });

    audio.addEventListener('ended', () => {
      const { repeatMode, currentTrack } = get();
      if (repeatMode === 'one' && currentTrack) {
        audio.currentTime = 0;
        audio.play().catch(err => console.error(err));
        set({ isPlaying: true, progress: 0 });
      } else {
        get().playNext();
      }
    });

    set({ audio });

    // ── Pre-load YouTube IFrame API immediately (not lazily) ──────────────
    // This ensures the player is ready BEFORE the user clicks play
    loadYoutubeAPI(() => {
      // API loaded — also pre-init the player silently so it's warm
      setTimeout(() => {
        if (!get().ytPlayer) {
          get().initYoutubePlayer(() => {
            console.log('[Player] YouTube Player pre-initialized and warm ✓');
          });
        }
      }, 1500); // short delay so DOM is ready
    });

    // ── Keep-alive ping to prevent backend cold start ─────────────────────
    // Free hosting (Render/Railway) sleeps after 15min → this prevents it
    const ping = () => {
      fetch(`${API_BASE}/tracks/top-weekly`, { method: 'GET' })
        .catch(() => {}); // silent, we don't care about the response
    };
    ping(); // ping immediately on app load
    const keepAliveInterval = setInterval(ping, 10 * 60 * 1000); // every 10 min
    // Store interval ID so it can be cleaned up on logout if needed
    (window as any).__keepAliveInterval = keepAliveInterval;
  },

  initYoutubePlayer: (callback?: () => void) => {
    if (get().ytPlayer) {
      if (callback) callback();
      return;
    }

    loadYoutubeAPI(() => {
      let container = document.getElementById('youtube-player-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'youtube-player-container';
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.width = '1px';
        container.style.height = '1px';
        document.body.appendChild(container);
      }

      let placeholder = document.getElementById('youtube-player-placeholder');
      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.id = 'youtube-player-placeholder';
        container.appendChild(placeholder);
      }

      const player = new (window as any).YT.Player('youtube-player-placeholder', {
        height: '1px',
        width: '1px',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1
        },
        events: {
          onReady: () => {
            console.log('[Player] YouTube Player Ready');
            set({ ytPlayer: player });
            if (callback) callback();
          },
          onStateChange: (event: any) => {
            if (event.data === 0) { // YT.PlayerState.ENDED
              const { repeatMode, currentTrack } = get();
              if (repeatMode === 'one' && currentTrack) {
                if (player && typeof player.seekTo === 'function') {
                  player.seekTo(0, true);
                  player.playVideo();
                }
              } else {
                get().playNext();
              }
            }
          }
        }
      });
    });
  },

  fetchTracks: async (search?: string, mine?: boolean, categoryId?: number | null, statusFilter?: string | null) => {
    const params = get().lastFetchParams || { search: '', mine: false, categoryId: null, statusFilter: null };
    const activeSearch = search !== undefined ? search : params.search;
    const activeMine = mine !== undefined ? mine : params.mine;
    const activeCategoryId = categoryId !== undefined ? categoryId : params.categoryId;
    const activeStatusFilter = statusFilter !== undefined ? statusFilter : params.statusFilter;

    set({ lastFetchParams: { search: activeSearch, mine: activeMine, categoryId: activeCategoryId, statusFilter: activeStatusFilter } });

    try {
      const token = localStorage.getItem('ms_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `${API_BASE}/tracks?search=${encodeURIComponent(activeSearch)}${activeMine ? '&mine=true' : ''}`;
      if (activeCategoryId !== null) {
        url += `&categoryId=${activeCategoryId}`;
      }
      if (activeStatusFilter) {
        url += `&status=${activeStatusFilter}`;
      }
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (json.success) {
        set({ tracks: json.data });
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  },

  fetchPlaylists: async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE}/playlists`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        set({ playlists: json.data });
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  },

  fetchPlaylistTracks: async (playlistId: number) => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE}/playlists/${playlistId}/tracks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        set({ currentPlaylistTracks: json.data });
      }
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
    }
  },

  fetchFavorites: async () => {
    try {
      const token = localStorage.getItem('ms_token');
      if (!token) return;
      const res = await fetch(`${API_BASE}/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        set({ favorites: (json.data || []).map((t: any) => t.id) });
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  },

  toggleFavorite: async (trackId: number) => {
    try {
      const token = localStorage.getItem('ms_token');
      if (!token) return;
      const res = await fetch(`${API_BASE}/favorites/${trackId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        const { favorites } = get();
        if (json.favorited) {
          set({ favorites: [...favorites, trackId] });
        } else {
          set({ favorites: favorites.filter(id => id !== trackId) });
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  },

  addTrack: async (trackData) => {
    try {
      const res = await fetch(`${API_BASE}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackData),
      });
      const json = await res.json();
      if (json.success) {
        await get().fetchTracks();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding track:', error);
      return false;
    }
  },

  updateTrack: async (id, trackData) => {
    try {
      const res = await fetch(`${API_BASE}/tracks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackData),
      });
      const json = await res.json();
      if (json.success) {
        await get().fetchTracks();
        // Update current track if it's the one being modified
        if (get().currentTrack?.id === id) {
          set({ currentTrack: { ...get().currentTrack!, ...trackData } });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating track:', error);
      return false;
    }
  },

  deleteTrack: async (id) => {
    try {
      const token = localStorage.getItem('ms_token');
      const res = await fetch(`${API_BASE}/tracks/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        await get().fetchTracks();
        if (get().currentTrack?.id === id) {
          const { audio } = get();
          if (audio) {
            audio.pause();
          }
          set({ currentTrack: null, isPlaying: false, progress: 0 });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting track:', error);
      return false;
    }
  },

  createPlaylist: async (name, description) => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE}/playlists`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description }),
      });
      const json = await res.json();
      if (json.success) {
        await get().fetchPlaylists();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating playlist:', error);
      return false;
    }
  },

  deletePlaylist: async (id) => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE}/playlists/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        await get().fetchPlaylists();
        if (get().currentPlaylist?.id === id) {
          set({ currentPlaylist: null, currentPlaylistTracks: [] });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      return false;
    }
  },

  addTrackToPlaylist: async (playlistId, trackId) => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE}/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ trackId }),
      });
      const json = await res.json();
      if (json.success) {
        if (get().currentPlaylist?.id === playlistId) {
          await get().fetchPlaylistTracks(playlistId);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      return false;
    }
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE}/playlists/${playlistId}/tracks/${trackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        if (get().currentPlaylist?.id === playlistId) {
          await get().fetchPlaylistTracks(playlistId);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing track from playlist:', error);
      return false;
    }
  },

  playTrack: (track, customQueue, forceIndex) => {
    if (track.status === 'pending' || track.status === 'rejected') {
      const isAdmin = useAuthStore.getState().user?.role === 'admin';
      if (!isAdmin) {
        const title = track.status === 'rejected' ? 'Bài hát bị từ chối' : 'Chưa thể phát';
        const msg = track.status === 'rejected'
          ? 'Bài hát này đã bị Admin từ chối phê duyệt, không thể phát bài hát này!'
          : 'Bài hát này đang chờ Admin phê duyệt, chưa thể phát lúc này!';
        useModalStore.getState().showAlert(title, msg, 'warning');
        return;
      }
    }

    const { audio, initAudio } = get();
    initAudio();

    const activeAudio = get().audio;
    let playQueue = [...(customQueue || get().tracks)];
    let index = forceIndex !== undefined ? forceIndex : playQueue.findIndex(t => t.id === track.id);
    if (index === -1) {
      playQueue.push(track);
      index = playQueue.length - 1;
    }


    // Stop standard audio
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.src = '';
    }
    
    // Stop YouTube audio
    const ytPlayer = get().ytPlayer;
    if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
      try { ytPlayer.stopVideo(); } catch (_) {}
    }

    if (get().progressInterval) {
      clearInterval(get().progressInterval);
      set({ progressInterval: null });
    }

    const videoId = getYoutubeVideoId(track.audio_url);

    if (videoId) {
      console.log(`[Player] Playing YouTube track via client-side player: ${videoId}`);
      
      const setupPlayerAndPlay = () => {
        const player = get().ytPlayer;
        if (!player) return;
        
        try {
          player.loadVideoById({
            videoId: videoId,
            suggestedQuality: 'small'
          });
          player.setVolume(get().volume * 100);
          player.playVideo();
          
          set({
            currentTrack: track,
            isPlaying: true,
            progress: 0,
            queue: playQueue,
            queueIndex: index,
          });

          // Record play count on backend
          const token = localStorage.getItem('ms_token');
          fetch(`${API_BASE}/tracks/${track.id}/play`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }).catch(() => {});
          
          // Setup progress interval
          const interval = setInterval(() => {
            const p = get().ytPlayer;
            if (p) {
              if (typeof p.getCurrentTime === 'function') {
                try {
                  set({ progress: p.getCurrentTime() });
                } catch (_) {}
              }
              if (typeof p.getDuration === 'function') {
                try {
                  const ytDuration = Math.floor(p.getDuration());
                  const currentTrack = get().currentTrack;
                  if (ytDuration > 0 && currentTrack && currentTrack.duration !== ytDuration) {
                    set({
                      currentTrack: {
                        ...currentTrack,
                        duration: ytDuration
                      }
                    });
                    const token = localStorage.getItem('ms_token');
                    fetch(`${API_BASE}/tracks/${currentTrack.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      },
                      body: JSON.stringify({ duration: ytDuration })
                    }).catch(() => {});
                  }
                } catch (_) {}
              }
            }
          }, 500);
          set({ progressInterval: interval });

        } catch (err) {
          console.error('[Player] loadVideoById failed:', err);
        }
      };

      // Ensure YouTube Player is initialized
      if (get().ytPlayer) {
        setupPlayerAndPlay();
      } else {
        get().initYoutubePlayer(() => {
          setupPlayerAndPlay();
        });
      }

    } else {
      if (!activeAudio) return;
      let finalUrl = track.audio_url;
      if (finalUrl && finalUrl.includes('soundcloud.com')) {
        finalUrl = `${API_BASE}/tracks/${track.id}/stream`;
      }
      console.log(`[Player] Playing standard audio stream: ${finalUrl}`);
      activeAudio.src = getAbsoluteUrl(finalUrl);
      activeAudio.play().then(() => {
        set({
          currentTrack: track,
          isPlaying: true,
          progress: 0,
          queue: playQueue,
          queueIndex: index,
        });

        const token = localStorage.getItem('ms_token');
        fetch(`${API_BASE}/tracks/${track.id}/play`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).catch(() => {});
      }).catch(err => {
        console.error('Standard playback failed', err);
      });
    }
  },

  togglePlay: () => {
    const { audio, isPlaying, currentTrack, tracks, playTrack } = get();
    if (!currentTrack) {
      if (tracks.length > 0) {
        playTrack(tracks[0]);
      }
      return;
    }

    const videoId = getYoutubeVideoId(currentTrack.audio_url);
    if (videoId) {
      const ytPlayer = get().ytPlayer;
      if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
        if (isPlaying) {
          try { ytPlayer.pauseVideo(); } catch (_) {}
          set({ isPlaying: false });
        } else {
          try { ytPlayer.playVideo(); } catch (_) {}
          set({ isPlaying: true });
        }
      }
    } else {
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
        set({ isPlaying: false });
      } else {
        audio.play().catch(err => console.error(err));
        set({ isPlaying: true });
      }
    }
  },

  setVolume: (vol) => {
    const { audio } = get();
    const clamped = Math.max(0, Math.min(1, vol));
    if (audio) {
      audio.volume = clamped;
    }
    
    const ytPlayer = get().ytPlayer;
    if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
      try {
        ytPlayer.setVolume(clamped * 100);
      } catch (_) {}
    }
    
    set({ volume: clamped });
  },

  setProgress: (time) => {
    const { audio, currentTrack, isPlaying } = get();
    if (currentTrack) {
      const videoId = getYoutubeVideoId(currentTrack.audio_url);
      if (videoId) {
        const ytPlayer = get().ytPlayer;
        if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
          try {
            ytPlayer.seekTo(time, true);
            if (isPlaying && typeof ytPlayer.playVideo === 'function') {
              setTimeout(() => {
                try { ytPlayer.playVideo(); } catch (_) {}
              }, 50);
            }
          } catch (_) {}
        }
      } else {
        if (audio) {
          audio.currentTime = time;
          if (isPlaying && audio.paused) {
            audio.play().catch(() => {});
          }
        }
      }
    }
    set({ progress: time });
  },

  playNext: () => {
    const { queue, queueIndex, playTrack, isShuffle, repeatMode } = get();
    if (queue.length === 0 || queueIndex === -1) return;

    if (isShuffle) {
      let nextIndex = queueIndex;
      if (queue.length > 1) {
        while (nextIndex === queueIndex) {
          nextIndex = Math.floor(Math.random() * queue.length);
        }
      }
      playTrack(queue[nextIndex], queue, nextIndex);
    } else {
      const nextIndex = queueIndex + 1;
      if (nextIndex < queue.length) {
        playTrack(queue[nextIndex], queue, nextIndex);
      } else {
        if (repeatMode === 'all') {
          playTrack(queue[0], queue, 0);
        } else {
          const { audio } = get();
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
          }
          const ytPlayer = get().ytPlayer;
          if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
            try { ytPlayer.stopVideo(); } catch (_) {}
          }
          if (get().progressInterval) {
            clearInterval(get().progressInterval);
            set({ progressInterval: null });
          }
          set({ isPlaying: false, progress: 0 });
        }
      }
    }
  },

  playPrevious: () => {
    const { queue, queueIndex, playTrack, isShuffle } = get();
    if (queue.length === 0 || queueIndex === -1) return;

    if (isShuffle) {
      let prevIndex = queueIndex;
      if (queue.length > 1) {
        while (prevIndex === queueIndex) {
          prevIndex = Math.floor(Math.random() * queue.length);
        }
      }
      playTrack(queue[prevIndex], queue, prevIndex);
    } else {
      let prevIndex = queueIndex - 1;
      if (prevIndex < 0) {
        prevIndex = queue.length - 1;
      }
      playTrack(queue[prevIndex], queue, prevIndex);
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setCurrentPlaylist: (playlist) => {
    set({ currentPlaylist: playlist });
    if (playlist) {
      get().fetchPlaylistTracks(playlist.id);
    } else {
      set({ currentPlaylistTracks: [] });
    }
  },

  resetPlayer: () => {
    const { audio } = get();
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    const ytPlayer = get().ytPlayer;
    if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
      try { ytPlayer.stopVideo(); } catch (_) {}
    }
    if (get().progressInterval) {
      clearInterval(get().progressInterval);
      set({ progressInterval: null });
    }
    set({
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      queue: [],
      queueIndex: -1,
    });
  },

  handleTrackRemoved: (trackId, title) => {
    const { tracks, currentTrack, queue, currentPlaylistTracks, audio, ytPlayer, progressInterval } = get();

    const isCurrentPlaying = currentTrack && Number(currentTrack.id) === Number(trackId);

    if (isCurrentPlaying) {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
        try { ytPlayer.stopVideo(); } catch (_) {}
      }
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      useModalStore.getState().showAlert(
        'Thông báo hệ thống',
        `Bài hát "${title || currentTrack?.title || ''}" vừa bị Admin xóa hoặc gỡ khỏi hệ thống.`,
        'warning'
      );
    }

    const newTracks = tracks.filter(t => Number(t.id) !== Number(trackId));
    const newQueue = queue.filter(t => Number(t.id) !== Number(trackId));
    const newPlaylistTracks = currentPlaylistTracks.filter(t => Number(t.id) !== Number(trackId));

    set({
      tracks: newTracks,
      queue: newQueue,
      currentPlaylistTracks: newPlaylistTracks,
      ...(isCurrentPlaying ? { currentTrack: null, isPlaying: false, progress: 0, progressInterval: null } : {})
    });
  },

  handleTrackStatusChanged: (trackId, status, updatedTrack) => {
    if (status === 'rejected') {
      get().handleTrackRemoved(trackId, updatedTrack?.title);
    } else if (status === 'approved') {
      const { tracks } = get();
      const exists = tracks.some(t => Number(t.id) === Number(trackId));
      if (exists) {
        set({
          tracks: tracks.map(t => Number(t.id) === Number(trackId) ? { ...t, ...updatedTrack, status: 'approved' } : t)
        });
      } else {
        get().fetchTracks();
      }
    } else {
      const { tracks } = get();
      set({
        tracks: tracks.map(t => Number(t.id) === Number(trackId) ? { ...t, ...updatedTrack, status } : t)
      });
    }
  }
}));
