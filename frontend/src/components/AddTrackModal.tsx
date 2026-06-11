import React, { useState } from 'react';
import { useMusicStore } from '../store/useMusicStore';
import { X, Music2 } from 'lucide-react';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTrackModal({ isOpen, onClose }: AddTrackModalProps) {
  const { addTrack } = useMusicStore();
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    duration: 180,
    cover_url: '',
    audio_url: '',
    genre: 'Lofi',
    category_id: ''
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      fetch('http://localhost:5000/api/categories')
        .then(r => r.json())
        .then(json => { if (json.success) setCategories(json.data); })
        .catch(() => { });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.artist || !formData.audio_url) {
      alert('Title, Artist and Audio URL are required!');
      return;
    }
    setLoading(true);
    const success = await addTrack({
      ...formData,
      duration: Number(formData.duration)
    });
    setLoading(false);
    if (success) {
      onClose();
      setFormData({
        title: '',
        artist: '',
        album: '',
        duration: 180,
        cover_url: '',
        audio_url: '',
        genre: 'Lofi',
        category_id: ''
      });
    } else {
      alert('Failed to add track. Make sure the backend is running.');
    }
  };

  const fillMockData = () => {
    // Fill with a SoundHelix URL for easy testing
    const randomNum = Math.floor(Math.random() * 5) + 6; // 6 to 10
    setFormData({
      title: `SoundHelix Track ${randomNum}`,
      artist: `SoundHelix Artist`,
      album: `Helix Album v${randomNum}`,
      duration: 350 + randomNum * 20,
      cover_url: `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3`,
      audio_url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${randomNum}.mp3`,
      genre: 'Instrumental'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl z-10 neon-glow-purple overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl"></div>

        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5 relative">
          <div className="flex items-center gap-2">
            <Music2 className="text-purple-400 w-5 h-5" />
            <h2 className="text-lg font-bold text-white">Add New Song</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Song Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600"
                placeholder="e.g., Chill Vibes"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Artist *</label>
              <input
                type="text"
                required
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600"
                placeholder="e.g., Lofi Boy"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Album</label>
              <input
                type="text"
                value={formData.album}
                onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600"
                placeholder="e.g., Summer Beats"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Danh mục nhạc</label>
              <select
                value={formData.category_id}
                onChange={(e) => {
                  const catId = e.target.value;
                  const selectedCat = categories.find(c => String(c.id) === String(catId));
                  setFormData({
                    ...formData,
                    category_id: catId,
                    genre: selectedCat ? selectedCat.name : formData.genre
                  });
                }}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Genre / Thể loại chi tiết</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600"
                placeholder="e.g., Lofi, Jazz"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Audio Stream URL *</label>
              <input
                type="url"
                required
                value={formData.audio_url}
                onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600 text-xs"
                placeholder="https://example.com/song.mp3"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Duration (sec)</label>
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Cover Image URL</label>
            <input
              type="url"
              value={formData.cover_url}
              onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600 text-xs"
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-white/5 mt-6">
            <button
              type="button"
              onClick={fillMockData}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-all"
            >
              🪄 Auto Fill Demo Song
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-lg transition-all shadow-lg neon-glow-purple disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Song'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
