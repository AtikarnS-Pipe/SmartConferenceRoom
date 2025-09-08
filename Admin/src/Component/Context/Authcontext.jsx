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
    if (!token) {
      return false;
    }
    
    // ตรวจสอบ format ของ JWT
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return false;
    }
    
    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = decodedToken.exp - currentTime;
      
      // ⭐ เพิ่มบัฟเฟอร์ 30 วินาที เพื่อป้องกัน edge case
      return (decodedToken.exp - 30) > currentTime;
    } catch (error) {
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
    closeEventSource();
    setAuthStatus("unauthorized");
    setIsRedirecting(true);
    
    setTimeout(() => {
      window.location.href = "/admin/unauthorized";
    }, 100);
  }, [closeEventSource]);

  useEffect(() => {
    // Reset initialized flag เมื่อ path เปลี่ยนไปยังหน้า protected
    const currentPath = window.location.pathname;
    if (currentPath.includes('/admin/api') || currentPath.includes('/account/') || currentPath.includes('/room/')) {
      initialized.current = false;
    }
  }, [window.location.pathname]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const forceLogout = localStorage.getItem("forceLogout");
      const fullPath = window.location.pathname;
      const routerPath = fullPath.replace('/admin', '') || '/';
      const hasOAuthCode = new URLSearchParams(window.location.search).get("code");

      // ⭐ ตรวจสอบ forceLogout flag ก่อน
      if (forceLogout === "true") {
        localStorage.removeItem("forceLogout");
        localStorage.removeItem("unauthorizedReason");
        
        // ⭐ ถ้าอยู่หน้า unauthorized แล้ว ไม่ต้อง redirect อีก
        if (routerPath === "/unauthorized") {
          setAuthStatus("unauthorized");
          return;
        }
        
        setAuthStatus("unauthorized");
        setIsRedirecting(true);
        setTimeout(() => {
          window.location.href = "/admin/unauthorized";
        }, 100);
        return;
      }

      // ตรวจสอบ token validity
      const tokenValid = token ? isTokenValid(token) : false;

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
      
      // ✅ ถ้าอยู่หน้า public และมี token ที่ valid
      if (publicRouterPaths.includes(routerPath) && tokenValid && !isOAuthCallback) {
        setAuthStatus("authorized");
        setTimeout(() => {
          window.location.href = "/admin/admin/api";
        }, 100);
        return;
      }
      
      // ✅ ถ้าเป็น public page หรือ OAuth callback
      if (publicRouterPaths.includes(routerPath) || isOAuthCallback) {
        if (isOAuthCallback) {
          setAuthStatus("checking");
          
          // ⭐ สร้าง SSE connection ทันทีด้วย code parameter
          try {
            const es = new EventSource(`/api1/admin/sse?code=${hasOAuthCode}`);
            setEventSource(es);

            es.onopen = () => {
            };

            es.onmessage = (e) => {
              try {
                const data = JSON.parse(e.data);
                if (data.results) {
                  setAuthStatus("authorized");
                  setUserData(data.user || null);
                }
              } catch (err) {
                setAuthStatus("unauthorized");
              }
            };

            es.addEventListener("forceLogout", (event) => {
              try {
                const data = JSON.parse(event.data);
                
                // ⭐ ปิด EventSource ทันที
                es.close();
                setEventSource(null);
                
                // ⭐ ไม่ลบ localStorage แต่ mark ว่าเป็น unauthorized session
                localStorage.setItem("forceLogout", "true");
                localStorage.setItem("unauthorizedReason", data.error || "Access denied");
                
                const errorMsg = data.error ? data.error.toLowerCase() : "";
                if (errorMsg.includes("unauthorized") || errorMsg.includes("forbidden")) {
                  setAuthStatus("unauthorized");
                  setIsRedirecting(true);
                  
                  // ⭐ Redirect ทันทีโดยไม่ต้องรอ แล้วหยุด execution
                  window.location.replace("/admin/unauthorized");
                  return;
                } else {
                  setAuthStatus("unauthorized");
                  setIsRedirecting(true);
                  window.location.replace("/admin/unauthorized");
                  return;
                }
              } catch (err) {
                es.close();
                setEventSource(null);
                localStorage.setItem("forceLogout", "true");
                localStorage.setItem("unauthorizedReason", "Session error");
                setAuthStatus("unauthorized");
                setIsRedirecting(true);
                window.location.replace("/admin/unauthorized");
                return;
              }
            });

            es.addEventListener("error", (event) => {
              try {
                const data = JSON.parse(event.data);
                
                if (data.error && (data.error.includes("Please login again") || data.error.includes("OAuth code required"))) {
                  localStorage.setItem("emailUnauthorized", "true");
                  window.location.href = "/admin/unauthorized";
                } else {
                  window.location.href = "/";
                }
              } catch (err) {
                localStorage.setItem("emailUnauthorized", "true");
                window.location.href = "/admin/unauthorized";
              }
            });

            es.onerror = (err) => {
              setAuthStatus("unauthorized");
            };

          } catch (error) {
            window.location.href = "/";
          }
        } else {
          setAuthStatus("unauthorized");
        }
        return;
      }

        // ⭐ สำหรับหน้าที่ต้อง authenticate
        if (tokenValid) {
          setAuthStatus("authorized");
          
          // ⭐ เริ่ม SSE connection โดยไม่ส่ง code (ใช้ token ที่มีอยู่)
          try {
            const es = new EventSource(`/api1/admin/sse`);
            setEventSource(es);          es.onopen = () => {
          };

          es.onmessage = (e) => {
            try {
              const data = JSON.parse(e.data);
              if (data.results) {
                setAuthStatus("authorized");
                setUserData(data.user || null);
              }
            } catch (err) {
              // ⭐ ไม่ remove token ที่นี่ เพราะอาจเป็นแค่ SSE data error
              setAuthStatus("unauthorized");
            }
          };

          es.addEventListener("forceLogout", (event) => {
            try {
              const data = JSON.parse(event.data);
              
              // ⭐ ปิด EventSource ทันที
              es.close();
              setEventSource(null);
              
              // ⭐ ไม่ลบ localStorage แต่ mark ว่าเป็น unauthorized session
              localStorage.setItem("forceLogout", "true");
              localStorage.setItem("unauthorizedReason", data.error || "Access denied");
              
              setAuthStatus("unauthorized");
              setIsRedirecting(true);
              // ⭐ ใช้ replace แทน href เพื่อไม่ให้กลับมาได้
              window.location.replace("/admin/unauthorized");
            } catch (err) {
              es.close();
              setEventSource(null);
              localStorage.setItem("forceLogout", "true");
              localStorage.setItem("unauthorizedReason", "Session error");
              setAuthStatus("unauthorized");
              setIsRedirecting(true);
              window.location.replace("/admin/unauthorized");
            }
          });

          es.onerror = (err) => {
            if (es.readyState === EventSource.CLOSED) {
              const errorStatus = err.target?.status;
              
              if (errorStatus === 401 || errorStatus === 403) {
                // ⭐ ตรวจสอบ token อีกครั้งก่อน logout
                const currentToken = localStorage.getItem("token");
                if (!isTokenValid(currentToken)) {
                  logout();
                } else {
                  setAuthStatus("unauthorized");
                }
              } else {
                // ⭐ ไม่ logout ทันที เพราะอาจเป็นแค่ network error
                setAuthStatus("unauthorized");
              }
            }
          };

        } catch (error) {
          // ⭐ ไม่ logout ทันที เพราะอาจเป็นแค่ network error
        }
        return;
      }

      // ⭐ ถ้าไม่มี token หรือ token ไม่ valid และไม่ใช่ public page
      if (!token) {
        setAuthStatus("unauthorized");
        setIsRedirecting(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 100);
      } else {
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