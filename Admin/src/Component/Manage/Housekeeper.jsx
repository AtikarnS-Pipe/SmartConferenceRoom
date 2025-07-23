import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  MoreHorizontal,
  Crown,
  ChevronDown,
  Search,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Home,
  LayoutDashboard,
  Sun,
  Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DarkModeContext } from '../Context/DarkModeContext'; // Adjust the import path as necessary

function Housekeeper() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [adminStatus, setAdminStatus] = useState(null);
  const [pinTargetName, setPinTargetName] = useState('');
  const [show, setShow] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [statusPopup, setStatusPopup] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [housekeeper, setHousekeeper] = useState([]);
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState('');
  const dropdownRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', pin: '', role: 'Housekeeper' });
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);

  useEffect(() => {
    const eventSource = new EventSource('/account/housekeepers', {
      withCredentials: true,
    });

    // console.log("SSE connection established for housekeepers", eventSource);

    const handleHousekeeperList = (event) => {
      try {
        // console.log('SSE raw event.data:', event.data);
        const data = JSON.parse(event.data);
        // console.log('SSE parsed housekeeper data:', data);

        if (Array.isArray(data)) {
          setHousekeeper(data);  // ใช้ได้ตรงนี้เลย
        } else {
          // console.error('Housekeeper data is not an array:', data);
        }
        
      } catch (error) {
        // console.error('Error parsing SSE data:', error);
      }
    };

    // ✅ ชื่อ event ต้องตรงเป๊ะ (เคารพ case-sensitive)
    eventSource.addEventListener('HousekeeperList', handleHousekeeperList);

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.removeEventListener('HousekeeperList', handleHousekeeperList);
      eventSource.close();
    };
  }, []);


    useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // filter สำหรับค้นหา housekeeper
  const filteredMembers = housekeeper.filter(member =>
    member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


const handleSelectAll = () => {
  if (selectedMembers.length === filteredMembers.length) {
    setSelectedMembers([]); // uncheck all
  } else {
    setSelectedMembers(filteredMembers.map(h => ({ id: h._id, name: h.name }))); // select all
  }
};

const handleSelectHousekeeper = (housekeeper) => {
  setSelectedMembers(prev => {
    const exists = prev.find(h => h.id === housekeeper._id);
    if (exists) {
      // ถ้ามีอยู่แล้ว ให้เอาออก
      return prev.filter(h => h.id !== housekeeper._id);
    } else {
      // ถ้ายังไม่มี ให้เพิ่มเข้าไป
      return [...prev, { id: housekeeper._id, name: housekeeper.name }];
    }
  });
};


 const handleChangePin = async () => {
  // if (newPin !== confirmPin) {
  //   setStatusPopup('error');
  //   setTimeout(() => setStatusPopup(null), 3000);
  //   return;
  // }

  try {
    const token = localStorage.getItem('token');
    const res = await axios.patch(
      '/account/edithousekeeper',
      { newpin: newPin, name: pinTargetName }, // สมมติว่าใช้ name สำหรับระบุตัวผู้ใช้
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.status === 200) {
      setStatusPopup('success');
      setTimeout(() => {
        setStatusPopup(null);
        setShowPinModal(false);
        setNewPin('');
        setConfirmPin('');
        setPinTargetName('');
      }, 2000);
    } else {
      setStatusPopup('error');
      setTimeout(() => setStatusPopup(null), 3000);
    }
  } catch (error) {
    console.error(error);
    // setStatusPopup('error');
    // setTimeout(() => setStatusPopup(null), 3000);
  }
};

const handleAddMember = async () => {
  if (!newMember.name?.trim() || !newMember.pin?.trim()) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const response = await axios.post(
      "/account/createhousekeeper",
      {
        name: newMember.name.trim(),
        pin: newMember.pin.trim(),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      }
    );

    const createdMember = response.data;

    setHousekeeper((prev) => [
      ...prev,
      {
        id: createdMember._id || prev.length + 1,   // ใช้ _id ถ้า backend ส่งกลับ
        name: createdMember.name,
        role: createdMember.role || "Housekeeper",  // fallback role เผื่อ backend ไม่ส่งกลับ
        status: "Offline",
        lastLogin: "N/A"
      }
    ]);

    setAdminStatus('success');
    setTimeout(() => {
      setAdminStatus(null);
      setShowModal(false);
      setNewMember({ name: "", pin: "", role: "Housekeeper" });
    }, 3000);

  } catch (error) {
    console.error("Error creating housekeeper:", error.response?.data || error.message);

    setAdminStatus('error');

    setTimeout(() => {
      setAdminStatus(null);
      setShowModal(false);
      setNewMember({ name: "", pin: "", role: "Housekeeper" });
    }, 3000);
  }
};


  const refreshToken = async () => {
    try {
      const refreshRes = await axios.post("/account/refreshtoken", {}, {
        withCredentials: true,
        timeout: 10000
      });

      const newToken = refreshRes?.data?.accessToken;
      console.log("Refresh response:", refreshRes);

      if (!newToken) {
        console.error("No accessToken returned in refresh response.");
        return null;
      }

      localStorage.setItem("token", newToken);
      console.log("Access token refreshed successfully.", newToken);
      return newToken;

    } catch (err) {
      console.error("Token refresh error:", {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      full: err
    });

      if (err.response?.status === 401) {
        console.warn("Refresh token expired. Redirecting to login.");
        // navigate('/');  // ปลดคอมเมนต์ถ้าต้องการบังคับ logout
      }

      return null;
    }
  };



