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
import { Client, DataContext, Datapoint } from '../../types'

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
                        data: clientData.map(e => e.data[key] || 0),
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
                },
                ticks: {
                    callback: (value: number) => applySuffix(value) + client.dataUnit
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
    console.log(clientData)
    return (
        <div style={{ width: '45%', height: '50%' }} className='border m-2'>
            {plotData ? (
                <div className='w-100 h-100 d-flex flex-column align-item-center'>
                    <div style={{ flexGrow: 1 }}>
                        <Line data={plotData} options={plotOptions} />
                    </div>

                    <NumbersElements
                        data={clientData.slice(clientData.length - 2, clientData.length)}
                        keys={client.dataKeys.flat()}
                        unit={client.dataUnit}
                    />
                </div>
            ) : (
                <div className='h-100 d-flex justify-content-center align-items-center'>
                    <Spinner animation='border' />
                </div>
            )}
        </div>
    )
}

interface NumbersElementsProps {
    data: Datapoint[]
    keys: string[]
    unit?: string
}

function NumbersElements({ data, keys, unit }: NumbersElementsProps) {
    console.log(data)
    if (data.length < 2) return <div>Not Enough Data</div>
    const previous = data[0].data
    const current = data[1].data
    return (
        <div className='d-flex justify-content-center' style={{ flexGrow: 1 }}>
            {keys.map(key => {
                const variation = (current[key] || 0) - (previous[key] || 0)
                let color = 'black'
                if (variation > 0) color = 'green'
                if (variation < 0) color = 'red'

                return (
                    <div key={key} className='d-flex flex-column align-items-center m-2' style={{ color }}>
                        <h5>{key}</h5>
                        <h5>
                            {applySuffix(current[key] || 0)}
                            {unit}
                        </h5>
                        <span style={{ fontSize: '15px' }}>
                            {variation >= 0 ? '+' : '-'}
                            {applySuffix(Math.abs(variation))}
                            {unit}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

function applySuffix(value: number) {
    const suffixes = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
    let suffixIndex = 0
    while (value >= 1000) {
        value /= 1000
        suffixIndex++
    }
    return `${value.toFixed(2)}${suffixes[suffixIndex]}`
}
