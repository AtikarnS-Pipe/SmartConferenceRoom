// src/layouts/Sidebar.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Home, Shield, UserCheck, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';
import RefreshButton from '../../utils/refreshToken';

export default function Sidebar({ darkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Helper function to check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Helper function to get button styles based on active state
  const getButtonStyles = (path) => {
    const active = isActive(path);
    const baseStyles = `w-full flex items-center rounded-lg text-left cursor-pointer transition-all duration-200`;
    
    if (active) {
      return `${baseStyles} ${isCollapsed ? 'p-2 justify-center' : 'gap-3 px-3 py-2'} bg-white text-blue-600`;
    }
    return `${baseStyles} ${isCollapsed ? 'p-2 justify-center' : 'gap-3 px-3 py-2'} text-slate-300 hover:${darkMode ? 'bg-gray-700' : 'bg-slate-700'} hover:text-white`;
  };

  // Helper function to get mobile button styles
  const getMobileButtonStyles = (path) => {
    const active = isActive(path);
    if (active) {
      return `flex flex-col items-center gap-1 p-3 rounded-lg bg-white text-blue-600 min-w-[60px] min-h-[60px] justify-center`;
    }
    return `flex flex-col items-center gap-1 p-3 rounded-lg text-slate-300 hover:${darkMode ? 'bg-gray-700' : 'bg-slate-700'} hover:text-white min-w-[60px] min-h-[60px] justify-center transition-all duration-200`;
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
    <>
      {/* Desktop Sidebar */}
      <div className ="font-display">
      <div className={`hidden md:flex flex-col ${isCollapsed ? 'w-16' : 'w-64'} ${darkMode ? 'bg-gray-800' : 'bg-slate-800'} text-white sticky top-0 h-screen transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-slate-700'} flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              {/* <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div> */}
              <span className="font-semibold text-lg">Conference Room</span>
            </div>
          )}
        
          
          
          {/* Toggle Button */}
          <RefreshButton
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1 rounded-md hover:bg-slate-700 transition-colors ${isCollapsed ? 'mt-4' : ''}`}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-300" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            )}
          </RefreshButton>
        </div>

        {/* Navigation */}
        <div className={`flex-1 p-4 ${isCollapsed ? 'flex flex-col items-center gap-6' : ''}`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              <RefreshButton 
                className={getButtonStyles('/admin/api')} 
                onClick={() => navigate('/admin/api')}
                title="Home"
              >
                <Home className={`w-4 h-4 ${isActive('/admin/api') ? 'text-blue-600' : 'text-white'}`} />
              </RefreshButton>
              <RefreshButton 
                className={getButtonStyles(getRoleBasedPath())} 
                onClick={handleNavigateByRole}
                title="Admin"
              >
                <Shield className={`w-4 h-4 ${isActive(getRoleBasedPath()) ? 'text-blue-600' : 'text-white'}`} />
              </RefreshButton>
              <RefreshButton 
                className={getButtonStyles('/account/housekeeper')} 
                onClick={() => navigate('/account/housekeeper')}
                title="Housekeeper"
              >
                <UserCheck className={`w-4 h-4 ${isActive('/account/housekeeper') ? 'text-blue-600' : 'text-white'}`} />
              </RefreshButton>
              <RefreshButton 
                className={getButtonStyles('/account/dashboard')} 
                onClick={() => navigate('/account/dashboard')}
                title="Dashboard"
              >
                <LayoutDashboard className={`w-4 h-4 ${isActive('/account/dashboard') ? 'text-blue-600' : 'text-white'}`} />
              </RefreshButton>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <RefreshButton 
                  className={getButtonStyles('/admin/api')} 
                  onClick={() => navigate('/admin/api')}
                  title={isCollapsed ? 'Home' : ''}
                >
                  <Home className={`w-4 h-4 ${isActive('/admin/api') ? 'text-blue-600' : 'text-white'}`} />
                  {!isCollapsed && <span className="text-sm">Home</span>}
                </RefreshButton>
              </div>
              <div className="mt-6">
                {!isCollapsed && (
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'} uppercase tracking-wider mb-3 px-3`}>
                    Role Filter
                  </p>
                )}
                <div className="space-y-1">
                  <RefreshButton 
                    className={getButtonStyles(getRoleBasedPath())} 
                    onClick={handleNavigateByRole}
                    title={isCollapsed ? 'Admin' : ''}
                  >
                    <Shield className={`w-4 h-4 ${isActive(getRoleBasedPath()) ? 'text-blue-600' : 'text-white'}`} />
                    {!isCollapsed && <span className="text-sm">Admin</span>}
                  </RefreshButton>
                  <RefreshButton 
                    className={getButtonStyles('/account/housekeeper')} 
                    onClick={() => navigate('/account/housekeeper')}
                    title={isCollapsed ? 'Housekeeper' : ''}
                  >
                    <UserCheck className={`w-4 h-4 ${isActive('/account/housekeeper') ? 'text-blue-600' : 'text-white'}`} />
                    {!isCollapsed && <span className="text-sm">Housekeeper</span>}
                  </RefreshButton>
                  {!isCollapsed && (
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'} uppercase tracking-wider mb-3 px-3 mt-5`}>
                      Monitoring
                    </p>
                  )}
                  <RefreshButton 
                    className={getButtonStyles('/account/dashboard')} 
                    onClick={() => navigate('/account/dashboard')}
                    title={isCollapsed ? 'Dashboard' : ''}
                  >
                    <LayoutDashboard className={`w-4 h-4 ${isActive('/account/dashboard') ? 'text-blue-600' : 'text-white'}`} />
                    {!isCollapsed && <span className="text-sm">Dashboard</span>}
                  </RefreshButton>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800' : 'bg-slate-800'} text-white border-t ${darkMode ? 'border-gray-700' : 'border-slate-700'} z-50`}>
        <div className="flex justify-around items-center py-2 px-4">
          <RefreshButton 
            className={getMobileButtonStyles('/admin/api')} 
            onClick={() => navigate('/admin/api')}
          >
            <Home className={`w-5 h-5 ${isActive('/admin/api') ? 'text-blue-600' : 'text-white'}`} />
            <span className="text-xs">Home</span>
          </RefreshButton>

          <RefreshButton 
            className={getMobileButtonStyles(getRoleBasedPath())} 
            onClick={handleNavigateByRole}
          >
            <Shield className={`w-5 h-5 ${isActive(getRoleBasedPath()) ? 'text-blue-600' : 'text-white'}`} />
            <span className="text-xs">Admin</span>
          </RefreshButton>

          <RefreshButton 
            className={getMobileButtonStyles('/account/housekeeper')} 
            onClick={() => navigate('/account/housekeeper')}
          >
            <UserCheck className={`w-5 h-5 ${isActive('/account/housekeeper') ? 'text-blue-600' : 'text-white'}`} />
            <span className="text-xs">Housekeeper</span>
          </RefreshButton>

          <RefreshButton 
            className={getMobileButtonStyles('/account/dashboard')} 
            onClick={() => navigate('/account/dashboard')}
          >
            <LayoutDashboard className={`w-5 h-5 ${isActive('/account/dashboard') ? 'text-blue-600' : 'text-white'}`} />
            <span className="text-xs">Dashboard</span>
          </RefreshButton>
        </div>
      </div>
      </div>
    </>
  );
}
