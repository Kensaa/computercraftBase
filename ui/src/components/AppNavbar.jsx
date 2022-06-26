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
              <Nav.Link as={Link} to='/reactor'>Reacteurs</Nav.Link>
              {/*<NavDropdown title="Stockages">
                <NavDropdown.Item as={Link} to='/storage/energy'>Energies</NavDropdown.Item>
                <NavDropdown.Item as={Link} to='/storage/fluid'>Liquides</NavDropdown.Item>
                <NavDropdown.Item as={Link} to='/storage/item'>Items</NavDropdown.Item>
              </NavDropdown>*/}
              <Nav.Link as={Link} to='/storage'>Stockage</Nav.Link>
              <Nav.Link as={Link} to='/rate'>Consomation</Nav.Link>
              

            </Nav>
            <Nav>
              <Nav.Link as={Link} to='/'>Connection(WIP)</Nav.Link>
            </Nav>
          </Container>
        </Navbar>
    )
}
