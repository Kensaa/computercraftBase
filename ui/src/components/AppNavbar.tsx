import React, { useState } from 'react'
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap'
import { Link, Redirect, useLocation } from 'wouter'
import auth from '../stores/auth'

export default function AppNavbar() {
    const [location, setLocation] = useLocation()
    const { user, logout, isConnected } = auth(state => ({
        user: state.user,
        logout: state.logout,
        isConnected: state.isConnected
    }))

    return (
        <>
            <Navbar bg='light'>
                <Container fluid>
                    <Navbar.Brand as={Link} to='/'>
                        Base
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls='basic-navbar-nav' />
                    <Nav>
                        <Nav.Link as={Link} to='/groups'>
                            Groups
                        </Nav.Link>
                    </Nav>
                    <Nav className='me-auto' />

                    <Nav>
                        {!isConnected ? (
                            <Nav.Link as={Link} to='/login'>
                                Connection
                            </Nav.Link>
                        ) : (
                            <NavDropdown align='end' title={user.username}>
                                <NavDropdown.Item as={Link} to='/account'>
                                    Mon Compte
                                </NavDropdown.Item>
                                <NavDropdown.Item
                                    onClick={() => {
                                        logout()
                                        setLocation('/')
                                    }}
                                >
                                    Déconnexion
                                </NavDropdown.Item>
                            </NavDropdown>
                        )}
                    </Nav>
                </Container>
            </Navbar>
        </>
    )
}
