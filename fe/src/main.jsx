import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './pages/home'
import { BrowserRouter, Routes, Route } from 'react-router-dom';


createRoot(document.getElementById('root')).render(
  <BrowserRouter basename="/user/">
    <Routes>
      <Route path="/users/api/:floor/:room" element={<Home />} />
    </Routes>
  </BrowserRouter>,
)
