import React, { useState } from 'react'
import { RoomPage } from './Component/Admin'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Available from './Component/Available'
import Unavailable from './Component/Unavailable'
import './App.css'
import RoomPages from './Component/Roompages'
import { Verify } from './Component/Authen/Frontend/Login'
import ForgotPasswordFlow from './Component/Authen/Frontend/ForgetPasswordFlow'
import RoomSize from './Component/Roomsize'
import Protect from './Component/Authen/Frontend/Protect'
import LoginPage from './Component/Login'
import Account from './Component/Manage/Account'
import Housekeeper from './Component/Manage/Housekeeper'
import Log from './Component/Manage/Log'

function App() {
  const [isAuthenticated, setAuth] = useState(!!localStorage.getItem('token'));

  return (
     <Router>
      <Routes>
        <Route path='/' element={<Verify setAuth={setAuth} />} />
        <Route path='/login/ms' element={<Protect><LoginPage /></Protect>} />
        <Route path='/admin/api' element={
          <Protect>
          <RoomPage />
        </Protect>
        } 
          />
        <Route path='/room/:Room/:startdate/:enddate' element={
          <Protect><RoomPages /></Protect>} />
        <Route path='/Available' element={<Protect><Available key={location.key}/></Protect>} />
        <Route path='/Unavailable' element={<Protect><Unavailable /></Protect>} />
        <Route path='/roomsize/:size' element={<Protect><RoomSize /></Protect>} />
        <Route path='/forgot-password' element={<Protect><ForgotPasswordFlow /></Protect>} />
        <Route path='/account/admin' element={<Protect><Account /></Protect>} />
        <Route path='/account/housekeeper' element={<Protect><Housekeeper /></Protect>} />
        <Route path='/account/dashboard' element={<Protect><Log /></Protect>} />
    </Routes>
    </Router>
  )
}

export default App
