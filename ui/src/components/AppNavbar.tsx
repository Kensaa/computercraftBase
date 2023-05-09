import React, {useState} from 'react'
import {Container,Navbar,Nav, NavDropdown} from 'react-bootstrap'
import { Link, Redirect, useLocation } from 'wouter'
import auth from '../stores/auth'

export default function AppNavbar() {
    const [location, setLocation] = useLocation()
    const {user, logout, isConnected} = auth(state => ({user: state.user, logout: state.logout, isConnected: state.isConnected}))
    
    return (
        <>
        <Navbar bg="light">
            <Container fluid className=''>
                <Navbar.Brand as={Link} to='/'>Base</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    
                <Nav className="me-auto">
                    {/*<NavDropdown title="time-based">
                        <NavDropdown.Item as={Link} to='/energy'>Energy</NavDropdown.Item>
                        <NavDropdown.Item as={Link} to='/fluid'>Fluid</NavDropdown.Item>
                    </NavDropdown>
                    <NavDropdown title="instant data">
                        <NavDropdown.Item as={Link} to='/state'>State</NavDropdown.Item>
                    </NavDropdown>*/}
                </Nav>
                <Nav>
                    {!isConnected 
                        ? <Nav.Link as={Link} to='/login'>Connexion</Nav.Link>
                        : 
                        <NavDropdown align="end" title={user.username}>
                            <NavDropdown.Item as={Link} to='/account'>Mon Compte</NavDropdown.Item>
                            <NavDropdown.Item onClick={()=>{
                                logout()
                                setLocation('/')
                            }}>Déconnexion</NavDropdown.Item>
                        </NavDropdown>
                    }
                </Nav>
            </Container>
        </Navbar>
        </>
    )
}
