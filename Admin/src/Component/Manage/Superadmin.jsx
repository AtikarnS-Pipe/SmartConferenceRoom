import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  MoreHorizontal,
  Crown ,
  ChevronDown,
  Search,
  Plus,
  Trash2,
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

function Superadmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({
        email: '',
        password: '',
        name: '',
        pin: ''
      });
  const [profile, setProfile] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [show, setShow] = useState(false);
  const [showAdminStatus, setShowAdminStatus] = useState(false);
  const [error, setError] = useState(null);
  const [pinChanged, setPinChanged] = useState(null);
  const [adminstatus, setAdminStatus] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [statusPopup, setStatusPopup] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  
  // New states for Add Admin functionality
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [addAdminForm, setAddAdminForm] = useState({
    email: '',
    password: '',
    name: '',
    pin: ''
  });
  const [showAddAdminPassword, setShowAddAdminPassword] = useState(false);
  
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const filteredMembers = members.filter((member) => {
    const keyword = searchTerm.toLowerCase();
    return (
      member.name?.toLowerCase().includes(keyword) ||
      member.email?.toLowerCase().includes(keyword) ||
      member.role?.toLowerCase().includes(keyword)
    );
  });

  useEffect(() => {
    const eventSource = new EventSource('/account/member', {
      withCredentials: true,
    });

    const handleAdminList = (event) => {
      try {
        console.log('Raw SSE event data:', event.data); 
        const data = JSON.parse(event.data);
          console.log("Selected Members:", data);
        setMembers(data);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.addEventListener('adminList', handleAdminList);

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.removeEventListener('adminList', handleAdminList);
      eventSource.close();
    };
  }, []);

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
    if (newPassword !== confirmPassword) {
      setStatusPopup('error');
      setTimeout(() => setStatusPopup(null), 3000);
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
        setStatusPopup('success');
        setTimeout(() => {
          setPinChanged(res.data.newPinPlaintext);
          setStatusPopup(null);
          setShowPasswordModal(false);
          setNewPassword('');
          setConfirmPassword('');
        }, 3000);
      } else {
        setStatusPopup('error');
        setTimeout(() => setStatusPopup(null), 3000);
      }
    } catch (error) {
      console.error(error);
      setStatusPopup('error');
      setTimeout(() => setStatusPopup(null), 3000);
    }
  };

