import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function AccountLayout({ darkMode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar darkMode={darkMode} />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
