import { useState, useEffect } from 'react'
import Roomcard from './Roomcard';
import Statscard from './Statscard';
import { useLocation } from 'react-router-dom';
import { useDarkMode } from './Context/DarkModeContext';
import { CircularProgress } from '@mui/material';
import Header from './Header';
import ButtonFilter from './ButtonFilter'; 
import { Users } from 'lucide-react';

function RoomPage() {
    const [loading, setLoading] = useState(true);
    const [authChecking, setAuthChecking] = useState(true);
    const [authStatus, setAuthStatus] = useState('checking'); // 'checking', 'authorized', 'unauthorized'
    const [isRedirecting, setIsRedirecting] = useState(false); // เพิ่ม state สำหรับ redirect
    const location = useLocation();
    const [selectedSize, setSelectedSize] = useState("Room");
    const [events, setEvents] = useState([]);
    const [filteredRoom, setFilteredRoom] = useState([]);
    const [filterType, setFilterType] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [emptyMessage, setEmptyMessage] = useState("");
    const { darkMode } = useDarkMode();

    useEffect(() => {
        const code = new URLSearchParams(location.search).get("code");
        const token = localStorage.getItem("token");

        if (!token) {
            setIsRedirecting(true);
            window.location.href = "/admin/login";
            return;
        }

        // เริ่มเชื่อมต่อ SSE
        const eventSource = new EventSource(`/admin/sse?code=${code}&token=${token}`);

        eventSource.onopen = () => {
            console.log("SSE connection opened");
            // ยังไม่ set authChecking เป็น false ทันที รอให้ได้ข้อมูลก่อน
        };

        eventSource.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                setEvents(data.results);
                setAuthStatus('authorized'); // ได้ข้อมูลแสดงว่า authorized
                setAuthChecking(false);
                setLoading(false);
            } catch (err) {
                console.error("Error parsing SSE data:", err);
                setLoading(false);
                setAuthChecking(false);
            }
        };

        // จัดการ forceLogout
        eventSource.addEventListener("forceLogout", (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("Force logout received:", data.error);
                
                setAuthStatus('unauthorized');
                setIsRedirecting(true);
                
                // Redirect to unauthorized page
                setTimeout(() => {
                    window.location.href = "/unauthorized";
                }, 100); // หน่วงเวลาเล็กน้อยเพื่อให้ state update
            } catch (err) {
                console.error("Error in forceLogout:", err);
                setAuthStatus('unauthorized');
                setIsRedirecting(true);
                setTimeout(() => {
                    window.location.href = "/unauthorized";
                }, 100);
            }
        });

        eventSource.onerror = (err) => {
            console.error("SSE error:", err);
            
            if (err.target.readyState === EventSource.CLOSED) {
                const errorResponse = err.target.status;
                if (errorResponse === 401 || errorResponse === 403) {
                    setAuthStatus('unauthorized');
                    setIsRedirecting(true);
                    setTimeout(() => {
                        window.location.href = "/unauthorized";
                    }, 100);
                    return;
                }
            }
            
            setLoading(false);
            setAuthChecking(false);
            eventSource.close();
            setIsRedirecting(true);
            window.location.href = "/admin/login";
        };

        return () => {
            eventSource.close();
        };
    }, []);

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

    // แสดง loading หรือ redirecting screen
    if (authChecking || isRedirecting || authStatus === 'unauthorized') {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
                darkMode ? "bg-gray-900" : "bg-gray-50"
            }`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className={`transition-colors duration-300 ${
                        darkMode ? "text-white" : "text-gray-600"
                    }`}>
                        {isRedirecting ? "Redirecting..." : 
                         authStatus === 'unauthorized' ? "Access denied..." :
                         "Checking permissions..."}
                    </p>
                </div>
            </div>
        );
    }

    // แสดงหน้าหลักเฉพาะเมื่อ authorized แล้วเท่านั้น
    if (authStatus !== 'authorized') {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
                darkMode ? "bg-gray-900" : "bg-gray-50"
            }`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className={`transition-colors duration-300 ${
                        darkMode ? "text-white" : "text-gray-600"
                    }`}>
                        Loading...
                    </p>
                </div>
            </div>
        );
    }
        
    return (
      <div
        className={`font-display min-h-screen transition-colors duration-300 ${
          darkMode ? "bg-gray-700" : "bg-gray-50"
        }`}
      >
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
                <h1
                  className={`text-lg font-medium transition-colors duration-300 ${
                    darkMode ? 'text-white' : 'text-black'
                  }`}
                >
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
            <div
              className={`flex justify-center py-20 gap-[5px] transition-colors duration-300 ${
                darkMode ? "text-white" : "text-black"
              }`}
            >
              <span>loading</span>
              <CircularProgress size="25px" />
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