import React, {ReactElement} from 'react'
import { Redirect, Route } from 'wouter'
import Home from './pages/Home'

import auth from './stores/auth'
import Login from './pages/Login'

import Graph from './pages/Graph'

interface LoginWallProps {
    children: JSX.Element,
    reversed?: boolean,
    redirect?: string
}
const LoginWall = ({children, reversed=false, redirect='/login'}: LoginWallProps) => {
    let autorized = auth(state => state.isConnected)
    if (reversed) autorized = !autorized
    return autorized ? children : <Redirect to={redirect} />
}

export default function App() {
    return(
        <>
            <Route path="/"><LoginWall><Home /></LoginWall></Route>
            <Route path="/login"><LoginWall reversed redirect='/'><Login /></LoginWall></Route>

            <Route path="/graph/:input">{params =>(<LoginWall><Graph input={params.input}/></LoginWall>)}</Route>
        </>
    )
}
