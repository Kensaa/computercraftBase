import React, { ReactElement, useEffect } from 'react'
import { Redirect, Route, Switch } from 'wouter'
import Home from './pages/Home'

import authStore from './stores/auth'
import configStore from './stores/config'
import Login from './pages/Login'

import Groups from './pages/groups/Groups'
import ShowClients from './pages/show/ShowClients'
import ShowGroup from './pages/show/ShowGroup'

interface LoginWallProps {
    children: JSX.Element
    reversed?: boolean
    redirect?: string
}
const LoginWall = ({
    children,
    reversed = false,
    redirect = '/login'
}: LoginWallProps) => {
    let autorized = authStore(state => state.isConnected)
    if (reversed) autorized = !autorized
    return autorized ? children : <Redirect to={redirect} />
}

export default function App() {
    const auth = authStore(state => ({
        isConnected: state.isConnected,
        token: state.token,
        logout: state.logout
    }))
    const config = configStore(state => ({ ...state }))

    // check if session expired
    useEffect(() => {
        if (!auth.isConnected) return
        fetch(`${config.address}/api/account/me`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${auth.token}` }
        }).then(res => {
            if (res) {
                if (!res.ok) {
                    auth.logout()
                }
            }
        })
    }, [auth.token])

    return (
        <Switch>
            <Route path='/'>
                <LoginWall>
                    <Home />
                </LoginWall>
            </Route>
            <Route path='/groups'>
                <LoginWall>
                    <Groups />
                </LoginWall>
            </Route>

            <Route path='/login'>
                <LoginWall reversed redirect='/'>
                    <Login />
                </LoginWall>
            </Route>

            <Route path='/showClients/:input'>
                {params => (
                    <LoginWall>
                        <ShowClients input={params.input} />
                    </LoginWall>
                )}
            </Route>
            <Route path='/showGroup/:input'>
                {params => (
                    <LoginWall>
                        <ShowGroup input={params.input} />
                    </LoginWall>
                )}
            </Route>
            <Route>
                <Redirect to='/' />
            </Route>
        </Switch>
    )
}
