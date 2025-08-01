import RefreshButton from "../utils/refreshToken";
import { useDarkMode } from './Context/DarkModeContext';
import { Sun, Moon } from 'lucide-react';

function Navbar({ 
  navigate, 
  toggleDropdown1, 
  openMenu1, 
  handleSizeNavigate, 
  handleNavigateByRole, 
  timeString, 
  dateString,
  showSizeRoom = true // Add prop to control size room visibility
}) {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="font-display">
    <nav className={`shadow-md p-6 items-center md:flex justify-between text-white sticky top-0 z-40 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-slate-800'
    }`}>
      <div className="md:text-2xl text-xl underline underline-offset-10">Conference Room</div>
      <ul className='flex items-center text-center md:ml-5 max-md:mb-10 max-md:mt-10'>
        <RefreshButton className='mr-5 cursor-pointer hover:text-gray-300' onClick={() => navigate('/admin/api')}>Home</RefreshButton>
        {showSizeRoom && (
          <li className='md:mr-5 lg:mx-5 cursor-pointer hover:text-gray-300' onClick={toggleDropdown1}>Size Room {openMenu1 ? '▴' : '▾'}
            {openMenu1 && (
              <ul className={`absolute mt-2 w-25 rounded-md shadow-lg z-10 transition-colors duration-300 ${
                darkMode ? 'bg-gray-800' : 'bg-blue-700'
              }`}>
                <RefreshButton 
                  className={`px-6.5 py-2 rounded-md cursor-pointer transition-colors duration-300 ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-400'
                  }`}
                  onClick={() => handleSizeNavigate(4)}
                >
                  Size S
                </RefreshButton>
                <RefreshButton 
                  className={`px-6 py-2 rounded-md cursor-pointer transition-colors duration-300 ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-400'
                  }`}
                  onClick={() => handleSizeNavigate(6)}
                >
                  Size M
                </RefreshButton>
                <RefreshButton 
                  className={`px-6.5 py-2 rounded-md cursor-pointer transition-colors duration-300 ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-400'
                  }`}
                  onClick={() => handleSizeNavigate(10)}
                >
                  Size L
                </RefreshButton>
              </ul>
            )}
          </li>
        )}
        <RefreshButton className="mr-5">
          <h1
            className="cursor-pointer hover:text-gray-300"
            onClick={handleNavigateByRole}
          >
            Management
          </h1>
        </RefreshButton>
        <li>
        </li>
      </ul>
      <div className="flex justify-center items-center gap-5">
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
          <h2 className="md:text-xs max-md:mr-5 flex justify-end">
            {timeString}
          </h2>
          <h4 className="md:text-xs">{dateString}</h4>
        </div>
      </div>
    </nav>
    </div>  
  );
}

export default Navbar;