const handleSignout = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      '/account/signout',
      {},  // ไม่มี body ในการ signout (เว้นเปล่า)
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    if (res.data.success) {
      alert('Signed out successfully.');
      window.location.href = '/';
    } else {
      alert('Signout failed: ' + (res.data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Signout error:', error);
    alert('Failed to sign out.');
  }
};
const handleAddAdmin = async () => {
  console.log('Sending data:', newMember);

  if (!newMember.name || !newMember.pin || !newMember.email || !newMember.password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const response = await axios.post(
      "/superadmin/createadmin",
      {
        email: newMember.email,
        password: newMember.password,
        name: newMember.name,
        pin: newMember.pin
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );

    console.log('Response:', response.data);

    setAdminStatus('success');  // ✅ แสดง popup success

    setTimeout(() => {
      setShowAdminStatus(false);  // ✅ ปิด popup หลัง 2 วินาที (เช่น)
    }, 2000);

    // ล้างฟอร์มหรือปิด modal ถ้าต้องการ
    setNewMember({ name: "", pin: "", email: "", password: "" });

  } catch (error) {
    console.error("Backend error:", error.response?.data || error.message);

    setAdminStatus('error');      // ✅ แสดง popup error

    setTimeout(() => {
      setShowAdminStatus(false);  // ✅ ปิด popup หลัง 2 วินาที
    }, 2000);

    alert("Failed to create admin. Please check form data or contact developer.");
  }
};

const handleDeleteAdmins = async () => {
  if (selectedMembers.length === 0) {
    alert('Please select at least one admin.');
    return;
  }

  const confirmDelete = window.confirm("Are you sure you want to delete selected admins?");
  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");
    // Find selected member objects by their _id
    const selectedMemberObjects = members.filter(m => selectedMembers.includes(m._id));
    for (const member of selectedMemberObjects) {
      await axios.delete(`/superadmin/deleteadmin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          id: member._id, // or use member._id if backend expects id
        },
        withCredentials: true,
      });
    }

    // Remove deleted members from the list
    setMembers(prev => prev.filter(m => !selectedMembers.includes(m._id)));
    setSelectedMembers([]);
    alert('Selected admins have been deleted.');

  } catch (error) {
    console.error('Delete failed:', error);
    alert('Failed to delete some or all admins.');
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

  // New functions for Add Admin
  const handleAddAdminClick = () => {
    setShowAddAdminModal(true);
  };

  const handleDeleteAdminClick = () => {
    if (selectedMembers.length === 0) {
      alert('Please select members to delete');
      return;
    }
    if (confirm(`Are you sure you want to delete ${selectedMembers.length} selected member(s)?`)) {
      // Add delete logic here
      console.log('Deleting members:', selectedMembers);
    }
  };

  // const handleAddAdminSubmit = () => {
  //   // Add validation and submit logic here
  //   console.log('Adding admin:', addAdminForm);
  //   // Reset form and close modal
  //   setAddAdminForm({ email: '', password: '', name: '', pin: '' });
  //   setShowAddAdminModal(false);
  // };

  // const handleAddAdminFormChange = (field, value) => {
  //   setAddAdminForm(prev => ({
  //     ...prev,
  //     [field]: value
  //   }));
  // };

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

  const totalUsers = members.length;
  const adminCount = members.filter((m) => m.role && m.role.toLowerCase() === 'admin').length;
  const housekeeperCount = members.filter((m) => m.role && m.role.toLowerCase() === 'housekeeper').length;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col md:flex-row font-display transition-colors duration-300`}>
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-xl shadow-lg w-96`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Change Password</h2>

            <div className="mb-4">
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute inset-y-0 right-0 flex items-center px-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {showNewPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute inset-y-0 right-0 flex items-center px-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {showConfirmPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
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
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
       <div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/20 flex items-center justify-center shadow-xl/30">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-xl shadow-lg w-96 max-h-[90vh] overflow-y-auto`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Add New Admin</h2>

            <div className="mb-4">
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Email</label>
              <input
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Password</label>
              <div className="relative">
                <input
                  type={showAddAdminPassword ? "text" : "password"}
                  value={newMember.password}
                  onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowAddAdminPassword(!showAddAdminPassword)}
                  className={`absolute inset-y-0 right-0 flex items-center px-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {showAddAdminPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Name</label>
              <input
                type="text"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
            </div>

            <div className="mb-6 relative">  {/* เพิ่ม relative */}
                <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>PIN</label>
                <input
                  type={showAddAdminPassword ? "text" : "password"}
                  value={newMember.pin}
                  onChange={(e) => setNewMember({ ...newMember, pin: e.target.value })}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                  placeholder="Enter PIN"
                  maxLength="4"
                />
                <button
                  type="button"
                  onClick={() => setShowAddAdminPassword(!showAddAdminPassword)}
                  className={`absolute right-3 top-11 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {showAddAdminPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddAdminModal(false);
                  setAddAdminForm({ email: '', password: '', name: '', pin: '' });
                  setShowAddAdminPassword(false);
                }}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdmin}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {statusPopup === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl shadow-lg text-lg">
            ✅ Password updated successfully!
          </div>
        </div>
      )}

      {statusPopup === 'error' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl shadow-lg text-lg">
            ❌ Failed to update password!
          </div>
        </div>
      )}
      {adminstatus === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl shadow-lg text-lg">
            ✅ Admin created successfully!
          </div>
        </div>
      )}

      {adminstatus === 'error' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl shadow-lg text-lg">
            ❌ Failed to create admin!
          </div>
        </div>
      )}

      {/* Sidebar */}
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
            <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:${darkMode ? 'bg-gray-700' : 'bg-slate-700'} cursor-pointer`} onClick={() => navigate('/admin/api')}>
              <Home className="w-4 h-4" />
              <span className="text-sm">Home</span>
            </button>
          </div>
          <div className="mt-4 md:mt-6">
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'} uppercase tracking-wider mb-3 px-3`}>Role Filter</p>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-blue-600 text-left">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Admin</span>
              </button>
              <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:${darkMode ? 'bg-gray-700' : 'bg-slate-700'} text-left cursor-pointer`} onClick={() => navigate('/account/housekeeper')}>
                <UserCheck className="w-4 h-4 text-white" />
                <span className="text-sm text-white">Housekeeper</span>
              </button>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'} uppercase tracking-wider mb-3 px-3 mt-5`}>MONITORING</p>
              <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:${darkMode ? 'bg-gray-700' : 'bg-slate-700'} text-left cursor-pointer`} onClick={() => navigate('/account/dashboard')}>
                <LayoutDashboard className="w-4 h-4 text-white" />
                <span className="text-sm text-white">Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 md:px-6 py-4 transition-colors duration-300`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Account Management</h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage users and permission</p>
            </div>
            <div className="flex items-center gap-3">
                <div className='flex px-4 py-1.5 gap-2 rounded-lg bg-yellow-600 text-white'>
                    <Crown  className="w-4 h-6" />
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

              {/* PIN Display */}
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg w-fit ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div className={`text-lg tracking-widest ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {show ? profile?.pin : '●'.repeat(profile?.pin?.length || 4)}
                </div>
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className={`focus:outline-none ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  title={show ? "Hide PIN" : "Show PIN"}
                >
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <div
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 cursor-pointer ${
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
                    className={`lucide lucide-circle-user-icon lucide-circle-user ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                  </svg>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} >{profile?.name || 'Guest'}</span>
                  <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                </div>

                <div
                  className={`absolute right-0 mt-2 w-42 border rounded-lg shadow-xl z-50 transition-all duration-200 ease-in-out ${
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
                      Change Password
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
          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {[['Total users', totalUsers, Users, 'green'],
              ['Admins', adminCount, Shield, 'purple'],
              ['Housekeepers', housekeeperCount, UserCheck, 'blue']].map(([label, count, Icon, color]) => (
              <div key={label} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl p-4 md:p-6 shadow-sm border transition-colors duration-300`}>
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
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border transition-colors duration-300`}>
            <div className={`p-4 md:p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex flex-col sm:flex-row sm:justify-between gap-4 flex-wrap`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Member</h2>
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
                <div className="flex gap-2">
                  <button
                    onClick={handleAddAdminClick}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add Admin</span>
                  </button>
                  <button
                    onClick={handleDeleteAdmins}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      selectedMembers.length > 0
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : `${darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500'} cursor-not-allowed`
                    }`}
                    disabled={selectedMembers.length === 0}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Delete Admin</span>
                  </button>
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
                  {members.map((m) => (
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
                {filteredMembers.length} of {adminCount} results
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Superadmin;