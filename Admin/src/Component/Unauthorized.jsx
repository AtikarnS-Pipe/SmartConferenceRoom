import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from './Context/DarkModeContext';
import { ShieldX, ArrowLeft, UserX, AlertTriangle } from 'lucide-react';

function UnauthorizedAccess() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  const handleBackToLogin = () => {
    // Clear any existing tokens
    
    // Redirect to Microsoft login
    window.location.href = '/admin/login';
  };

  const handleContactAdmin = () => {
    // You can customize this to your organization's contact method
    // For example, open email client or redirect to contact page
    const email = 'admin@yourcompany.com'; // Replace with your admin email
    const subject = 'Request for Room Booking System Access';
    const body = 'Hi Admin,\n\nI would like to request access to the Meeting Room Booking System.\n\nThank you.';
    
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full rounded-lg shadow-lg p-8 text-center transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>

        {/* Title */}
        <h1 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Access Denied
        </h1>

        {/* Description */}
        <div className={`mb-6 space-y-3 transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <UserX className="w-5 h-5 text-red-500" />
            <span className="font-medium text-red-500">Unauthorized User</span>
          </div>
          
          <p className="text-sm">
            You don't have permission to access the Meeting Room Booking System.
          </p>
          
          <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4 ${
            darkMode ? 'bg-yellow-900/20 border-yellow-800' : ''
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className={`text-sm font-medium ${
                darkMode ? 'text-yellow-400' : 'text-yellow-800'
              }`}>
                Need Access?
              </span>
            </div>
            <p className={`text-xs ${
              darkMode ? 'text-yellow-300' : 'text-yellow-700'
            }`}>
              Please contact your system administrator to request access permissions.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Back to Login Button */}
          <button
            onClick={handleBackToLogin}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              darkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } hover:shadow-md active:transform active:scale-95`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          {/* Contact Admin Button */}
          <button
            onClick={handleContactAdmin}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
              darkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            } hover:shadow-sm active:transform active:scale-95`}
          >
            Contact Administrator
          </button>
        </div>

        {/* Footer Info */}
        <div className={`mt-6 pt-4 border-t text-xs ${
          darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'
        }`}>
          <p>Meeting Room Booking System</p>
          <p className="mt-1">© 2025 Your Organization</p>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedAccess;