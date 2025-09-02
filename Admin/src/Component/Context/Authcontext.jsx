import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authStatus, setAuthStatus] = useState("checking");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const [userData, setUserData] = useState(null);
  const initialized = useRef(false);

  // ฟังก์ชันตรวจสอบ token validity - เพิ่ม debug และ error handling
  const isTokenValid = useCallback((token) => {
    console.log("🔍 Starting token validation...");
    
    if (!token) {
      console.log("❌ No token provided");
      return false;
    }
    
    // ตรวจสอบ format ของ JWT
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log("❌ Invalid JWT format - parts count:", tokenParts.length);
      return false;
    }
    
    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = decodedToken.exp - currentTime;
      
      console.log("🔍 Token validation details:", {
        tokenLength: token.length,
        exp: decodedToken.exp,
        current: currentTime,
        timeUntilExpiry: timeUntilExpiry,
        expiresIn: Math.floor(timeUntilExpiry / 60) + " minutes",
        isValid: decodedToken.exp > currentTime
      });
      
      // ⭐ เพิ่มบัฟเฟอร์ 30 วินาที เพื่อป้องกัน edge case
      return (decodedToken.exp - 30) > currentTime;
    } catch (error) {
      console.error("❌ Token decode error:", error);
      // ⭐ ไม่ควร remove token ที่นี่ เพราะอาจเป็น network/parsing error
      return false;
    }
  }, []);

  const closeEventSource = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  }, [eventSource]);

  const logout = useCallback(() => {
    console.log("🚪 Logout function called");
    closeEventSource();
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setAuthStatus("unauthorized");
    setUserData(null);
    setIsRedirecting(true);
    
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
  }, [closeEventSource]);

  const redirectToUnauthorized = useCallback(() => {
    console.log("🚨 Redirecting to unauthorized");
    closeEventSource();
    setAuthStatus("unauthorized");
    setIsRedirecting(true);
    
    setTimeout(() => {
      window.location.href = "/unauthorized";
    }, 100);
  }, [closeEventSource]);

  useEffect(() => {
    // Reset initialized flag เมื่อ path เปลี่ยนไปยังหน้า protected
    const currentPath = window.location.pathname;
    if (currentPath.includes('/admin/api') || currentPath.includes('/account/') || currentPath.includes('/room/')) {
      console.log("🛤️ Protected route detected, allowing re-initialization");
      initialized.current = false;
    }
  }, [window.location.pathname]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    const initializeAuth = async () => {
      console.log("🚀 AuthContext initialization started");
      
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const fullPath = window.location.pathname;
      const routerPath = fullPath.replace('/admin', '') || '/';
      const hasOAuthCode = new URLSearchParams(window.location.search).get("code");

      console.log("🔍 AuthContext debug info:", {
        fullPath,
        routerPath,
        hasToken: !!token,
        hasRole: !!role,
        hasOAuthCode: !!hasOAuthCode,
        tokenLength: token ? token.length : 0
      });

      // ตรวจสอบ token validity
      const tokenValid = token ? isTokenValid(token) : false;
      console.log("🔍 Token validation result:", tokenValid);

      // ⭐ หน้าที่ไม่ต้องมี token (public pages)
      const publicRouterPaths = [
        "/", 
        "/forgot-password", 
        "/unauthorized",
        "/login/ms"
      ];

      // ⭐ OAuth callback pages
      const isOAuthCallback = hasOAuthCode && (
        routerPath === "/admin/api" ||
        routerPath.includes("/admin/api") ||
        fullPath === "/admin/admin/api" ||
        fullPath.includes("/admin/admin/api")
      );
      
      console.log("🔍 Page classification:", {
        isPublicPage: publicRouterPaths.includes(routerPath),
        isOAuthCallback
      });
      
      // ✅ ถ้าอยู่หน้า public และมี token ที่ valid
      if (publicRouterPaths.includes(routerPath) && tokenValid && !isOAuthCallback) {
        console.log("✅ Valid token on public page, redirecting to Admin");
        setAuthStatus("authorized");
        setTimeout(() => {
          window.location.href = "/admin/admin/api";
        }, 100);
        return;
      }
      
      // ✅ ถ้าเป็น public page หรือ OAuth callback
      if (publicRouterPaths.includes(routerPath) || isOAuthCallback) {
        console.log("📄 Public page or OAuth callback detected");
        
        if (isOAuthCallback) {
          console.log("🔗 OAuth callback detected, processing...");
          setAuthStatus("checking");
          
          setTimeout(() => {
            const tokenAfterOAuth = localStorage.getItem("token");
            if (!isTokenValid(tokenAfterOAuth)) {
              console.log("❌ OAuth timeout or invalid token");
              setAuthStatus("unauthorized");
              // ใช้ internal route '/' เพื่อให้ basename="/admin" ทำงานถูกต้อง
              window.location.href = "/";
            } else {
              console.log("✅ OAuth token received, setting authorized");
              setAuthStatus("authorized");
            }
          }, 3000);
        } else {
          console.log("📄 Setting unauthorized for public page");
          setAuthStatus("unauthorized");
        }
        return;
      }

      // ✅ **สำคัญ**: สำหรับหน้าที่ต้อง authenticate
      if (tokenValid) {
        console.log("✅ Valid token on protected page, setting authorized");
        setAuthStatus("authorized");
        
        // ⭐ เริ่ม SSE connection
        try {
          const code = new URLSearchParams(window.location.search).get("code");
          const es = new EventSource(`/api1/admin/sse?code=${code || ''}`);
          setEventSource(es);

          es.onopen = () => {
            console.log("✅ SSE connection established");
          };

          es.onmessage = (e) => {
            try {
              const data = JSON.parse(e.data);
              if (data.results) {
                console.log("✅ SSE data received, confirming authorization");
                setAuthStatus("authorized");
                setUserData(data.user || null);
              }
            } catch (err) {
              console.error("❌ Error parsing SSE data:", err);
              // ⭐ ไม่ remove token ที่นี่ เพราะอาจเป็นแค่ SSE data error
              setAuthStatus("unauthorized");
            }
          };

          es.addEventListener("forceLogout", (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log("🚨 Force logout received:", data.error);
              
              if (data.error.includes("unauthorized") || data.error.includes("forbidden")) {
                alert("คุณไม่มีสิทธิ์เข้าใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ");
              }
              
              redirectToUnauthorized();
            } catch (err) {
              console.error("❌ Error in forceLogout:", err);
              redirectToUnauthorized();
            }
          });

          es.onerror = (err) => {
            console.error("❌ SSE error:", err);
            
            if (es.readyState === EventSource.CLOSED) {
              const errorStatus = err.target?.status;
              console.log("🔍 SSE closed with status:", errorStatus);
              
              if (errorStatus === 401 || errorStatus === 403) {
                console.log("🚨 Unauthorized SSE error - token may be invalid");
                // ⭐ ตรวจสอบ token อีกครั้งก่อน logout
                const currentToken = localStorage.getItem("token");
                if (!isTokenValid(currentToken)) {
                  console.log("🚨 Token confirmed invalid, logging out");
                  logout();
                } else {
                  console.log("⚠️ Token still valid, may be server issue");
                  setAuthStatus("unauthorized");
                }
              } else {
                console.log("🚨 General SSE error, keeping token but setting unauthorized");
                // ⭐ ไม่ logout ทันที เพราะอาจเป็นแค่ network error
                setAuthStatus("unauthorized");
              }
            }
          };

        } catch (error) {
          console.error("❌ Error initializing SSE:", error);
          // ⭐ ไม่ logout ทันที เพราะอาจเป็นแค่ network error
          console.log("⚠️ SSE initialization failed, but keeping token");
        }
        return;
      }

      // ⭐ ถ้าไม่มี token หรือ token ไม่ valid และไม่ใช่ public page
      if (!token) {
        console.log("❌ No token found, redirecting to login");
        setAuthStatus("unauthorized");
        setIsRedirecting(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 100);
      } else {
        console.log("❌ Invalid token found, removing and redirecting to login");
        // ⭐ แค่ clear token ที่นี่ ไม่ต้อง set status ซ้ำ
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setAuthStatus("unauthorized");
        setIsRedirecting(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 100);
      }
    };

    initializeAuth();
    return () => closeEventSource();
  }, [logout, redirectToUnauthorized, closeEventSource, isTokenValid]);

  const retryConnection = useCallback(() => {
    setAuthStatus("checking");
    setIsRedirecting(false);
    
    const token = localStorage.getItem("token");
    
    if (!isTokenValid(token)) {
      logout();
      return;
    }
    
    const code = new URLSearchParams(window.location.search).get("code");
    const es = new EventSource(`/api1/admin/sse?code=${code || ''}`);
    setEventSource(es);
  }, [logout, isTokenValid]);

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