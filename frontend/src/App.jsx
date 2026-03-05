import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import ApplicantDashboard from './pages/ApplicantDashboard';
import ApplicationForm from './pages/ApplicationForm';
import ReviewSubmit from './pages/ReviewSubmit';
import ApplicationDetail from './pages/ApplicationDetail';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ReviewerApplicationDetail from './pages/ReviewerApplicationDetail';
import AdminSummary from './pages/AdminSummary';
import { getStoredUser, isAuthenticated } from './services/api';

function Protected({ children, role }) {
  const user = getStoredUser();
  if (!isAuthenticated() || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    const to = user.role === 'ADMIN' ? '/admin' : user.role === 'REVIEWER' ? '/reviewer' : '/dashboard';
    return <Navigate to={to} replace />;
  }
  return children;
}

function PublicOnly({ children }) {
  if (isAuthenticated()) {
    const user = getStoredUser();
    const to = user?.role === 'ADMIN' ? '/admin' : user?.role === 'REVIEWER' ? '/reviewer' : '/dashboard';
    return <Navigate to={to} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="dashboard" element={<Protected role="APPLICANT"><ApplicantDashboard /></Protected>} />
          <Route path="apply" element={<Protected role="APPLICANT"><ApplicationForm /></Protected>} />
          <Route path="apply/review" element={<Protected role="APPLICANT"><ReviewSubmit /></Protected>} />
          <Route path="application/:id" element={<Protected role="APPLICANT"><ApplicationDetail /></Protected>} />
          <Route path="reviewer" element={<Protected role="REVIEWER"><ReviewerDashboard /></Protected>} />
          <Route path="reviewer/application/:id" element={<Protected role="REVIEWER"><ReviewerApplicationDetail /></Protected>} />
          <Route path="admin" element={<Protected role="ADMIN"><AdminSummary /></Protected>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
