import React from 'react'
import {Container,ListGroup,Form} from 'react-bootstrap'
import {useFetch} from '../utils/utils'

import AppNavbar from '../components/AppNavbar'

export default function Home({config}) {

  const {error,data:clients,loading} = useFetch(config.address+"api/clients/",config.fetchOptions)

  return (
    <Container fluid className='m-0 p-0 h-100'>
      <AppNavbar/>
      {loading ? <p>Loading...</p> : error ? <p>Error: {error.message}</p> : (
      <Container className='h-75 d-flex flex-column align-items-center border mt-5'>
        <Form.Label>Liste des clients</Form.Label>
        <ListGroup className="w-100">
          {clients.map((client,i)=>(<ListGroup.Item className="d-flex flex-row justify-content-center" key={i}>{client.name+' ('+client.type+(client.type==='storage' ? ', '+client.subtype+')' : ')')}</ListGroup.Item>))}
        </ListGroup>
      </Container>)}
    </Container>
  )
}
