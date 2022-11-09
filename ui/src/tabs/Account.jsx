import React,{useState} from 'react'
import { Form, Button,Container,Alert } from "react-bootstrap";

import AppNavbar from '../components/AppNavbar'

export default function Account({auth}) {
    return (
        <Container fluid className='m-0 p-0 h-100'>
            <AppNavbar auth={auth}/>
        </Container>
    )
}
