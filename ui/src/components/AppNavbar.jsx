import React from 'react'
import {Container,Navbar,Nav,NavDropdown} from 'react-bootstrap'
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
              <Nav.Link as={Link} to='/reactor'>Reacteurs</Nav.Link>
              <NavDropdown title="Energie">
                <NavDropdown.Item as={Link} to="/energy/rate">Consommation/Production</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/energy/storage">Stockage</NavDropdown.Item>

              </NavDropdown>
            </Nav>
            <Nav>
              <Nav.Link as={Link} to='/'>Connection(WIP)</Nav.Link>
            </Nav>
          </Container>
        </Navbar>
    )
}
