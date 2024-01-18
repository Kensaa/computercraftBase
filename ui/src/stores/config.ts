import { create } from 'zustand'

const address =
    import.meta.env.MODE == 'production' ? '' : 'http://localhost:3695'
const maxSelectedClient = 9999
const fetchOptions = {
    method: 'GET',
    headers: {
        count: '100'
    }
}

const plotConfig = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false
    },
    stacked: false,
    animation: {
        duration: 0
    }
    /*scales: {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: {
                drawOnChartArea: false
            }
        }
        
      
    }*/
}

const colors = [
    [
        '#a50026',
        '#d73027',
        '#f46d43',
        '#fdae61',
        '#fee08b',
        '#ffffbf',
        '#d9ef8b',
        '#a6d96a',
        '#66bd63',
        '#1a9850',
        '#006837'
    ],
    [
        '#543005',
        '#8c510a',
        '#bf812d',
        '#dfc27d',
        '#f6e8c3',
        '#f5f5f5',
        '#c7eae5',
        '#80cdc1',
        '#35978f',
        '#01665e',
        '#003c30'
    ],
    [
        '#8e0152',
        '#c51b7d',
        '#de77ae',
        '#f1b6da',
        '#fde0ef',
        '#f7f7f7',
        '#e6f5d0',
        '#b8e186',
        '#7fbc41',
        '#4d9221',
        '#276419'
    ]
]

interface configType {
    address: string
    maxSelectedClient: number
    fetchOptions: Record<string, any>
    plotConfig: Record<string, any>
    plotColors: string[][]

    setAddress: (address: string) => void
    setMaxSelectedClient: (maxSelectedClient: number) => void
    setFetchOptions: (fetchOptions: Record<string, any>) => void
    setPlotConfig: (plotConfig: Record<string, any>) => void
    setPlotColors: (plotColors: string[][]) => void
}

export default create<configType>(set => ({
    address,
    maxSelectedClient,
    fetchOptions,
    plotConfig,
    plotColors: colors,
    setAddress: address => set({ address }),
    setMaxSelectedClient: maxSelectedClient => set({ maxSelectedClient }),
    setFetchOptions: fetchOptions => set({ fetchOptions }),
    setPlotConfig: plotConfig => set({ plotConfig }),
    setPlotColors: plotColors => set({ plotColors })
}))
