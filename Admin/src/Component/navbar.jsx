import RefreshButton from "../utils/refreshToken";
import { useDarkMode } from "./Context/DarkModeContext";
import { Sun, Moon } from "lucide-react";
import { useRoomFilter } from './Layout'; // ✅ import hook จาก Layout
import { useState } from "react";
import { useLocation } from "react-router-dom";

function Navbar({
  navigate,       
  toggleDropdown1,
  openMenu1,
  handleSizeNavigate,
  handleNavigateByRole,
  timeString,
  dateString,
  showSizeRoom = true, // Add prop to control size room visibility
}) {
  const location = useLocation(); // ⬅️ ตรวจ path ปัจจุบัน
  const isActive = (path) => location.pathname === path;
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [selectedSize, setSelectedSize] = useState("Room");
  const { filteredRoom, onResetFilter, filterType } = useRoomFilter();

  const handleSizeChange = (size) => {
    const label = size === 4 ? "S" : size === 6 ? "M" : "L";
    setSelectedSize(label);
    handleSizeNavigate(size); // เรียก function จาก props
  };


  return (
    <div className="font-display">
    <nav className={`shadow-md p-6 items-center md:flex justify-between text-white sticky top-0 z-40 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-slate-800'
    }`}>
      <div className="md:text-2xl text-xl ">Conference Room</div>
      
      
      
      
      <ul className='flex items-center text-center md:ml-5 max-md:mb-10 max-md:mt-10'>
        <RefreshButton   className={`mr-5 cursor-pointer transition-colors duration-300 ${
          isActive("/admin/api") ? "text-yellow-400 border-b-2 border-yellow-400" : "hover:text-gray-300"
        }`} onClick={()=>{
          setSelectedSize("Room");  
          onResetFilter();
          navigate('/admin/api')
          ;}}
          >
            Home
          </RefreshButton>
  {showSizeRoom && (
  <li className="mr-5 md:mr-5 lg:mx-5 relative flex items-center gap-1">
    {/* Dropdown Button */}
    <div
      className={`cursor-pointer transition-colors duration-300 whitespace-nowrap ${
        selectedSize !== "Room" ? "text-yellow-400 border-b-2 border-yellow-400" : "hover:text-gray-300"
      }`}
      onClick={toggleDropdown1}
    >
      Size {selectedSize} {openMenu1 ? "▴" : "▾"}
    </div>


    {/* Dropdown Menu */}
    {openMenu1 && (
      <ul
      className={`absolute left-0 top-full mt-1 w-25 rounded-md shadow-lg z-20 transition-colors duration-300 ${
        darkMode ? "bg-blue-700" : "bg-gray-800"
      }`}
      >
        <RefreshButton
          className={`px-6.5 py-2 rounded-md cursor-pointer transition-colors duration-300 ${
            darkMode ? "hover:bg-blue-700" : "hover:bg-gray-400"
          }`}
          onClick={() => {
            handleSizeChange(4);
            setSelectedSize("S");
          }}
        >
          Size S
        </RefreshButton>
        <RefreshButton
          className={`px-6 py-2 rounded-md cursor-pointer transition-colors duration-300 ${
            darkMode ? "hover:bg-blue-700" : "hover:bg-gray-400"
          }`}
          onClick={() => {
            handleSizeChange(6);
            setSelectedSize("M");
          }}
        >
          Size M
        </RefreshButton>
        <RefreshButton
          className={`px-6.5 py-2 rounded-md cursor-pointer transition-colors duration-300 ${
            darkMode ? "hover:bg-blue-700" : "hover:bg-gray-400"
          }`}
          onClick={() => {
            handleSizeChange(10);
            setSelectedSize("L");
          }}
        >
          Size L
        </RefreshButton>
      </ul>
    )}
  </li>
)}
        <RefreshButton className="mr-5" onClick={handleNavigateByRole}>
          <h1
            className="cursor-pointer hover:text-gray-300"
          >
            Management
          </h1>
        </RefreshButton>
        <li>
        </li>
      </ul>


      {/*right side of navbar*/}
      <div className="flex justify-start items-center gap-5">
        <RefreshButton title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
           {darkMode ? (
              <div onClick={toggleDarkMode}   className="bg-blue-600 p-2 rounded-full">
                <Sun className="w-4 h-4" />
              </div>
            ) : (
              <div onClick={toggleDarkMode} className="bg-blue-400 p-2 rounded-full">
                <Moon className="w-4 h-4" />
              </div>
            )}
        </RefreshButton>
        <div className="h-[30px] w-[1px] bg-white"></div>
        <div className=" max-md:flex">
          <h2 className="md:text-sm max-md:mr-5 flex justify-end">
            {timeString}
          </h2>
          <h4 className="md:text-sm">{dateString}</h4>
        </div>
      </div>
    </nav>
    </div>  
  );
}

export default Navbar;
