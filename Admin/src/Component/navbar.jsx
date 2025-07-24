import RefreshButton from "../utils/refreshToken";

function Navbar({ 
  navigate, 
  toggleDropdown1, 
  openMenu1, 
  handleSizeNavigate, 
  handleNavigateByRole, 
  timeString, 
  dateString 
}) {
  return (
    <nav className='shadow-md p-6 items-center md:flex justify-between bg-slate-800 text-white sticky top-0 z-40'>
      <div className="md:text-2xl text-xl underline underline-offset-10">Conference Room</div>
      <ul className='flex text-center md:ml-5 max-md:mb-10 max-md:mt-10'>
        <RefreshButton className='mr-5 cursor-pointer hover:text-gray-300' onClick={() => navigate('/admin/api')}>Home</RefreshButton>
        <li className='md:mr-5 lg:mx-5 cursor-pointer hover:text-gray-300' onClick={toggleDropdown1}>Size Room {openMenu1 ? '▴' : '▾'}
          {openMenu1 && (
            <ul className="absolute mt-2 w-25 bg-blue-700 rounded-md shadow-lg z-10">
              <RefreshButton 
                className="px-6.5 py-2 hover:bg-blue-400 rounded-md cursor-pointer"
                onClick={() => handleSizeNavigate(2)}
              >
                Size S
              </RefreshButton>
              <RefreshButton 
                className="px-6 py-2 hover:bg-blue-400  rounded-md cursor-pointer"
                onClick={() => handleSizeNavigate(4)}
              >
                Size M
              </RefreshButton>
              <RefreshButton 
                className="px-6.5 py-2 hover:bg-blue-400  rounded-md cursor-pointer"
                onClick={() => handleSizeNavigate(6)}
              >
                Size L
              </RefreshButton>
            </ul>
          )}
        </li>
        <RefreshButton>
          <h1 className='cursor-pointer hover:text-gray-300' onClick={handleNavigateByRole}>Management</h1>
        </RefreshButton>
      </ul>
      <div className=' max-md:flex'>
        <h2 className='md:text-2xl max-md:mr-5'>{timeString}</h2>
        <h4 className=''>{dateString}</h4> 
      </div>
    </nav>
  );
}

export default Navbar;