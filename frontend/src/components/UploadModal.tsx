import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMusicStore } from '../store/useMusicStore';
import { useAuthStore } from '../store/useAuthStore';
import { useModalStore } from '../store/useModalStore';
import { X, Upload, Music2, Image, CheckCircle2, AlertCircle, Link2 } from 'lucide-react';
import axios from 'axios';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}
import { API_BASE } from '../config';
const API = API_BASE;

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { t } = useTranslation();
  const { fetchTracks } = useMusicStore();
  const { token } = useAuthStore();
  const { showAlert } = useModalStore();

  const audioRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
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

  useEffect(() => {
    if (isOpen) {
      axios.get(`${API}/categories`)
        .then(res => {
          if (res.data.success) {
            setCategories(res.data.data);
          }
        })
        .catch(err => console.error('Error loading categories:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      if (!form.title) setForm(f => ({ ...f, title: file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      if (uploadMode === 'file') {
        if (!audioFile) return;
        const formData = new FormData();
        formData.append('audio', audioFile);
        if (coverFile) formData.append('cover', coverFile);
        Object.entries(form).forEach(([k, v]) => formData.append(k, v));
        if (!form.duration) formData.set('duration', '180');

        const res = await axios.post(`${API}/tracks`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.success) {
          setStatus('success');
          showAlert('Thành công', 'Upload bài hát thành công', 'success');
          await fetchTracks();
          setTimeout(() => {
            onClose();
            setStatus('idle');
            setAudioFile(null);
            setCoverFile(null);
            setForm({ title: '', artist: '', album: '', genre: 'Lofi', duration: '', is_public: '1', category_id: '' });
          }, 1500);
        } else {
          setStatus('error');
          const msg = res.data.message || 'Lỗi không xác định khi tải lên';
          setErrorMessage(msg);
          showAlert('Tải lên thất bại', msg, 'error');
        }
      } else {
        if (!importUrl) {
          setStatus('error');
          const msg = 'Vui lòng nhập đường dẫn liên kết';
          setErrorMessage(msg);
          showAlert('Yêu cầu nhập link', msg, 'warning');
          setLoading(false);
          return;
        }

        const res = await axios.post(`${API}/tracks/import`, {
          url: importUrl,
          genre: form.genre,
          is_public: form.is_public,
          category_id: form.category_id || null
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.data.success) {
          setStatus('success');
          showAlert('Thành công', 'Upload bài hát thành công', 'success');
          await fetchTracks();
          setTimeout(() => {
            onClose();
            setStatus('idle');
            setImportUrl('');
            setForm({ title: '', artist: '', album: '', genre: 'Lofi', duration: '', is_public: '1', category_id: '' });
          }, 1500);
        } else {
          setStatus('error');
          const msg = res.data.message || 'Lỗi không thể nhập nhạc từ liên kết';
          setErrorMessage(msg);
          showAlert('Nhập nhạc thất bại', msg, 'error');
        }
      }
    } catch (err: any) {
      setStatus('error');
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi thực hiện';
      setErrorMessage(msg);
      showAlert('Lỗi hệ thống', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl max-h-[90vh] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-y-auto z-10">
        {/* Decorative glows */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl" />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <Upload className="text-purple-400 w-5 h-5" />
              <h2 className="text-lg font-bold text-white">{t('upload.title')}</h2>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 p-1 bg-zinc-900/60 border border-white/5 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => { setUploadMode('file'); setStatus('idle'); setErrorMessage(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${uploadMode === 'file'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              Tải lên tệp tin
            </button>
            <button
              type="button"
              onClick={() => { setUploadMode('url'); setStatus('idle'); setErrorMessage(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${uploadMode === 'url'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              Nhập từ YouTube / URL
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {uploadMode === 'file' ? (
              <>
                {/* Audio Drop Zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleAudioDrop}
                  onClick={() => audioRef.current?.click()}
                  className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all ${dragOver
                    ? 'border-purple-500 bg-purple-500/10'
                    : audioFile
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                >
                  <input
                    ref={audioRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setAudioFile(f);
                        if (!form.title) setForm(prev => ({ ...prev, title: f.name.replace(/\.[^/.]+$/, '') }));
                      }
                    }}
                  />
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
                      <p className="text-sm font-medium text-zinc-300">{t('upload.dragDrop')}</p>
                      <p className="text-xs text-zinc-600 mt-1">{t('upload.orClick')}</p>
                      <p className="text-[10px] text-zinc-700 mt-2">{t('upload.supported')}</p>
                    </>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">{t('tracks.title')} *</label>
                    <input
                      required
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600"
                      placeholder="Tên bài hát"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">{t('tracks.artist')} *</label>
                    <input
                      required
                      value={form.artist}
                      onChange={e => setForm({ ...form, artist: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600"
                      placeholder="Nghệ sĩ"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">{t('tracks.album')}</label>
                    <input
                      value={form.album}
                      onChange={e => setForm({ ...form, album: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600"
                      placeholder="Album"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Danh mục nhạc</label>
                    <select
                      value={form.category_id}
                      onChange={e => {
                        const catId = e.target.value;
                        const selectedCat = categories.find(c => String(c.id) === String(catId));
                        setForm({
                          ...form,
                          category_id: catId,
                          genre: selectedCat ? selectedCat.name : form.genre
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
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">{t('tracks.genre')} / Thể loại chi tiết</label>
                    <input
                      value={form.genre}
                      onChange={e => setForm({ ...form, genre: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600"
                      placeholder="Thể loại"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">{t('tracks.visibility')}</label>
                    <select
                      value={form.is_public}
                      onChange={e => setForm({ ...form, is_public: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="1">{t('tracks.public')}</option>
                      <option value="0">{t('tracks.private')}</option>
                    </select>
                  </div>
                </div>

                {/* Cover upload row */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">{t('tracks.fileCover')}</label>
                    <div
                      onClick={() => coverRef.current?.click()}
                      className={`cursor-pointer flex items-center gap-2 bg-zinc-900 border rounded-lg px-3 py-2 text-sm transition-all ${coverFile ? 'border-green-500/50 text-green-300' : 'border-zinc-800 hover:border-zinc-700 text-zinc-500'
                        }`}
                    >
                      <Image className="w-4 h-4" />
                      <span className="truncate text-xs">{coverFile ? coverFile.name : t('tracks.orUploadFile')}</span>
                      <input
                        ref={coverRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => setCoverFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                  {coverFile && (
                    <img
                      src={URL.createObjectURL(coverFile)}
                      className="w-12 h-12 rounded-lg object-cover border border-white/10"
                      alt="preview"
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Đường dẫn liên kết (YouTube / Audio Link)</label>
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
                    Nhập liên kết video YouTube hoặc link file nhạc trực tiếp (.mp3, .wav, .m4a). Hệ thống sẽ tự động tải về và trích xuất thông tin bài hát.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Danh mục nhạc</label>
                    <select
                      value={form.category_id}
                      onChange={e => {
                        const catId = e.target.value;
                        const selectedCat = categories.find(c => String(c.id) === String(catId));
                        setForm({
                          ...form,
                          category_id: catId,
                          genre: selectedCat ? selectedCat.name : form.genre
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
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Thể loại chi tiết</label>
                    <input
                      value={form.genre}
                      onChange={e => setForm({ ...form, genre: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600"
                      placeholder="Thể loại"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Chế độ hiển thị</label>
                    <select
                      value={form.is_public}
                      onChange={e => setForm({ ...form, is_public: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="1">Công khai</option>
                      <option value="0">Riêng tư</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Status messages */}
            {status === 'success' && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <p className="text-xs text-green-300">
                  {uploadMode === 'file' ? t('upload.success') : 'Tải nhạc từ liên kết thành công!'}
                </p>
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <p className="text-xs text-rose-300">{errorMessage || t('upload.error')}</p>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer">
                {t('common.close')}
              </button>
              <button
                type="submit"
                disabled={loading || (uploadMode === 'file' && !audioFile) || (uploadMode === 'url' && !importUrl)}
                className="px-5 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {loading && <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />}
                {loading
                  ? (uploadMode === 'file' ? t('upload.uploading') : 'Đang tải về...')
                  : (uploadMode === 'file' ? t('upload.upload') : 'Tải nhạc về')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
