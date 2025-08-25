// AuthContext.js - ปรับปรุงแล้ว
import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authStatus, setAuthStatus] = useState("checking"); // checking | authorized | unauthorized
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const [userData, setUserData] = useState(null);

  // ฟังก์ชันสำหรับปิด SSE connection
  const closeEventSource = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  }, [eventSource]);

  // ฟังก์ชันสำหรับ logout - กลับไปหน้าแรกเพื่อ login ใหม่
  const logout = useCallback(() => {
    closeEventSource();
    localStorage.removeItem("token");
    localStorage.removeItem("role"); // ลบ role ด้วย
    setAuthStatus("unauthorized");
    setUserData(null);
    setIsRedirecting(true);
    
    // Delay redirect เพื่อให้ UI update - กลับไปหน้าแรกเพื่อ login ใหม่
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
  }, [closeEventSource]);

  // ฟังก์ชันสำหรับ redirect ไป unauthorized
  const redirectToUnauthorized = useCallback(() => {
    closeEventSource();
    setAuthStatus("unauthorized");
    setIsRedirecting(true);
    
    setTimeout(() => {
      window.location.href = "/unauthorized";
    }, 100);
  }, [closeEventSource]);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const code = new URLSearchParams(window.location.search).get("code");

      // ถ้าไม่มี token ให้ redirect ไปหน้าแรกเพื่อ login
      if (!token) {
        setAuthStatus("unauthorized");
        setIsRedirecting(true);
        
        // ตรวจสอบว่าอยู่หน้าแรกหรือไม่ ถ้าไม่ใช่ให้ redirect กลับไปหน้าแรก
        const currentPath = window.location.pathname;
        if (currentPath !== '/') {
          setTimeout(() => {
            window.location.href = "/";
          }, 100);
        }
        return;
      }

      try {
        // สร้าง SSE connection
        const es = new EventSource(`/admin/sse?code=${code}`);
        setEventSource(es);

        // เมื่อเชื่อมต่อสำเร็จ
        es.onopen = () => {
          console.log("SSE connection established");
        };

        // รับข้อมูลจาก SSE
        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            
            // ถ้ามีข้อมูลห้องแสดงว่า authorized
            if (data.results) {
              setAuthStatus("authorized");
              setUserData(data.user || null);
            }
          } catch (err) {
            console.error("Error parsing SSE data:", err);
            setAuthStatus("unauthorized");
          }
        };

        // จัดการ force logout
        es.addEventListener("forceLogout", (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("Force logout received:", data.error);
            
            // แสดง alert หรือ notification ถ้าต้องการ
            if (data.error.includes("unauthorized") || data.error.includes("forbidden")) {
              alert("คุณไม่มีสิทธิ์เข้าใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ");
            }
            
            redirectToUnauthorized();
          } catch (err) {
            console.error("Error in forceLogout:", err);
            redirectToUnauthorized();
          }
        });

        // จัดการข้อผิดพลาด
        es.onerror = (err) => {
          console.error("SSE error:", err);
          
          // ตรวจสอบสถานะ connection
          if (es.readyState === EventSource.CLOSED) {
            const errorStatus = err.target?.status;
            
            if (errorStatus === 401 || errorStatus === 403) {
              redirectToUnauthorized();
            } else {
              // Error อื่นๆ (เช่น network error, token หมดอายุ) ให้กลับไปหน้าแรก
              setAuthStatus("unauthorized");
              setIsRedirecting(true);
              closeEventSource();
              
              setTimeout(() => {
                window.location.href = "/";
              }, 100);
            }
          }
        };

      } catch (error) {
        console.error("Error initializing auth:", error);
        logout();
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      closeEventSource();
    };
  }, []); // ลบ dependencies ออกเพื่อให้รันแค่ครั้งเดียว

  // ฟังก์ชันสำหรับ retry connection
  const retryConnection = useCallback(() => {
    setAuthStatus("checking");
    setIsRedirecting(false);
    
    const token = localStorage.getItem("token");
    
    if (!token) {
      // ถ้าไม่มี token ให้กลับไปหน้าแรก
      logout();
      return;
    }
    
    const code = new URLSearchParams(window.location.search).get("code");
    
    // Recreate connection
    const es = new EventSource(`/admin/sse?code=${code}`);
    setEventSource(es);
    
    // ทำซ้ำ logic เดิม...
  }, [logout]);

  const contextValue = {
    authStatus,
    isRedirecting,
    userData,
    logout,
    retryConnection,
    redirectToUnauthorized
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};