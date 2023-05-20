import React, { useEffect, useState, CSSProperties } from 'react'
import { Form, Container, Table, Alert, Button } from 'react-bootstrap'
import AppNavbar from '../components/AppNavbar'
import { useLocation } from 'wouter'

import authStore from '../stores/auth'
import configStore from '../stores/config'
import { Client, Group } from '../types'
import ClientSearch from '../components/ClientSearch'
import GroupSearch from '../components/GroupSearch'

export default function Home() {
    const [, setLocation] = useLocation()

    const onClientValidate = (selectedClients: Client[]) => {
        const paramString = selectedClients.map(e => e.name).join(',')
        setLocation(`/show/${paramString}`)
    }

    const onGroupValidate = (selectedGroup: Group) => {
        //TODO: send to show page for groups
    }

    return (
        <div className='w-100 h-100 d-flex flex-column'>
            <AppNavbar />
            <div className='m-0 mt-3 p-0 h-100 w-100 d-flex flex-row justify-content-around'>
                <ClientSearch onValidate={onClientValidate} />
                <GroupSearch onValidate={onGroupValidate} />
            </div>
        </div>
    )
}
