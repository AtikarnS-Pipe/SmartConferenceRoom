import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook สำหรับจัดการข้อมูล Admin และ Housekeeper ผ่าน SSE
 * ป้องกันการสร้าง connection หลายตัวและจัดการ cleanup อย่างถูกต้อง
 */
export const useUserData = () => {
  const [housekeepers, setHousekeepers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ใช้ ref เพื่อเก็บ reference ของ EventSource connections
  const housekeeperSourceRef = useRef(null);
  const adminSourceRef = useRef(null);
  const connectionInitializedRef = useRef(false);
  const retryTimeoutRef = useRef(null);
  
  // ฟังก์ชันสำหรับปิด connections
  const closeConnections = () => {
    console.log('🧹 Closing SSE connections...');
    
    if (housekeeperSourceRef.current) {
      housekeeperSourceRef.current.close();
      housekeeperSourceRef.current = null;
    }
    
    if (adminSourceRef.current) {
      adminSourceRef.current.close();
      adminSourceRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    connectionInitializedRef.current = false;
  };
  
  // ฟังก์ชันสำหรับสร้าง SSE connections
  const initializeConnections = () => {
    // ป้องกันการสร้าง connection ซ้ำ
    if (connectionInitializedRef.current) {
      console.log('⚠️ SSE connections already initialized, skipping...');
      return;
    }
    
    console.log('🔌 Initializing SSE connections for user data...');
    setIsLoading(true);
    setError(null);
    
    try {
      // สร้าง connection สำหรับ Housekeeper data
      const housekeeperSource = new EventSource('/api1/account/housekeepers', {
        withCredentials: true,
      });
      
      // สร้าง connection สำหรับ Admin data
      const adminSource = new EventSource('/api1/account/member', {
        withCredentials: true,
      });
      
      housekeeperSourceRef.current = housekeeperSource;
      adminSourceRef.current = adminSource;
      
      // Event handlers สำหรับ Housekeeper data
      const handleHousekeeperList = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('👥 Housekeeper data received:', data);
          
          if (Array.isArray(data)) {
            setHousekeepers(data);
          }
        } catch (err) {
          console.error('❌ Error parsing housekeeper data:', err);
          setError('Failed to parse housekeeper data');
        }
      };
      
      // Event handlers สำหรับ Admin data
      const handleAdminList = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('👨‍💼 Admin data received:', data);
          
          if (Array.isArray(data)) {
            setAdmins(data);
          }
        } catch (err) {
          console.error('❌ Error parsing admin data:', err);
          setError('Failed to parse admin data');
        }
      };
      
      // ลงทะเบียน event listeners
      housekeeperSource.addEventListener('HousekeeperList', handleHousekeeperList);
      adminSource.addEventListener('adminList', handleAdminList);
      
      // Handle connection opened
      housekeeperSource.onopen = () => {
        console.log('✅ Housekeeper SSE connection opened');
      };
      
      adminSource.onopen = () => {
        console.log('✅ Admin SSE connection opened');
      };
      
      // Handle errors
      housekeeperSource.onerror = (err) => {
        console.error('❌ Housekeeper SSE error:', err);
        setError('Housekeeper connection failed');
        
        // ปิด connection และ retry
        if (housekeeperSourceRef.current) {
          housekeeperSourceRef.current.close();
          housekeeperSourceRef.current = null;
        }
        
        // Retry after 3 seconds
        retryTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Retrying housekeeper connection...');
          connectionInitializedRef.current = false;
          initializeConnections();
        }, 3000);
      };
      
      adminSource.onerror = (err) => {
        console.error('❌ Admin SSE error:', err);
        setError('Admin connection failed');
        
        // ปิด connection และ retry
        if (adminSourceRef.current) {
          adminSourceRef.current.close();
          adminSourceRef.current = null;
        }
        
        // Retry after 3 seconds
        retryTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Retrying admin connection...');
          connectionInitializedRef.current = false;
          initializeConnections();
        }, 3000);
      };
      
      connectionInitializedRef.current = true;
      
    } catch (err) {
      console.error('❌ Failed to initialize SSE connections:', err);
      setError('Failed to initialize connections');
      setIsLoading(false);
    }
  };
  
  // Effect สำหรับรวม allUsers และจัดการ loading state
  useEffect(() => {
    const combined = [...admins, ...housekeepers];
    setAllUsers(combined);
    
    // ถ้ามีข้อมูลอย่างน้อย 1 อย่าง ให้หยุด loading
    if (admins.length > 0 || housekeepers.length > 0) {
      setIsLoading(false);
    }
    
    console.log('📊 Combined user data updated:', {
      admins: admins.length,
      housekeepers: housekeepers.length,
      total: combined.length
    });
  }, [admins, housekeepers]);
  
  // Main effect สำหรับ initialize connections
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('❌ No token found, skipping SSE initialization');
      setError('No authentication token');
      setIsLoading(false);
      return;
    }
    
    // เริ่ม connections
    initializeConnections();
    
    // Cleanup เมื่อ component unmount
    return () => {
      console.log('🧹 useUserData cleanup...');
      closeConnections();
    };
  }, []); // Empty dependency array - initialize once
  
  // ฟังก์ชันสำหรับ manual refresh
  const refreshData = () => {
    console.log('🔄 Manual refresh requested...');
    closeConnections();
    setIsLoading(true);
    setError(null);
    
    // รอสักครู่แล้วสร้าง connection ใหม่
    setTimeout(() => {
      initializeConnections();
    }, 500);
  };
  
  // คำนวณ counts
  const adminCount = allUsers.filter(user => user.role === 'Admin').length;
  const housekeeperCount = allUsers.filter(user => user.role === 'Housekeeper').length;
  
  return {
    // Data
    housekeepers,
    admins,
    allUsers,
    
    // Counts
    adminCount,
    housekeeperCount,
    
    // States
    isLoading,
    error,
    
    // Actions
    refreshData,
    closeConnections
  };
};

export default useUserData;
