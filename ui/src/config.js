export const plotOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: 'Energy Rates',
      },
    },
    animation:{
      duration:0
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
            drawOnChartArea: false,
          },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };