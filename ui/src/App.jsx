import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './tabs/Home'
import Door from './tabs/Door'
import Energy from './tabs/Energy';

export default function App() {

  //const address = "http://kensa.fr:3695/"
  const address = "http://localhost:3695/"

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home address={address}/>} />
        <Route path="/door" element={<Door address={address}/>} />
        <Route path="/energy" element={<Energy address={address}/>} />

      </Routes>
    </BrowserRouter>
  )
}
