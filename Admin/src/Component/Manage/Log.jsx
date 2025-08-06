import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Activity,
  Crown,
  XCircle,
  CheckCircle,
  Info,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  Server,
  Bug,
  ChevronDown,
  Eye,
  EyeOff,
  Home,
  Users,
  Shield,
  UserCheck,
  LayoutDashboard,
  Sun,
  Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DarkModeContext } from '../Context/DarkModeContext';
import RefreshButton from '../../utils/refreshToken';

function Log() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [signoutsuccess, setSignoutsuccess] = useState(false);
  const [logs, setLogs] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [show, setShow] = useState(false);
  const [profile, setProfile] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [statusPopup, setStatusPopup] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [message, setMessage] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const eventSource = new EventSource('/account/logsmonitoring', { withCredentials: true });

    eventSource.addEventListener('Logsmonitoring', (event) => {
      console.log('Received Logsmonnitoring event:', event.data);

      try {
        const data = JSON.parse(event.data);

        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          console.warn('Unexpected data format:', data);
        }
      } catch (error) {
        console.error('Error parsing Logsmonnitoring event data:', error);
      }
    });

    setConnectionStatus('connecting');

    eventSource.onopen = () => {
      console.log('SSE connection opened successfully');
      setConnectionStatus('connected');
    };
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    console.log('Logs state updated:', logs);
    console.log('Number of logs:', logs.length);
  }, [logs]);

  const logStats = {
    total: logs.length,
    info: logs.filter(log => log.level === 'info' || log.L_status === 'info').length,
    warning: logs.filter(log => log.level === 'warning' || log.L_status === 'warning').length,
    error: logs.filter(log => log.level === 'error' || log.L_status === 'error').length,
    debug: logs.filter(log => log.level === 'debug' || log.L_status === 'debug').length
  };

  const ITEMS_PER_PAGE = 10;

  const filteredLogs = logs.filter(log => {
    const message = log.message || log.Details || '';
    const source = log.source || log.role || '';
    const level = log.level || log.L_status || '';

    const matchesSearch = message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          source.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = selectedLevel === 'all' || level === selectedLevel;
    const matchesSource = selectedSource === 'all' || source === selectedSource;

    return matchesSearch && matchesLevel && matchesSource;
  });

  // Sort filteredLogs by timestamp (latest first) before paginating
  const sortedFilteredLogs = [...filteredLogs].sort(
    (a, b) => new Date(b.L_createdAt || b.timestamp) - new Date(a.L_createdAt || a.timestamp)
  );

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

  const paginatedLogs = sortedFilteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const sortedLogs = [...paginatedLogs].sort(
  (a, b) => new Date(b.L_createdAt || b.timestamp) - new Date(a.L_createdAt || a.timestamp)
);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(',', '');
  };

  const uniqueSources = Array.from(new Set(logs.map(log => log.source || log.role).filter(Boolean)));

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleSubmitPasswordChange = async () => {
    if (newPassword.length !== 4 || confirmPassword.length !== 4) {
    setStatusPopup('error');
    setMessage('Please enter a 4-digit PIN');
    setTimeout(() => {
      setStatusPopup(null);
    }, 3000);
    return;
  }
  if (newPassword !== confirmPassword) {
    setStatusPopup('error');
    setMessage('Passwords do not match');
    setTimeout(() => {
      setStatusPopup(null);
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    }, 3000);
    return;
  }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        '/account/changeadminpw',
        { newpin: newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.status === 200) {
        setMessage(res.data.message || 'PIN Admin Update Successfully');
        setStatusPopup('success');
        setTimeout(() => {
          setStatusPopup(null);
          setShowPasswordModal(false);
          setNewPassword('');
          setConfirmPassword('');
        }, 3000);
      } 
    } catch (error) {
      const messageFromBackend =
      error.res?.data?.message || 'Failed to update PIN. Please try again.';
      console.error(error);
      setMessage(messageFromBackend)
      setStatusPopup('error');
      setTimeout(() => setStatusPopup(null), 3000);
    }
  };

