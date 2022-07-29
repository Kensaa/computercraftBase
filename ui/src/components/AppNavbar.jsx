import React from 'react'
import {Container,Navbar,Nav,Button, NavDropdown} from 'react-bootstrap'
import {Link,useNavigate} from 'react-router-dom'

export default function AppNavbar({auth}) {
    const navigate = useNavigate()
    const [connected,info,login,logout] = auth
    return (
      <Navbar bg="light">
          <Container fluid className=''>
            <Navbar.Brand as={Link} to='/'>Base</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
                
            <Nav className="me-auto">
                <Nav.Link as={Link} to='/door'>Portes</Nav.Link>
                <Nav.Link as={Link} to='/reactor'>Reacteurs</Nav.Link>
                {/*<NavDropdown title="Stockages">
                    <NavDropdown.Item as={Link} to='/storage/energy'>Energies</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to='/storage/fluid'>Liquides</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to='/storage/item'>Items</NavDropdown.Item>
                </NavDropdown>*/}
                <Nav.Link as={Link} to='/storage'>Stockage</Nav.Link>
                <Nav.Link as={Link} to='/rate'>Consommation</Nav.Link>
              

            </Nav>
            <Nav>
                {!connected 
                    ? <Nav.Link as={Link} to='/login'>Connexion</Nav.Link>
                    : <NavDropdown align="end" title={info.user.username}>
                        <NavDropdown.Item as={Link} to='/account'>Mon Compte</NavDropdown.Item>
                        <NavDropdown.Item onClick={()=>{
                            logout()
                            navigate('/door')
                        }}>Déconnexion</NavDropdown.Item>
                    </NavDropdown>
                }

                
            </Nav>
          </Container>
        </Navbar>
    )
}
