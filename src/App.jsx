import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useDispatch } from 'react-redux';
import { initializeAuth } from './features/auth/authSlice';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy load components
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const PricingPage = lazy(() => import('./features/billing/PricingPage'));
const BillingPage = lazy(() => import('./features/billing/BillingPage'));
const AcceptInvite = lazy(() => import('./features/auth/AcceptInvite'));
const ForgotPassword = lazy(() => import('./features/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./features/auth/ResetPassword'));
const DashboardPage = lazy(() => import('./features/project/DashboardPage'));
const BoardPage = lazy(() => import('./features/board/BoardPage'));
const BacklogPage = lazy(() => import('./features/backlog/BacklogPage'));
const SprintPage = lazy(() => import('./features/sprint/SprintPage'));
const ReportsPage = lazy(() => import('./features/report/ReportsPage'));
const MembersPage = lazy(() => import('./features/members/MembersPage'));
const ProjectSettingsPage = lazy(() => import('./features/project/ProjectSettingsPage'));
const GlobalMeetingsPage = lazy(() => import('./features/meeting/GlobalMeetingsPage').then(m => ({ default: m.GlobalMeetingsPage })));
const MeetingRoom = lazy(() => import('./features/meeting/MeetingRoom').then(m => ({ default: m.MeetingRoom })));
const MOMPreview = lazy(() => import('./features/meeting/MOMPreview').then(m => ({ default: m.MOMPreview })));
const ServerWakeUpBanner = lazy(() => import('./components/ui/ServerWakeUpBanner'));

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const dispatch = useDispatch();

  // Global axios interceptors
  useEffect(() => {
    // Check session on mount
    dispatch(initializeAuth());

    const reqId = axios.interceptors.request.use(config => {
      window.__onApiRequest?.();
      return config;
    });
    const resId = axios.interceptors.response.use(
      res => { window.__onApiResponse?.(); return res; },
      err => { window.__onApiResponse?.(); return Promise.reject(err); }
    );
    return () => {
      axios.interceptors.request.eject(reqId);
      axios.interceptors.response.eject(resId);
    };
  }, []);

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <ServerWakeUpBanner />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="projects" element={<DashboardPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="meetings" element={<GlobalMeetingsPage />} />
            <Route path="accept-invite" element={<AcceptInvite />} />
            <Route path="project/:projectId/board" element={<BoardPage />} />
            <Route path="project/:projectId/backlog" element={<BacklogPage />} />
            <Route path="project/:projectId/sprints" element={<SprintPage />} />
            <Route path="project/:projectId/reports" element={<ReportsPage />} />
            <Route path="project/:projectId/settings" element={<ProjectSettingsPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="meetings/:meetingId/mom" element={<MOMPreview />} />
          </Route>
          
          {/* Full Screen Meeting Room (Outside DashboardLayout) */}
          <Route path="/meetings/:meetingId/join" element={
            <Suspense fallback={<LoadingFallback />}>
                <MeetingRoom />
            </Suspense>
          } />
        </Routes>
      </Suspense>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
