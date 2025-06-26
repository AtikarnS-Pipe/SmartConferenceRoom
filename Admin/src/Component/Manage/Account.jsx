import React, { useState } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  MoreHorizontal,
  MessageCircle,
  ChevronDown,
  Search,
  Plus,
  Trash2,
  Clock,
  Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Account() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const navigate = useNavigate();

  const allMembers = [
    { id: 1, name: 'Seen TCC', email: 'seen@tcc.com', role: 'Admin', status: 'Online', lastLogin: 'Jun 25, 12:33 PM' },
    { id: 2, name: 'Pipe TCC', email: 'pipe@tcc.com', role: 'Admin', status: 'Online', lastLogin: 'Jun 25, 12:33 PM' },
    { id: 3, name: 'Inkk', email: 'inkk@tcc.com', role: 'Admin', status: 'Offline', lastLogin: 'Jun 25, 12:33 PM' },
    { id: 4, name: 'Chitsanuchat yang', email: 'yang@tcc.com', role: 'Housekeeper', status: 'Online', lastLogin: 'Jun 25, 12:33 PM' },
    { id: 5, name: 'John', email: 'john@tcc.com', role: 'Housekeeper', status: 'Offline', lastLogin: 'Jun 25, 12:33 PM' }
  ];

  const admins = allMembers.filter(member => member.role === 'Admin');
  const filteredMembers = admins.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(member => member.id));
    }
  };

  const handleMemberSelect = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const totalUsers = allMembers.length;
  const adminCount = admins.length;
  const housekeeperCount = allMembers.filter(m => m.role === 'Housekeeper').length;

  return (
    <div className="min-h-screen bg-gray-50 flex font-display">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Conference Room</span>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left">
              <Home className="w-4 h-4" />
              <span className="text-sm">Home</span>
            </button>
          </div>
          <div className="mt-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3 px-3">Role Filter</p>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-blue-600 text-left">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Admin</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 text-left">
                <UserCheck className="w-4 h-4" />
                <span className="text-sm" onClick={()=>navigate('/account/housekeeper')}>Housekeeper</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
              <p className="text-gray-600 mt-1">Manage users and permission</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
              <button className="p-2 text-gray-400 hover:text-gray-600"><MessageCircle className="w-5 h-5" /></button>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <span className="text-sm font-medium">Chitsanuchat</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[['Total users', totalUsers, Users, 'green'],
              ['Admins', adminCount, Shield, 'purple'],
              ['Housekeepers', housekeeperCount, UserCheck, 'blue']].map(([label, count, Icon, color]) => (
              <div key={label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Member</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                  />
                </div>
                {/* <div className="flex gap-2">
                  <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    Add Member
                  </button>
                  <button
                    disabled={selectedMembers.length === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      selectedMembers.length > 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div> */}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    {['Member', 'Role', 'Status', 'Last Login'].map((title) => (
                      <th key={title} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => handleMemberSelect(member.id)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${member.status === 'Online' ? 'bg-green-400' : 'bg-red-400'}`} />
                          <span className={`text-sm ${member.status === 'Online' ? 'text-green-600' : 'text-red-600'}`}>
                            {member.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-2 mt-3">
                        <Clock className="w-4 h-4" />
                        {member.lastLogin}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <Shield className="mx-auto w-12 h-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No admins found</p>
              </div>
            )}

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-500">
                {filteredMembers.length} of {adminCount} results
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
