import React,{useState} from 'react'
import {Container,Form,Button} from 'react-bootstrap'
import * as useFetch from "react-fetch-hook";

import AppNavbar from '../components/AppNavbar'


export default function Door({config, auth}) {
  const address = config.address

  const [connected,info,login,logout] = auth;


  const [door,setDoor] = useState(0)
  const { isLoading: doorLoading, data:doors, error: doorError } = useFetch(address+"api/doors", {headers:{'Authorization':'Bearer '+info.token}})

  const onClick = (action) => {
    fetch(address+"api/door", {method:'post',headers: {'Content-Type': 'application/json','Authorization':'Bearer '+info.token},body:JSON.stringify({door:doors[door],action})})
  }

  return (
    <Container fluid className='m-0 p-0 h-100'>
      <AppNavbar auth={auth}/>
      {doorLoading 
        ? <p>Loading...</p> 
        : doorError ? <p>Error: {doorError.message}</p> 
        : <Container className='h-75 d-flex flex-column align-items-center border mt-5'>
            <h1>Portes</h1>
            <Form.Label>Sélectionnez une porte</Form.Label>
            <Form.Select value={door} onChange={(e)=>setDoor(e.target.value)} className='w-25'>
                {doors.map((door,index) => (<option key={index}>{door}</option>))}
            </Form.Select>
            <Button onClick={()=>onClick('enter')} className='mt-2'>Entrer</Button>
            
            <Container className='w-50 d-flex flex-row justify-content-center mt-2'>
              <Button variant="success" onClick={()=>onClick('open')} className='m-1'>Ouvrir</Button>
              <Button variant="danger" onClick={()=>onClick('close')} className='m-1'>Fermer</Button>
            </Container>
        </Container>}
    </Container>
  )
}
