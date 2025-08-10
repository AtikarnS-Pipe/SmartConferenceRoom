import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  MoreHorizontal,
  CheckCircle,
  ChevronDown,
  Search,
  Plus,
  XCircle,
  Clock,
  Home,
  Eye,
  EyeOff,
  LayoutDashboard,
  Sun,
  Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DarkModeContext } from '../Context/DarkModeContext';
import RefreshButton from '../../utils/refreshToken';
import Statscard from '../Statscard';
import Header from '../Header'; // 🔥 เพิ่ม import Header

function Admin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState([]);
  const [signoutsuccess, setSignoutsuccess] = useState(false);
  const [profile, setProfile] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [housekeepers, setHousekeepers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [statusPopup, setStatusPopup] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const housekeeperSource = new EventSource('/account/housekeepers', {
      withCredentials: true,
    });
  
    const adminSource = new EventSource('/account/member', {
      withCredentials: true,
    });
  
    const handleHousekeeperList = (event) => {
      const data = JSON.parse(event.data);
      if (Array.isArray(data)) {
        setHousekeepers(data);
      }
    };
  
    const handleAdminList = (event) => {
      const data = JSON.parse(event.data);
      console.log("📥 AdminList SSE data received:", data);
      if (Array.isArray(data)) {
        setAdmins(data);
      }
    };
  
    housekeeperSource.addEventListener('HousekeeperList', handleHousekeeperList);
    adminSource.addEventListener('adminList', handleAdminList);
  
    housekeeperSource.onerror = (err) => {
      console.error('SSE error (housekeeper):', err);
      housekeeperSource.close();
    };
    adminSource.onerror = (err) => {
      console.error('SSE error (admin):', err);
      adminSource.close();
    };
  
    return () => {
      housekeeperSource.removeEventListener('HousekeeperList', handleHousekeeperList);
      adminSource.removeEventListener('AdminList', handleAdminList);
      housekeeperSource.close();
      adminSource.close();
    };
  }, []);

  const [adminCount, setAdminCount] = useState(0);
  const [housekeeperCount, setHousekeeperCount] = useState(0);
  
  useEffect(() => {
    setAllUsers([...admins, ...housekeepers]);
  }, [admins, housekeepers]);

  useEffect(() => {
    const adminList = allUsers.filter(u => u.role === 'Admin');
    const housekeeperList = allUsers.filter(u => u.role === 'Housekeeper');

    console.log("🧑‍💼 allUsers (in housekeeper page):", allUsers);

    setAdminCount(adminList.length);
    setHousekeeperCount(housekeeperList.length);
  }, [allUsers]);

  const adminmem = allUsers.filter(user => user.role === 'Admin');

  const filteredMembers = adminmem.filter((member) => {
    const keyword = searchTerm.toLowerCase();
    return (
      member.name?.toLowerCase().includes(keyword) ||
      member.email?.toLowerCase().includes(keyword) ||
      member.role?.toLowerCase().includes(keyword)
    );
  });

  console.log("Members data fetched:", members);

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

      setMessage(res.data.message);
      setStatusPopup('success');

      setTimeout(() => {
        setStatusPopup(null);
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      }, 3000);

    } catch (error) {
      const messageFromBackend =
        error.res?.data?.message || 'Failed to update PIN. Please try again.';

      console.error('Error updating PIN:', messageFromBackend);

      setMessage(messageFromBackend);
      setStatusPopup('error');

      setTimeout(() => {
        setStatusPopup(null);
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      }, 3000);
    }
  };

  const handleSignout = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/account/signout',
        {},
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
        }, 3000);
      }

    } catch (error) {
      console.error('Signout error:', error);
      alert('Failed to sign out.');
    }
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map((m) => m.id));
    }
  };

  const handleMemberSelect = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(',', '');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} font-display transition-colors duration-300`}>
      {/* 🔥 ใช้ Header component แทน */}
      <Header 
        title="Admin Management" 
        subtitle="Manage administrator accounts and access"
        profile={profile}
        show={show}
        setShow={setShow}
      />

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-gray-300/30 flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-xl shadow-lg w-full max-w-md mx-4`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Change PIN</h2>

            <div className="mb-4">
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>New PIN</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  maxLength="4"
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
                onClick={() => {
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowPasswordModal(false)
                }}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </RefreshButton>
              <RefreshButton
                onClick={() => {
                  setShowPasswordModal(false);
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

      {/* Status Popups */}
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

      <div className="p-2 md:p-6">
        {/* Stats */}
        <Statscard 
          housekeeperCount={housekeeperCount}
          adminCount={adminCount}
          filteredMembers={filteredMembers}
          darkMode={darkMode}
        />

        {/* Table */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border transition-colors duration-300`}>
          <div className={`p-4 md:p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex flex-col sm:flex-row sm:justify-between gap-4 flex-wrap`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Admin</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-64 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[350px] sm:min-w-[500px] md:min-w-[600px]">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  {['Member', 'Role', 'Status', 'Last Login'].map((title) => (
                    <th key={title} className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{title}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredMembers.map((m) => (
                  <tr key={m._id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2 mt-3`}>
                      <Clock className="w-4 h-4" />
                      {formatDate(m.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <Shield className={`mx-auto w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No admins found</p>
            </div>
          )}

          <div className={`px-4 md:px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-100 bg-gray-50'} transition-colors duration-300`}>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Updated Real-Time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin