import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission, Permission } from '../types';
import { ReactNode } from 'react';

export function PermissionRoute({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!user || !hasPermission(user.role, permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
