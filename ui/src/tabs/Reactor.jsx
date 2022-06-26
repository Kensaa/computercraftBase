import React,{useState} from 'react'
import {Container,Form,Button} from 'react-bootstrap'
import * as useFetch from "react-fetch-hook";

import AppNavbar from '../components/AppNavbar'


export default function Door({config}) {
  const address = config.address

  const [reactor,setReactor] = useState(0)
  const { isLoading: reactorLoading, data:reactors, error: reactorError } = useFetch(address+"api/reactor", {})

  const onClick = (action) => {
    fetch(address+"api/reactor", {method:'post',headers: {'Content-Type': 'application/json'},body:JSON.stringify({reactor:reactors[reactor],action})})
  }

  return (
    <Container fluid className='m-0 p-0 h-100'>
      <AppNavbar/>
      {reactorLoading ? <p>Loading...</p> : reactorError ? <p>Error: {reactorError.message}</p> : (
      <Container className='h-75 d-flex flex-column align-items-center border mt-5'>
        <h1>Reacteurs</h1>
        <Form.Label>Sélectionnez un reacteur</Form.Label>
        <Form.Select value={reactor} onChange={(e)=>setReactor(e.target.value)} className='w-25'>
            {reactors.map((reactor,index) => (<option key={index}>{reactor}</option>))}
        </Form.Select>        
        <Container className='w-50 d-flex flex-row justify-content-center mt-2'>
          <Button variant="success" onClick={()=>onClick('on')} className='m-1'>ON</Button>
          <Button variant="danger" onClick={()=>onClick('off')} className='m-1'>OFF</Button>
        </Container>
      </Container>)}
    </Container>
  )
}
