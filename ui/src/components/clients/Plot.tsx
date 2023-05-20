import React, { useContext, useMemo } from 'react'
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
import { Line } from 'react-chartjs-2'
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
import { Client } from '../../types'

import { DataContext, dataContext } from '../../pages/Show'
import { Spinner } from 'react-bootstrap'

interface PlotProps {
    client: Client
}

export default function Plot({ client }: PlotProps) {
    const config = configStore(state => ({ ...state }))
    const clientData = useContext(dataContext).data[client.name]
    if (!client.dataKeys) {
        //error
        return <div>ERROR</div>
    }

    const plotData = useMemo(() => {
        const keys = client.dataKeys
        if (!keys) return undefined
        if (!clientData) return undefined
        return {
            labels: clientData.map(e => new Date(e.time).toLocaleTimeString()),
            datasets: keys.map((key, index) => ({
                label: key,
                data: clientData.map(e => e.data[key]),
                backgroundColor: config.plotColors[index],
                borderColor: config.plotColors[index],
                color: config.plotColors[index]
            }))
        }
    }, [clientData, client.dataKeys, config])

    const plotOptions = useMemo(
        () => ({
            ...config.plotConfig,
            plugins: {
                title: {
                    display: true,
                    text: client.name
                }
            }
        }),
        [config.plotConfig, client.name]
    )
    return (
        <div style={{ width: '45%', height: '50%' }} className='border m-2'>
            {plotData ? (
                <Line data={plotData} options={plotOptions} />
            ) : (
                <Spinner animation='border' />
            )}
        </div>
    )
}
