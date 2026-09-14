import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useModalStore } from '../../store/useModalStore';
import ImageUploadWithCrop from '../ImageUploadWithCrop';
import { API_BASE, getAbsoluteUrl } from '../../config';

const API = API_BASE;

export function SettingsTab({ authH }: { authH: Record<string, string> }) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [backdrops, setBackdrops] = useState<any[]>([]);
  const [bannerSlides, setBannerSlides] = useState<any[]>([]);
  const [youtubeCookies, setYoutubeCookies] = useState('');
  const [loading, setLoading] = useState(false);

  // Drag and Drop reordering state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [draggedType, setDraggedType] = useState<'backdrop' | 'banner' | null>(null);

  const { showConfirm, showAlert } = useModalStore();

  const handleDragStart = (e: React.DragEvent, index: number, type: 'backdrop' | 'banner') => {
    setDraggedIdx(index);
    setDraggedType(type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number, type: 'backdrop' | 'banner') => {
    e.preventDefault();
    if (draggedIdx === null || draggedType !== type || draggedIdx === index) return;

    if (type === 'backdrop') {
      const list = [...backdrops];
      const draggedItem = list[draggedIdx];
      list.splice(draggedIdx, 1);
      list.splice(index, 0, draggedItem);
      setBackdrops(list);
      setDraggedIdx(index);
    } else {
      const list = [...bannerSlides];
      const draggedItem = list[draggedIdx];
      list.splice(draggedIdx, 1);
      list.splice(index, 0, draggedItem);
      setBannerSlides(list);
      setDraggedIdx(index);
    }
  };

  const handleDragEnd = async (type: 'backdrop' | 'banner') => {
    setDraggedIdx(null);
    setDraggedType(null);
    try {
      if (type === 'backdrop') {
        const ids = backdrops.map(b => b.id);
        await axios.put(`${API}/settings/backdrops/reorder`, { ids }, { headers: authH });
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Cập nhật thứ tự hình nền thành công!' : 'Backdrop order updated successfully!', 'success');
        window.dispatchEvent(new CustomEvent('reload-settings'));
      } else {
        const ids = bannerSlides.map(s => s.id);
        await axios.put(`${API}/settings/banner-slides/reorder`, { ids }, { headers: authH });
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Cập nhật thứ tự banner thành công!' : 'Banner order updated successfully!', 'success');
        window.dispatchEvent(new CustomEvent('reload-settings'));
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', isVi ? 'Lỗi khi cập nhật thứ tự.' : 'Failed to update order.', 'error');
    }
  };

  // Form states for background (backdrop)
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgUrl, setBgUrl] = useState('');

  // Form states for banner slide
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [slideUrl, setSlideUrl] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const bgRes = await axios.get(`${API}/settings/backdrops`);
      if (bgRes.data.success) {
        setBackdrops(bgRes.data.data || []);
      }

      const slidesRes = await axios.get(`${API}/settings/banner-slides`);
      if (slidesRes.data.success) {
        setBannerSlides(slidesRes.data.data || []);
      }

      const cookiesRes = await axios.get(`${API}/settings/youtube-cookies`, { headers: authH });
      if (cookiesRes.data.success) {
        setYoutubeCookies(cookiesRes.data.value || '');
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi tải cấu hình.' : 'Failed to load configuration.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddBackdrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bgFile && !bgUrl.trim()) {
      showAlert(isVi ? 'Chú ý' : 'Warning', isVi ? 'Vui lòng tải lên tệp ảnh hoặc điền link ảnh.' : 'Please upload an image file or enter an image URL.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (bgFile) {
        formData.append('cover', bgFile);
      } else {
        formData.append('image_url', bgUrl);
      }

      const res = await axios.post(`${API}/settings/backdrops`, formData, {
        headers: { ...authH, 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setBackdrops([res.data.data, ...backdrops]);
        setBgFile(null);
        setBgUrl('');
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Thêm ảnh nền thành công!' : 'Backdrop added successfully!', 'success');
        window.dispatchEvent(new CustomEvent('reload-settings'));
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi thêm ảnh nền.' : 'Failed to add backdrop.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackdrop = async (id: number) => {
    showConfirm(
      isVi ? 'Xác nhận xóa' : 'Confirm Delete',
      isVi ? 'Bạn có chắc chắn muốn xóa ảnh nền này?' : 'Are you sure you want to delete this backdrop?',
      async () => {
        setLoading(true);
        try {
          const res = await axios.delete(`${API}/settings/backdrops/${id}`, { headers: authH });
          if (res.data.success) {
            setBackdrops(backdrops.filter(b => b.id !== id));
            showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Xóa ảnh nền thành công!' : 'Backdrop deleted successfully!', 'success');
            window.dispatchEvent(new CustomEvent('reload-settings'));
          }
        } catch (err: any) {
          showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi xóa ảnh nền.' : 'Failed to delete backdrop.'), 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleAddBannerSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideFile && !slideUrl.trim()) {
      showAlert(isVi ? 'Chú ý' : 'Warning', isVi ? 'Vui lòng tải lên tệp ảnh hoặc điền link ảnh.' : 'Please upload an image file or enter an image URL.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (slideFile) {
        formData.append('cover', slideFile);
      } else {
        formData.append('image_url', slideUrl);
      }

      const res = await axios.post(`${API}/settings/banner-slides`, formData, {
        headers: { ...authH, 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setBannerSlides([res.data.data, ...bannerSlides]);
        setSlideFile(null);
        setSlideUrl('');
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Thêm ảnh banner thành công!' : 'Banner image added successfully!', 'success');
        window.dispatchEvent(new CustomEvent('reload-settings'));
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi thêm banner.' : 'Failed to add banner image.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBannerSlide = async (id: number) => {
    showConfirm(
      isVi ? 'Xác nhận xóa' : 'Confirm Delete',
      isVi ? 'Bạn có chắc chắn muốn xóa ảnh banner này?' : 'Are you sure you want to delete this banner image?',
      async () => {
        setLoading(true);
        try {
          const res = await axios.delete(`${API}/settings/banner-slides/${id}`, { headers: authH });
          if (res.data.success) {
            setBannerSlides(bannerSlides.filter(s => s.id !== id));
            showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Xóa ảnh banner thành công!' : 'Banner image deleted successfully!', 'success');
            window.dispatchEvent(new CustomEvent('reload-settings'));
          }
        } catch (err: any) {
          showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi xóa banner.' : 'Failed to delete banner image.'), 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleUpdateCookies = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/settings/youtube-cookies`, { value: youtubeCookies }, { headers: authH });
      if (res.data.success) {
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Cập nhật YouTube Cookies thành công!' : 'YouTube Cookies updated successfully!', 'success');
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Lỗi khi cập nhật Cookies.' : 'Failed to update Cookies.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Background Section */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            🖼️ {isVi ? 'Quản lý nhiều hình nền (Backdrop Backgrounds)' : 'Backdrop Backgrounds Management'}
          </h3>
          <p className="text-xs text-zinc-500">
            {isVi 
              ? 'Tải lên nhiều hình nền để hiển thị dọc theo độ dài của trang chủ, tự động tạo khoảng cách chuyển tiếp đẹp mắt.' 
              : 'Upload multiple backdrops to display along the length of the homepage, automatically spacing out beautifully.'}
          </p>
        </div>

        {/* Hint for drag and drop */}
        {backdrops.length > 0 && (
          <p className="text-[11px] text-amber-500/90 bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
            💡 {isVi ? 'Nhấn giữ và kéo thả các ảnh để sắp xếp thứ tự hiển thị của hình nền trang chủ.' : 'Click and drag images to rearrange the home backdrop display order.'}
          </p>
        )}

        {/* List of current backdrops */}
        {backdrops.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {backdrops.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index, 'backdrop')}
                onDragOver={(e) => handleDragOver(e, index, 'backdrop')}
                onDragEnd={() => handleDragEnd('backdrop')}
                className={`group relative aspect-[16/9] rounded-xl overflow-hidden border bg-zinc-900 shadow-md cursor-grab active:cursor-grabbing transition-all duration-300 ${
                  draggedIdx === index && draggedType === 'backdrop'
                    ? 'opacity-40 border-amber-500 scale-95 z-50 shadow-amber-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <img src={getAbsoluteUrl(item.image_url)} alt="Backdrop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                
                {/* Drag Handle Indicator */}
                <div className="absolute top-2 left-2 p-1 bg-black/60 rounded text-zinc-400 opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none">
                  <GripVertical className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold text-zinc-300">#{index + 1}</span>
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleDeleteBackdrop(item.id)}
                    className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg transition-transform transform scale-90 group-hover:scale-100 cursor-pointer"
                    title={isVi ? 'Xóa hình nền này' : 'Delete this backdrop'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddBackdrop} className="space-y-4 max-w-xl border-t border-white/5 pt-4">
          <h4 className="text-xs font-bold text-zinc-400">{isVi ? 'Thêm hình nền mới' : 'Add New Backdrop'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUploadWithCrop
              label={isVi ? 'Tải file ảnh lên' : 'Upload image file'}
              aspectRatio={16 / 9}
              cropShape="rect"
              placeholder={isVi ? 'Chọn và cắt ảnh nền backdrop...' : 'Choose and crop backdrop...'}
              onFileCropped={(croppedFile) => {
                setBgFile(croppedFile);
                setBgUrl('');
              }}
            />
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Hoặc đường dẫn ảnh (URL)' : 'Or image URL'}</label>
              <input
                type="text"
                placeholder="http://localhost:1005/..."
                value={bgUrl}
                disabled={!!bgFile}
                onChange={e => setBgUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none placeholder-zinc-600 disabled:opacity-50"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isVi ? 'Thêm hình nền' : 'Add Backdrop'}
          </button>
        </form>
      </div>

      {/* Cookies Section */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          🔑 {isVi ? 'Cấu hình YouTube Cookies (Vượt chặn tải nhạc)' : 'YouTube Cookies (Bypass Bot Check)'}
        </h3>
        <p className="text-xs text-zinc-500">
          {isVi 
            ? 'Nhập nội dung tập tin Cookies (định dạng Netscape) để yt-dlp có thể vượt qua kiểm tra bot của YouTube trên Render.' 
            : 'Enter Cookies file content (Netscape format) to allow yt-dlp to bypass YouTube bot protection on Render.'}
        </p>
        <div className="text-xs text-amber-500/90 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 space-y-1">
          <p className="font-bold">💡 {isVi ? 'Cách lấy Cookies:' : 'How to export Cookies:'}</p>
          <ul className="list-disc pl-4 space-y-0.5 text-zinc-400">
            <li>{isVi ? "Cài đặt tiện ích Chrome 'Get cookies.txt LOCALLY' hoặc 'Cookie-Editor'." : "Install Chrome extension 'Get cookies.txt LOCALLY' or 'Cookie-Editor'."}</li>
            <li>{isVi ? 'Mở trang youtube.com (đảm bảo đã đăng nhập một tài khoản phụ).' : 'Go to youtube.com (make sure you are logged in on a dummy/secondary account).'}</li>
            <li>{isVi ? 'Xuất Cookies dưới dạng Netscape/text rồi dán toàn bộ nội dung vào ô dưới đây.' : 'Export cookies as Netscape format, copy the full text, and paste below.'}</li>
          </ul>
        </div>

        <form onSubmit={handleUpdateCookies} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              {isVi ? 'Nội dung Cookies (Netscape Text)' : 'Cookies Content (Netscape Text)'}
            </label>
            <textarea
              rows={8}
              value={youtubeCookies}
              onChange={e => setYoutubeCookies(e.target.value)}
              placeholder="# Netscape HTTP Cookie File&#10;.youtube.com&#10;..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white focus:outline-none placeholder-zinc-700 font-mono resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
          >
            {isVi ? 'Lưu cấu hình Cookies' : 'Save Cookies Configuration'}
          </button>
        </form>
      </div>

      {/* Banner Section */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            🎞️ {isVi ? 'Quản lý hình ảnh Banner Slideshow' : 'Banner Slideshow Management'}
          </h3>
          <p className="text-xs text-zinc-500">
            {isVi ? 'Thêm, xem danh sách và xóa các ảnh trình chiếu trên banner chào mừng "Xin chào, Dũ!".' : 'Add, view, and delete images on the welcoming slide banner "Hello, Du!".'}
          </p>
        </div>

        {/* Add Banner Form */}
        <form onSubmit={handleAddBannerSlide} className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 space-y-3 max-w-xl">
          <h4 className="text-xs font-bold text-zinc-300">{isVi ? 'Thêm ảnh banner mới' : 'Add New Banner Image'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUploadWithCrop
              label={isVi ? 'Tải file ảnh lên' : 'Upload image file'}
              aspectRatio={16 / 9}
              cropShape="rect"
              placeholder={isVi ? 'Chọn và cắt ảnh banner...' : 'Choose and crop banner...'}
              onFileCropped={(croppedFile) => {
                setSlideFile(croppedFile);
                setSlideUrl('');
              }}
            />
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">{isVi ? 'Hoặc đường dẫn ảnh (URL)' : 'Or image URL'}</label>
              <input
                type="text"
                placeholder="http://localhost:1005/..."
                value={slideUrl}
                disabled={!!slideFile}
                onChange={e => setSlideUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none placeholder-zinc-600 disabled:opacity-50"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
          >
            {isVi ? 'Thêm vào slideshow' : 'Add to Slideshow'}
          </button>
        </form>

        {/* Banner List */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-zinc-300">{isVi ? `Danh sách ảnh banner hiện tại (${bannerSlides.length})` : `Current banner image list (${bannerSlides.length})`}</h4>
            {bannerSlides.length > 0 && (
              <p className="text-[11px] text-amber-500/90 bg-amber-500/5 border border-amber-500/10 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 self-start">
                💡 {isVi ? 'Nhấn giữ và kéo thả để thay đổi thứ tự trình chiếu slideshow.' : 'Click and drag to rearrange the slideshow sequence.'}
              </p>
            )}
          </div>
          {bannerSlides.length === 0 ? (
            <p className="text-xs text-zinc-600">{isVi ? 'Chưa có ảnh banner nào. Hệ thống sẽ hiển thị các slide mặc định.' : 'No banner images yet. Default slides will be shown.'}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {bannerSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index, 'banner')}
                  onDragOver={(e) => handleDragOver(e, index, 'banner')}
                  onDragEnd={() => handleDragEnd('banner')}
                  className={`relative group rounded-xl overflow-hidden border bg-zinc-900 aspect-[16/9] cursor-grab active:cursor-grabbing transition-all duration-300 ${
                    draggedIdx === index && draggedType === 'banner'
                      ? 'opacity-40 border-amber-500 scale-95 z-50 shadow-amber-500/10'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <img src={getAbsoluteUrl(slide.image_url)} alt="Banner slide" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-300" />
                  
                  {/* Drag Handle Indicator */}
                  <div className="absolute top-2 left-2 p-1 bg-black/60 rounded text-zinc-400 opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none">
                    <GripVertical className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold text-zinc-300">#{index + 1}</span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteBannerSlide(slide.id)}
                        className="p-1.5 bg-red-600/95 hover:bg-red-500 text-white rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-400 truncate bg-black/40 px-1.5 py-0.5 rounded self-start max-w-full">
                      {slide.image_url}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
