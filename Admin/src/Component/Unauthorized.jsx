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
    window.location.href = '/api1/admin/login';
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
          
          {/* Error Details Card */}
            <div className={`p-6 rounded-xl mb-6 border-l-4 border-red-500 transition-colors duration-300 ${
              darkMode ? 'bg-red-950/30 border-red-500' : 'bg-red-50 border-red-500'
            }`}>
              <div className="flex items-start gap-3">
                <UserX className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className={`font-semibold mb-2 ${
                    darkMode ? 'text-red-400' : 'text-red-700'
                  }`}>
                    Unauthorized Email Address
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    darkMode ? 'text-red-300/80' : 'text-red-600'
                  }`}>
                    Your email address is not authorized to access the Conference Room System. 
                    Please contact your system administrator for access.
                  </p>
                </div>
              </div>
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
        </div>

        {/* Footer Info */}
        <div className={`mt-6 pt-4 border-t text-xs ${
          darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'
        }`}>
          <p>Conference Room System</p>
          <p className="mt-1">© 2025 Your Organization</p>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedAccess;
