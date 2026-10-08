import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import BottomNav from '../components/common/BottomNav';
import PushRegistration from '../components/common/PushRegistration';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import SplashScreenPage from '../pages/auth/SplashScreenPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import MaterialsPage from '../pages/materials/MaterialsPage';
import PracticePage from '../pages/practice/PracticePage';
import ProfilePage from '../pages/profile/ProfilePage';
import NewsPage from '../pages/news/NewsPage';
import StatisticsPage from '../pages/statistics/StatisticsPage';
import TryoutPage from '../pages/tryout/TryoutPage';
import { useAuthStore } from '../store/authStore';

function ProtectedLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <PushRegistration />
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

export default function AppRoutes() {
  const { isAuthenticated } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return <SplashScreenPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/tryout" element={<TryoutPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:slug" element={<NewsPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
