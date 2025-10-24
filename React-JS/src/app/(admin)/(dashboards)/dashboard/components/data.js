// Configuration pour les graphiques radialBar
export const getOeuvresTotal = () => ({
  series: [75],
  chart: {
    type: 'radialBar',
    sparkline: {
      enabled: true
    }
  },
  plotOptions: {
    radialBar: {
      hollow: {
        size: '50%'
      },
      dataLabels: {
        show: false
      },
      track: {
        background: '#e0f2fe'
      }
    }
  },
  colors: ['#10b981']
});

export const getGaleriesTotal = () => ({
  series: [65],
  chart: {
    type: 'radialBar',
    sparkline: {
      enabled: true
    }
  },
  plotOptions: {
    radialBar: {
      hollow: {
        size: '50%'
      },
      dataLabels: {
        show: false
      },
      track: {
        background: '#dbeafe'
      }
    }
  },
  colors: ['#3b82f6']
});

export const getOeuvresPubliees = () => ({
  series: [85],
  chart: {
    type: 'radialBar',
    sparkline: {
      enabled: true
    }
  },
  plotOptions: {
    radialBar: {
      hollow: {
        size: '50%'
      },
      dataLabels: {
        show: false
      },
      track: {
        background: '#ddd6fe'
      }
    }
  },
  colors: ['#8b5cf6']
});

export const getGaleriesActives = () => ({
  series: [90],
  chart: {
    type: 'radialBar',
    sparkline: {
      enabled: true
    }
  },
  plotOptions: {
    radialBar: {
      hollow: {
        size: '50%'
      },
      dataLabels: {
        show: false
      },
      track: {
        background: '#fef3c7'
      }
    }
  },
  colors: ['#f59e0b']
});

