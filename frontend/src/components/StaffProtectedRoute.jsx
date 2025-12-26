import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const StaffProtectedRoute = ({ children }) => {
  const isStaffLoggedIn = localStorage.getItem('isStaffLoggedIn') === 'true';
  const location = useLocation();

  if (!isStaffLoggedIn) {
    // Lưu đường dẫn hiện tại để redirect sau khi đăng nhập
    return <Navigate to="/staff/login" state={{ from: location }} replace />;
  }

  return children;
};

export default StaffProtectedRoute;

