export const plotOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,

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
      /*y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },*/
    },
  };

export const pieOptions = {
  maintainAspectRatio: false,
  animation:{
    duration:200
  }
}


export const fetchOptions = {
  method: 'GET',
  headers: {
    'count': '100'
  }
}
//export const address = "http://localhost:3695/"
export const address = "http://kensa.fr:3695/"