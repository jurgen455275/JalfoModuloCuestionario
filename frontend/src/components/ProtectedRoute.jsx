import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem('jalfo_token');
  const userStr = localStorage.getItem('jalfo_user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.nombre_rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
