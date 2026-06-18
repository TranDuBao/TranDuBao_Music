import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMusicStore } from '../store/useMusicStore';
import { useAuthStore } from '../store/useAuthStore';
import { useModalStore } from '../store/useModalStore';
import { X, Upload, Music2, Image, CheckCircle2, AlertCircle, Link2, Search, Play, Plus } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API = API_BASE;

type UploadMode = 'file' | 'url' | 'search';

interface DeezerTrack {
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover_url: string;
  audio_url: string; // Deezer 30s preview mp3
  preview: string;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { t } = useTranslation();
  const { fetchTracks } = useMusicStore();
  const { token } = useAuthStore();
  const { showAlert } = useModalStore();

  const audioRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [uploadMode, setUploadMode] = useState<UploadMode>('search');
  const [importUrl, setImportUrl] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    title: '', artist: '', album: '', genre: 'Lofi', duration: '', is_public: '1', category_id: '',
  });
  const [categories, setCategories] = useState<any[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DeezerTrack[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [previewingUrl, setPreviewingUrl] = useState('');
  const [addingTrack, setAddingTrack] = useState<string | null>(null);
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      axios.get(`${API}/categories`)
        .then(res => { if (res.data.success) setCategories(res.data.data); })
        .catch(() => {});
    }
    return () => {
      if (previewAudio) { previewAudio.pause(); }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Deezer search ─────────────────────────────────────────────────
  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await axios.get(`${API}/tracks/search?q=${encodeURIComponent(q)}`);
        if (res.data.success) setSearchResults(res.data.data);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 500);
  };

  const togglePreview = (track: DeezerTrack) => {
    if (!track.preview) return;
    if (previewingUrl === track.preview) {
      previewAudio?.pause();
      setPreviewingUrl('');
      return;
    }
    previewAudio?.pause();
    const audio = new Audio(track.preview);
    audio.volume = 0.7;
    audio.play();
    audio.onended = () => setPreviewingUrl('');
    setPreviewAudio(audio);
    setPreviewingUrl(track.preview);
  };

  const addDeezerTrack = async (track: DeezerTrack) => {
    if (!token) { showAlert('Cần đăng nhập', 'Vui lòng đăng nhập để thêm bài hát.', 'warning'); return; }
    setAddingTrack(track.preview);
    try {
      const res = await axios.post(`${API}/tracks/import`, {
        url: track.audio_url, // Deezer 30s preview URL
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        cover_url: track.cover_url,
        genre: 'Deezer',
        is_public: 1,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        showAlert('Đã thêm!', `"${track.title}" đã được thêm vào thư viện.`, 'success');
        await fetchTracks();
      } else {
        showAlert('Thất bại', res.data.message || 'Không thể thêm bài hát.', 'error');
      }
    } catch (err: any) {
      showAlert('Lỗi', err.response?.data?.message || 'Lỗi khi thêm bài hát.', 'error');
    } finally {
      setAddingTrack(null);
    }
  };

  // ── File / URL upload ─────────────────────────────────────────────
  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      if (!form.title) setForm(f => ({ ...f, title: file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setStatus('idle'); setErrorMessage('');
    try {
      if (uploadMode === 'file') {
        if (!audioFile) return;
        const formData = new FormData();
        formData.append('audio', audioFile);
        if (coverFile) formData.append('cover', coverFile);
        Object.entries(form).forEach(([k, v]) => formData.append(k, v));
        if (!form.duration) formData.set('duration', '180');
        const res = await axios.post(`${API}/tracks`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setStatus('success');
          showAlert('Thành công', 'Upload bài hát thành công', 'success');
          await fetchTracks();
          setTimeout(() => { onClose(); setStatus('idle'); setAudioFile(null); setCoverFile(null); }, 1500);
        } else {
          setStatus('error'); setErrorMessage(res.data.message || 'Lỗi không xác định');
          showAlert('Thất bại', res.data.message || 'Lỗi khi tải lên', 'error');
        }
      } else if (uploadMode === 'url') {
        if (!importUrl) { setStatus('error'); setErrorMessage('Vui lòng nhập URL'); setLoading(false); return; }
        const res = await axios.post(`${API}/tracks/import`, {
          url: importUrl, genre: form.genre, is_public: form.is_public, category_id: form.category_id || null
        }, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) {
          setStatus('success');
          showAlert('Thành công', 'Thêm bài hát thành công!', 'success');
          await fetchTracks();
          setTimeout(() => { onClose(); setStatus('idle'); setImportUrl(''); }, 1500);
        } else {
          setStatus('error'); setErrorMessage(res.data.message || 'Lỗi nhập nhạc');
          showAlert('Thất bại', res.data.message || 'Lỗi nhập nhạc', 'error');
        }
      }
    } catch (err: any) {
      setStatus('error');
      const msg = err.response?.data?.message || 'Có lỗi xảy ra';
      setErrorMessage(msg);
      showAlert('Lỗi hệ thống', msg, 'error');
    } finally { setLoading(false); }
  };

  const TABS: { key: UploadMode; label: string }[] = [
    { key: 'search', label: '🔍 Tìm kiếm' },
    { key: 'url',    label: '🔗 YouTube / URL' },
    { key: 'file',   label: '📁 Tải file lên' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl max-h-[92vh] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-y-auto z-10">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl" />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Upload className="text-purple-400 w-5 h-5" />
              <h2 className="text-lg font-bold text-white">Thêm bài hát</h2>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 p-1 bg-zinc-900/60 border border-white/5 rounded-xl mb-5">
            {TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setUploadMode(tab.key); setStatus('idle'); setErrorMessage(''); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${uploadMode === tab.key
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── SEARCH TAB ── */}
          {uploadMode === 'search' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Tìm tên bài hát, nghệ sĩ... (Deezer)"
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-600"
                  autoFocus
                />
              </div>

              <p className="text-[10px] text-zinc-500">
                Powered by Deezer API · Nghe thử 30 giây · Bấm <Plus className="inline w-3 h-3" /> để thêm vào thư viện
              </p>

              {searchLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {searchResults.map((track, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-purple-500/30 transition-all group">
                      <img
                        src={track.cover_url || 'https://via.placeholder.com/48'}
                        alt={track.title}
                        className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                        <p className="text-xs text-zinc-400 truncate">{track.artist} · {track.album}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {track.preview && (
                          <button
                            type="button"
                            onClick={() => togglePreview(track)}
                            className={`p-1.5 rounded-lg transition-all ${previewingUrl === track.preview
                              ? 'bg-purple-600 text-white'
                              : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                            title="Nghe thử 30s"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => addDeezerTrack(track)}
                          disabled={addingTrack === track.preview}
                          className="p-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white transition-all disabled:opacity-50"
                          title="Thêm vào thư viện"
                        >
                          {addingTrack === track.preview
                            ? <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                            : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!searchLoading && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  Không tìm thấy kết quả cho "{searchQuery}"
                </div>
              )}

              {!searchQuery && (
                <div className="text-center py-8">
                  <Search className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm">Nhập tên bài hát để tìm kiếm</p>
                </div>
              )}
            </div>
          )}

          {/* ── URL TAB ── */}
          {uploadMode === 'url' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Đường dẫn YouTube hoặc link audio</label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={importUrl}
                    onChange={e => setImportUrl(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-600"
                  />
                  <Link2 className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5">
                  YouTube URL → thông tin được lấy tự động qua oEmbed, nhạc phát qua YouTube Player. Link mp3 trực tiếp cũng được.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Danh mục</label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Thể loại</label>
                  <input value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600"
                    placeholder="Lofi, Pop..." />
                </div>
              </div>

              {status === 'success' && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-green-300">Thêm bài hát thành công!</p>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <p className="text-xs text-rose-300">{errorMessage}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer">
                  Đóng
                </button>
                <button type="submit" disabled={loading || !importUrl}
                  className="px-5 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-2">
                  {loading && <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />}
                  {loading ? 'Đang tải...' : 'Thêm bài hát'}
                </button>
              </div>
            </form>
          )}

          {/* ── FILE TAB ── */}
          {uploadMode === 'file' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleAudioDrop}
                onClick={() => audioRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all ${dragOver
                  ? 'border-purple-500 bg-purple-500/10'
                  : audioFile ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
              >
                <input ref={audioRef} type="file" accept="audio/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setAudioFile(f); if (!form.title) setForm(p => ({ ...p, title: f.name.replace(/\.[^/.]+$/, '') })); } }} />
                {audioFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-green-300">{audioFile.name}</p>
                      <p className="text-xs text-zinc-500">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Music2 className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-zinc-300">Kéo thả hoặc click để chọn file</p>
                    <p className="text-[10px] text-zinc-700 mt-2">MP3, WAV, M4A, FLAC, OGG</p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Tên bài hát *</label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600" placeholder="Tên bài hát" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Nghệ sĩ *</label>
                  <input required value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600" placeholder="Nghệ sĩ" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Album</label>
                  <input value={form.album} onChange={e => setForm({ ...form, album: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600" placeholder="Album" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Danh mục</label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    <option value="">-- Chọn --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Ảnh bìa</label>
                  <div onClick={() => coverRef.current?.click()}
                    className={`cursor-pointer flex items-center gap-2 bg-zinc-900 border rounded-lg px-3 py-2 text-sm transition-all ${coverFile ? 'border-green-500/50 text-green-300' : 'border-zinc-800 hover:border-zinc-700 text-zinc-500'}`}>
                    <Image className="w-4 h-4" />
                    <span className="truncate text-xs">{coverFile ? coverFile.name : 'Chọn ảnh bìa'}</span>
                    <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                {coverFile && <img src={URL.createObjectURL(coverFile)} className="w-12 h-12 rounded-lg object-cover border border-white/10" alt="preview" />}
              </div>

              {status === 'success' && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-green-300">Upload thành công!</p>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <p className="text-xs text-rose-300">{errorMessage}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer">
                  Đóng
                </button>
                <button type="submit" disabled={loading || !audioFile}
                  className="px-5 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-2">
                  {loading && <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />}
                  {loading ? 'Đang tải lên...' : 'Upload'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
