import React,{useState,useEffect} from 'react'
import {Container,Form} from 'react-bootstrap'

import { useSortingFetch } from '../utils/utils';
import AppNavbar from '../components/AppNavbar'

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


export default function Rate({config}) {
    const address = config.address

    const fetchAddress = address + "api/rates/"

    const [pie, setPie] = useState(false)
    

    const types = [
        ['energy', 'Energie']
    ]
    const [selectedType, setSelectedType] = useState(0)
    const [source1,setSource1] = useState(0)
    const [source2,setSource2] = useState(0)

    const [data1,setData1] = useState([])
    const [data2,setData2] = useState([])


    const {error:sourcesError,data:sources,loading:sourcesLoading} = useSortingFetch(fetchAddress,config.fetchOptions,types[selectedType][0])
    
    useEffect(()=>{setSource1(0);setSource2(0)},[selectedType])

    useEffect(()=>{
        if(!sources) return
        if(sources.length === 0) return
        const interval = setInterval(()=>{
            fetch(fetchAddress+encodeURI(sources[source1]),config.fetchOptions).then(res=>res.json()).then(res=>setData1(res))
            fetch(fetchAddress+encodeURI(sources[source2]),config.fetchOptions).then(res=>res.json()).then(res=>setData2(res))
        },1000)
        return () => clearInterval(interval)
    },[sources,sourcesLoading,source1,source2,fetchAddress,config.fetchOptions])


    const plotData = {
      labels:data1.map(rate=>new Date(parseInt(rate.time)).toLocaleTimeString()),
      datasets: [
        {
          label: sources[source1],
          data: data1.map(rate=>rate.rate),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: sources[source2],
          data: data2.map(rate=>rate.rate),
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
    if(data1.length > 0 && data2.length > 0){
        const rate1 = [...data1].reverse()[0].rate
        const rate2 = [...data2].reverse()[0].rate
        
        pieData = {
            labels: [sources[source1],sources[source2]],
            datasets: [
                {
                    label:'Stockage',
                    data:[rate1,rate2],
                    backgroundColor:['rgba(80, 255, 50, 0.6)','rgba(50, 50, 50, 0.8)'],
                    hoverOffset: 4
                }
            ]
        }
    }
  
    return (
    <Container fluid className='m-0 p-0 h-100'>
        <AppNavbar/>
        {sourcesLoading ? <p>Loading...</p> : sourcesError ? <p>Error: {sourcesError.message}</p> : (
        <Container className='h-75 d-flex flex-column align-items-center mt-5'>
            <Container className='w-75 d-flex flex-row'>
                <Container className='d-flex flex-column align-items-center flex-grow'>
                    <Form.Label>Sélectionnez un type</Form.Label>
                    <Form.Select value={types[selectedType][1]} onChange={(e)=>{
                        const index = types.findIndex(type=>type[1] === e.target.value)
                        setSelectedType(index)
                        }} className='w-100'>
                        {types.map((logger,index) => (<option key={index}>{logger[1]}</option>))}
                    </Form.Select>
                </Container>
                
                <Container className='d-flex flex-column align-items-center flex-grow'>
                    <Form.Label>Sélectionnez 1ère source</Form.Label>
                    <Form.Select disabled={sources.length === 0 ? 'disabled' : ''} value={sources[source1]} onChange={(e)=>{
                        const index = sources.indexOf(e.target.value)
                        setSource1(index)
                        }} className='w-100'>
                        {sources.map((logger,index) => (<option key={index}>{logger}</option>))}
                    </Form.Select>
                </Container>
                <Container className='d-flex flex-column align-items-center flex-grow'>
                    <Form.Label>Sélectionnez 2nde source</Form.Label>
                    <Form.Select disabled={sources.length === 0 ? 'disabled' : ''} value={sources[source2]} onChange={(e)=>{
                        const index = sources.indexOf(e.target.value)
                        setSource2(index)
                        }} className='w-100'>
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
        </Container>)}
    </Container>
    )
}