const handleSignout = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      '/account/signout',
      {}, // ไม่มี body ในการ signout (เว้นเปล่า)
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    if (res.data.success) {
      setSignoutsuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 3000); // แสดงข้อความสำเร็จ 3 วินาทีแล้ว redirect
    }

  } catch (error) {
    console.error('Signout error:', error);
    alert('Failed to sign out.');
  }
};
    useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('/account/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setProfile(res.data);
        console.log("Profile data fetched:", res.data);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (profile) {
      console.log("Profile state updated:", profile);
    }
  }, [profile]);
    const handleNavigateByRole = () => {
  const role = localStorage.getItem('role'); // ดึง role จาก localStorage
    console.log("Navigating based on role:", role);
  if (role === 'Superadmin') {
    navigate('/account/superadmin');
  } else if (role === 'Admin') {
    navigate('/account/admin');
  } else {
    navigate('/'); // สำรองเผื่อ role อื่นหรือไม่มี role
  }
};
  const icon = () => {
    const role = profile?.role; // ดึง role จาก localStorage
    if (role === 'Superadmin') {
      return <Crown className="w-4 h-6" />;
    }
    else if (role === 'Admin') {
      return <Shield className="w-4 h-6" />;
    }
  };
  const getRoleColor = (role) => {
  if (role === 'Superadmin') return 'bg-yellow-600';
  if (role === 'Admin') return 'bg-blue-600';
};



  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} font-display transition-colors duration-300`}>
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-gray-300/30 flex items-center justify-center">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-xl shadow-lg w-96`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Change PIN</h2>

            <div className="mb-4">
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>New PIN</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  maxLength={4}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
                <RefreshButton
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute inset-y-0 right-0 flex items-center px-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {showNewPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </RefreshButton>
              </div>
            </div>

            <div className="mb-6">
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Confirm New PIN</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  maxLength={4}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
                <RefreshButton
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute inset-y-0 right-0 flex items-center px-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {showConfirmPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </RefreshButton>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <RefreshButton
                onClick={() => setShowPasswordModal(false)}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </RefreshButton>
              <RefreshButton
                onClick={() => {
                  handleSubmitPasswordChange();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Pin
              </RefreshButton>
            </div>
          </div>
        </div>
      )}

      {statusPopup === 'success' && (
        <div className="fixed top-6 right-6 z-[9999]">
            <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{message}</span>
            </div>
          </div>
      )}

      {statusPopup === 'error' && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}

      {signoutsuccess && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Signout Successful! Redirecting...</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full">
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 md:px-6 py-4 transition-colors duration-300`}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1 text-sm md:text-base`}>Real-time system logs and monitoring</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}></div>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  SSE: {connectionStatus} 
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              {/* First Row - Dark Mode Toggle and Role Badge */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <RefreshButton title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                    {darkMode ? (
                        <div onClick={toggleDarkMode} className="bg-gray-700 p-2 rounded-full">
                          <Sun className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div onClick={toggleDarkMode} className="bg-gray-200 p-2 rounded-full">
                          <Moon className="w-4 h-4 text-gray" />
                        </div>
                      )}
                  </RefreshButton>
                <div className={`flex px-3 py-1.5 gap-2 rounded-lg text-white ${getRoleColor(profile?.role)}`}>
                    {icon()}
                    <h1 className="text-sm font-medium">{profile?.role}</h1>
                </div>
              </div>

              {/* Second Row - PIN Display and User Dropdown */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* PIN Display */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div className={`text-sm tracking-widest ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                   {show ? profile?.pin || '0000' : '●'.repeat(profile?.pin?.length || 4)}
                  </div>
                  <RefreshButton
                    type="button"
                    onClick={() => setShow(!show)}
                    className={`focus:outline-none ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    title={show ? "Hide PIN" : "Show PIN"}
                >
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </RefreshButton>
                </div>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <div
                  className={`flex items-center gap-2 rounded-lg px-5 py-2 cursor-pointer whitespace-nowrap ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  onClick={() => setOpen((prev) => !prev)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`lucide lucide-circle-user-icon lucide-circle-user flex-shrink-0 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                  </svg>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{profile?.name || 'quest'}</span>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                </div>

                <div
                  className={`absolute right-0 mt-2 min-w-full border rounded-lg shadow-xl z-50 transition-all duration-200 ease-in-out ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
                  } ${
                    open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                  }`}
                >
                  <ul className={`py-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li className={`px-3 py-2 cursor-pointer flex ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-300'
                    }`} onClick={() => {
                        setOpen(false);
                        setTimeout(() => setShowPasswordModal(true), 0);
                      }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-3"
                        width="18"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="16" r="1" />
                        <rect width="18" height="12" x="3" y="10" rx="2" />
                        <path d="M7 10V7a5 5 0 0 1 9.33-2.5" />
                      </svg>
                      Change PIN
                    </li>
                    <li className={`px-3 py-2 cursor-pointer flex ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-300'
                    }`} onClick={handleSignout}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-3"
                        width="18"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m16 17 5-5-5-5" />
                        <path d="M21 12H9" />
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      </svg>
                      Signout
                    </li>
                  </ul>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-2 md:p-6">
          {/* Log Monitoring Panel */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border transition-colors duration-300`}>
            {/* Header */}
            <div className={`p-4 md:p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>System Logs</h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Real-time application monitoring</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className={`p-4 md:p-6 border-b ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-100 bg-gray-50'} transition-colors duration-300`}>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      placeholder="Search logs by message or source..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full ${
                        darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
                
                <div className="flex max-sm:flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Server className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                    <select
                      value={selectedSource}
                        onChange={(e) => {
                                setSelectedSource(e.target.value);  // เปลี่ยน filter
                                setCurrentPage(1);                // รีเซ็ตกลับหน้า 1
                              }}
                      className={`pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none min-w-full ${
                        darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="all">All Sources</option>
                      {uniqueSources.map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                  <div className={`rounded-lg pl-10 pr-10 py-2 text-white ${
                    darkMode ? 'bg-gray-600' : 'bg-black'
                  }`}>
                    {filteredLogs.length} of {logs.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[800px]">
                <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Status</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Timestamp</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Role</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Details</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>User ID</th>
                  </tr>
                </thead>
                
                <tbody>
                  {paginatedLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className={`px-6 py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Activity className={`mx-auto w-8 h-8 mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <p>No logs Found</p>
                          <p className="text-xs">Connection: {connectionStatus}</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedLogs.map((log, index) => (
                          <tr key={log._id || index} className={darkMode ? 'border-gray-700' : ''}>
                            <td className={`px-6 py-4 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                              {log.L_status || log.level || 'N/A'}
                            </td>
                            <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatTimestamp(log.L_createdAt || log.timestamp)}
                            </td>
                            <td className={`px-6 py-4 text-sm capitalize ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {log.role || log.source || 'N/A'}
                            </td>
                            <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {log.Details || log.message || 'N/A'}
                            </td>
                            <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {log.user_Id || log.userId || 'N/A'}
                            </td>
                          </tr>
                        ))
                    )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className={`max-sm:flex justify-center items-center px-4 md:px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-100 bg-gray-50'} transition-colors duration-300`}>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Showing {filteredLogs.length} of {logs.length} log entries
                </p>
                <div className="flex justify-center mt-4">
                  <RefreshButton
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className={`px-3 py-1 mx-1 rounded disabled:opacity-50 ${
                      darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  >
                    Prev
                  </RefreshButton>

                  <span className={`px-3 py-1 mx-1 ${darkMode ? 'text-gray-300' : ''}`}>
                    {currentPage} / {totalPages}
                  </span>

                  <RefreshButton
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className={`px-3 py-1 mx-1 rounded disabled:opacity-50 ${
                      darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  >
                    Next
                  </RefreshButton>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Log;