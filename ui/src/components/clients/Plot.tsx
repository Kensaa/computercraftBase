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
ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement)
import configStore from '../../stores/config'
import { Client, DataContext } from '../../types'

import { Spinner } from 'react-bootstrap'

interface PlotProps {
    client: Client
    context: React.Context<DataContext>
}

export default function Plot({ client, context }: PlotProps) {
    const config = configStore(state => ({ ...state }))
    const clientData = useContext(context).data[client.name]
    if (!client.dataKeys) {
        //error
        return <div>ERROR</div>
    }
    // console.log(useContext(dataContext))

    const plotData = useMemo(() => {
        const keys = client.dataKeys
        if (!keys) return undefined
        if (!clientData) return undefined

        const colors = config.plotColors

        return {
            labels: clientData.map(e => new Date(e.time).toLocaleTimeString()),
            datasets: keys
                .map((axis, axisIndex) =>
                    axis.map((key, keyIndex) => ({
                        label: key,
                        data: clientData.map(e => e.data[key]),
                        backgroundColor: colors[axisIndex % colors.length][keyIndex % colors[keyIndex].length],
                        borderColor: colors[axisIndex % colors.length][keyIndex % colors[keyIndex].length],
                        color: colors[axisIndex % colors.length][keyIndex % colors[keyIndex].length],
                        yAxisID: `yAxis${axisIndex}`
                    }))
                )
                .flat()
        }
    }, [clientData, client.dataKeys, config])

    const plotOptions = useMemo(() => {
        const axisCount = client.dataKeys ? client.dataKeys.length : 0
        const scales: Record<string, any> = {}

        for (let i = 0; i < axisCount; i++) {
            scales[`yAxis${i}`] = {
                type: 'linear',
                display: true,
                position: i % 2 == 0 ? 'left' : 'right',
                grid: {
                    drawOnChartArea: false
                }
            }
        }

        return {
            ...config.plotConfig,
            plugins: {
                title: {
                    display: true,
                    text: client.name
                }
            },
            scales
        }
    }, [config.plotConfig, client.name, client.dataKeys])

    return (
        <div style={{ width: '45%', height: '50%' }} className='border m-2'>
            {plotData ? (
                <Line data={plotData} options={plotOptions} />
            ) : (
                <div className='h-100 d-flex justify-content-center align-items-center'>
                    <Spinner animation='border' />
                </div>
            )}
        </div>
    )
}
