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
  const loadingTimeoutRef = useRef(null);
  
  // ฟังก์ชันสำหรับปิด connections
  const closeConnections = () => {
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
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    connectionInitializedRef.current = false;
  };
  
  // ฟังก์ชันสำหรับสร้าง SSE connections
  const initializeConnections = () => {
    // ป้องกันการสร้าง connection ซ้ำ
    if (connectionInitializedRef.current) {
      return;
    }
    
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
          
          if (Array.isArray(data)) {
            setHousekeepers(data);
          }
        } catch (err) {
          setError('Failed to parse housekeeper data');
        }
      };
      
      // Event handlers สำหรับ Admin data
      const handleAdminList = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (Array.isArray(data)) {
            setAdmins(data);
          }
        } catch (err) {
          setError('Failed to parse admin data');
        }
      };
      
      // ลงทะเบียน event listeners
      housekeeperSource.addEventListener('HousekeeperList', handleHousekeeperList);
      adminSource.addEventListener('adminList', handleAdminList);
      
      // Handle connection opened
      housekeeperSource.onopen = () => {
      };
      
      adminSource.onopen = () => {
      };
      
      // Handle errors
      housekeeperSource.onerror = (err) => {
        setError('Housekeeper connection failed');
        
        // ปิด connection และ retry
        if (housekeeperSourceRef.current) {
          housekeeperSourceRef.current.close();
          housekeeperSourceRef.current = null;
        }
        
        // Retry after 3 seconds
        retryTimeoutRef.current = setTimeout(() => {
          connectionInitializedRef.current = false;
          initializeConnections();
        }, 3000);
      };
      
      adminSource.onerror = (err) => {
        setError('Admin connection failed');
        
        // ปิด connection และ retry
        if (adminSourceRef.current) {
          adminSourceRef.current.close();
          adminSourceRef.current = null;
        }
        
        // Retry after 3 seconds
        retryTimeoutRef.current = setTimeout(() => {
          connectionInitializedRef.current = false;
          initializeConnections();
        }, 3000);
      };
      
      connectionInitializedRef.current = true;
      
      // ตั้ง timeout หยุด loading หาก SSE ไม่ส่งข้อมูลมาภายใน 10 วินาที
      loadingTimeoutRef.current = setTimeout(() => {
        if (admins.length === 0 && housekeepers.length === 0) {
          setIsLoading(false);
          setError('Please wait while connecting to server... If this takes too long, try refreshing the page.');
        }
      }, 10000);
      
    } catch (err) {
      setError('Failed to initialize connections');
      setIsLoading(false);
    }
  };
  
  // Effect สำหรับรวม allUsers และจัดการ loading state
  useEffect(() => {
    const combined = [...admins, ...housekeepers];
    setAllUsers(combined);
    
    // ถ้ามีข้อมูลอย่างน้อย 1 อย่าง ให้หยุด loading และยกเลิก timeout
    if (admins.length > 0 || housekeepers.length > 0) {
      setIsLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [admins, housekeepers]);
  
  // Main effect สำหรับ initialize connections
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('No authentication token');
      setIsLoading(false);
      return;
    }
    
    // เริ่ม connections
    initializeConnections();
    
    // Cleanup เมื่อ component unmount
    return () => {
      closeConnections();
    };
  }, []); // Empty dependency array - initialize once
  
  // ฟังก์ชันสำหรับ manual refresh
  const refreshData = () => {
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
