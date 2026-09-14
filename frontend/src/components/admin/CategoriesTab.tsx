import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useModalStore } from '../../store/useModalStore';
import { API_BASE } from '../../config';

const API = API_BASE;

const PRESET_EMOJIS = [
  { char: '🎵', tags: 'music song note nhạc nốt' },
  { char: '🎶', tags: 'music notes melody nhạc giai điệu' },
  { char: '📻', tags: 'radio lofi đài phát thanh' },
  { char: '🎸', tags: 'guitar rock instrument đàn ghita' },
  { char: '🎹', tags: 'piano classical instrument đàn dương cầm' },
  { char: '🎻', tags: 'violin classical instrument vĩ cầm' },
  { char: '🎷', tags: 'saxophone jazz instrument kèn' },
  { char: '🎺', tags: 'trumpet instrument kèn' },
  { char: '🎤', tags: 'microphone mic sing vocal hát micro' },
  { char: '🎧', tags: 'headphone dj music nghe nhạc tai nghe' },
  { char: '🇻🇳', tags: 'vietnam vpop viet nam cờ việt nam' },
  { char: '🇺🇸', tags: 'usa us uk english cờ mỹ' },
  { char: '🇰🇷', tags: 'korea kpop cờ hàn quốc' },
  { char: '🇯🇵', tags: 'japan jpop cờ nhật bản' },
  { char: '🇬🇧', tags: 'uk britain english cờ anh' },
  { char: '🇨🇳', tags: 'china cpop cờ trung quốc' },
  { char: '⚡', tags: 'electric edm thunder flash điện sét' },
  { char: '🌌', tags: 'synthwave galaxy space space vũ trụ dải ngân hà' },
  { char: '🔥', tags: 'hiphop hot rap fire lửa nhiệt' },
  { char: '💃', tags: 'dance latin girl khiêu vũ nhảy' },
  { char: '🕺', tags: 'dance disco boy khiêu vũ nhảy' },
  { char: '☕', tags: 'coffee acoustic lofi tea cà phê trà' },
  { char: '💤', tags: 'sleep lofi relax ngủ thư giãn' },
  { char: '🌊', tags: 'wave chill ocean biển sóng' },
  { char: '🌴', tags: 'palm summer beach nhiệt đới cây dừa' },
  { char: '🍂', tags: 'autumn sad ballad lá rụng mùa thu buồn' },
  { char: '🎮', tags: 'gaming game chiptune trò chơi' },
  { char: '📼', tags: 'retro tape cassette băng nhạc' },
  { char: '💿', tags: 'cd dvd disc vinyl đĩa nhạc' },
  { char: '🎭', tags: 'theater drama opera classical nghệ thuật kịch' },
  { char: '⭐', tags: 'star favorite ngôi sao' },
  { char: '✨', tags: 'sparkles magic lấp lánh ảo thuật' },
  { char: '❤️', tags: 'love heart tim yêu' },
  { char: '💔', tags: 'broken heart buồn sad chia tay' },
  { char: '🎉', tags: 'party celebrate party lễ hội tiệc' },
  { char: '🔊', tags: 'sound speaker volume loa âm thanh' },
  { char: '🥁', tags: 'drum beats trống gõ' },
  { char: '🎼', tags: 'score stave music khuông nhạc' },
  { char: '📣', tags: 'megaphone announcement loa phát thanh' },
  { char: '🔔', tags: 'bell notification chuông' },
  { char: '🪐', tags: 'saturn space sao thổ vũ trụ' },
  { char: '🌙', tags: 'moon night lofi trăng đêm' },
  { char: '☀️', tags: 'sun bright day mặt trời nắng' },
  { char: '☁️', tags: 'cloud chill mây' },
  { char: '🌧️', tags: 'rain sad ballad mưa buồn' },
  { char: '❄️', tags: 'snow cold winter tuyết lạnh' },
  { char: '🌈', tags: 'rainbow cầu vồng' },
  { char: '🔮', tags: 'crystal magic quả cầu pha lê' },
  { char: '🎈', tags: 'balloon bóng bay' },
  { char: '🧸', tags: 'bear toy lofi gấu bông' },
  { char: '🐱', tags: 'cat meow mèo' },
  { char: '🐶', tags: 'dog woof chó' },
  { char: '🦊', tags: 'fox cáo' },
  { char: '🦄', tags: 'unicorn kỳ lân' },
  { char: '🦁', tags: 'lion sư tử' },
  { char: '🌸', tags: 'flower spring hoa anh đào' },
  { char: '🌹', tags: 'rose flower hoa hồng' },
  { char: '🍀', tags: 'lucky cỏ 4 lá may mắn' },
  { char: '🌵', tags: 'cactus xương rồng' },
  { char: '🌍', tags: 'earth world quả địa cầu' },
  { char: '🚀', tags: 'rocket space bay tên lửa' },
  { char: '🛸', tags: 'ufo alien đĩa bay' },
  { char: '💎', tags: 'diamond kim cương' },
  { char: '👑', tags: 'crown king queen vương miện' },
  { char: '💡', tags: 'idea light bóng đèn ý tưởng' },
  { char: '📚', tags: 'book study sách' },
  { char: '✉️', tags: 'mail letter thư' },
  { char: '🗺️', tags: 'map bản đồ' },
  { char: '🧭', tags: 'compass la bàn' },
  { char: '⏰', tags: 'clock time đồng hồ báo thức' },
  { char: '💰', tags: 'money gold tiền vàng' },
  { char: '🎁', tags: 'gift present quà' },
  { char: '🎨', tags: 'art paint palette bảng màu mỹ thuật' },
  { char: '🎬', tags: 'movie cinema clapperboard điện ảnh phim' },
  { char: '📷', tags: 'camera photo máy ảnh' },
  { char: '🔍', tags: 'search find kính lúp' },
  { char: '🔑', tags: 'key mật mã chìa khóa' },
  { char: '🧁', tags: 'cupcake cake bánh ngọt' },
  { char: '🍭', tags: 'lollipop kẹo mút' },
  { char: '🍎', tags: 'apple táo' },
  { char: '🍉', tags: 'watermelon dưa hấu' },
  { char: '🍓', tags: 'strawberry dâu tây' },
  { char: '🍋', tags: 'lemon chanh' },
  { char: '🍷', tags: 'wine rượu vang' },
  { char: '🍺', tags: 'beer bia' },
  { char: '🍹', tags: 'cocktail nước ngọt' },
  { char: '🍕', tags: 'pizza' },
  { char: '🍟', tags: 'fries khoai tây chiên' },
  { char: '🍔', tags: 'burger bánh mì kẹp' },
  { char: '🛫', tags: 'plane travel máy bay cất cánh' },
  { char: '🚗', tags: 'car xe hơi' },
  { char: '🚲', tags: 'bicycle xe đạp' },
  { char: '⚓', tags: 'anchor mỏ neo' },
  { char: '⛰️', tags: 'mountain núi' },
  { char: '⛺', tags: 'tent camping lều cắm trại' },
  { char: '🏠', tags: 'home house nhà' },
  { char: '🏙️', tags: 'city thành phố' },
  { char: '⛲', tags: 'fountain đài phun nước' },
  { char: '🎢', tags: 'rollercoaster tàu lượn siêu tốc' },
  { char: '🎠', tags: 'carousel ngựa gỗ' },
  { char: '🎡', tags: 'ferris wheel vòng quay' },
  { char: '🎪', tags: 'circus rạp xiếc' },
  { char: '🎟️', tags: 'ticket vé' },
  { char: '🏆', tags: 'trophy cup cúp vô địch' },
  { char: '🎯', tags: 'target bullseye mục tiêu' },
  { char: '🧩', tags: 'puzzle mảnh ghép' },
  { char: '🕶️', tags: 'sunglasses kính mát' }
];

