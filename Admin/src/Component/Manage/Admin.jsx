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
import RefreshButton from '../../utils/refreshToken'; // Adjust the import path as necessary
import HousekeeperStats from '../Housekeeperstats';

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
  const [allUsers, setAllUsers] = useState([]);  // รวมทั้งหมด
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
     console.log("📥 AdminList SSE data received:", data); // ⬅️ ใส่ตรงนี้
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
    // ✅ ใช้ error.response แทน res
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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Admin Management</h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage administrator accounts and access</p>
            </div>

            <div className="flex items-center gap-3">
              <RefreshButton title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                  {darkMode ? (
                      <div onClick={toggleDarkMode}   className="bg-gray-700 p-2 rounded-full">
                        <Sun className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div onClick={toggleDarkMode} className="bg-gray-200 p-2 rounded-full">
                        <Moon className="w-4 h-4 text-gray" />
                      </div>
                    )}
                </RefreshButton>
              <div className='flex px-4 py-1.5 gap-2 rounded-lg bg-blue-600 text-white'>
                    <Shield  className="w-4 h-6" />
                   <h1>{profile?.role}</h1>
                </div>

              {/* PIN Display */}
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg w-fit ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div className={`text-lg tracking-widest ${
                  darkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  {show ? profile?.pin || '0000' : '●'.repeat(profile?.pin?.length || 4)}
                </div>
                <RefreshButton
                  type="button"
                  onClick={() => setShow(!show)}
                  className={`focus:outline-none ${darkMode ? 'text-white' : 'text-gray-500'}`}
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
                    className="lucide lucide-circle-user-icon lucide-circle-user flex-shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                  </svg>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`} >{profile?.name || 'Guest'}</span>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-white' : 'text-gray-500'}`} />
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

        <div className="p-2 md:p-6">
          {/* Stats */}
          <HousekeeperStats 
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
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(m._id)}
                          onChange={() => handleMemberSelect(m._id)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{m.name}</div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{m.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {m.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${m.login_status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
                          <span className={`text-sm ${m.login_status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                            {m.login_status}
                          </span>
                        </div>
                      </td>
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
    </div>
  );
}

export default Admin;