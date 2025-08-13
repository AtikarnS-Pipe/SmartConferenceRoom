import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  Home,
  Shield,
  UserCheck,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Crown,
  ChevronUp,
  ChevronDown,
  Key,
  LogOut,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";
import RefreshButton from "../../utils/refreshToken";
import axios from "axios";
import { useDarkMode } from '../Context/DarkModeContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { darkMode } = useDarkMode();

  // User profile states
  const [profile, setProfile] = useState(null);

  // Change PIN states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusPopup, setStatusPopup] = useState(null);
  const [message, setMessage] = useState("");

  // Get user info from localStorage (fallback)
  const userName = localStorage.getItem("name") || "User";
  const userRole = localStorage.getItem("role") || "Admin";

  // Fetch user profile on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get("/account/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProfile(res.data);
        console.log("Profile data fetched:", res.data);
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        // If API fails, we'll use localStorage values as fallback
      });
  }, []);

  // Helper function to check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Helper function to get button styles based on active state
  const getButtonStyles = (path) => {
    const active = isActive(path);
    const baseStyles = `w-full flex items-center rounded-lg text-left cursor-pointer transition-all duration-200`;

    if (active) {
      return `${baseStyles} ${
        isCollapsed ? "p-2 justify-center" : "gap-3 px-3 py-2"
      } bg-white text-blue-600`;
    }
    return `${baseStyles} ${
      isCollapsed ? "p-2 justify-center" : "gap-3 px-3 py-2"
    } text-slate-300 hover:${
      darkMode ? "bg-gray-700" : "bg-slate-700"
    } hover:text-white`;
  };

  // Helper function to get mobile button styles
  const getMobileButtonStyles = (path) => {
    const active = isActive(path);
    if (active) {
      return `flex flex-col items-center gap-1 p-3 rounded-lg bg-white text-blue-600 min-w-[60px] min-h-[60px] justify-center`;
    }
    return `flex flex-col items-center gap-1 p-3 rounded-lg text-slate-300 hover:${
      darkMode ? "bg-gray-700" : "bg-slate-700"
    } hover:text-white min-w-[60px] min-h-[60px] justify-center transition-all duration-200`;
  };

  // Get the current user's role-based path for highlighting
  const getRoleBasedPath = () => {
    const role = localStorage.getItem("role");
    if (role === "Superadmin") {
      return "/account/superadmin";
    } else if (role === "Admin") {
      return "/account/admin";
    }
    return "/account/admin"; // default fallback
  };

  const handleNavigateByRole = () => {
    const role = localStorage.getItem("role");
    if (role === "Superadmin") {
      navigate("/account/superadmin");
    } else if (role === "Admin") {
      navigate("/account/admin");
    } else {
      navigate("/");
    }
  };

  // Handle Change PIN
  const handleChangePIN = () => {
    setUserDropdownOpen(false);
    setTimeout(() => setShowPasswordModal(true), 100);
  };

  const handleSubmitPasswordChange = async () => {
    if (newPassword.length !== 4 || confirmPassword.length !== 4) {
      setStatusPopup("error");
      setMessage("Please enter a 4-digit PIN");
      setTimeout(() => {
        setStatusPopup(null);
      }, 3000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusPopup("error");
      setMessage("PINs do not match");
      setTimeout(() => {
        setStatusPopup(null);
      }, 3000);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await axios.patch(
        "/account/changeadminpw",
        { newpin: newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(res.data.message);
      setStatusPopup("success");

      setTimeout(() => {
        setStatusPopup(null);
        setShowPasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
        // Refresh profile to get updated PIN
        fetchProfile();
      }, 3000);
    } catch (error) {
      const messageFromBackend =
        error.response?.data?.message ||
        "PIN is already in use. Please try again.";

      console.error("Error updating PIN:", messageFromBackend);

      setMessage(messageFromBackend);
      setStatusPopup("error");

      setTimeout(() => {
        setStatusPopup(null);
        setNewPassword("");
        setConfirmPassword("");
      }, 3000);
    }
  };

  // Helper function to refetch profile
  const fetchProfile = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get("/account/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProfile(res.data);
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
      });
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/account/signout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setStatusPopup("success");
        setMessage("Sign out successful! Redirecting...");
        localStorage.clear();
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      console.error("Signout error:", error);
      setStatusPopup("error");
      setMessage("Failed to sign out. Please try again.");
      setTimeout(() => {
        setStatusPopup(null);
      }, 3000);
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Use profile data if available, otherwise fallback to localStorage
  const displayName = profile?.name || userName;
  const displayRole = profile?.role || userRole;

  const role = localStorage.getItem("role");

  const getRoleIcon = () => {
    switch (role) {
      case 'Superadmin':
        return (
          <div className="p-1 rounded-full bg-yellow-600">
            <Crown className="w-6 h-6 text-white-100" />
          </div>
        );
      case 'Admin':
        return (
          <div className="p-1 rounded-full bg-blue-600">
            <Shield className="w-6 h-6 text-gray-100" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Status Popups */}
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


      {/* Change PIN Modal */}
      {showPasswordModal && (
        <div className={`fixed inset-0 z-50 backdrop-blur-sm ${
          darkMode ? "bg-gray-300/30" : "bg-white/30"
        } flex items-center justify-center font-display`}>
          <div
            className={`${
              darkMode ? "bg-gray-800 text-white" : "bg-white"
            } p-6 rounded-xl shadow-lg w-full max-w-md mx-4`}
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
                New PIN
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  maxLength="4"
                  onChange={(e) => {
                    const value = e.target.value;
                    // อนุญาตเฉพาะตัวเลข
                    if (/^\d*$/.test(value)) {
                      setNewPassword(value);
                    } else {
                      setStatusPopup("error");
                      setMessage("Please enter numbers only (0-9)");
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
                  placeholder="Enter New Pin"
                />
                <RefreshButton
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute inset-y-0 right-0 flex items-center px-3 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {showNewPassword ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </RefreshButton>
              </div>
            </div>

            <div className="mb-6">
              <label
                className={`block text-sm mb-1 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Confirm New PIN
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  maxLength="4"
                  onChange={(e) => {
                    const value = e.target.value;
                    // อนุญาตเฉพาะตัวเลข
                    if (/^\d*$/.test(value)) {
                      setConfirmPassword(value);
                    } else {
                      setStatusPopup("error");
                      setMessage("Please enter numbers only (0-9)");
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
                  placeholder="Enter Confirm New Pin"
                />
                <RefreshButton
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute inset-y-0 right-0 flex items-center px-3 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {showConfirmPassword ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </RefreshButton>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <RefreshButton
                onClick={() => {
                  setNewPassword("");
                  setConfirmPassword("");
                  setShowPasswordModal(false);
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
                onClick={handleSubmitPasswordChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update PIN
              </RefreshButton>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="font-display">
        <div
          className={`hidden md:flex flex-col ${
            isCollapsed ? "w-16" : "w-64"
          } ${
            darkMode ? "bg-gray-800" : "bg-slate-800"
          } text-white sticky top-0 h-screen transition-all duration-300 ease-in-out`}
        >
          {/* Header */}
          <div
            className={`p-4 border-b ${
              darkMode ? "border-gray-700" : "border-slate-700"
            } flex items-center ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <span className="font-semibold text-lg">Conference Room</span>
              </div>
            )}

            {/* Toggle Button */}
            <RefreshButton
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1 rounded-md hover:bg-slate-700 transition-colors ${
                isCollapsed ? "mt-4" : ""
              }`}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-slate-300" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-slate-300" />
              )}
            </RefreshButton>
          </div>

          {/* Navigation */}
          <div
            className={`flex-1 p-4 ${
              isCollapsed ? "flex flex-col items-center gap-6" : ""
            } flex flex-col`}
          >
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshButton
                  className={getButtonStyles("/admin/api")}
                  onClick={() => navigate("/admin/api")}
                  title="Home"
                >
                  <Home
                    className={`w-4 h-4 ${
                      isActive("/admin/api") ? "text-blue-600" : "text-white"
                    }`}
                  />
                </RefreshButton>
                <RefreshButton
                  className={getButtonStyles(getRoleBasedPath())}
                  onClick={handleNavigateByRole}
                  title="Admin"
                >
                  <Shield
                    className={`w-4 h-4 ${
                      isActive(getRoleBasedPath())
                        ? "text-blue-600"
                        : "text-white"
                    }`}
                  />
                </RefreshButton>
                <RefreshButton
                  className={getButtonStyles("/account/housekeeper")}
                  onClick={() => navigate("/account/housekeeper")}
                  title="Housekeeper"
                >
                  <UserCheck
                    className={`w-4 h-4 ${
                      isActive("/account/housekeeper")
                        ? "text-blue-600"
                        : "text-white"
                    }`}
                  />
                </RefreshButton>
                <RefreshButton
                  className={getButtonStyles("/account/dashboard")}
                  onClick={() => navigate("/account/dashboard")}
                  title="Dashboard"
                >
                  <LayoutDashboard
                    className={`w-4 h-4 ${
                      isActive("/account/dashboard")
                        ? "text-blue-600"
                        : "text-white"
                    }`}
                  />
                </RefreshButton>
              </div>
            ) : (
              <div className="flex-1">
                <div className="space-y-2">
                  <RefreshButton
                    className={getButtonStyles("/admin/api")}
                    onClick={() => navigate("/admin/api")}
                    title={isCollapsed ? "Home" : ""}
                  >
                    <Home
                      className={`w-4 h-4 ${
                        isActive("/admin/api") ? "text-blue-600" : "text-white"
                      }`}
                    />
                    {!isCollapsed && <span className="text-sm">Home</span>}
                  </RefreshButton>
                </div>
                <div className="mt-6">
                  {!isCollapsed && (
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-slate-400"
                      } uppercase tracking-wider mb-3 px-3`}
                    >
                      Role Filter
                    </p>
                  )}
                  <div className="space-y-1">
                    <RefreshButton
                      className={getButtonStyles(getRoleBasedPath())}
                      onClick={handleNavigateByRole}
                      title={isCollapsed ? "Admin" : ""}
                    >
                      <Shield
                        className={`w-4 h-4 ${
                          isActive(getRoleBasedPath())
                            ? "text-blue-600"
                            : "text-white"
                        }`}
                      />
                      {!isCollapsed && <span className="text-sm">Admin</span>}
                    </RefreshButton>
                    <RefreshButton
                      className={getButtonStyles("/account/housekeeper")}
                      onClick={() => navigate("/account/housekeeper")}
                      title={isCollapsed ? "Housekeeper" : ""}
                    >
                      <UserCheck
                        className={`w-4 h-4 ${
                          isActive("/account/housekeeper")
                            ? "text-blue-600"
                            : "text-white"
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="text-sm">Housekeeper</span>
                      )}
                    </RefreshButton>
                    {!isCollapsed && (
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-slate-400"
                        } uppercase tracking-wider mb-3 px-3 mt-5`}
                      >
                        Monitoring
                      </p>
                    )}
                    <RefreshButton
                      className={getButtonStyles("/account/dashboard")}
                      onClick={() => navigate("/account/dashboard")}
                      title={isCollapsed ? "Dashboard" : ""}
                    >
                      <LayoutDashboard
                        className={`w-4 h-4 ${
                          isActive("/account/dashboard")
                            ? "text-blue-600"
                            : "text-white"
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="text-sm">Dashboard</span>
                      )}
                    </RefreshButton>
                  </div>
                </div>
              </div>
            )}

            {/* User Management Section */}
            <div
              className={`mt-auto border-t ${
                darkMode ? "border-gray-700" : "border-slate-700"
              } pt-4 relative`}
            >
              {isCollapsed ? (
                <div className="flex flex-col items-center">
                  <RefreshButton
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors relative"
                    title={`${displayName} (${displayRole})`}
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {getRoleIcon()}
                    </div>
                  </RefreshButton>

                  {/* Collapsed Dropdown - Icons Only */}
                  {userDropdownOpen && (
                    <div
                      className={`absolute bottom-full right-0 mb-2 ${
                        darkMode ? "bg-gray-700" : "bg-slate-700"
                      } rounded-lg shadow-lg border ${
                        darkMode ? "border-gray-600" : "border-slate-600"
                      } z-50`}
                    >
                      {/* Icon-only buttons */}
                      <div className="py-2 px-1">
                        <div className="flex flex-col justify-center gap-2">
                          <RefreshButton
                            onClick={handleChangePIN}
                            className="p-3 rounded-lg text-slate-300 hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center"
                            title="Change PIN"
                          >
                            <Key className="w-5 h-5" />
                          </RefreshButton>
                          <RefreshButton
                            onClick={handleSignOut}
                            className="p-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center"
                            title="Sign Out"
                          >
                            <LogOut className="w-5 h-5" />
                          </RefreshButton>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <RefreshButton
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="w-full p-3 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {getRoleIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-400">{displayRole}</p>
                    </div>
                    {userDropdownOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </RefreshButton>

                  {/* Expanded Dropdown - Full Text */}
                  {userDropdownOpen && (
                    <div
                      className={`absolute bottom-full left-0 right-0 mb-2 ${
                        darkMode ? "bg-gray-700" : "bg-slate-700"
                      } rounded-lg shadow-lg border ${
                        darkMode ? "border-gray-600" : "border-slate-600"
                      } z-50`}
                    >
                      <div className="py-2">
                        <RefreshButton
                          onClick={handleChangePIN}
                          className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-600 hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <Key className="w-4 h-4" />
                          Change PIN
                        </RefreshButton>
                        <RefreshButton
                          onClick={handleSignOut}
                          className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-red-600 hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </RefreshButton>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Bar */}
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 ${
            darkMode ? "bg-gray-800" : "bg-slate-800"
          } text-white border-t ${
            darkMode ? "border-gray-700" : "border-slate-700"
          } z-50`}
        >
          <div className="flex justify-around items-center py-2 px-4">
            <RefreshButton
              className={getMobileButtonStyles("/admin/api")}
              onClick={() => navigate("/admin/api")}
            >
              <Home
                className={`w-5 h-5 ${
                  isActive("/admin/api") ? "text-blue-600" : "text-white"
                }`}
              />
              <span className="text-xs">Home</span>
            </RefreshButton>

            <RefreshButton
              className={getMobileButtonStyles(getRoleBasedPath())}
              onClick={handleNavigateByRole}
            >
              <Shield
                className={`w-5 h-5 ${
                  isActive(getRoleBasedPath()) ? "text-blue-600" : "text-white"
                }`}
              />
              <span className="text-xs">Admin</span>
            </RefreshButton>

            <RefreshButton
              className={getMobileButtonStyles("/account/housekeeper")}
              onClick={() => navigate("/account/housekeeper")}
            >
              <UserCheck
                className={`w-5 h-5 ${
                  isActive("/account/housekeeper")
                    ? "text-blue-600"
                    : "text-white"
                }`}
              />
              <span className="text-xs">Housekeeper</span>
            </RefreshButton>

            <RefreshButton
              className={getMobileButtonStyles("/account/dashboard")}
              onClick={() => navigate("/account/dashboard")}
            >
              <LayoutDashboard
                className={`w-5 h-5 ${
                  isActive("/account/dashboard")
                    ? "text-blue-600"
                    : "text-white"
                }`}
              />
              <span className="text-xs">Dashboard</span>
            </RefreshButton>

            {/* Mobile User Menu */}
            <div className="relative">
              <RefreshButton
                className="flex flex-col items-center gap-1 p-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white min-w-[60px] min-h-[60px] justify-center transition-all duration-200"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {getUserInitials(displayName)}
                </div>
                <span className="text-xs">Profile</span>
              </RefreshButton>

              {/* Mobile Dropdown */}
              {userDropdownOpen && (
                <div
                  className={`absolute bottom-full right-0 mb-2 w-48 ${
                    darkMode ? "bg-gray-700" : "bg-slate-700"
                  } rounded-lg shadow-lg border ${
                    darkMode ? "border-gray-600" : "border-slate-600"
                  } z-50`}
                >
                  <div className="p-3 border-b border-slate-600">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {getUserInitials(displayName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-slate-400">{displayRole}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <RefreshButton
                      onClick={handleChangePIN}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-600 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <Key className="w-4 h-4" />
                      Change PIN
                    </RefreshButton>
                    <RefreshButton
                      onClick={handleSignOut}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-red-600 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </RefreshButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}