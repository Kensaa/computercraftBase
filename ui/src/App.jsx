import React from 'react'
import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";
import Home from './tabs/Home'
import Login from './tabs/Login'
import Door from './tabs/Door'
import Reactor from './tabs/Reactor'
import Rate from './tabs/Rate';

import * as config from './config';

import Storage from './tabs/Storage';
import Account from './tabs/Account';
import { useAuth } from './utils/utils';



const LoginWall = ({children,auth}) => {
    const [connected,info,login,logout] = auth;
    //console.log(connected)
    if(!connected){
        return <Navigate to="/login"/>
    }
    return children
}

export default function App() {

  const auth = useAuth()
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login config={config} auth={auth}/>} />
        <Route path="/account" element={<LoginWall auth={auth}><Account config={config} auth={auth}/></LoginWall>} />
        

        <Route path="/" element={<LoginWall auth={auth}><Home config={config} auth={auth}/></LoginWall>}/>

        <Route path="/door" element={<LoginWall auth={auth}><Door config={config} auth={auth}/></LoginWall>} />
        <Route path="/reactor" element={<LoginWall auth={auth}><Reactor config={config} auth={auth}/></LoginWall>} />

        {/*<Route path="/storage/energy" element={<EnergyStorage config={config}/>}/>
        <Route path="/storage/fluid" element={<FluidStorage config={config}/>}/>
        <Route path="/storage/item" element={<ItemStorage config={config}/>}/>
        */}
        <Route path="/storage/" element={<LoginWall auth={auth}><Storage config={config} auth={auth}/></LoginWall>}/>

        <Route path="/rate" element={<LoginWall auth={auth}><Rate config={config} auth={auth}/></LoginWall>} />
        
      </Routes>
    </BrowserRouter>
  )
}
