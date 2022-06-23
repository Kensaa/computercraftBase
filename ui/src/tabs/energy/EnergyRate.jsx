import React,{useState,useEffect} from 'react'
import {Container,Form} from 'react-bootstrap'
import * as useFetch from "react-fetch-hook";

import AppNavbar from '../../components/AppNavbar'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function EnergyRate({address,plotOptions}) {
  const [dataCount,setDataCount] = useState(100)
  
  //-------------------EnergyRate-------------------\\
  const [selectedRateLogger,setSelectedRateLogger] = useState(0)
  const [rates,setRates] = useState([])
  const { isLoading: rateLoggersLoading, data:rateLoggers, error: rateLoggersError } = useFetch(address+"api/energy/rate/", {})
  useEffect(()=>{
      const interval = setInterval(()=>{
      if(!rateLoggers) return clearInterval(interval)
      if(rateLoggers.length === 0) return clearInterval(interval)
      fetch(address+"api/energy/rate/"+encodeURI(rateLoggers[selectedRateLogger]+'/'+dataCount)).then(res=>res.json()).then(res=>setRates(res))
  },1000)
  return ()=>clearInterval(interval)
  },[rateLoggers,selectedRateLogger])
  
  console.log(rates)
  //console.log(selectedRateLogger)
  //console.log(rates.map(rate=>new Date(parseInt(rate.time))).toString())
  const labels = rates.map(rate=>new Date(parseInt(rate.time)).toLocaleTimeString());
  const plotData = {
    labels,
    datasets: [
      {
        label: 'Input',
        data: rates.map(rate=>rate.inputRate),
        backgroundColor: 'rgba(20, 200, 20, 0.2)',
        borderColor: 'rgba(20, 170, 20, 1)',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        label: 'Output',
        data: rates.map(rate=>rate.outputRate),
        backgroundColor: 'rgba(200, 50, 50, 0.2)',
        borderColor: 'rgba(200, 50, 50, 1)',
        borderWidth: 1,
        yAxisID: 'y'
      }
    ]
  }

  return (
  <Container fluid className='m-0 p-0 h-100'>
      <AppNavbar/>
      {rateLoggersLoading ? <p>Loading...</p> : rateLoggersError ? <p>Error: {rateLoggersError.message}</p> : (
      <Container className='h-75 d-flex flex-column align-items-center border mt-5'>
      <Form.Label>Sélectionnez une source</Form.Label>
      <Form.Select value={rateLoggers[selectedRateLogger]} onChange={(e)=>setSelectedRateLogger(rateLoggers.indexOf(e.target.value))} className='w-25'>
          {rateLoggers.map((logger,index) => (<option key={index}>{logger}</option>))}
      </Form.Select>
      <Line options={plotOptions} data={plotData} />
      </Container>)}
  </Container>
  )
}
  