export function CategoriesTab({ authH }: { authH: Record<string, string> }) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', color: '#7c3aed', icon: '🎵' });
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/categories`, { headers: authH });
      if (data.success) setCats(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const { showConfirm, showAlert } = useModalStore();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API}/categories/${editing}`, form, { headers: authH });
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Cập nhật danh mục thành công!' : 'Category updated successfully!', 'success');
      } else {
        await axios.post(`${API}/categories`, form, { headers: authH });
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Thêm danh mục mới thành công!' : 'Category created successfully!', 'success');
      }
      setForm({ name: '', description: '', color: '#7c3aed', icon: '🎵' });
      setEditing(null);
      fetch();
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Có lỗi xảy ra khi lưu danh mục' : 'An error occurred while saving the category'), 'error');
    }
  };

  const del = async (id: number) => {
    showConfirm(
      isVi ? 'Xác nhận xóa' : 'Confirm Delete',
      isVi ? 'Bạn có chắc chắn muốn xóa danh mục này? Tất cả bài hát trong danh mục sẽ được gán lại.' : 'Are you sure you want to delete this category? All songs in this category will be reassigned.',
      async () => {
        try {
          await axios.delete(`${API}/categories/${id}`, { headers: authH });
          showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Đã xóa danh mục thành công.' : 'Category deleted successfully.', 'success');
          fetch();
        } catch (err: any) {
          showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể xóa danh mục.' : 'Failed to delete category.'), 'error');
        }
      }
    );
  };

  const startEdit = (c: any) => {
    setEditing(c.id);
    setForm({ name: c.name, description: c.description || '', color: c.color, icon: c.icon });
  };

  const filteredEmojis = PRESET_EMOJIS.filter(e => 
    e.tags.toLowerCase().includes(emojiSearch.toLowerCase()) || 
    e.char.includes(emojiSearch)
  );

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
        <h3 className="text-sm font-bold text-white mb-3">{editing ? (isVi ? 'Chỉnh sửa danh mục' : 'Edit Category') : (isVi ? 'Thêm danh mục mới' : 'Add New Category')}</h3>
        <form onSubmit={save} className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <input
              required
              value={form.icon}
              onChange={e => setForm({ ...form, icon: e.target.value })}
              onClick={() => setShowEmojiPicker(true)}
              placeholder="🎵"
              className="w-14 bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-2 py-2 text-xl text-center focus:outline-none cursor-pointer"
            />
            {showEmojiPicker && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => {
                    setShowEmojiPicker(false);
                    setEmojiSearch('');
                  }} 
                />
                <div className="absolute top-full left-0 mt-1.5 p-2 bg-zinc-950/95 border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-40 w-56 flex flex-col gap-2">
                  <input
                    type="text"
                    value={emojiSearch}
                    onChange={e => setEmojiSearch(e.target.value)}
                    placeholder={isVi ? "Tìm biểu tượng..." : "Search icon..."}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-zinc-500"
                    autoFocus
                  />
                  <div className="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {filteredEmojis.length === 0 ? (
                      <span className="col-span-5 text-[10px] text-zinc-500 text-center py-4">{isVi ? 'Không tìm thấy' : 'Not found'}</span>
                    ) : (
                      filteredEmojis.map(emoji => (
                        <button
                          key={emoji.char}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, icon: emoji.char });
                            setShowEmojiPicker(false);
                            setEmojiSearch('');
                          }}
                          className="text-xl p-1 hover:bg-white/10 rounded-lg transition-colors text-center active:scale-90"
                          title={emoji.tags}
                        >
                          {emoji.char}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={isVi ? "Tên danh mục" : "Category Name"}
            className="flex-1 min-w-[120px] bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600" />
          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={isVi ? "Mô tả..." : "Description..."}
            className="flex-1 min-w-[200px] bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600" />
          <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
            className="w-10 h-9 rounded-lg border border-zinc-800 cursor-pointer bg-zinc-900 p-0.5" />
          <button type="submit" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-lg text-sm">
            {editing ? (isVi ? 'Cập nhật' : 'Update') : (isVi ? 'Thêm' : 'Add')}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', description: '', color: '#7c3aed', icon: '🎵' }); }}
            className="px-3 py-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-lg text-sm">{isVi ? 'Hủy' : 'Cancel'}</button>}
        </form>
      </div>

      {/* Category List */}
      <div className="grid grid-cols-2 gap-3">
        {cats.map(c => (
          <div key={c.id} className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] group hover:bg-white/[0.04] transition-all">
            <span className="text-2xl">{c.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <p className="text-sm font-semibold text-zinc-200">{c.name}</p>
              </div>
              <p className="text-xs text-zinc-500">{c.track_count} {isVi ? 'bài hát' : 'songs'}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => startEdit(c)} className="p-1.5 text-zinc-500 hover:text-purple-400 rounded-lg hover:bg-white/5"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => del(c.id)} className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
