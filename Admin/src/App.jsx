import { RoomPage } from './Component/Admin'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Available from './Component/Available'
import Unavailable from './Component/Unavailable'
import './App.css'
import RoomPages from './Component/Roompages'
import RoomSize from './Component/Roomsize'
import LoginPage from './Component/Login'

function App() {

  return (
    <Router>
    <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='/admin/api' element={<RoomPage />} />
        <Route path='/room/:Room/:startdate/:enddate' element={<RoomPages />} />
        <Route path='/Available' element={<Available key={location.key}/>} />
        <Route path='/Unavailable' element={<Unavailable />} />
        <Route path='/roomsize/:size' element={<RoomSize />} />
    </Routes>
    </Router>
  )
}

export default App
