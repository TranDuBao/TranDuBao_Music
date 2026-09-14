import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useModalStore } from '../../store/useModalStore';
import ImageUploadWithCrop from '../ImageUploadWithCrop';
import { API_BASE, getAbsoluteUrl } from '../../config';

const API = API_BASE;

export function AlbumsTab({ authH }: { authH: Record<string, string> }) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { showConfirm, showAlert } = useModalStore();
  const [albums, setAlbums] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const [form, setForm] = useState({ name: '', artist: '', description: '', trackIds: [] as number[] });
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  
  // Track search filter within the album builder form
  const [trackSearch, setTrackSearch] = useState('');

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/albums`);
      if (data.success) setAlbums(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTracks = async () => {
    try {
      const { data } = await axios.get(`${API}/tracks`);
      if (data.success) setTracks(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlbums();
    fetchTracks();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('artist', form.artist);
      formData.append('description', form.description);
      // Append track IDs as a JSON string
      formData.append('trackIds', JSON.stringify(form.trackIds));

      if (file) {
        formData.append('cover', file);
      } else if (imageUrl) {
        formData.append('cover_url', imageUrl);
      }

      let res;
      if (editing) {
        res = await axios.put(`${API}/albums/${editing}`, formData, {
          headers: { ...authH, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post(`${API}/albums`, formData, {
          headers: { ...authH, 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Lưu album thành công!' : 'Album saved successfully!', 'success');
        setForm({ name: '', artist: '', description: '', trackIds: [] });
        setFile(null);
        setImageUrl('');
        setEditing(null);
        fetchAlbums();
        window.dispatchEvent(new CustomEvent('reload-settings'));
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Có lỗi xảy ra khi lưu album' : 'An error occurred while saving the album'), 'error');
    }
  };

  const del = async (id: number) => {
    showConfirm(
      isVi ? 'Xác nhận xóa' : 'Confirm Delete',
      isVi ? 'Bạn có chắc chắn muốn xóa album này? Các bài hát trong album sẽ không bị xóa nhưng sẽ không còn thuộc album này.' : 'Are you sure you want to delete this album? Songs in this album will not be deleted but will no longer belong to this album.',
      async () => {
        try {
          await axios.delete(`${API}/albums/${id}`, { headers: authH });
          showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Đã xóa album thành công.' : 'Album deleted successfully.', 'success');
          fetchAlbums();
          window.dispatchEvent(new CustomEvent('reload-settings'));
        } catch (err: any) {
          showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể xóa album.' : 'Failed to delete album.'), 'error');
        }
      }
    );
  };

  const startEdit = (album: any) => {
    setEditing(album.id);
    const existingTrackIds = album.tracks?.map((t: any) => t.id) || [];
    setForm({
      name: album.name,
      artist: album.artist,
      description: album.description || '',
      trackIds: existingTrackIds
    });
    setFile(null);
    setImageUrl(album.cover_url || '');
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: '', artist: '', description: '', trackIds: [] });
    setFile(null);
    setImageUrl('');
  };

  const toggleTrack = (trackId: number) => {
    setForm(prev => {
      const idx = prev.trackIds.indexOf(trackId);
      if (idx === -1) {
        return { ...prev, trackIds: [...prev.trackIds, trackId] };
      } else {
        return { ...prev, trackIds: prev.trackIds.filter(id => id !== trackId) };
      }
    });
  };

  const filteredTracks = tracks.filter(t =>
    t.title.toLowerCase().includes(trackSearch.toLowerCase()) ||
    t.artist.toLowerCase().includes(trackSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Form thêm/sửa album */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          {editing ? <Edit2 className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-purple-400" />}
          {editing ? (isVi ? 'Chỉnh sửa album' : 'Edit Album') : (isVi ? 'Tạo album mới' : 'Create New Album')}
        </h3>
        
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Tên album' : 'Album Name'}</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={isVi ? "Ví dụ: Starboy" : "E.g., Starboy"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Tên ca sĩ' : 'Artist Name'}</label>
              <input required value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })}
                placeholder={isVi ? "Ví dụ: The Weeknd" : "E.g., The Weeknd"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Mô tả album' : 'Album Description'}</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder={isVi ? "Thông tin giới thiệu ngắn về album..." : "Short introduction about the album..."}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700 resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUploadWithCrop
              label={isVi ? 'Ảnh bìa Album (Upload file)' : 'Album Cover Photo (Upload file)'}
              aspectRatio={1}
              cropShape="rect"
              placeholder={isVi ? 'Chọn và cắt ảnh bìa Album...' : 'Choose and crop Album cover...'}
              onFileCropped={(croppedFile) => setFile(croppedFile)}
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Hoặc dán URL ảnh bìa' : 'Or paste cover URL'}</label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} disabled={!!file}
                placeholder="http://example.com/cover.png"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700 disabled:opacity-40" />
            </div>
          </div>

          {/* Chọn bài hát vào album */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? `Danh sách bài hát thuộc album (${form.trackIds.length})` : `Song list belonging to the album (${form.trackIds.length})`}</label>
              <input
                type="text"
                value={trackSearch}
                onChange={e => setTrackSearch(e.target.value)}
                placeholder={isVi ? "Tìm bài hát..." : "Search song..."}
                className="w-48 bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none placeholder-zinc-700"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-zinc-800 bg-zinc-950/40 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {filteredTracks.map(t => {
                const checked = form.trackIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTrack(t.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border text-xs cursor-pointer ${
                      checked
                        ? 'bg-purple-600/10 border-purple-500/35 text-white'
                        : 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    <input type="checkbox" checked={checked} readOnly className="rounded border-zinc-800 text-purple-600 focus:ring-purple-500" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{t.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{t.artist}</p>
                    </div>
                  </button>
                );
              })}
              {filteredTracks.length === 0 && (
                <div className="col-span-full py-6 text-center text-zinc-600 text-xs">{isVi ? 'Không tìm thấy bài hát nào' : 'No songs found'}</div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
              {editing ? (isVi ? 'Cập nhật Album' : 'Update Album') : (isVi ? 'Tạo Album' : 'Create Album')}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-sm transition-all">
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Danh sách album */}
      <div className="rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-zinc-300">{isVi ? 'Danh sách album hiện có' : 'Existing Albums'}</h3>
          <button onClick={fetchAlbums} className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="divide-y divide-white/[0.03]">
          {albums.map((album) => (
            <div key={album.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.01] group">
              <img src={getAbsoluteUrl(album.cover_url)} alt={album.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-white/5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-zinc-200">{album.name}</span>
                  <span className="text-xs text-zinc-500">{isVi ? `bởi ${album.artist}` : `by ${album.artist}`}</span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5"><span className="text-zinc-500">{isVi ? 'Mô tả:' : 'Description:'}</span> {album.description || (isVi ? 'Không có mô tả' : 'No description')} · <span className="text-zinc-500">{isVi ? 'Bài hát:' : 'Songs:'}</span> {album.tracks?.length || 0} {isVi ? 'bài' : 'songs'}</p>
                {album.tracks && album.tracks.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {album.tracks.slice(0, 5).map((t: any) => (
                      <span key={t.id} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md truncate max-w-[120px]" title={t.title}>
                        {t.title}
                      </span>
                    ))}
                    {album.tracks.length > 5 && (
                      <span className="text-[10px] text-zinc-500 px-1 py-0.5">+{album.tracks.length - 5} {isVi ? 'bài khác' : 'other songs'}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                <button onClick={() => startEdit(album)} className="p-2 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => del(album.id)} className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {albums.length === 0 && !loading && (
            <div className="p-8 text-center text-zinc-600 text-sm">{isVi ? 'Chưa có album nào. Vui lòng thêm bằng biểu mẫu trên.' : 'No albums yet. Please add using the form above.'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
