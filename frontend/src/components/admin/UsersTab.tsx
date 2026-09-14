import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Trash2, Lock, Unlock, Key } from 'lucide-react';
import axios from 'axios';
import { useModalStore } from '../../store/useModalStore';
import { API_BASE, getAbsoluteUrl } from '../../config';

const API = API_BASE;

export function UsersTab({ authH }: { authH: Record<string, string> }) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [banTarget, setBanTarget] = useState<any | null>(null); // user to ban
  const [banType, setBanType] = useState<'days' | 'permanent'>('days');
  const [banDays, setBanDays] = useState(7);

  // Reset password state
  const [resetTarget, setResetTarget] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/auth/users`, { headers: authH });
      if (data.success) setUsers(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const { showConfirm, showAlert } = useModalStore();

  const deleteUser = async (id: number) => {
    showConfirm(
      isVi ? 'Xác nhận xóa' : 'Confirm Delete',
      isVi ? 'Bạn có chắc chắn muốn xóa người dùng này khỏi hệ thống?' : 'Are you sure you want to delete this user from the system?',
      async () => {
        try {
          await axios.delete(`${API}/auth/users/${id}`, { headers: authH });
          showAlert(isVi ? 'Thành công' : 'Success', isVi ? 'Đã xóa người dùng thành công.' : 'User deleted successfully.', 'success');
          fetchUsers();
        } catch (err: any) {
          showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể xóa người dùng.' : 'Failed to delete user.'), 'error');
        }
      }
    );
  };

  const applyBan = async () => {
    if (!banTarget) return;
    try {
      const payload = banType === 'permanent'
        ? { type: 'permanent' }
        : { type: 'days', days: banDays };
      await axios.put(`${API}/auth/users/${banTarget.id}/ban`, payload, { headers: authH });
      showAlert(isVi ? 'Thành công' : 'Success', isVi ? `Đã khóa tài khoản ${banTarget.name} thành công.` : `Successfully banned ${banTarget.name}.`, 'success');
      setBanTarget(null);
      fetchUsers();
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể khóa tài khoản.' : 'Failed to ban account.'), 'error');
    }
  };

  const unbanUser = async (u: any) => {
    try {
      await axios.put(`${API}/auth/users/${u.id}/ban`, { type: 'unban' }, { headers: authH });
      showAlert(isVi ? 'Thành công' : 'Success', isVi ? `Đã mở khóa tài khoản ${u.name}.` : `Successfully unbanned ${u.name}.`, 'success');
      fetchUsers();
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể mở khóa.' : 'Failed to unban.'), 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword) return;
    if (newPassword.length < 6) {
      showAlert(isVi ? 'Thất bại' : 'Failed', isVi ? 'Mật khẩu mới phải có ít nhất 6 ký tự.' : 'New password must be at least 6 characters.', 'error');
      return;
    }
    try {
      const res = await axios.put(`${API}/auth/users/${resetTarget.id}/reset-password`, { newPassword }, { headers: authH });
      if (res.data.success) {
        showAlert(isVi ? 'Thành công' : 'Success', isVi ? `Đã đặt lại mật khẩu cho ${resetTarget.name} thành công!` : `Password reset for ${resetTarget.name} successfully!`, 'success');
        setResetTarget(null);
        setNewPassword('');
      }
    } catch (err: any) {
      showAlert(isVi ? 'Thất bại' : 'Failed', err.response?.data?.message || (isVi ? 'Không thể đặt lại mật khẩu.' : 'Failed to reset password.'), 'error');
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setShowPassword(true);
  };

  // Helper: check if user is currently banned
  const isBanned = (u: any) => {
    if (!u.banned_until) return false;
    return new Date(u.banned_until) > new Date();
  };
  const isPermanentBan = (u: any) => u.banned_until && new Date(u.banned_until).getFullYear() >= 9999;
  const banLabel = (u: any) => {
    if (!isBanned(u)) return null;
    if (isPermanentBan(u)) return isVi ? 'Khóa vĩnh viễn' : 'Permanently banned';
    const d = new Date(u.banned_until);
    return isVi ? `Khóa đến ${d.toLocaleDateString('vi-VN')}` : `Banned until ${d.toLocaleDateString('en-US')}`;
  };

  const isOnline = (u: any) => {
    if (!u.last_active_at) return false;
    const lastActive = new Date(u.last_active_at);
    const now = new Date();
    return (now.getTime() - lastActive.getTime()) < 5 * 60 * 1000;
  };

  const lastActiveLabel = (u: any) => {
    if (!u.last_active_at) return isVi ? 'Chưa rõ' : 'Unknown';
    const lastActive = new Date(u.last_active_at);
    return lastActive.toLocaleString(isVi ? 'vi-VN' : 'en-US');
  };

  const admins = users.filter(u => u.role === 'admin').length;
  const regular = users.filter(u => u.role === 'user').length;
  const banned  = users.filter(u => isBanned(u)).length;

  return (
    <div className="space-y-4">
      {/* Ban Modal */}
      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-950 border border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.15)] rounded-2xl p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 flex-shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{isVi ? 'Khóa tài khoản' : 'Ban Account'}</h3>
                <p className="text-sm text-zinc-400 mt-0.5">{isVi ? 'Khóa tài khoản' : 'Ban account'} <span className="text-white font-semibold">{banTarget.name}</span></p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBanType('days')}
                  className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                    banType === 'days' ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' : 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >{isVi ? '⏱ Theo ngày' : '⏱ By days'}</button>
                <button
                  onClick={() => setBanType('permanent')}
                  className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                    banType === 'permanent' ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' : 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >{isVi ? '🔒 Vĩnh viễn' : '🔒 Permanent'}</button>
              </div>

              {banType === 'days' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Số ngày khóa' : 'Days to ban'}</label>
                  <div className="flex items-center gap-2">
                    {[1, 3, 7, 14, 30].map(d => (
                      <button
                        key={d}
                        onClick={() => setBanDays(d)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          banDays === d ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' : 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >{d}d</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{isVi ? 'Hoặc nhập số ngày:' : 'Or enter days:'}</span>
                    <input
                      type="number" min={1} max={365}
                      value={banDays}
                      onChange={e => setBanDays(Number(e.target.value))}
                      className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              )}

              {banType === 'permanent' && (
                <p className="text-xs text-zinc-500 bg-rose-500/5 border border-rose-500/10 rounded-xl px-3 py-2">
                  {isVi ? '⚠️ Người dùng sẽ không thể đăng nhập mãi mãi cho đến khi admin mở khóa.' : '⚠️ User will not be able to log in until they are unbanned.'}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBanTarget(null)}
                className="px-4 py-2 border border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
              >{isVi ? 'Hủy' : 'Cancel'}</button>
              <button
                onClick={applyBan}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all"
              >{isVi ? 'Xác nhận khóa' : 'Confirm Ban'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[[isVi ? 'Tổng' : 'Total', users.length, 'text-blue-400','bg-blue-500/10'],['Admin', admins,'text-amber-400','bg-amber-500/10'],[isVi ? 'Người dùng' : 'User', regular,'text-purple-400','bg-purple-500/10'],[isVi ? 'Bị khóa' : 'Banned', banned,'text-rose-400','bg-rose-500/10']].map(([l,v,tc,bg]) => (
          <div key={l as string} className={`rounded-xl border border-white/5 p-4 ${bg} flex items-center gap-3`}>
            <div>
              <p className={`text-xl font-bold ${tc}`}>{v as number}</p>
              <p className="text-xs text-zinc-500">{l as string}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-zinc-300">{isVi ? 'Danh sách người dùng' : 'User List'}</h3>
          <button onClick={fetchUsers} className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {users.map(u => (
            <div key={u.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] group ${
              isBanned(u) ? 'bg-rose-950/10' : ''
            }`}>
              <div className="relative flex-shrink-0">
                <div className={`w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center ${
                  isBanned(u) ? 'ring-1 ring-rose-500/40 opacity-60' : ''
                }`}>
                  {u.avatar_url ? <img src={getAbsoluteUrl(u.avatar_url)} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-zinc-400">{u.name.charAt(0).toUpperCase()}</span>}
                </div>
                <div 
                  className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-zinc-950 ${
                    isOnline(u) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-500'
                  }`}
                  title={isOnline(u) ? (isVi ? 'Đang hoạt động' : 'Active') : (isVi ? `Hoạt động lần cuối: ${lastActiveLabel(u)}` : `Last active: ${lastActiveLabel(u)}`)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold truncate ${isBanned(u) ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{u.name}</span>
                  {u.role === 'admin' && <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>}
                  {isBanned(u) && <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> {banLabel(u)}
                  </span>}
                </div>
                <p className="text-xs text-zinc-500 truncate">{u.email || '—'} · {u.provider}</p>
              </div>
              <span className="text-xs text-zinc-600 hidden md:block">{new Date(u.created_at).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}</span>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                {u.role === 'admin' ? (
                  <span className="text-[10px] text-amber-400/70 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg font-medium">
                    {isVi ? 'Tài khoản được bảo vệ' : 'Protected Account'}
                  </span>
                ) : (
                  <>
                    {isBanned(u) ? (
                      <button
                        onClick={() => unbanUser(u)}
                        title={isVi ? 'Mở khóa tài khoản' : 'Unban account'}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                      >
                        <Unlock className="w-3 h-3" /> {isVi ? 'Mở khóa' : 'Unban'}
                      </button>
                    ) : (
                      <button
                        onClick={() => { setBanTarget(u); setBanType('days'); setBanDays(7); }}
                        title={isVi ? 'Khóa tài khoản' : 'Ban account'}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                      >
                        <Lock className="w-3 h-3" /> {isVi ? 'Khóa' : 'Ban'}
                      </button>
                    )}

                    <button
                      onClick={() => { setResetTarget(u); setNewPassword(''); setShowPassword(false); }}
                      title={isVi ? 'Đặt lại mật khẩu' : 'Reset password'}
                      className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>

                    <button onClick={() => deleteUser(u.id)} className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-950 border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)] rounded-2xl p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 flex-shrink-0">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{isVi ? 'Đặt lại mật khẩu' : 'Reset Password'}</h3>
                <p className="text-sm text-zinc-400 mt-0.5">{isVi ? 'Đặt mật khẩu mới cho' : 'Set new password for'} <span className="text-white font-semibold">{resetTarget.name}</span></p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-400">{isVi ? 'Mật khẩu mới' : 'New Password'}</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold hover:underline"
                  >
                    ✨ {isVi ? 'Tạo ngẫu nhiên' : 'Generate random'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder={isVi ? "Nhập mật khẩu mới..." : "Enter new password..."}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 font-medium"
                  >
                    {showPassword ? (isVi ? 'Ẩn' : 'Hide') : (isVi ? 'Hiện' : 'Show')}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setResetTarget(null); setNewPassword(''); }}
                className="px-4 py-2 border border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
              >{isVi ? 'Hủy' : 'Cancel'}</button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={!newPassword || newPassword.length < 6}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all"
              >{isVi ? 'Lưu mật khẩu mới' : 'Save New Password'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
