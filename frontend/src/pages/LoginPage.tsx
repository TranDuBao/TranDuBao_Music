import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, WifiOff } from 'lucide-react';
import Logo from '../components/Logo';
import { API_BASE } from '../config';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login, register, token } = useAuthStore();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // If already logged in, redirect immediately
  useEffect(() => {
    if (token) navigate('/app', { replace: true });
  }, [token]);

  // Check backend health on mount
  useEffect(() => {
    fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) })
      .then(r => r.json())
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  const getLocalizedErrorMessage = (msg?: string) => {
    if (!msg) return i18n.language === 'vi' ? 'Đã xảy ra lỗi. Vui lòng thử lại.' : 'An error occurred. Please try again.';
    const isVi = i18n.language === 'vi';
    const lower = msg.toLowerCase();
    if (lower.includes('email and password are required')) {
      return isVi ? 'Vui lòng nhập đầy đủ email và mật khẩu.' : 'Email and password are required.';
    }
    if (lower.includes('name, email and password are required')) {
      return isVi ? 'Vui lòng điền đầy đủ họ tên, email và mật khẩu.' : 'Name, email and password are required.';
    }
    if (lower.includes('email already registered')) {
      return isVi ? 'Email này đã được đăng ký sử dụng.' : 'This email is already registered.';
    }
    if (lower.includes('invalid email or password')) {
      return isVi ? 'Tài khoản hoặc mật khẩu không chính xác.' : 'Invalid email or password.';
    }
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isVi = i18n.language === 'vi';

    // Field validations on client side
    if (isLogin) {
      if (!form.email.trim() || !form.password) {
        setError(isVi ? 'Vui lòng nhập đầy đủ email và mật khẩu.' : 'Email and password are required.');
        return;
      }
    } else {
      if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
        setError(isVi ? 'Vui lòng điền đầy đủ tất cả thông tin.' : 'All fields are required.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError(isVi ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      const result = isLogin
        ? await login(form.email.trim(), form.password)
        : await register(form.name.trim(), form.email.trim(), form.password);

      if (result.success) {
        navigate('/app', { replace: true });
      } else {
        setError(getLocalizedErrorMessage(result.message));
      }
    } catch {
      setError(
        import.meta.env.DEV
          ? (isVi ? 'Không thể kết nối đến máy chủ. Hãy đảm bảo backend đang chạy trên cổng 5000.' : 'Could not connect to server. Make sure backend is running on port 5000.')
          : (isVi ? 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.' : 'Could not connect to server. Please try again later.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'facebook') => {
    if (!backendOk && import.meta.env.DEV) {
      setError(i18n.language === 'vi' ? 'Backend chưa kết nối. Vui lòng chạy npm run dev:backend trước.' : 'Backend not connected. Please run npm run dev:backend first.');
      return;
    }
    window.location.href = `${API_BASE}/auth/${provider}`;
  };

  return (
    <div className="min-h-screen w-full bg-[#070709] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')}
          className="h-9 px-3 flex items-center gap-1.5 rounded-xl bg-zinc-900/80 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium shadow-lg"
        >
          <span className="text-base leading-none">{i18n.language === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
          <span className="text-xs">{i18n.language === 'vi' ? 'VI' : 'EN'}</span>
        </button>
      </div>
      {/* ── Dynamic Glowing / Particle Background ── */}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(105vh) translateX(0) scale(0.6);
            opacity: 0;
          }
          30% {
            opacity: 0.45;
          }
          80% {
            opacity: 0.2;
          }
          100% {
            transform: translateY(-15vh) translateX(50px) scale(1.2);
            opacity: 0;
          }
        }
        .bubble-glow {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.03) 70%, transparent 100%);
          animation: floatUp infinite linear;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      {/* Static blur blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-[40%] left-[30%] w-[350px] h-[350px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Floating Animated Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
        <div className="bubble-glow w-64 h-64 left-[10%]" style={{ animationDuration: '24s', animationDelay: '0s' }} />
        <div className="bubble-glow w-96 h-96 left-[50%]" style={{ animationDuration: '32s', animationDelay: '4s' }} />
        <div className="bubble-glow w-72 h-72 left-[80%]" style={{ animationDuration: '28s', animationDelay: '8s' }} />
        <div className="bubble-glow w-80 h-80 left-[25%]" style={{ animationDuration: '30s', animationDelay: '14s' }} />
        <div className="bubble-glow w-60 h-60 left-[70%]" style={{ animationDuration: '22s', animationDelay: '18s' }} />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo className="w-16 h-16 mb-4 filter drop-shadow-[0_0_12px_rgba(168,85,247,0.4)] hover:scale-105 transition-transform duration-300" />
          <h1 className="text-2xl font-black text-white bg-gradient-to-r from-pink-500 via-purple-400 to-blue-500 bg-clip-text text-transparent filter drop-shadow-[0_0_10px_rgba(168,85,247,0.25)] tracking-wider">MusicStream</h1>
          <p className="text-xs text-zinc-500 mt-1.5 font-medium">{t('auth.loginDesc')}</p>
        </div>



        {/* Card */}
        <div className="bg-zinc-950/80 border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
              </h2>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                <button
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-purple-400 hover:text-purple-300 font-bold hover:underline transition-all"
                >
                  {isLogin ? t('auth.signUp') : t('auth.signIn')}
                </button>
              </p>
            </div>
          </div>

          {/* Global error box */}
          {error && (
            <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl py-2.5 text-xs font-semibold text-zinc-200 transition-all active:scale-95"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button
              onClick={() => handleOAuth('facebook')}
              className="flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/10 hover:border-blue-600/20 rounded-xl py-2.5 text-xs font-semibold text-blue-300 transition-all active:scale-95"
            >
              <svg className="w-4.5 h-4.5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">{i18n.language === 'vi' ? 'hoặc' : 'or'}</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Local auth form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">{t('auth.name')}</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    required={!isLogin}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none placeholder-zinc-600 transition-colors"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none placeholder-zinc-600 transition-colors"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-purple-500 rounded-xl pl-10 pr-11 py-2.5 text-xs text-white focus:outline-none placeholder-zinc-600 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isLogin && (
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-bold hover:underline transition-all"
                  >
                    {i18n.language === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
                  </button>
                </div>
              )}
            </div>

            {/* Confirm password in Sign Up */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">{i18n.language === 'vi' ? 'Xác nhận mật khẩu' : 'Confirm Password'}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required={!isLogin}
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-purple-500 rounded-xl pl-10 pr-11 py-2.5 text-xs text-white focus:outline-none placeholder-zinc-600 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || backendOk === false}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-purple-500/15 hover:shadow-purple-500/25 text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-[0.99]"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {i18n.language === 'vi' ? 'Đang xử lý...' : 'Processing...'}
                </span>
                : isLogin ? t('auth.signIn') : t('auth.signUp')
              }
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-sm bg-zinc-950 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] rounded-3xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 flex-shrink-0">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">{i18n.language === 'vi' ? 'Quên mật khẩu?' : 'Forgot Password?'}</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {i18n.language === 'vi'
                    ? 'Để đảm bảo tính bảo mật tối đa cho tài khoản, vui lòng liên hệ trực tiếp với Ban Quản trị qua địa chỉ email dưới đây để được hỗ trợ cấp lại mật khẩu:'
                    : 'To ensure maximum account security, please contact the Administration directly via the email below for assistance resetting your password:'}
                </p>
                <div className="mt-3 bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-center shadow-inner">
                  <span className="text-xs font-bold text-purple-400 font-mono select-all">admin@musicstream.com</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
              >
                {i18n.language === 'vi' ? 'Đồng ý' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
