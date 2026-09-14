import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useModalStore } from '../../store/useModalStore';
import ImageUploadWithCrop from '../ImageUploadWithCrop';
import { API_BASE, getAbsoluteUrl } from '../../config';

const API = API_BASE;

export function ArtistsTab({ authH }: { authH: Record<string, string> }) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { showConfirm, showAlert } = useModalStore();
  const [artists, setArtists] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', genre: '', listeners: '', popular_track: '', bio: '' });
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/artists`);
      if (data.success) setArtists(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('genre', form.genre);
      formData.append('listeners', form.listeners);
      formData.append('bio', form.bio);
      formData.append('popular_track', form.popular_track);
      if (file) {
        formData.append('cover', file);
      } else if (imageUrl) {
        formData.append('image_url', imageUrl);
      }

      let res;
      if (editing) {
        res = await axios.put(`${API}/artists/${editing}`, formData, {
          headers: {
            ...authH,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        res = await axios.post(`${API}/artists`, formData, {
          headers: {
            ...authH,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      if (res.data.success) {
        showAlert(
          isVi ? 'Thành công' : 'Success',
          editing 
            ? (isVi ? 'Cập nhật thông tin nghệ sĩ thành công!' : 'Artist updated successfully!') 
            : (isVi ? 'Thêm nghệ sĩ thành công!' : 'Artist added successfully!'),
          'success'
        );
        setForm({ name: '', genre: '', listeners: '', popular_track: '', bio: '' });
        setFile(null);
        setImageUrl('');
        setEditing(null);
        fetchArtists();
        window.dispatchEvent(new CustomEvent('reload-artists'));
      }
    } catch (err: any) {
      showAlert(
        isVi ? 'Thất bại' : 'Failed',
        err.response?.data?.message || (isVi ? 'Có lỗi xảy ra khi lưu nghệ sĩ' : 'An error occurred while saving the artist'),
        'error'
      );
    }
  };

  const handleEdit = (artist: any) => {
    setEditing(artist.id);
    setForm({
      name: artist.name,
      genre: artist.genre,
      listeners: artist.listeners,
      popular_track: artist.popular_track,
      bio: artist.bio
    });
    setFile(null);
    setImageUrl(artist.image_url || '');
    const element = document.getElementById('artist-form-container');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: '', genre: '', listeners: '', popular_track: '', bio: '' });
    setFile(null);
    setImageUrl('');
  };

  const del = async (id: number) => {
    showConfirm(
      isVi ? 'Xác nhận xóa' : 'Confirm Delete',
      isVi ? 'Bạn có chắc chắn muốn xóa nghệ sĩ tiêu biểu này?' : 'Are you sure you want to delete this featured artist?',
      async () => {
        try {
          await axios.delete(`${API}/artists/${id}`, { headers: authH });
          showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Đã xóa nghệ sĩ thành công.' : 'Artist deleted successfully.', 'success');
          fetchArtists();
          window.dispatchEvent(new CustomEvent('reload-artists'));
        } catch (err: any) {
          showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể xóa nghệ sĩ.' : 'Failed to delete artist.'), 'error');
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Form thêm nghệ sĩ */}
      <div id="artist-form-container" className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          {editing ? <Edit2 className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-purple-400" />}
          {editing ? (isVi ? 'Chỉnh sửa thông tin nghệ sĩ' : 'Edit Featured Artist') : (isVi ? 'Thêm nghệ sĩ tiêu biểu mới' : 'Add New Featured Artist')}
        </h3>
        
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Tên nghệ sĩ' : 'Artist Name'}</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={isVi ? "Ví dụ: The Weeknd" : "E.g., The Weeknd"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Thể loại' : 'Genre'}</label>
              <input required value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })}
                placeholder={isVi ? "Ví dụ: R&B / Synthwave / Pop" : "E.g., R&B / Synthwave / Pop"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Lượt nghe hàng tháng' : 'Monthly Listeners'}</label>
              <input required value={form.listeners} onChange={e => setForm({ ...form, listeners: e.target.value })}
                placeholder={isVi ? "Ví dụ: 115.4M" : "E.g., 115.4M"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Bài hát nổi bật' : 'Popular Track'}</label>
              <input required value={form.popular_track} onChange={e => setForm({ ...form, popular_track: e.target.value })}
                placeholder={isVi ? "Ví dụ: Blinding Lights" : "E.g., Blinding Lights"}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Mô tả tiểu sử' : 'Bio description'}</label>
            <textarea required rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder={isVi ? "Thông tin giới thiệu chi tiết về cuộc đời, sự nghiệp của ca sĩ..." : "Detailed introduction about the singer's life, career..."}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700 resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUploadWithCrop
              label={isVi ? 'Ảnh chân dung nghệ sĩ (Upload file)' : 'Artist portrait photo (Upload file)'}
              aspectRatio={1}
              cropShape="round"
              placeholder={isVi ? 'Chọn và cắt ảnh chân dung...' : 'Choose and crop portrait...'}
              onFileCropped={(croppedFile) => setFile(croppedFile)}
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Hoặc dán URL ảnh' : 'Or paste image URL'}</label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} disabled={!!file}
                placeholder="http://example.com/image.png"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-700 disabled:opacity-40" />
            </div>
          </div>

          <div className="flex gap-3">
            {editing && (
              <button type="button" onClick={cancelEdit} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-all">
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
            )}
            <button type="submit" className="flex-[2] py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
              {editing ? (isVi ? 'Lưu thay đổi' : 'Save Changes') : (isVi ? 'Thêm nghệ sĩ' : 'Add Artist')}
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách nghệ sĩ */}
      <div className="rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-zinc-300">{isVi ? 'Danh sách nghệ sĩ tiêu biểu hiện có' : 'Featured Artist List'}</h3>
          <button onClick={fetchArtists} className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="divide-y divide-white/[0.03]">
          {artists.map((artist) => (
            <div key={artist.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.01] group">
              <img src={getAbsoluteUrl(artist.image_url)} alt={artist.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-white/5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-zinc-200">{artist.name}</span>
                  <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">{artist.listeners} {isVi ? 'lượt nghe/tháng' : 'listeners/month'}</span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5"><span className="text-zinc-500">{isVi ? 'Thể loại:' : 'Genre:'}</span> {artist.genre} · <span className="text-zinc-500">{isVi ? 'Bài hát nổi bật:' : 'Popular track:'}</span> {artist.popular_track}</p>
                <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1">{artist.bio}</p>
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                <button onClick={() => handleEdit(artist)} className="p-2 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => del(artist.id)} className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {artists.length === 0 && !loading && (
            <div className="p-8 text-center text-zinc-600 text-sm">{isVi ? 'Chưa có nghệ sĩ nào. Vui lòng thêm bằng biểu mẫu trên.' : 'No artists yet. Please add using the form above.'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
