import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  CheckCircle,
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
  Moon,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DarkModeContext } from '../Context/DarkModeContext'; // Adjust the import path as necessary
import RefreshButton from '../../utils/refreshToken'; // Adjust the import path as necessary
import HousekeeperStats from '../Housekeeperstats';

function Housekeeper() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinerr, setPinerr] = useState('');
  const [createhousekeeper, setCreatehousekeeper] = useState('');
  const [deletehousekeeper, setDeletehousekeeper] = useState('');
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState([]);  // รวมทั้งหมด
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // ใช้เก็บ callback ลบจริง
  const [signoutsuccess, setSignoutsuccess] = useState(false);
  const [pinadmin, setPinadmin] = useState(null);
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
  const [message, setMessage] = useState('');
  const [housekeepers, setHousekeepers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState('');
  const dropdownRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', pin: '', role: 'Housekeeper' });
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);

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

  // คำนวณจำนวน
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
const Housekeepermem = allUsers.filter(user => user.role === 'Housekeeper');

const filteredMembers = Housekeepermem.filter((member) => {
  const keyword = searchTerm.toLowerCase();
  return (
    member.name?.toLowerCase().includes(keyword) ||
    member.email?.toLowerCase().includes(keyword) ||
    member.role?.toLowerCase().includes(keyword)
  );
});


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

    setMessage(res.data.message || 'PIN Admin Update Successfully');
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

    }, 3000);
  }
};


 const handleChangePin = async () => {
    if (newPin.length !== 4) {
    setStatusPopup('error');
    setMessage('Please enter a 4-digit PIN');
    setTimeout(() => {
      setStatusPopup(null);
    }, 3000);
    return;
  }

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
      setMessage(res.data.message || 'PIN updated successfully');
      setPinerr('success');
      setTimeout(() => {
        setPinerr(null);
        setShowPinModal(false);
        setNewPin('');
        setConfirmPin('');
        setPinTargetName('');
      }, 2000);
    } 
  } catch (error) {
    const messageFromBackend = error.res?.data?.message || 'Failed to update PIN. Please try again.';
      setMessage(messageFromBackend);
      setPinerr('error');
      setTimeout(() => {
        setPinerr(null);
        setShowPinModal(false);
        setNewPin('');
        setConfirmPin('');
        setPinTargetName('');
      }, 3000);
    }
};

const handleAddMember = async () => {
    if (newMember.pin.length !== 4) {
    setStatusPopup('error');
    setMessage('Please enter a 4-digit PIN');
    setTimeout(() => {
      setStatusPopup(null);
    }, 3000);
    return;
  }
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
    setMessage(response.data.message);
    setCreatehousekeeper('success');
    
    setTimeout(() => {
      setCreatehousekeeper(null);
      setShowModal(false);
      setNewMember({ name: "", pin: "", role: "Housekeeper" });
    }, 2000);

  } catch (error) {
    console.error("Error creating housekeeper:", error.response?.data || error.message);
    setMessage(error.response?.data?.message);
    setCreatehousekeeper('error');

    setTimeout(() => {
      setCreatehousekeeper(null);
    }, 2000);
  }
};


const handleDeleteHousekeepers = () => {
  if (selectedMembers.length === 0) {
    alert('Please select at least one housekeeper.');
    return;
  }

  // แค่เปิด popup และเก็บฟังก์ชันลบไว้
  setPendingDelete(() => performDeleteHousekeepers);
  setShowDeleteConfirm(true);
};

