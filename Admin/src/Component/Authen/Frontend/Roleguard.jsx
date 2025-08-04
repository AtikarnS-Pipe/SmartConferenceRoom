import { Navigate } from 'react-router-dom';

const RoleGuard = ({ allowedRoles, children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');  // สมมติคุณเก็บ role ใน localStorage ด้วย

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/admin/api" replace />;
  }

  return children;
};

export default RoleGuard;