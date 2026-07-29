import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PermissionRoute } from './components/PermissionRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import CustomerListPage from './pages/CustomerListPage';
import CustomerFormPage from './pages/CustomerFormPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ProductListPage from './pages/ProductListPage';
import ProductFormPage from './pages/ProductFormPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ChallanListPage from './pages/ChallanListPage';
import ChallanFormPage from './pages/ChallanFormPage';
import ChallanDetailPage from './pages/ChallanDetailPage';
import ReportsPage from './pages/ReportsPage';
import { hasPermission } from './types';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (hasPermission(user.role, 'manage_customers')) return <Navigate to="/customers" replace />;
  if (hasPermission(user.role, 'manage_products')) return <Navigate to="/products" replace />;
  if (hasPermission(user.role, 'manage_challans')) return <Navigate to="/challans" replace />;
  if (hasPermission(user.role, 'view_reports')) return <Navigate to="/reports" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/customers" element={<PermissionRoute permission="manage_customers"><CustomerListPage /></PermissionRoute>} />
        <Route path="/customers/new" element={<PermissionRoute permission="manage_customers"><CustomerFormPage /></PermissionRoute>} />
        <Route path="/customers/:id" element={<PermissionRoute permission="manage_customers"><CustomerDetailPage /></PermissionRoute>} />
        <Route path="/products" element={<PermissionRoute permission="manage_products"><ProductListPage /></PermissionRoute>} />
        <Route path="/products/new" element={<PermissionRoute permission="manage_products"><ProductFormPage /></PermissionRoute>} />
        <Route path="/products/:id" element={<PermissionRoute permission="manage_products"><ProductDetailPage /></PermissionRoute>} />
        <Route path="/challans" element={<PermissionRoute permission="manage_challans"><ChallanListPage /></PermissionRoute>} />
        <Route path="/challans/new" element={<PermissionRoute permission="manage_challans"><ChallanFormPage /></PermissionRoute>} />
        <Route path="/challans/:id" element={<PermissionRoute permission="manage_challans"><ChallanDetailPage /></PermissionRoute>} />
        <Route path="/reports" element={<PermissionRoute permission="view_reports"><ReportsPage /></PermissionRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