const performDeleteHousekeepers = async () => {
  try {
    const token = localStorage.getItem("token");
    for (const member of selectedMembers) {
      await axios.delete(`/account/deletehousekeeper`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { id: member.id },
        withCredentials: true,
      });
    }

    setHousekeeper(prev => prev.filter(h => !selectedMembers.some(m => m.id === h._id)));
    setSelectedMembers([]);
    setDeletehousekeeper('success');
  } catch (error) {
    console.error('Delete failed:', error);
    setDeletehousekeeper('error');
  } finally {
    setShowDeleteConfirm(false);
    setPendingDelete(null);
    setTimeout(() => setDeletehousekeeper(null), 3000);
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



  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex flex-col md:flex-row font-display`}>
      {showPinModal && (
       <div className="fixed inset-0 z-50 backdrop-blur-sm bg-gray-300/30 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-xl shadow-lg w-96`}>
        <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Change PIN
        </h2>
        
        <div className="mb-4">
          <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Name
          </label>
          <div
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-800'
              }`}
            >
              {pinTargetName || '-'}
            </div>
        </div>
        
        <div className="mb-6">
          <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            New PIN
          </label>
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              maxLength="4"
              inputMode="numeric"
              className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
              }`}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 hover:bg-opacity-10 rounded-r-md transition-colors"
            >
              {showPin ? 
                <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" /> : 
                <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              }
            </button>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <RefreshButton
          onClick={() => {
            setShowPinModal(false);
            setNewPin('');
            setConfirmPin('');
            setPinTargetName('');
          }}
            className={`px-4 py-2 rounded-md ${
              darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </RefreshButton>
          <RefreshButton
            onClick={handleChangePin}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Confirm
          </RefreshButton>
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
                  maxLength={4}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                />
                <RefreshButton
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
                </RefreshButton>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Confirm New PIN</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  maxLength={4}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                />
                <RefreshButton
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
                </RefreshButton>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <RefreshButton
                onClick={() => setShowPasswordModal(false)}
                className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
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
      {pinerr == 'success' && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}
      {pinerr == 'error' && (
        <div className="fixed top-6 right-6 z-50">
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
        {createhousekeeper === 'success' && (
          <div className="fixed top-6 right-6 z-[9999]">
            <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{message}.</span>
            </div>
          </div>
        )}
        {createhousekeeper == 'error' && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}
       {deletehousekeeper === 'success' && (
          <div className="fixed top-6 right-6 z-[9999]">
            <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Delete Housekeeper Successful.</span>
            </div>
          </div>
        )}
       {deletehousekeeper === 'error' && (
          <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Delete Housekeeper Failed..</span>
          </div>
        </div>
        )}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/20 flex items-center justify-center shadow-xl/30">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
              <h2 className="text-lg text-gray-700 font-semibold mb-4">Confirm Deletion</h2>
              <p className="mb-6 text-gray-700">Are you sure you want to delete selected housekeepers?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => pendingDelete && pendingDelete()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Yes
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPendingDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      {/* Sidebar */}
      {/* <div className={`w-full md:w-64 ${darkMode ? 'bg-gray-800' : 'bg-slate-800'} text-white flex flex-row md:flex-col sticky top-0 h-screen`}>
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
            <RefreshButton className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-slate-700  cursor-pointer"  onClick={()=>navigate('/admin/api')}>
              <Home className="w-4 h-4" />
              <span className="text-sm">Home</span>
            </RefreshButton>
          </div>
          <div className="mt-4 md:mt-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3 px-3">Role Filter</p>
            <div className="space-y-1">
              <RefreshButton className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 text-left  cursor-pointer" onClick={handleNavigateByRole}>
                <Shield className="w-4 h-4 text-white" />
                <span className="text-sm text-white">Admin</span>
              </RefreshButton>
              <RefreshButton className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-blue-600 text-left">
                <UserCheck className="w-4 h-4" />
                <span className="text-sm">Housekeeper</span>
              </RefreshButton>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'} uppercase tracking-wider mb-3 px-3 mt-5`}>MONITORING</p>
              <RefreshButton className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 text-left cursor-pointer" onClick={()=>navigate('/account/dashboard')}>
                <LayoutDashboard className="w-4 h-4 text-white" />
                <span className="text-sm text-white">Dashboard</span>
              </RefreshButton>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} px-4 md:px-6 py-4 border-b transition-colors duration-300`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Housekeeper Management</h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage housekeepers and access levels</p>
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
              <div className={`flex px-4 py-1.5 gap-2 rounded-lg text-white ${getRoleColor(profile?.role)}`}>
                  {icon()}
                  <h1>{profile?.role}</h1>
              </div>
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg w-fit ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div className="text-lg tracking-widest">
                  {show ? profile?.pin || '0000' : '●'.repeat(profile?.pin?.length || 4)}
                </div>
                <RefreshButton
                  type="button"
                  onClick={() => setShow(!show)}
                  className="focus:outline-none"
                  title={show ? "Hide PIN" : "Show PIN"}
                >
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </RefreshButton>
              </div>
                          <div className="relative" ref={dropdownRef}>
                            <div
                              className={`flex items-center gap-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg px-5 py-2 cursor-pointer whitespace-nowrap`}
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
                              <span className="text-sm font-medium">{profile?.name || 'Guest'}</span>
                              <ChevronDown className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            </div>
              
                            <div
                              className={`absolute right-0 mt-2 min-w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-700'} border rounded-lg shadow-xl z-50 transition-all duration-200 ease-in-out ${
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
                                <li className={`px-3 py-2 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'} cursor-pointer flex`} onClick={handleSignout}>
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
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border`}>
            <div className={`p-4 md:p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex flex-col sm:flex-row sm:justify-between gap-4 flex-wrap`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-blue-600" />
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
                  <RefreshButton
                    onClick={() => {
                    setShowModal(true)
                  }}
                    
                    className="flex items-center gap-2 bg-blue-600 text-sm text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Housekeeper
                  </RefreshButton>
                  <RefreshButton
                    disabled={selectedMembers.length === 0}
                    onClick={handleDeleteHousekeepers}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                      selectedMembers.length > 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </RefreshButton>
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
                        <RefreshButton
                          onClick={() => {
                            setPinTargetName(h.name);
                            setShowPinModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition"
                        >
                          Change PIN
                        </RefreshButton>
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
                Updated Real-Time
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
              {/* Name Field */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className={`mt-1 block w-full p-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
              </div>

              {/* Pin Field */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pin</label>
                <div className="relative mt-1">
              <input
                type={showPin ? "text" : "password"}
                maxLength="4"
                value={newMember.pin}
                onChange={(e) =>
                  setNewMember({
                    ...newMember,
                    pin: e.target.value.replace(/\D/g, '')
                  })
                }
                className={`block w-full p-2 pr-10 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showPin ? (
                  <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <RefreshButton
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-lg border ${
                  darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </RefreshButton>
              <RefreshButton
                onClick={async () => {
                  await handleAddMember();
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Add
              </RefreshButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Housekeeper;