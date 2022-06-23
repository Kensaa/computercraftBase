import React,{useState,useEffect} from 'react'
import {Container,Form,Button} from 'react-bootstrap'
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

export default function EnergyStorage({address,plotOptions}) {
  const [dataCount,setDataCount] = useState(100)
  
  //-------------------EnergyRate-------------------\\
  const [selectedStorageLogger,setSelectedStorageLogger] = useState(0)
  const [storages,setStorages] = useState([])
  const { isLoading: storageLoggersLoading, data:storageLoggers, error: storageLoggersError } = useFetch(address+"api/energy/storage/", {})
  useEffect(()=>{
      const interval = setInterval(()=>{
      if(!storageLoggers) return clearInterval(interval)
      if(storageLoggers.length === 0) return clearInterval(interval)
      fetch(address+"api/energy/storage/"+encodeURI(storageLoggers[selectedStorageLogger]+'/'+dataCount)).then(res=>res.json()).then(res=>setStorages(res))
  },1000)
  return ()=>clearInterval(interval)
  },[storageLoggers,selectedStorageLogger])
  
  console.log(storages)
  //console.log(selectedRateLogger)
  //console.log(rates.map(rate=>new Date(parseInt(rate.time))).toString())
  const labels = storages.map(storage=>new Date(parseInt(storage.time)).toLocaleTimeString());
  const plotData = {
    labels,
    datasets: [
      {
        label: 'Stockage',
        data: storages.map(storage=>storage.storage),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
          label: 'Stockage Max',
          data: storages.map(storage=>storage.maxStorage),
          backgroundColor: 'rgba(70, 70, 255, 0.2)',
          borderColor: 'rgba(70, 70, 255, 1)',
          borderWidth: 1,
          yAxisID: 'y'
    }
    ]
  }

  return (
  <Container fluid className='m-0 p-0 h-100'>
      <AppNavbar/>
      {storageLoggersLoading ? <p>Loading...</p> : storageLoggersError ? <p>Error: {storageLoggersError.message}</p> : (
      <Container className='h-75 d-flex flex-column align-items-center border mt-5'>
      <Form.Label>Sélectionnez une source</Form.Label>
      <Form.Select value={storageLoggers[selectedStorageLogger]} onChange={(e)=>setSelectedStorageLogger(storageLoggers.indexOf(e.target.value))} className='w-25'>
          {storageLoggers.map((logger,index) => (<option key={index}>{logger}</option>))}
      </Form.Select>
      <Line options={plotOptions} data={plotData} />
      </Container>)}
  </Container>
  )
}
  