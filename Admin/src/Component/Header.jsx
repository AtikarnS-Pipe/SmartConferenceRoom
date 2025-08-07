import RefreshButton from "../utils/refreshToken";
import { useDarkMode } from "./Context/DarkModeContext";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";

function Header ({selectedSize, setSelectedSize, events, clearAllFilters}) {
    const [openMenu1, setOpenMenu1] = useState(false);
    const { darkMode, toggleDarkMode } = useDarkMode();
    const location = useLocation();
    const [currentTime, setCurrentTime] = useState(new Date());
    const isActive = (path) => location.pathname === path;
    const showSizeRoom = true;
    const toggleDropdown1 = () => setOpenMenu1(prev => !prev);
    const navigate = useNavigate();

    // ✅ Fix: อัพเดท selectedSize เมื่อเปลี่ยนหน้า
    useEffect(() => {
        if (location.pathname.includes('/roomsize/')) {
            const size = parseInt(location.pathname.split('/roomsize/')[1]);
            const label = size === 4 ? "S" : size === 6 ? "M" : size === 10 ? "L" : "Room";
            setSelectedSize(label);
        }
    }, [location.pathname, setSelectedSize]);

    const handleNavigateByRole = () => {
        const role = localStorage.getItem('role');
        console.log("Navigating based on role:", role);
        if (role === 'Superadmin') {
            navigate('/account/superadmin');
        } else if (role === 'Admin') {
            navigate('/account/admin');
        } else {
            navigate('/');
        }
    };

    const handleSizeNavigate = (peopleSize, label) => {
        // ข้อมูล icons แบบเดียวกับใน Admin.jsx
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

        // ✅ Fix: ไม่ reload เมื่อกด Size เดิม แต่จะ reset filter แทน
        if (window.location.pathname === `/roomsize/${peopleSize}`) {
            // ถ้าอยู่หน้าเดิม ให้ reset filter โดยการ navigate ใหม่
            console.log("Same page - resetting filters");
            navigate(`/roomsize/${peopleSize}`, {
                state: {
                    icons: iconClass,
                    peopleSize: peopleSize,
                    rooms: events,
                    selectedSize: label,
                    resetFilter: true // ✅ เพิ่ม flag สำหรับ reset filter
                },
                replace: true
            });
        } else {
            // Navigate ไปหน้าใหม่
            navigate(`/roomsize/${peopleSize}`, {
                state: {
                    icons: iconClass,
                    peopleSize: peopleSize,
                    rooms: events,
                    selectedSize: label
                },
                replace: true
            });
        }
        setOpenMenu1(false);
    };

    const handleSizeChange = (size) => {
        const label = size === 4 ? "S" : size === 6 ? "M" : size === 10 ? "L" : "Room";
        setSelectedSize(label); // ✅ อัพเดท state ทันที
        handleSizeNavigate(size, label);
        console.log("Size clicked:", size, "Label:", label);
    };
    
    // Time
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    
    const dateString = currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Bangkok'
    });

    const timeString = currentTime.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Bangkok'
    });
    
    return (
        <div className={`w-full h-20 ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-300 border-gray-200 border-b `}>
            <div className ="flex items-center justify-between px-5 h-full">
                <div >
                    <h1 className='text-black text-2xl font-bold'>Dashboard</h1>
                    <p className='text-gray-600  text-sm'>Updated in real-time</p>
                </div>

                <div className="flex justify-start items-center gap-5">
                    {showSizeRoom && (
                        <li className="mr-5 md:mr-5 lg:mx-5 relative flex items-center gap-1">
                            {/* Dropdown Button */}
                            <div
                                className={`text-black cursor-pointer transition-colors duration-300 whitespace-nowrap ${
                                    selectedSize !== "Room" ? "text-blue-400 border-b-2 border-blue-400" : "hover:text-blue-400"
                                }`}
                                onClick={toggleDropdown1}
                            >
                                Size {selectedSize} {openMenu1 ? "▴" : "▾"}
                            </div>
                        
                            {/* Dropdown Menu */}
                            {openMenu1 && (
                                <ul
                                className={`absolute left-0 top-full mt-1 w-25 rounded-md shadow-lg z-20 transition-colors duration-300 ${
                                    darkMode ? "bg-gray-700" : "bg-gray-800"
                                }`}
                                >
                                    <li>
                                        <RefreshButton
                                            className={`block w-full text-left px-6 py-2 text-white rounded-md cursor-pointer transition-colors duration-300 ${
                                                darkMode ? "hover:bg-gray-600" : "hover:bg-gray-700"
                                            }`}
                                            onClick={() => handleSizeChange(4)}
                                        >
                                            Size S
                                        </RefreshButton>
                                    </li>
                                    <li>
                                        <RefreshButton
                                            className={`block w-full text-left px-6 py-2 text-white rounded-md cursor-pointer transition-colors duration-300 ${
                                                darkMode ? "hover:bg-gray-600" : "hover:bg-gray-700"
                                            }`}
                                            onClick={() => handleSizeChange(6)}
                                        >
                                            Size M
                                        </RefreshButton>
                                    </li>
                                    <li>
                                        <RefreshButton
                                            className={`block w-full text-left px-6 py-2 text-white rounded-md cursor-pointer transition-colors duration-300 ${
                                                darkMode ? "hover:bg-gray-600" : "hover:bg-gray-700"
                                            }`}
                                            onClick={() => handleSizeChange(10)}
                                        >
                                            Size L
                                        </RefreshButton>
                                    </li>
                                </ul>
                            )}
                        </li>
                    )}
                    <RefreshButton 
                        className='text-black hover:text-blue-400 transition-colors duration-300' 
                        onClick={() => {
                            setSelectedSize("Room");
                            setOpenMenu1(false);
                            // ✅ เรียกฟังก์ชัน clearAllFilters ถ้ามี (สำหรับหน้า Admin)
                            if (clearAllFilters) {
                                clearAllFilters();
                            } else {
                                // ✅ Navigate กลับไปหน้าหลัก (สำหรับหน้า Roomsize)
                                navigate('/admin/api');
                            }
                        }}
                    >
                        Clear filter
                    </RefreshButton>
                    <RefreshButton 
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        onClick={toggleDarkMode}
                    >
                        {darkMode ? (
                            <div className="bg-yellow-500 p-2 rounded-full hover:bg-yellow-400 transition-colors duration-300">
                                <Sun className="w-4 h-4 text-white" />
                            </div>
                        ) : (
                            <div className="bg-blue-500 p-2 rounded-full hover:bg-blue-400 transition-colors duration-300">
                                <Moon className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </RefreshButton>
                    <div className="h-[30px] w-[1px] bg-black"></div>
                    <div className=" max-md:flex">
                        <h2 className=" text-black md:text-md max-md:mr-5 flex justify-end">
                            {timeString}
                        </h2>
                        <h4 className=" text-black md:text-md">{dateString}</h4>
                    </div>
                </div>
            </div> 
        </div>
    );
}

export default Header;