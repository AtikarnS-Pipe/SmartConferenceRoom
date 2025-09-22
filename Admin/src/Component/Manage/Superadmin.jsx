import React, { useState, useRef, useEffect, useContext } from "react";
import {
  Users,
  Shield,
  UserCheck,
  MoreHorizontal,
  CheckCircle,
  Crown,
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
  Moon,
  XCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { DarkModeContext } from "../Context/DarkModeContext";
import { useProfile } from "../Context/ProfileContext";
import RefreshButton from "../../utils/refreshToken";
import Statscard from "../Statscard";
import Header from "../Header";
import useUserData from "../../hooks/useUserData";

function Superadmin() {
  // ใช้ custom hook สำหรับจัดการ user data
  const {
    allUsers,
    adminCount,
    housekeeperCount,
    isLoading: userDataLoading,
    error: userDataError,
    refreshData
  } = useUserData();

  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({
    email: "",
    password: "",
    name: "",
    pin: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newPassword, setNewPassword] = useState("");
  const [show, setShow] = useState(false);
  const [showAdminStatus, setShowAdminStatus] = useState(false);
  const [signoutsuccess, setSignoutsuccess] = useState(false);
  const [deleteadmin, setDeleteadmin] = useState(null);
  const [adminstatus, setAdminStatus] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [statusPopup, setStatusPopup] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [showDeleteAdminConfirm, setShowDeleteAdminConfirm] = useState(false);
  const [pendingDeleteAdmin, setPendingDeleteAdmin] = useState(null); // ฟังก์ชันที่รอการยืนยัน
  const [loading, setLoading] = useState(true); // เพิ่ม loading state สำหรับหน้า

  // New states for Add Admin functionality
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [message, setMessage] = useState("");
  const [addAdminForm, setAddAdminForm] = useState({
    email: "",
    password: "",
    name: "",
    pin: "",
  });
  const [showAddAdminPassword, setShowAddAdminPassword] = useState(false);

  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);
  const { profile } = useProfile(); // ใช้ profile จาก Context
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // เพิ่ม useEffect สำหรับจัดการ loading หน้า
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 200); // แสดง loading 2 วินาที

    return () => clearTimeout(timer);
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
  
  const superadminmem = allUsers.filter((user) => user.role === "Admin");

  const filteredMembers = superadminmem.filter((member) => {
    const keyword = searchTerm.toLowerCase();
    return (
      member.name?.toLowerCase().includes(keyword) ||
      member.email?.toLowerCase().includes(keyword) ||
      member.role?.toLowerCase().includes(keyword)
    );
  });

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (newMember.pin.length !== 4) {
    setStatusPopup('error');
    setMessage('Please enter a 4-digit PIN');
    setTimeout(() => {
      setStatusPopup(null);
    }, 3000);
    return;
  }

    if (
      !newMember.name ||
      !newMember.pin ||
      !newMember.email ||
      !newMember.password
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "/api1/superadmin/createadmin",
        {
          email: newMember.email,
          password: newMember.password,
          name: newMember.name,
          pin: newMember.pin,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );


      // ✅ เช็คให้แน่ว่าสถานะ 201 เท่านั้นถึงถือว่าสำเร็จ
      if (response.status === 201) {
        setNewMember({ name: "", pin: "", email: "", password: "" });
        setShowPassword(false);
        setShowPin(false);
        setMessage(response.data.message || "Admin created successfully");
        setAdminStatus("success");

        setShowAddAdminModal(false);
        setTimeout(() => {
          setAdminStatus(null);
          setShowAdminStatus(false);
        }, 3000);
      } else {
        throw new Error("Unexpected response status: " + response.status);
      }
    } catch (error) {
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      console.error("Error message:", error.message);

      // ✅ แสดงข้อความ error จาก backend หรือ fallback เป็น error.message
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred";
      setMessage(errorMsg);
      setAdminStatus("error");

      // ✅ ล้างฟอร์ม
      setShowPassword(false);
      setShowPin(false);
      setTimeout(() => {
        setAdminStatus(null);
        setShowAdminStatus(false);
      }, 3000);
    }
  };

  const handleDeleteAdmins = () => {
    if (selectedMembers.length === 0) {
      alert("Please select at least one admin.");
      return;
    }

    // เปิด popup และเก็บฟังก์ชันที่จะลบไว้
    setPendingDeleteAdmin(() => performDeleteAdmins);
    setShowDeleteAdminConfirm(true);
  };
  const performDeleteAdmins = async () => {
    try {
      const token = localStorage.getItem("token");

      const selectedMemberObjects = superadminmem.filter((m) =>
        selectedMembers.includes(m._id)
      );
      for (const member of selectedMemberObjects) {
        await axios.delete(`/api1/superadmin/deleteadmin`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            id: member._id,
          },
          withCredentials: true,
        });
      }

      setMembers((prev) =>
        prev.filter((m) => !selectedMembers.includes(m._id))
      );
      setSelectedMembers([]);

      setDeleteadmin("success");
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleteadmin("error");
    } finally {
      setShowDeleteAdminConfirm(false);
      setPendingDeleteAdmin(null);

      // ซ่อน status popup หลัง 3 วินาที
      setTimeout(() => {
        setDeleteadmin(null);
      }, 3000);
    }
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map((m) => m._id));
    }
  };
  const handleMemberSelect = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (profile) {
    }
  }, [profile]);

  // New functions for Add Admin
  const handleAddAdminClick = () => {
    setShowAddAdminModal(true);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(",", "");
  };

  // Loading Screen Component
  if (loading || userDataLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-gray-900" : "bg-gray-50"
        } transition-colors duration-300`}
      >
        <div className="text-center">
          <Loader2
            className={`w-12 h-12 animate-spin mx-auto mb-4 ${
              darkMode ? "text-blue-400" : "text-blue-600"
            }`}
          />
          <h2
            className={`text-lg font-semibold mb-2 ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Loading...
          </h2>
          <p
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {userDataLoading ? "Please wait while we prepare superadmin management" : "Loading user data..."}
          </p>
          {userDataError && (
            <div className="mt-4">
              <p className="text-red-500 text-sm mb-2">{userDataError}</p>
              <button
                onClick={refreshData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200"
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      } font-display transition-colors duration-300`}
    > 

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <form onSubmit={handleAddAdmin}>
          <div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/20 flex items-center justify-center shadow-xl/30">
            <div
              className={`${
                darkMode ? "bg-gray-800 text-white" : "bg-white"
              } p-6 rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto`}
            >
              <h2
                className={`text-lg font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Add New Admin
              </h2>

              <div className="mb-4">
                <label
                  className={`block text-sm mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter email address"
                />
              </div>

              <div className="mb-4">
                <label
                  className={`block text-sm mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newMember.password}
                    onChange={(e) =>
                      setNewMember({ ...newMember, password: e.target.value })
                    }
                    className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter password"
                  />
                  <RefreshButton
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 right-0 flex items-center px-3 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </RefreshButton>
                </div>
              </div>

              <div className="mb-4">
                <label
                  className={`block text-sm mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter full name"
                />
              </div>

              <div className="mb-6 relative">
                {" "}
                {/* เพิ่ม relative */}
                <label
                  className={`block text-sm mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  PIN
                </label>
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={newMember.pin}
                  onChange={(e) => {
                    const value = e.target.value;
                    // อนุญาตเฉพาะตัวเลข
                    if (/^\d*$/.test(value)) {
                      setNewMember({ ...newMember, pin: value });
                    } else {
                      setStatusPopup("error");
                      setMessage("Please enter numbers only");
                      setTimeout(() => {
                        setStatusPopup(null);
                      }, 2000);
                    }
                  }}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter PIN"
                  maxLength="4"
                />
                <RefreshButton
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className={`absolute right-3 top-11 transform -translate-y-1/2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {showPin ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </RefreshButton>
              </div>

              <div className="flex justify-end gap-2">
                <RefreshButton
                  type="button"
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setAddAdminForm({
                      email: "",
                      password: "",
                      name: "",
                      pin: "",
                    });
                    setShowAddAdminPassword(false);
                    setNewMember({
                      name: "",
                      pin: "",
                      email: "",
                      password: "",
                    });
                  }}
                  className={`px-4 py-2 rounded-md ${
                    darkMode
                      ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Cancel
                </RefreshButton>
                <RefreshButton
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  Confirm
                </RefreshButton>
              </div>
            </div>
          </div>
        </form>
      )}

      {statusPopup === "success" && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}

      {statusPopup === "error" && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}
      {adminstatus === "success" && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}

      {adminstatus === "error" && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}
      {deleteadmin === "success" && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Delete Admin Successful.</span>
          </div>
        </div>
      )}
      {deleteadmin === "error" && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Delete Admin Failed..</span>
          </div>
        </div>
      )}
      {showDeleteAdminConfirm && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/20 flex items-center justify-center shadow-xl/30">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
            <h2 className="text-lg font-semibold mb-4">
              Confirm Admin Deletion
            </h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete selected Admin?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => pendingDeleteAdmin && pendingDeleteAdmin()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setShowDeleteAdminConfirm(false);
                  setPendingDeleteAdmin(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {signoutsuccess && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              Signout Successful! Redirecting...
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full">
        {/* Header */}
        <Header 
        title="Admin Management" 
        subtitle="Manage administrator accounts and access"
        show={show}
        setShow={setShow}
      />

        <div className="p-2 md:p-6">
          {/* Stats */}
          <Statscard
            housekeeperCount={housekeeperCount}
            adminCount={adminCount}
            filteredMembers={filteredMembers}
            darkMode={darkMode}
          />
          {/* Table */}
          <div
            className={`${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } rounded-xl shadow-sm border transition-colors duration-300`}
          >
            <div
              className={`p-4 md:p-6 border-b ${
                darkMode ? "border-gray-700" : "border-gray-100"
              } flex flex-col sm:flex-row sm:justify-between gap-4 flex-wrap`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <h2
                  className={`text-lg font-semibold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Admin
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      darkMode ? "text-gray-400" : "text-gray-400"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Search Admin Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-64 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                <div className="flex gap-2">
                  <RefreshButton
                    onClick={handleAddAdminClick}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add Admin</span>
                  </RefreshButton>
                  <RefreshButton
                    onClick={handleDeleteAdmins}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      selectedMembers.length > 0
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : `${
                            darkMode
                              ? "bg-gray-600 text-gray-400"
                              : "bg-gray-100 text-gray-400"
                          } cursor-not-allowed`
                    }`}
                    disabled={selectedMembers.length === 0}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Delete</span>
                  </RefreshButton>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[350px] sm:min-w-[500px] md:min-w-[600px]">
                <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedMembers.length === filteredMembers.length &&
                          filteredMembers.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    {["Member", "Role", "Status", "Last Login"].map((title) => (
                      <th
                        key={title}
                        className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                          darkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } divide-y ${
                    darkMode ? "divide-gray-700" : "divide-gray-200"
                  }`}
                >
                  {filteredMembers.map((m) => (
                    <tr
                      key={m._id}
                      className={
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                      }
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(m._id)}
                          onChange={() => handleMemberSelect(m._id)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`text-sm font-medium ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {m.name}
                        </div>
                        <div
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {m.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {m.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              m.login_status === "online"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              m.login_status === "online"
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {m.login_status}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        } flex items-center gap-2 mt-3`}
                      >
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
                <Shield
                  className={`mx-auto w-12 h-12 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                />
                <p
                  className={`mt-2 text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No admins found
                </p>
              </div>
            )}

            <div
              className={`px-4 md:px-6 py-4 border-t ${
                darkMode
                  ? "border-gray-700 bg-gray-700"
                  : "border-gray-100 bg-gray-50"
              } transition-colors duration-300`}
            >
              <p
                className={`text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Updated Real-Time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Superadmin;