import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const isStaffLoggedIn = localStorage.getItem('isStaffLoggedIn') === 'true';
  const location = useLocation();

  // Cho phép cả customer và staff truy cập
  if (!isLoggedIn && !isStaffLoggedIn) {
    // Lưu đường dẫn hiện tại để redirect sau khi đăng nhập
    return <Navigate to="/dang-nhap" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

