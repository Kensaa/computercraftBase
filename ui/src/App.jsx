import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './tabs/Home'
import Door from './tabs/Door'
import EnergyRate from './tabs/energy/EnergyRate';
import EnergyStorage from './tabs/energy/EnergyStorage';
import { plotOptions } from './config';

export default function App() {

  //const address = "http://kensa.fr:3695/"
  const address = "http://localhost:3695/"

  

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home address={address}/>} />
        <Route path="/door" element={<Door address={address}/>} />

        <Route path="/energy/rate" element={<EnergyRate address={address} plotOptions={plotOptions}/>} />
        <Route path="/energy/storage" element={<EnergyStorage address={address} plotOptions={plotOptions}/>} />
        
      </Routes>
    </BrowserRouter>
  )
}