const handleDeleteHousekeepers = async () => {
  if (selectedMembers.length === 0) {
    alert('Please select at least one housekeeper.');
    return;
  }

  const confirmDelete = window.confirm("Are you sure you want to delete selected housekeepers?");
  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");
    for (const member of selectedMembers) {
      await axios.delete(`/account/deletehousekeeper`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          id: member.id,
        },
        withCredentials: true,
      });
    }

    setHousekeeper(prev => prev.filter(h => !selectedMembers.some(m => m.id === h._id)));
    setSelectedMembers([]);
    alert('Selected housekeepers have been deleted.');
  } catch (error) {
    console.error('Delete failed:', error);
    alert('Failed to delete some or all housekeepers.');
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
  const role = profile?.role; // ดึง role จาก localStorage
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

  // คำนวณจำนวน
  const totalUsers = housekeeper.length;
  const adminCount = housekeeper.filter(m => m.role && m.role.toLowerCase() === 'admin').length;
  const housekeeperCount = housekeeper.filter(m => m.role && m.role.toLowerCase() === 'housekeeper').length;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex flex-col md:flex-row font-display`}>
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-xl shadow-lg w-96`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Change PIN</h2>
            <div className="mb-4">
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Name</label>
              <input
                type="username"
                maxLength={20}
                inputMode="numeric"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                value={pinTargetName}
                onChange={(e) => setPinTargetName(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>New PIN</label>
              <input
                type="password"
                maxLength="4"
                inputMode="numeric"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setNewPin('');
                  setConfirmPin('');
                  setPinTargetName('');
                }}
                className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleChangePin}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-gray-300/30 flex items-center justify-center">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-xl shadow-lg w-96`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Change PIN</h2>

            {/* New Password */}
            <div className="mb-4">
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>New PIN</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                >
                  {showNewPassword ? (
                    // icon ตาเปิด
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S3.732 16.057 2.458 12z" />
                    </svg>
                  ) : (
                    // icon ตาปิด
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.96 9.96 0 012.293-3.95" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.428 6.428A9.954 9.954 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.96 9.96 0 01-1.205 2.423" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Confirm New PIN</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S3.732 16.057 2.458 12z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.96 9.96 0 012.293-3.95" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.428 6.428A9.954 9.954 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.96 9.96 0 01-1.205 2.423" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  handleSubmitPasswordChange();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update PIN
              </button>
            </div>
          </div>
        </div>
      )}
      {statusPopup === 'success' && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/20 flex items-center justify-center shadow-xl/30">
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl shadow-lg text-lg">
            ✅ PIN updated successfully!
          </div>
        </div>
      )}

      {statusPopup === 'error' && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/20 flex items-center justify-center shadow-xl/30">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl shadow-lg text-lg">
            ❌ Failed to update PIN!
          </div>
        </div>
      )}
      {adminStatus === 'success' && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/20 flex items-center justify-center shadow-xl/30">
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl shadow-lg text-lg">
            ✅ Admin created successfully!
          </div>
        </div>
      )}

      {adminStatus === 'error' && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/20 flex items-center justify-center shadow-xl/30">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl shadow-lg text-lg">
            ❌ Failed to create admin!
          </div>
        </div>
      )}
      {/* Sidebar */}
      <div className={`w-full md:w-64 ${darkMode ? 'bg-gray-800' : 'bg-slate-800'} text-white flex flex-row md:flex-col sticky top-0 h-screen`}>
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
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-slate-700  cursor-pointer"  onClick={()=>navigate('/admin/api')}>
              <Home className="w-4 h-4" />
              <span className="text-sm">Home</span>
            </button>
          </div>
          <div className="mt-4 md:mt-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3 px-3">Role Filter</p>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 text-left  cursor-pointer" onClick={handleNavigateByRole}>
                <Shield className="w-4 h-4 text-white" />
                <span className="text-sm text-white">Admin</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-blue-600 text-left">
                <UserCheck className="w-4 h-4" />
                <span className="text-sm">Housekeeper</span>
              </button>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'} uppercase tracking-wider mb-3 px-3 mt-5`}>MONITORING</p>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 text-left cursor-pointer" onClick={()=>navigate('/account/dashboard')}>
                <LayoutDashboard className="w-4 h-4 text-white" />
                <span className="text-sm text-white">Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} px-4 md:px-6 py-4 border-b transition-colors duration-300`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Account Management</h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage users and permission</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex px-4 py-1.5 gap-2 rounded-lg text-white ${getRoleColor(profile?.role)}`}>
                  {icon()}
                  <h1>{profile?.role}</h1>
              </div>
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4" />
                    <span className="text-sm">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    <span className="text-sm">Dark</span>
                  </>
                )}
              </button>
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg w-fit ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div className="text-lg tracking-widest">
                  {show ? profile?.pin || '0000' : '●'.repeat(profile?.pin?.length || 4)}
                </div>
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="focus:outline-none"
                  title={show ? "Hide PIN" : "Show PIN"}
                >
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
                          <div className="relative" ref={dropdownRef}>
                            <div
                              className={`flex items-center gap-2 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'} rounded-lg px-4 py-2 cursor-pointer`}
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
                                className="lucide lucide-circle-user-icon lucide-circle-user"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="10" r="3" />
                                <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                              </svg>
                              <span className="text-sm font-medium">{profile?.name || 'Guest'}</span>
                              <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            </div>
              
                            <div
                              className={`absolute right-0 mt-2 w-35 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-700'} border rounded-lg shadow-xl z-50 transition-all duration-200 ease-in-out ${
                                open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                              }`}
                            >
                              <ul className="py-1 text-sm">
                                <li className={`px-3 py-2 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'} cursor-pointer flex`}onClick={() => {
                                setOpen(false); // ปิด dropdown ก่อน
                                setTimeout(() => setShowPasswordModal(true), 0); // เปิด modal หลังจาก dropdown ปิด
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
                                <li className={`px-3 py-2 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'} cursor-pointer flex`}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {[['Total users', totalUsers, Users, 'green'],
              ['Admins', adminCount, Shield, 'purple'],
              ['Housekeepers', housekeeperCount, UserCheck, 'blue']].map(([label, count, Icon, color]) => (
              <div key={label} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl p-4 md:p-6 shadow-sm border`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border`}>
            <div className={`p-4 md:p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex flex-col sm:flex-row sm:justify-between gap-4 flex-wrap`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Housekeepers</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search housekeepers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-64 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                    setShowModal(true)
                  }}
                    
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Housekeeper
                  </button>
                  <button
                    disabled={selectedMembers.length === 0}
                    onClick={handleDeleteHousekeepers}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      selectedMembers.length > 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

        <div className="overflow-x-auto">
      <table className={`w-full min-w-[450px] sm:min-w-[500px] md:min-w-[600px]`}>
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
            {['Member', 'Role', 'Action'].map((title) => (
              <th key={title} className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{title}</th>
            ))}
          </tr>
        </thead>
        <tbody className={`${darkMode ? 'bg-gray-800 divide-gray-700 text-white' : 'bg-white divide-gray-200 text-gray-900'} divide-y`}>
          {filteredMembers.map((h) => (
            <tr key={h._id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedMembers.some(m => m.id === h._id)}
                  onChange={() => handleSelectHousekeeper(h)}
                />
              </td>
              <td className="px-6 py-4">
                <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{h.name}</div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {h.role}
                </span>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => {
                    setPinTargetName(h.name);
                    setShowPinModal(true);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition"
                >
                  Change PIN
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <UserCheck className={`mx-auto w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No housekeepers found</p>
              </div>
            )}

            <div className={`px-4 md:px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-700 text-gray-300' : 'border-gray-100 bg-gray-50 text-gray-500'}`}>
              <p className="text-sm">
                {filteredMembers.length} of {housekeeperCount} results
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-gray-300/30 flex items-center justify-center">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl shadow-lg w-full max-w-md p-4 md:p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : ''}`}>Add Housekeeper</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className={`mt-1 block w-full p-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pin</label>
                <input
                  type={showPin ? "text" : "password"}
                  maxLength="4"
                  value={newMember.pin}
                  onChange={(e) => setNewMember({
                    ...newMember,
                    pin: e.target.value.replace(/\D/g, '')  // กรองไม่ให้มีตัวอักษรที่ไม่ใช่ตัวเลข
                  })}
                  className={`mt-1 block w-full p-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute top-[358px] right-[515px]"  // ปรับตำแหน่งให้ปุ่มอยู่ขอบ input
                      >
                        {showPin ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                      </button>
              </div>
              {/* <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role</label>
                <div
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className={`mt-1 block w-full p-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                >
                  <option value="Housekeeper">Housekeeper</option>
                </div>
              </div> */}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleAddMember();
                  await refreshToken();
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Housekeeper;