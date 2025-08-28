import React, { useState, useRef, useEffect, useContext } from "react";
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
  X,
  LayoutDashboard,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { DarkModeContext } from "../Context/DarkModeContext";
import RefreshButton from "../../utils/refreshToken";
import Header from "../Header";

function Log() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [logs, setLogs] = useState([]);
  const [show, setShow] = useState(false);
  const [profile, setProfile] = useState("");
  const [statusPopup, setStatusPopup] = useState(null);
  const [open, setOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true); // เพิ่ม loading state
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);

  // เพิ่ม useEffect สำหรับจัดการ loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // แสดง loading 1.5 วินาที

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/account/logsmonitoring", {
      withCredentials: true,
    });

    eventSource.addEventListener("Logsmonitoring", (event) => {
      console.log("Received Logsmonnitoring event:", event.data);

      try {
        const data = JSON.parse(event.data);

        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          console.warn("Unexpected data format:", data);
        }
      } catch (error) {
        console.error("Error parsing Logsmonnitoring event data:", error);
      }
    });

    setConnectionStatus("disconnected");

    eventSource.onopen = () => {
      console.log("SSE connection opened successfully");
      setConnectionStatus("connected");
    };
    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    console.log("Logs state updated:", logs);
    console.log("Number of logs:", logs.length);
  }, [logs]);

  const ITEMS_PER_PAGE = 10;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
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

  const filteredLogs = logs.filter((log) => {
    const message = log.message || log.Details || "";
    const source = log.source || log.role || "";
    const level = log.level || log.L_status || "";
    const id = log.user_Id ? log.user_Id.toString() : ""; // แปลง ObjectId เป็น string
    const timestamp = formatTimestamp(log.L_createdAt || log.timestamp); // เพิ่ม timestamp สำหรับ search

    const matchesSearch =
      message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      id.includes(searchTerm) ||
      timestamp.toLowerCase().includes(searchTerm.toLowerCase()); // เพิ่มการ search timestamp

    const matchesLevel = selectedLevel === "all" || level === selectedLevel;
    const matchesSource = selectedSource === "all" || source === selectedSource;

    return matchesSearch && matchesLevel && matchesSource;
  });

  // Sort filteredLogs by timestamp (latest first) before paginating
  const sortedFilteredLogs = [...filteredLogs].sort(
    (a, b) =>
      new Date(b.L_createdAt || b.timestamp) -
      new Date(a.L_createdAt || a.timestamp)
  );

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

  const paginatedLogs = sortedFilteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const sortedLogs = [...paginatedLogs].sort(
    (a, b) =>
      new Date(b.L_createdAt || b.timestamp) -
      new Date(a.L_createdAt || a.timestamp)
  );

  const uniqueSources = Array.from(
    new Set(logs.map((log) => log.source || log.role).filter(Boolean))
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (profile) {
      console.log("Profile state updated:", profile);
    }
  }, [profile]);

  // Loading Screen Component
  if (loading) {
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
            Please wait while we prepare your logs
          </p>
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

      {/* Main Content */}
      <div className="w-full">
        {/* Header */}
        <Header
          title="Dashboard"
          subtitle="Real-time system logs and monitoring"
          profile={profile}
          show={show}
          setShow={setShow}
        />

        <div className="p-2 md:p-6">
          {/* Log Monitoring Panel */}
          <div
            className={`${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } rounded-xl shadow-sm border transition-colors duration-300`}
          >
            {/* Header */}
            <div
              className={`p-4 md:p-6 border-b ${
                darkMode ? "border-gray-700" : "border-gray-100"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      connectionStatus == "connected"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    <Activity
                      className={`w-5 h-5 ${
                        connectionStatus == "connected"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h2
                      className={`text-lg font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      System Logs
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          connectionStatus === "connected"
                            ? "bg-green-500"
                            : connectionStatus === "disconnected" ||
                              connectionStatus === "reconnecting"
                            ? "bg-red-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <span
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Live Data : {connectionStatus}
                      </span>
                      <div
                        className={`h-4 w-px ${
                          darkMode ? "bg-gray-400" : "bg-black"
                        }`}
                      />
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Last updated: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div
              className={`p-4 md:p-6 border-b ${
                darkMode
                  ? "border-gray-700 bg-gray-700"
                  : "border-gray-100 bg-gray-50"
              } transition-colors duration-300`}
            >
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        darkMode ? "text-gray-400" : "text-gray-400"
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Search by Status, User ID, Role, Details, or Timestamp..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // รีเซ็ตกลับหน้า 1 เมื่อ search
                      }}
                      className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex max-sm:flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Server
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        darkMode ? "text-gray-400" : "text-gray-400"
                      }`}
                    />
                    <select
                      value={selectedSource}
                      onChange={(e) => {
                        setSelectedSource(e.target.value); // เปลี่ยน filter
                        setCurrentPage(1); // รีเซ็ตกลับหน้า 1
                      }}
                      className={`pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none min-w-full ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      <option value="all">Filter Role</option>
                      {uniqueSources.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                  </div>
                  <RefreshButton
                    onClick={() => {
                      setSelectedSource("all");
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    disabled={selectedSource === "all" && searchTerm === ""}
                    className={`px-7 py-2 border rounded-lg transition-colors duration-300 ${
                      selectedSource === "all" && searchTerm === ""
                        ? `cursor-not-allowed ${
                            darkMode
                              ? "bg-gray-600 border-gray-500 text-gray-400"
                              : "bg-gray-200 border-gray-300 text-gray-400"
                          }`
                        : `hover:bg-red-600 ${
                            darkMode
                              ? "bg-red-500 border-red-500 text-white"
                              : "bg-red-500 border-red-500 text-white"
                          }`
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <X className="w-4 h-4" />
                      Clear filter
                    </div>
                  </RefreshButton>
                  <div
                    className={`rounded-lg pl-10 pr-10 py-2 text-white ${
                      darkMode ? "bg-gray-600" : "bg-black"
                    }`}
                  >
                    Total Logs : {filteredLogs.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[800px]">
                <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Timestamp
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Role
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Details
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      User ID
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className={`px-6 py-8 text-center ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <Activity
                          className={`mx-auto w-8 h-8 mb-2 ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        />
                        <p>No logs Found</p>
                        <p className="text-xs">
                          Connection: {connectionStatus}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log, index) => (
                      <tr
                        key={log._id || index}
                        className={darkMode ? "border-gray-700" : ""}
                      >
                        <td
                          className={`px-6 py-4 text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-800"
                          }`}
                        >
                          {log.L_status || log.level || "N/A"}
                        </td>
                        <td
                          className={`px-6 py-4 text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {formatTimestamp(log.L_createdAt || log.timestamp)}
                        </td>
                        <td
                          className={`px-6 py-4 text-sm capitalize ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {log.role || log.source || "N/A"}
                        </td>
                        <td
                          className={`px-6 py-4 text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {log.Details || log.message || "N/A"}
                        </td>
                        <td
                          className={`px-6 py-4 text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {log.user_Id || log.userId || "N/A"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div
              className={`max-sm:flex justify-center items-center px-4 md:px-6 py-4 border-t ${
                darkMode
                  ? "border-gray-700 bg-gray-700"
                  : "border-gray-100 bg-gray-50"
              } transition-colors duration-300`}
            >
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
                <div className="flex justify-center">
                  <RefreshButton
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className={`px-3 py-1 mx-1 rounded disabled:opacity-50 ${
                      darkMode
                        ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  >
                    Prev
                  </RefreshButton>

                  <span
                    className={`px-3 py-1 mx-1 ${
                      darkMode ? "text-gray-300" : ""
                    }`}
                  >
                    {currentPage} / {totalPages}
                  </span>

                  <RefreshButton
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className={`px-3 py-1 mx-1 rounded disabled:opacity-50 ${
                      darkMode
                        ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  >
                    Next
                  </RefreshButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Log;