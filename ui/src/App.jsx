import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './tabs/Home'
import Door from './tabs/Door'
import Reactor from './tabs/Reactor'
import Rate from './tabs/Rate';

import * as config from './config';

import Storage from './tabs/Storage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home config={config}/>} />
        <Route path="/door" element={<Door config={config}/>} />
        <Route path="/reactor" element={<Reactor config={config}/>} />

        {/*<Route path="/storage/energy" element={<EnergyStorage config={config}/>}/>
        <Route path="/storage/fluid" element={<FluidStorage config={config}/>}/>
        <Route path="/storage/item" element={<ItemStorage config={config}/>}/>
        */}
        <Route path="/storage/" element={<Storage config={config}/>}/>

        <Route path="/rate" element={<Rate config={config}/>} />
        
      </Routes>
    </BrowserRouter>
  )
}
