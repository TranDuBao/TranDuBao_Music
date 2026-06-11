import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useMusicStore } from './store/useMusicStore';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import Sidebar from './components/Sidebar';
import MainView from './components/MainView';
import PlayerBar from './components/PlayerBar';
import LoginPage from './pages/LoginPage';
import UploadModal from './components/UploadModal';
import UserProfilePage from './pages/UserProfilePage';

// ── OAuth Callback Handler ─────────────────────────────────────────
function OAuthCallback() {
  const [params] = useSearchParams();
  const { loginWithToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      loginWithToken(token).then(() => navigate('/app', { replace: true }));
    } else {
      navigate('/login?error=oauth_failed', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center text-zinc-400">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>Đang xác thực...</p>
      </div>
    </div>
  );
}

// ── Protected App Shell ────────────────────────────────────────────
// ── Protected App Shell ────────────────────────────────────────────
function AppShell() {
  const { fetchTracks, fetchPlaylists, fetchFavorites, initAudio } = useMusicStore();
  const { user } = useAuthStore();
  const [view, setView] = useState<'all' | 'mine' | 'admin' | 'profile'>('all');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchTracks();
    fetchPlaylists();
    fetchFavorites();
    initAudio();
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)] relative transition-colors duration-300">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-purple-950/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] bg-indigo-950/15 rounded-full blur-3xl translate-y-1/3 pointer-events-none" />

      <Sidebar view={view} setView={setView} onUploadClick={() => setShowUpload(true)} />
      <MainView view={view} setView={setView} onUploadClick={() => setShowUpload(true)} />
      <PlayerBar />
      <UploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} />
    </div>
  );
}

// ── Route Guard ────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ── Root Initializer ───────────────────────────────────────────────
function AppInitializer() {
  const { initAuth } = useAuthStore();
  const { initTheme } = useThemeStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initTheme();
    initAuth().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route path="/app" element={
        <RequireAuth><AppShell /></RequireAuth>
      } />
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

import ModalNotification from './components/ModalNotification';

// ── Root App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppInitializer />
      <ModalNotification />
    </BrowserRouter>
  );
}
