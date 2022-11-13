import React, { useMemo } from 'react'
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
} from 'chart.js'
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
)
import configStore from '../../stores/config'

interface PlotProps{
    data: DataPoint[],
    keys: string[]
    width: string
    height: string
}
interface DataPoint {
    data: Record<string,any>
    time:string

}
export default function Plot({ data, keys, width, height }: PlotProps) {
    const config = configStore(state => ({...state}))
    
    const plotData = useMemo(() =>({
        labels: data.map(e => new Date(e.time).toLocaleTimeString()),
        datasets: keys.map((currentKey,i) => (
            {
                label: currentKey,
                data: data.map(e => e.data[currentKey]),
                backgroundColor: config.plotColors[i],
                borderColor: config.plotColors[i],
                color: config.plotColors[i],
            }
        ))
    }),[data, keys, config.plotColors])
    return (
        <div style={{maxWidth: width, maxHeight: height, flexGrow:1}}>
            <Line data={plotData} options={config.plotConfig}/>
        </div>
    )
}
