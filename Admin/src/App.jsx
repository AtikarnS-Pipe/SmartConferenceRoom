import React, { useState } from "react";
import RoomPage from "./Component/Admin";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import RoomPages from "./Component/Roompages";
import { AuthProvider } from "./Component/Context/Authcontext";
import { Verify } from "./Component/Authen/Frontend/Login";
import ForgotPasswordFlow from "./Component/Authen/Frontend/ForgetPasswordFlow";
import RoomSize from "./Component/Roomsize";
import Protect from "./Component/Authen/Frontend/Protect";
import LoginPage from "./Component/Login";
import Admin from "./Component/Manage/Admin";
import SuperAdminDashboard from "./Component/Manage/Superadmin";
import Housekeeper from "./Component/Manage/Housekeeper";
import Log from "./Component/Manage/Log";
import RoleGuard from "./Component/Authen/Frontend/Roleguard";
import { ThemeProvider } from "./Component/Context/DarkModeContext";
import AccountLayout from "./Component/Manage/Accountlayout"; // ✅ import Layout ที่ใช้ Sidebar
import UnauthorizedAccess from "./Component/Unauthorized";

function App() {
  const [isAuthenticated, setAuth] = useState(!!localStorage.getItem("token"));
  const darkMode = true;

  return (
    <ThemeProvider>
       <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Verify setAuth={setAuth} />} />
          <Route
            path="/login/ms"
            element={
              <Protect>
                <LoginPage />
              </Protect>
            }
          />


          <Route
            path="/forgot-password"
            element={
              <Protect>
                <ForgotPasswordFlow />
              </Protect>
            }
          />
          <Route path="/unauthorized" element={<UnauthorizedAccess />} /> 
          <Route element={<AccountLayout darkMode={darkMode} />}> 
            <Route path="/room/:Room/:startdate/:enddate" element={ <Protect><RoomPages /></Protect>}/>
            <Route path="/admin/api" element={<Protect><RoomPage /></Protect>} />
            <Route path="/roomsize/:size" element={<Protect><RoomSize /></Protect>} />
            <Route
              path="/account/admin"
              element={
                <Protect>
                  <RoleGuard allowedRoles={["Admin"]}>
                    <Admin />
                  </RoleGuard>
                </Protect>
              }
            />

            <Route
              path="/account/superadmin"
              element={
                <Protect>
                  <RoleGuard allowedRoles={["Superadmin"]}>
                    <SuperAdminDashboard />
                  </RoleGuard>
                </Protect>
              }
            />

            <Route
              path="/account/housekeeper"
              element={
                <Protect>
                  <Housekeeper />
                </Protect>
              }
            />
            <Route
              path="/account/dashboard"
              element={
                <Protect>
                  <Log />
                </Protect>
              }
            />
          </Route>
        </Routes>
      </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
