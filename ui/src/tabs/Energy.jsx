import React,{useState,useEffect} from 'react'
import {Container,Form,Button} from 'react-bootstrap'
import * as useFetch from "react-fetch-hook";

import AppNavbar from '../components/AppNavbar'


export default function Energy({address}) {
    



    const [dataCount,setDataCount] = useState(100)

    const [logger,setLogger] = useState(0)
    const [energyReads,setEnergyReads] = useState([])
    const { isLoading: energyLoggersLoading, data:energyLoggers, error: energyLoggersError } = useFetch(address+"api/energyLoggers/", {})
    useEffect(()=>{
        let interval = setInterval(()=>{
        if(!energyLoggers) return
        if(energyLoggers.length === 0) return
        fetch(address+"api/energyReads/"+encodeURI(energyLoggers[logger]+'/'+dataCount)).then(res=>res.json()).then(res=>setEnergyReads(res))
    },1000)
    //return ()=>clearInterval(interval)
  },[energyLoggers])

    console.log(energyReads)
  return (
    <Container fluid className='m-0 p-0 h-100'>
        <AppNavbar/>
        {energyLoggersLoading ? <p>Loading...</p> : energyLoggersError ? <p>Error: {energyLoggersError.message}</p> : (
        <Container className='h-75 d-flex flex-column align-items-center border mt-5'>
        <Form.Label>Sélectionnez une source</Form.Label>
        <Form.Select value={logger} onChange={(e)=>setLogger(e.target.value)} className='w-25'>
            {energyLoggers.map((energyLogger,index) => (<option key={index}>{energyLogger}</option>))}
        </Form.Select>
        </Container>)}
    </Container>
  )
}
