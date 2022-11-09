import React,{useState,useEffect} from 'react'
import {Container,Form} from 'react-bootstrap'

import { useSortingFetch } from '../utils/utils';
import AppNavbar from '../components/AppNavbar'

import { useInterval } from 'usehooks-ts'


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
  ArcElement
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);


export default function Storage({config, auth}) {
    const address = config.address
    const [connected,info,login,logout] = auth;

    const fetchAddress = address + "api/storages/"

    const [pie, setPie] = useState(false)
    

    const types = [
        ['energy', 'Energie'],
        ['fluid', 'Liquide'],
        ['item', 'Item'],
    ]
    const [selectedType, setSelectedType] = useState(0)
    const [selectedSource,setSelectedSource] = useState(0)
    const [data,setData] = useState([])

    const {error:sourcesError,data:sources,loading:sourcesLoading} = useSortingFetch(fetchAddress,{headers: {'Authorization': 'Bearer '+info.token}},types[selectedType][0])
    
    useEffect(()=>{setSelectedSource(0)},[selectedType])

    useInterval(()=>{
        fetch(fetchAddress+encodeURI(sources[selectedSource]),{headers: {'Authorization': 'Bearer '+info.token}}).then(res=>res.json()).then(res=>setData(res))
    },1000)


    const plotData = {
      labels:data.map(storage=>new Date(parseInt(storage.time)).toLocaleTimeString()),
      datasets: [
        {
          label: 'Stockage',
          data: data.map(storage=>storage.storage),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Stockage Max',
          data: data.map(storage=>storage.maxStorage),
          backgroundColor: 'rgba(70, 70, 255, 0.2)',
          borderColor: 'rgba(70, 70, 255, 1)',
          borderWidth: 1,
          yAxisID: 'y'
      }
      ]
    }

    var pieData = {
        labels: ['Stocké','Vide'],
        datasets : []
    };
    if(data.length > 0){
        
        pieData = {
            labels: ['Stocké','Vide'],
            datasets: [
                {
                    label:'Stockage',
                    data:[[...data].reverse()[0].storage,[...data].reverse()[0].maxStorage-[...data].reverse()[0].storage],
                    backgroundColor:['rgba(80, 255, 50, 0.6)','rgba(50, 50, 50, 0.8)'],
                    hoverOffset: 4
                }
            ]
        }
    }
  
    return (
    <Container fluid className='m-0 p-0 h-100'>
        <AppNavbar auth={auth}/>
        {sourcesLoading 
            ? <p>Loading...</p> 
            : sourcesError ? <p>Error: {sourcesError.message}</p> 
            : <Container className='h-75 d-flex flex-column align-items-center mt-5'>
                <Container className='w-50 d-flex flex-row'>
                    <Container className='d-flex flex-column align-items-center flex-grow'>
                        <Form.Label>Sélectionnez un type</Form.Label>
                        <Form.Select value={types[selectedType][1]} onChange={(e)=>{
                            const index = types.findIndex(type=>type[1] === e.target.value)
                            setSelectedType(index)
                            }} className='w-75'>
                            {types.map((logger,index) => (<option key={index}>{logger[1]}</option>))}
                        </Form.Select>
                    </Container>
                    
                    <Container className='d-flex flex-column align-items-center flex-grow'>
                        <Form.Label>Sélectionnez une source</Form.Label>
                        <Form.Select disabled={sources.length === 0 ? 'disabled' : ''} value={sources[selectedSource]} onChange={(e)=>{
                            const index = sources.indexOf(e.target.value)
                            setSelectedSource(index)
                            }} className='w-75'>
                            {sources.map((logger,index) => (<option key={index}>{logger}</option>))}
                        </Form.Select>
                    </Container>

                </Container>
                <Form.Check 
                    disabled={sources.length === 0 ? 'disabled' : ''}
                    type="switch"
                    id="custom-switch"
                    label="pie / graph"
                    onChange={(e)=>setPie(e.target.checked)}
                />
                {sources.length === 0 ? '' : pie ? <Line options={config.plotOptions} data={plotData} width="100%" height="100%" /> : <Pie data={pieData} options={config.pieOptions} width="100%" height="100%" />}
            </Container>}
    </Container>
    )
}
