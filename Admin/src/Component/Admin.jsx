// Admin.jsx - พร้อมการป้องกัน infinite loop
import { useState, useEffect, useRef } from 'react'
import Roomcard from './Roomcard';
import Statscard from './Statscard';
import { useLocation } from 'react-router-dom';
import { useDarkMode } from './Context/DarkModeContext';
import { useAuth } from './Context/Authcontext';
import { CircularProgress } from '@mui/material';
import Header from './Header';
import ButtonFilter from './ButtonFilter'; 
import { Users } from 'lucide-react';

function RoomPage() {
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState("Room");
    const [events, setEvents] = useState([]);
    const [filteredRoom, setFilteredRoom] = useState([]);
    const [filterType, setFilterType] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [emptyMessage, setEmptyMessage] = useState("");
    const [roomDataSource, setRoomDataSource] = useState(null);
    
    const location = useLocation();
    const { darkMode } = useDarkMode();
    const { authStatus, isRedirecting, logout, retryConnection } = useAuth();
    
    // ใช้ ref เพื่อป้องกัน multiple connections
    const connectionInitialized = useRef(false);
    const retryCount = useRef(0);
    const maxRetries = 3;

    useEffect(() => {
        // Reset connection flag เมื่อ component mount
        connectionInitialized.current = false;
        retryCount.current = 0;
        
        return () => {
            if (roomDataSource) {
                roomDataSource.close();
            }
        };
    }, []);

    useEffect(() => {
        // ถ้า authStatus เป็น authorized และยังไม่ได้ initialize connection
        if (authStatus === "authorized" && !connectionInitialized.current) {
            initializeRoomData();
            connectionInitialized.current = true;
        } else if (authStatus === "unauthorized") {
            setLoading(false);
            // ปิด connection ถ้ามี
            if (roomDataSource) {
                roomDataSource.close();
                setRoomDataSource(null);
            }
            connectionInitialized.current = false;
        }
    }, [authStatus]);

    const initializeRoomData = () => {
        const code = new URLSearchParams(location.search).get("code");
        const token = localStorage.getItem("token");

        // เช็คซ้ำอีกครั้งก่อนสร้าง connection
        if (!token) {
            console.log("No token found, redirecting to home for login");
            window.location.href = "/";
            return;
        }

        // ปิด connection เดิมถ้ามี
        if (roomDataSource) {
            roomDataSource.close();
        }

        console.log("Initializing room data SSE connection");

        // สร้าง SSE connection สำหรับข้อมูลห้อง
        const es = new EventSource(`/api1/admin/sse`);
        setRoomDataSource(es);

        es.onopen = () => {
            console.log("Room data SSE connection opened successfully");
            retryCount.current = 0; // Reset retry count เมื่อเชื่อมต่อสำเร็จ
        };

        es.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                console.log("Received room data:", data);
                
                if (data.results) {
                    setEvents(data.results);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error parsing room data:", err);
                setLoading(false);
            }
        };

        es.onerror = (err) => {
            console.error("Room data SSE error:", err);
            setLoading(false);
            
            // ปิด connection
            es.close();
            setRoomDataSource(null);
            connectionInitialized.current = false;
            
            // จำกัดจำนวนครั้งในการ retry
            if (retryCount.current < maxRetries) {
                retryCount.current++;
                console.log(`Retrying connection (${retryCount.current}/${maxRetries})...`);
                
                // รอ 2 วินาทีก่อน retry
                setTimeout(() => {
                    if (authStatus === "authorized") {
                        initializeRoomData();
                    }
                }, 2000);
            } else {
                console.log("Max retries reached, redirecting to home for login");
                // ถ้า retry เกินจำนวนที่กำหนด ให้กลับไปหน้าแรกเพื่อ login ใหม่
                window.location.href = "/";
            }
        };
    };

    const handleRoomFilter = (rooms, type, message = "") => {
        setFilteredRoom(rooms);
        setFilterType(type);
        setEmptyMessage(message);
    };

    const clearAllFilters = () => {
        console.log("Clear all filters called from Admin");
        setFilteredRoom([]);
        setFilterType(null);
        setEmptyMessage("");
        setSelectedSize("Room");
    };

    const handleRetryConnection = () => {
        console.log("Manual retry requested");
        retryCount.current = 0;
        connectionInitialized.current = false;
        setLoading(true);
        
        if (authStatus === "authorized") {
            initializeRoomData();
            connectionInitialized.current = true;
        }
    };

    const iconClass = [
        {id:1, room: "1501", icons: 1, people: 4},
        {id:2, room: "1502", icons: 1, people: 4},
        {id:3, room: "1503", icons: 1, people: 4},
        {id:4, room: "1504", icons: 1, people: 4},
        {id:5, room: "1505", icons: 1, people: 6},
        {id:6, room: "1506", icons: 1, people: 6},
        {id:7, room: "1514", icons: 1, people: 10},
        {id:8, room: "1515", icons: 1, people: 10},
        {id:9, room: "1519", icons: 1, people: 4},
        {id:10, room: "1520", icons: 1, people: 4},
    ];

    // แสดง loading screen ขณะตรวจสอบสิทธิ์
    if (authStatus === "checking" || isRedirecting) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
                darkMode ? "bg-gray-900" : "bg-gray-50"
            }`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className={`transition-colors duration-300 ${
                        darkMode ? "text-white" : "text-gray-600"
                    }`}>
                        Checking permissions...
                    </p>
                </div>
            </div>
        );
    }

    // แสดงหน้า error ถ้าไม่มีสิทธิ์
    if (authStatus === "unauthorized") {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
                darkMode ? "bg-gray-900" : "bg-gray-50"
            }`}>
                <div className="text-center">
                    <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                        Access Denied
                    </h2>
                    <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        คุณไม่มีสิทธิ์เข้าใช้งานระบบนี้
                    </p>
                    <div className="space-x-2">
                        <button
                            onClick={() => window.location.href = "/"}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
                        >
                            เข้าสู่ระบบใหม่
                        </button>
                        <button
                            onClick={() => window.location.href = "/admin/api"}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
                        >
                            ลองใหม่
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`font-display min-h-screen transition-colors duration-300 ${
            darkMode ? "bg-gray-700" : "bg-gray-50"
        }`}>
            <Header/>
            
            <Statscard 
                darkMode={darkMode}
                rooms={events}
                currentTime={new Date()}
                onFilter={handleRoomFilter}
                showHousekeeper={false}
                showAdmin={false}
                showRoomStatus={true}
            />
            
            <div className={`pb-4 mx-[8px] md:mx-[24px] rounded-xl shadow-sm transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                <div className='flex gap-2 flex-col items-start md:flex-row md:items-center md:justify-between p-[24px]'>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <h1 className={`text-lg font-medium transition-colors duration-300 ${
                            darkMode ? 'text-white' : 'text-black'
                        }`}>
                            Meeting Room
                        </h1>
                    </div>
                    
                    <ButtonFilter 
                        onFilter={handleRoomFilter} 
                        events={events}
                        currentTime={new Date()}
                        selectedSize={selectedSize}
                        setSelectedSize={setSelectedSize}
                        clearAllFilters={clearAllFilters}
                        icons={iconClass}
                    />
                </div>

                {loading ? (
                    <div className={`flex flex-col items-center justify-center py-20 gap-4 transition-colors duration-300 ${
                        darkMode ? "text-white" : "text-black"
                    }`}>
                        <div className="flex items-center gap-2">
                            <span>Loading</span>
                            <CircularProgress size="25px" />
                        </div>
                        {retryCount.current > 0 && (
                            <div className="text-center">
                                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    Retry attempt: {retryCount.current}/{maxRetries}
                                </p>
                                {retryCount.current >= maxRetries && (
                                    <button
                                        onClick={handleRetryConnection}
                                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200"
                                    >
                                        Try Again
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <Roomcard
                        data={filteredRoom.length > 0 ? filteredRoom : events}
                        icons={iconClass}
                        filterType={filterType}
                        emptyMessage={emptyMessage}
                        selectedSize={selectedSize}
                        setSelectedSize={setSelectedSize}
                        events={events}
                        clearAllFilters={clearAllFilters}
                    />
                )}
            </div>
        </div>
    );
}

export default RoomPage;