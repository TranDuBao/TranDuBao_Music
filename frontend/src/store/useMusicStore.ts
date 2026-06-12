import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

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
  lastFetchParams: { search: string; mine: boolean; categoryId: number | null } | null;

  // API Fetch actions
  fetchTracks: (search?: string, mine?: boolean, categoryId?: number | null) => Promise<void>;
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
  playTrack: (track: Track, customQueue?: Track[]) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  setProgress: (time: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setSearchQuery: (query: string) => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  resetPlayer: () => void;
}

import { API_BASE } from '../config';

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

  initAudio: () => {
    if (get().audio) return;

    const audio = new Audio();
    audio.volume = get().volume;

    audio.addEventListener('timeupdate', () => {
      set({ progress: audio.currentTime });
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
  },

  fetchTracks: async (search, mine, categoryId) => {
    const params = get().lastFetchParams || { search: '', mine: false, categoryId: null };
    const activeSearch = search !== undefined ? search : params.search;
    const activeMine = mine !== undefined ? mine : params.mine;
    const activeCategoryId = categoryId !== undefined ? categoryId : params.categoryId;

    set({ lastFetchParams: { search: activeSearch, mine: activeMine, categoryId: activeCategoryId } });

    try {
      const token = localStorage.getItem('ms_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `${API_BASE}/tracks?search=${encodeURIComponent(activeSearch)}${activeMine ? '&mine=true' : ''}`;
      if (activeCategoryId !== null) {
        url += `&categoryId=${activeCategoryId}`;
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

  playTrack: (track, customQueue) => {
    const { audio, initAudio } = get();
    initAudio();

    const activeAudio = get().audio;
    if (!activeAudio) return;

    const playQueue = customQueue || get().tracks;
    const index = playQueue.findIndex(t => t.id === track.id);

    activeAudio.src = track.audio_url;
    activeAudio.play().then(() => {
      set({
        currentTrack: track,
        isPlaying: true,
        progress: 0,
        queue: playQueue,
        queueIndex: index,
      });

      // ── Record play & increment play_count ──────────────────────
      const token = localStorage.getItem('ms_token');
      fetch(`${API_BASE}/tracks/${track.id}/play`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {/* silent – non-critical */ });

    }).catch(err => {
      console.error('Playback failed', err);
    });
  },

  togglePlay: () => {
    const { audio, isPlaying, currentTrack, tracks, playTrack } = get();
    if (!audio) return;

    if (!currentTrack) {
      if (tracks.length > 0) {
        playTrack(tracks[0]);
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
      set({ isPlaying: false });
    } else {
      audio.play().catch(err => console.error(err));
      set({ isPlaying: true });
    }
  },

  setVolume: (vol) => {
    const { audio } = get();
    const clamped = Math.max(0, Math.min(1, vol));
    if (audio) {
      audio.volume = clamped;
    }
    set({ volume: clamped });
  },

  setProgress: (time) => {
    const { audio } = get();
    if (audio) {
      audio.currentTime = time;
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
      playTrack(queue[nextIndex], queue);
    } else {
      const nextIndex = queueIndex + 1;
      if (nextIndex < queue.length) {
        playTrack(queue[nextIndex], queue);
      } else {
        if (repeatMode === 'all') {
          playTrack(queue[0], queue);
        } else {
          const { audio } = get();
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
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
      playTrack(queue[prevIndex], queue);
    } else {
      let prevIndex = queueIndex - 1;
      if (prevIndex < 0) {
        prevIndex = queue.length - 1;
      }
      playTrack(queue[prevIndex], queue);
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
    set({
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      queue: [],
      queueIndex: -1,
    });
  }
}));
