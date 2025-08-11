import { useState, useEffect } from 'react'
import Roomcard from './Roomcard';
import Statscard from './Statscard';
import { useLocation } from 'react-router-dom';
import { useDarkMode } from './Context/DarkModeContext';
import { CircularProgress } from '@mui/material';
import Header from './Header';
import ButtonFilter from './ButtonFilter'; 

function RoomPage() {
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const [selectedSize, setSelectedSize] = useState("Room");
    const [events, setEvents] = useState([]);
    const [filteredRoom, setFilteredRoom] = useState([]);
    const [filterType, setFilterType] = useState(null); // "available" | "unavailable" | null
    const [filterStatus, setFilterStatus] = useState("all");
    const [emptyMessage, setEmptyMessage] = useState(""); // ✅ เพิ่ม state สำหรับข้อความว่าง
    const { darkMode } = useDarkMode();

    // ✅ เพิ่ม state สำหรับจำนวน housekeeper และ admin (ตัวอย่าง)
    const [housekeeperCount, setHousekeeperCount] = useState(0);
    const [adminCount, setAdminCount] = useState(0);

    useEffect(() => {
        const code = new URLSearchParams(location.search).get("code");
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "/admin/login";
            return;
        }

        const eventSource = new EventSource(`/admin/sse?code=${code}&token=${token}`);

        eventSource.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                setEvents(data.results);
                setLoading(false);
                
                // ✅ ถ้ามีข้อมูล housekeeper/admin จาก API ให้ update ตรงนี้
                // ตัวอย่าง:
                // setHousekeeperCount(data.housekeeperCount || 5);
                // setAdminCount(data.adminCount || 2);
                
                // หรือ hardcode ไว้ก่อนสำหรับทดสอบ
                setHousekeeperCount(5);
                setAdminCount(2);
            } catch (err) {
                console.error("Error parsing SSE data:", err);
                setLoading(false);
            }
        };

        // ✅ ดัก forceLogout
        eventSource.addEventListener("forceLogout", (event) => {
            try {
                const data = JSON.parse(event.data);
                alert(data.error);
                window.location.href = "/admin/login";
            } catch (err) {
                console.error("Error in forceLogout:", err);
            }
        });

        eventSource.onerror = (err) => {
            console.error("SSE error:", err);
            setLoading(false);
            eventSource.close();
            window.location.href = "/admin/login";
        };

        return () => {
            eventSource.close();
        };
    }, []);

    // ✅ FIX: เพิ่ม useEffect เพื่อจัดการกับการกลับมาจาก RoomSize
    useEffect(() => {
        // เช็คว่ามี clearFilters flag จาก navigation
        if (location.state?.clearFilters) {
            console.log("Clearing filters from navigation state");
            setFilteredRoom([]);
            setFilterType(null);
            setEmptyMessage("");
            setSelectedSize("Room");
            
            // Clear the state to prevent repeated clearing
            window.history.replaceState({}, '', location.pathname + location.search);
        }
        
        // จัดการ selectedSize จาก state
        if (location.state?.selectedSize) {
            setSelectedSize(location.state.selectedSize);
        }
    }, [location.state]);

    // ✅ อัพเดทฟังก์ชัน handleRoomFilter เพื่อรับ message
    const handleRoomFilter = (rooms, type, message = "") => {
        setFilteredRoom(rooms);
        setFilterType(type);
        setEmptyMessage(message); // ตั้งค่าข้อความว่าง
    };

    // ✅ ฟังก์ชันสำหรับเคลียร์ filter
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

    // ✅ FIX: ลดความซับซ้อนของ useEffect นี้
    useEffect(() => {
        // รีเซ็ต filter เฉพาะเมื่อไม่มี selectedSize จาก state และไม่มี clearFilters flag
        if (!location.state?.selectedSize && !location.state?.clearFilters) {
            setFilteredRoom([]);
            setFilterType(null);
            setEmptyMessage("");
            setSelectedSize("Room");
        }
    }, [location.pathname]); // เปลี่ยนจาก location.state เป็น location.pathname
        
    return (
      <div
        className={`font-display min-h-screen transition-colors duration-300 ${
          darkMode ? "bg-gray-700" : "bg-gray-50"
        }`}
      >
        <Header/>
        
        {/* ✅ แก้ไข HousekeeperStats ให้ส่ง props ครบถ้วน */}
          <Statscard 
            darkMode={darkMode}
            rooms={events}
            currentTime={new Date()}
            onFilter={handleRoomFilter}
            
            // ปิดการแสดง Housekeeper และ Admin cards
            showHousekeeper={false}
            showAdmin={false}
            showRoomStatus={true}  // แสดงเฉพาะ Room Status
          />
        
        <div className={`p-4 mx-2 rounded-3xl shadow-xl transition-colors duration-300 ${
                darkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`}>
            <div className='flex justify-between px-8 pb-4'>
            <h1 className={`text-xl font-semibold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-black'
            }`}>
                Meeting Room Status
            </h1>
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
              emptyMessage={emptyMessage} // ✅ ส่ง emptyMessage ไปด้วย
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