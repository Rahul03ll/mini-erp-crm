import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission, Permission } from '../types';
import { ReactNode } from 'react';

export function PermissionRoute({
  permission,
  permissions,
  children,
}: {
  permission?: Permission;
  permissions?: Permission[];
  children: ReactNode;
}) {
  const { user } = useAuth();

  const isAllowed =
    user &&
    ((permission && hasPermission(user.role, permission)) ||
      (permissions && permissions.some((p) => hasPermission(user.role, p))));

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
