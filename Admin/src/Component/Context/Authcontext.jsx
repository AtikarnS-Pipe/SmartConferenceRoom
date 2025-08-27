import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authStatus, setAuthStatus] = useState("checking");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const [userData, setUserData] = useState(null);
  const initialized = useRef(false);

  const closeEventSource = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  }, [eventSource]);

  const logout = useCallback(() => {
    closeEventSource();
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setAuthStatus("unauthorized");
    setUserData(null);
    setIsRedirecting(true);
    
    setTimeout(() => {
      window.location.href = "/admin/";
    }, 100);
  }, [closeEventSource]);

  const redirectToUnauthorized = useCallback(() => {
    closeEventSource();
    setAuthStatus("unauthorized");
    setIsRedirecting(true);
    
    setTimeout(() => {
      window.location.href = "/admin/unauthorized";
    }, 100);
  }, [closeEventSource]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const currentPath = window.location.pathname;

      // ⭐ สำคัญมาก: หน้าที่ไม่ต้องมี token (public pages)
      const publicPages = ["/", "/admin/", "/admin/forgot-password", "/admin/unauthorized"];
      
      if (publicPages.includes(currentPath)) {
        console.log("📄 Public page, setting unauthorized status only");
        setAuthStatus("unauthorized");
        return; // ⭐ ไม่ redirect เพราะเป็นหน้า public
      }

      // ⭐ ถ้าไม่มี token และไม่ใช่หน้า public ให้ redirect
      if (!token) {
        console.log("❌ No token and not public page, redirecting to login");
        setAuthStatus("unauthorized");
        setIsRedirecting(true);
        setTimeout(() => {
          window.location.href = "/admin/";
        }, 100);
        return;
      }

      try {
        // เฉพาะหน้าที่ต้องมี token ถึงจะสร้าง SSE
        const code = new URLSearchParams(window.location.search).get("code");
        const es = new EventSource(`/admin/sse?code=${code}`);
        setEventSource(es);

        es.onopen = () => {
          console.log("SSE connection established");
        };

        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.results) {
              setAuthStatus("authorized");
              setUserData(data.user || null);
            }
          } catch (err) {
            console.error("Error parsing SSE data:", err);
            setAuthStatus("unauthorized");
          }
        };

        es.addEventListener("forceLogout", (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("Force logout received:", data.error);
            
            if (data.error.includes("unauthorized") || data.error.includes("forbidden")) {
              alert("คุณไม่มีสิทธิ์เข้าใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ");
            }
            
            redirectToUnauthorized();
          } catch (err) {
            console.error("Error in forceLogout:", err);
            redirectToUnauthorized();
          }
        });

        es.onerror = (err) => {
          console.error("SSE error:", err);
          
          if (es.readyState === EventSource.CLOSED) {
            const errorStatus = err.target?.status;
            
            if (errorStatus === 401 || errorStatus === 403) {
              redirectToUnauthorized();
            } else {
              logout();
            }
          }
        };

      } catch (error) {
        console.error("Error initializing auth:", error);
        logout();
      }
    };

    initializeAuth();
    return () => closeEventSource();
  }, []);

  const retryConnection = useCallback(() => {
    setAuthStatus("checking");
    setIsRedirecting(false);
    
    const token = localStorage.getItem("token");
    
    if (!token) {
      logout();
      return;
    }
    
    const code = new URLSearchParams(window.location.search).get("code");
    const es = new EventSource(`/admin/sse?code=${code}`);
    setEventSource(es);
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
