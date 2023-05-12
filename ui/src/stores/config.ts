import create from 'zustand'

const address = 'http://localhost:3695'
const maxSlectedClient = 4
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
    },
    scales: {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: {
                drawOnChartArea: false
            }
        }
        /*y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },*/
    }
}
const plotColors = [
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
]

interface configType {
    address: string
    maxSlectedClient: number
    fetchOptions: Record<string, any>
    plotConfig: Record<string, any>
    plotColors: string[]

    setAddress: (address: string) => void
    setMaxSlectedClient: (maxSlectedClient: number) => void
    setFetchOptions: (fetchOptions: Record<string, any>) => void
    setPlotConfig: (plotConfig: Record<string, any>) => void
    setPlotColors: (plotColors: string[]) => void
}

export default create<configType>(set => ({
    address,
    maxSlectedClient,
    fetchOptions,
    plotConfig,
    plotColors,
    setAddress: address => set({ address }),
    setMaxSlectedClient: maxSlectedClient => set({ maxSlectedClient }),
    setFetchOptions: fetchOptions => set({ fetchOptions }),
    setPlotConfig: plotConfig => set({ plotConfig }),
    setPlotColors: plotColors => set({ plotColors })
}))
