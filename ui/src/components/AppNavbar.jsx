import React from 'react'
import {Container,Navbar,Nav} from 'react-bootstrap'
import {Link} from 'react-router-dom'

export default function AppNavbar() {
    return (
      <Navbar bg="light">
          <Container fluid className=''>
            <Navbar.Brand as={Link} to='/'>Base</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
                
            <Nav className="me-auto">
              <Nav.Link as={Link} to='/'>Home</Nav.Link>
              <Nav.Link as={Link} to='/door'>Portes</Nav.Link>
              <Nav.Link as={Link} to='/energy'>Energie</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link as={Link} to='/'>Connection(WIP)</Nav.Link>
            </Nav>
          </Container>
        </Navbar>
    )
}
