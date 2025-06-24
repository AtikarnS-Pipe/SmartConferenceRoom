import React, { useState } from 'react'
import { RoomPage } from './Component/Admin'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Available from './Component/Available'
import Unavailable from './Component/Unavailable'
import './App.css'
import RoomPages from './Component/Roompages'
import { Verify } from './Component/Authen/Frontend/Login'
import RoomSize from './Component/Roomsize'
import Protect from './Component/Authen/Frontend/Protect'
import LoginPage from './Component/Login'

function App() {

  const [isAuthenticated, setAuth] = useState(!!localStorage.getItem('token'));


  return (
    <Router>
    <Routes>
        <Route path='/' element={<Verify setAuth={setAuth} />} />
        <Route path='/login/ms' element={<LoginPage />} />
        <Route path='/admin/api' element={
          <Protect>
          <RoomPage />
        </Protect>
        } 
          />
        <Route path='/room/:Room/:startdate/:enddate' element={<RoomPages />} />
        <Route path='/Available' element={<Available key={location.key}/>} />
        <Route path='/Unavailable' element={<Unavailable />} />
        <Route path='/roomsize/:size' element={<RoomSize />} />
    </Routes>
    </Router>
  )
}

export default App
