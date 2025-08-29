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
      const hasOAuthCode = new URLSearchParams(window.location.search).get("code");

      console.log("🔍 AuthContext - Current path:", currentPath);
      console.log("🔍 AuthContext - Has OAuth code:", !!hasOAuthCode);
      console.log("🔍 AuthContext - Token exists:", !!token);

      // ⭐ หน้าที่ไม่ต้องมี token (public pages)
      const publicPages = [
        "/", 
        "/admin/", 
        "/admin/forgot-password", 
        "/admin/unauthorized",
        "/admin/login/ms" // ⭐ Microsoft OAuth redirect to backend
      ];

      // ⭐ หน้าที่เป็น OAuth callback (มี code parameter)
      const isOAuthCallback = hasOAuthCode && (
        currentPath === "/admin/admin/api" || // ⭐ Microsoft OAuth callback path
        currentPath === "/admin/api" ||       // ⭐ Alternative callback path
        currentPath.includes("/admin/api")    // ⭐ Any api path with OAuth code
      );
      
      // ⭐ ถ้าเป็น public page หรือ OAuth callback
      if (publicPages.includes(currentPath) || isOAuthCallback) {
        console.log("📄 Public page or OAuth callback detected");
        
        if (isOAuthCallback) {
          console.log("🔗 OAuth callback detected, processing...");
          // ⭐ ใน OAuth callback ให้รอสักครู่เพื่อให้ component ประมวลผล OAuth code
          setAuthStatus("checking");
          
          // ⭐ หลังจาก 3 วินาที ถ้ายังไม่มี token ให้ redirect กลับ login
          setTimeout(() => {
            const tokenAfterOAuth = localStorage.getItem("token");
            if (!tokenAfterOAuth) {
              console.log("❌ OAuth timeout, no token received");
              setAuthStatus("unauthorized");
              window.location.href = "/admin/";
            } else {
              console.log("✅ OAuth token received, setting authorized");
              setAuthStatus("authorized");
            }
          }, 3000);
        } else {
          setAuthStatus("unauthorized");
        }
        return;
      }

      // ⭐ ถ้าไม่มี token และไม่ใช่ public page หรือ OAuth callback
      if (!token) {
        console.log("❌ No token and not public/OAuth page, redirecting to login");
        setAuthStatus("unauthorized");
        setIsRedirecting(true);
        setTimeout(() => {
          window.location.href = "/admin/";
        }, 100);
        return;
      }

      try {
        // ⭐ เฉพาะหน้าที่มี token แล้วถึงจะสร้าง SSE
        const code = new URLSearchParams(window.location.search).get("code");
        const es = new EventSource(`/admin/sse?code=${code || ''}`);
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
  }, [logout, redirectToUnauthorized, closeEventSource]);

  const retryConnection = useCallback(() => {
    setAuthStatus("checking");
    setIsRedirecting(false);
    
    const token = localStorage.getItem("token");
    
    if (!token) {
      logout();
      return;
    }
    
    const code = new URLSearchParams(window.location.search).get("code");
    const es = new EventSource(`/admin/sse?code=${code || ''}`);
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
