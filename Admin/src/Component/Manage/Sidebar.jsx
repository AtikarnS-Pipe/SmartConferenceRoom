// src/layouts/Sidebar.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Home, Shield, UserCheck, LayoutDashboard } from 'lucide-react';
import RefreshButton from '../../utils/refreshToken';

export default function Sidebar({ darkMode }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Helper function to get button styles based on active state
  const getButtonStyles = (path, isHome = false) => {
    const active = isActive(path);
    if (active) {
      return `w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-blue-600 text-left cursor-pointer`;
    }
    return `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:${darkMode ? 'bg-gray-700' : 'bg-slate-700'} text-left cursor-pointer`;
  };

  // Get the current user's role-based path for highlighting
  const getRoleBasedPath = () => {
    const role = localStorage.getItem('role');
    if (role === 'Superadmin') {
      return '/account/superadmin';
    } else if (role === 'Admin') {
      return '/account/admin';
    }
    return '/account/admin'; // default fallback
  };


  const handleNavigateByRole = () => {
    const role = localStorage.getItem('role');
    console.log("Navigating based on role:", role);
    if (role === 'Superadmin') {
      navigate('/account/superadmin');
    } else if (role === 'Admin') {
      navigate('/account/admin');
    } else {
      navigate('/');
    }
  };

  return (
    <div className='font-display'>
    <div className={`w-full md:w-64 ${darkMode ? 'bg-gray-800' : 'bg-slate-800'} text-white flex flex-row md:flex-col sticky top-0 h-screen transition-colors duration-300`}>
      <div className={`p-4 md:p-6 border-b ${darkMode ? 'border-gray-700' : 'border-slate-700'} w-full`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">Conference Room</span>
        </div>
      </div>
      <div className="flex-1 p-2 md:p-4">
        <div className="space-y-2">
          <RefreshButton 
            className={getButtonStyles('/admin/api', true)} 
            onClick={() => navigate('/admin/api')}
          >
            <Home className={`w-4 h-4 ${isActive('/admin/api') ? 'text-blue-600' : 'text-white'}`} />
            <span className="text-sm">Home</span>
          </RefreshButton>
        </div>
        <div className="mt-4 md:mt-6">
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'} uppercase tracking-wider mb-3 px-3`}>Role Filter</p>
          <div className="space-y-1">
            <RefreshButton 
              className={getButtonStyles(getRoleBasedPath())} 
              onClick={handleNavigateByRole}
            >
              <Shield className={`w-4 h-4 ${isActive(getRoleBasedPath()) ? 'text-blue-600' : 'text-white'}`} />
              <span className="text-sm">Admin</span>
            </RefreshButton>
            <RefreshButton 
              className={getButtonStyles('/account/housekeeper')} 
              onClick={() => navigate('/account/housekeeper')}
            >
              <UserCheck className={`w-4 h-4 ${isActive('/account/housekeeper') ? 'text-blue-600' : 'text-white'}`} />
              <span className="text-sm">Housekeeper</span>
            </RefreshButton>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'} uppercase tracking-wider mb-3 px-3 mt-5`}>Monitoring</p>
            <RefreshButton 
              className={getButtonStyles('/account/dashboard')} 
              onClick={() => navigate('/account/dashboard')}
            >
              <LayoutDashboard className={`w-4 h-4 ${isActive('/account/dashboard') ? 'text-blue-600' : 'text-white'}`} />
              <span className="text-sm">Dashboard</span>
            </RefreshButton>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
