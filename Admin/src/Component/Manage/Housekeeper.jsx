import React, { useState, useRef, useEffect, useContext } from "react";
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
  Loader2,
  Sun,
  Moon,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { DarkModeContext } from "../Context/DarkModeContext"; // Adjust the import path as necessary
import { useProfile } from "../Context/ProfileContext";
import RefreshButton from "../../utils/refreshToken"; // Adjust the import path as necessary
import Statscard from "../Statscard";
import Header from "../Header";
import useUserData from "../../hooks/useUserData";

function Housekeeper() {
  // ใช้ custom hook สำหรับจัดการ user data
  const {
    housekeepers,
    admins,
    allUsers,
    adminCount,
    housekeeperCount,
    isLoading: userDataLoading,
    error: userDataError,
    refreshData
  } = useUserData();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newPassword, setNewPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinerr, setPinerr] = useState("");
  const [createhousekeeper, setCreatehousekeeper] = useState("");
  const [deletehousekeeper, setDeletehousekeeper] = useState("");
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // ใช้เก็บ callback ลบจริง
  const [pinTargetName, setPinTargetName] = useState("");
  const [show, setShow] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [statusPopup, setStatusPopup] = useState(null);
  const [housekeeper, setHousekeeper] = useState([]);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    pin: "",
    role: "Housekeeper",
  });
  const [loading, setLoading] = useState(true); // เพิ่ม loading state สำหรับหน้า
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);
  const { profile } = useProfile(); // ใช้ profile จาก Context
  const [visibleRow, setVisibleRow] = useState(null); // เก็บ index หรือ id ของ row ที่เปิดอยู่

  const togglePin = (rowId) => {
    setVisibleRow((prev) => (prev === rowId ? null : rowId));
  };
  
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

  // filter สำหรับค้นหา housekeeper
  const Housekeepermem = allUsers.filter((user) => user.role === "Housekeeper");

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
      setSelectedMembers(
        filteredMembers.map((h) => ({ id: h._id, name: h.name }))
      ); // select all
    }
  };

  const handleSelectHousekeeper = (housekeeper) => {
    setSelectedMembers((prev) => {
      const exists = prev.find((h) => h.id === housekeeper._id);
      if (exists) {
        // ถ้ามีอยู่แล้ว ให้เอาออก
        return prev.filter((h) => h.id !== housekeeper._id);
      } else {
        // ถ้ายังไม่มี ให้เพิ่มเข้าไป
        return [...prev, { id: housekeeper._id, name: housekeeper.name }];
      }
    });
  };

  const handleChangePin = async () => {
    if (newPin.length !== 4) {
      setStatusPopup("error");
      setMessage("Please enter a 4-digit PIN");
      setTimeout(() => {
        setStatusPopup(null);
      }, 3000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        "/api1/account/edithousekeeper",
        { newpin: newPin, name: pinTargetName }, // สมมติว่าใช้ name สำหรับระบุตัวผู้ใช้
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 200) {
        setMessage(res.data.message || "PIN updated successfully");
        setPinerr("success");
        setTimeout(() => {
          setPinerr(null);
          setShowPinModal(false);
          setNewPin("");
          setConfirmPin("");
          setPinTargetName("");
        }, 2000);
      }
    } catch (error) {
      const messageFromBackend =
        error.res?.data?.message || "Failed to update PIN. Please try again.";
      setMessage(messageFromBackend);
      setPinerr("error");
      setTimeout(() => {
        setPinerr(null);
        setShowPinModal(false);
        setNewPin("");
        setConfirmPin("");
        setPinTargetName("");
      }, 3000);
    }
  };

  const handleAddMember = async () => {
    if (newMember.pin.length !== 4) {
      setStatusPopup("error");
      setMessage("Please enter a 4-digit PIN");
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
        "/api1/account/createhousekeeper",
        {
          name: newMember.name.trim(),
          pin: newMember.pin.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      const createdMember = response.data;

      setHousekeeper((prev) => [
        ...prev,
        {
          id: createdMember._id || prev.length + 1, // ใช้ _id ถ้า backend ส่งกลับ
          name: createdMember.name,
          role: createdMember.role || "Housekeeper", // fallback role เผื่อ backend ไม่ส่งกลับ
          status: "Offline",
          lastLogin: "N/A",
        },
      ]);
      setMessage(response.data.message);
      setCreatehousekeeper("success");

      setTimeout(() => {
        setCreatehousekeeper(null);
        setShowModal(false);
        setNewMember({ name: "", pin: "", role: "Housekeeper" });
      }, 2000);
    } catch (error) {
      console.error(
        "Error creating housekeeper:",
        error.response?.data || error.message
      );
      setMessage(error.response?.data?.message);
      setCreatehousekeeper("error");

      setTimeout(() => {
        setCreatehousekeeper(null);
      }, 2000);
    }
  };

  const handleDeleteHousekeepers = () => {
    if (selectedMembers.length === 0) {
      alert("Please select at least one housekeeper.");
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
        await axios.delete(`/api1/account/deletehousekeeper`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { id: member.id },
          withCredentials: true,
        });
      }

      setHousekeeper((prev) =>
        prev.filter((h) => !selectedMembers.some((m) => m.id === h._id))
      );
      setSelectedMembers([]);
      setDeletehousekeeper("success");
    } catch (error) {
      console.error("Delete failed:", error);
      setDeletehousekeeper("error");
    } finally {
      setShowDeleteConfirm(false);
      setPendingDelete(null);
      setTimeout(() => setDeletehousekeeper(null), 3000);
    }
  };

  useEffect(() => {
    if (profile) {
      console.log("Profile state updated:", profile);
    }
  }, [profile]);

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
            {userDataLoading ? "Loading user data..." : "Please wait while we prepare housekeeper management"}
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
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      } flex flex-col md:flex-row font-display`}
    >
      {showPinModal && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-gray-300/30 flex items-center justify-center">
          <div
            className={`${
              darkMode ? "bg-gray-800 text-white" : "bg-white"
            } p-6 rounded-xl shadow-lg w-96`}
          >
            <h2
              className={`text-lg font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Change PIN
            </h2>

            <div className="mb-4">
              <label
                className={`block text-sm mb-1 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Name
              </label>
              <div
                className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-100 border-gray-300 text-gray-800"
                }`}
              >
                {pinTargetName || "-"}
              </div>
            </div>

            <div className="mb-6">
              <label
                className={`block text-sm mb-1 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                New PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  maxLength="4"
                  inputMode="numeric"
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring focus:ring-blue-200 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "border-gray-300"
                  }`}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 hover:bg-opacity-10 rounded-r-md transition-colors"
                >
                  {showPin ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <RefreshButton
                onClick={() => {
                  setShowPinModal(false);
                  setNewPin("");
                  setConfirmPin("");
                  setPinTargetName("");
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
                onClick={handleChangePin}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm
              </RefreshButton>
            </div>
          </div>
        </div>
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
      {pinerr == "success" && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}
      {pinerr == "error" && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}
      {createhousekeeper === "success" && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{message}.</span>
          </div>
        </div>
      )}
      {createhousekeeper == "error" && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}
      {deletehousekeeper === "success" && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Delete Housekeeper Successful.</span>
          </div>
        </div>
      )}
      {deletehousekeeper === "error" && (
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
            <h2 className="text-lg text-gray-700 font-semibold mb-4">
              Confirm Deletion
            </h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete selected housekeepers?
            </p>
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

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Header
          title="Housekeeper Management"
          subtitle="Manage housekeepers and access levels"
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
            } rounded-xl shadow-sm border`}
          >
            <div
              className={`p-4 md:p-6 border-b ${
                darkMode ? "border-gray-700" : "border-gray-100"
              } flex flex-col sm:flex-row sm:justify-between gap-4 flex-wrap`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <h2
                  className={`text-lg font-semibold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Housekeeper
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search housekeepers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-64 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                <div className="flex gap-2">
                  <RefreshButton
                    onClick={() => {
                      setShowModal(true);
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
                      selectedMembers.length > 0
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : `${
                            darkMode
                              ? "bg-gray-600 text-gray-400"
                              : "bg-gray-100 text-gray-400"
                          } cursor-not-allowed`
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </RefreshButton>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table
                className={`w-full min-w-[450px] sm:min-w-[500px] md:min-w-[600px]`}
              >
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
                    {["Member", "Role", "Pin", "Action"].map((title) => (
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
                    darkMode
                      ? "bg-gray-800 divide-gray-700 text-white"
                      : "bg-white divide-gray-200 text-gray-900"
                  } divide-y`}
                >
                  {filteredMembers.map((h) => (
                    <tr
                      key={h._id}
                      className={`${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedMembers.some((m) => m.id === h._id)}
                          onChange={() => handleSelectHousekeeper(h)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`text-sm font-medium ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {h.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {h.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center pr-2 py-0.5 rounded-full text-base font-medium"
                          style={{ width: "60px" }} // กำหนดความกว้างคงที่
                        >
                          {visibleRow === h._id ? h.pin : "● ● ● ●"}
                        </span>
                        <button
                          onClick={() => togglePin(h._id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {visibleRow === h._id ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
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
                <UserCheck
                  className={`mx-auto w-12 h-12 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                />
                <p
                  className={`mt-2 text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No housekeepers found
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
                className={`text-sm text-center ${
                  darkMode ? "text-gray-300" : "text-gray-500"
                }`}
              >
                Updated Real-Time
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-gray-300/30 flex items-center justify-center">
          <div
            className={`${
              darkMode ? "bg-gray-800 text-white" : "bg-white"
            } rounded-xl shadow-lg w-full max-w-md p-4 md:p-6`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${
                darkMode ? "text-white" : ""
              }`}
            >
              Add Housekeeper
            </h2>

            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label
                  className={`block text-sm font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
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
                  className={`mt-1 block w-full p-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "border-gray-300"
                  }`}
                />
              </div>

              {/* Pin Field */}
              <div>
                <label
                  className={`block text-sm font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Pin
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength="4"
                    value={newMember.pin}
                    // onChange={(e) =>
                    //   setNewMember({
                    //     ...newMember,
                    //     pin: e.target.value.replace(/\D/g, '')
                    //   })
                    // }
                    onChange={(e) => {
                      const value = e.target.value;
                      // ถ้าไม่ใช่ตัวเลข → แสดง popup
                      if (!/^\d*$/.test(value)) {
                        setStatusPopup("error");
                        setMessage("Please enter numbers only (0-9)");
                        setTimeout(() => {
                          setStatusPopup(null);
                        }, 2000);
                        return; // หยุดไม่ให้เซ็ตค่า
                      }

                      setNewMember({ ...newMember, pin: value });
                    }}
                    className={`block w-full p-2 pr-10 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300"
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
                  darkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
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
