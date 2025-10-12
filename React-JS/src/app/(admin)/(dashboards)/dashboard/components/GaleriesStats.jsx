import ApexChartClient from '@/components/client-wrapper/ApexChartClient';

const GaleriesStats = ({ galeries = [], oeuvres = [] }) => {
  // Calculer le nombre de galeries et œuvres par mois
  const currentYear = new Date().getFullYear();
  const galeriesData = Array(12).fill(0);
  const oeuvresData = Array(12).fill(0);
  
  console.log('GaleriesStats - Nombre total d\'œuvres:', oeuvres.length);
  console.log('GaleriesStats - Première œuvre:', oeuvres[0]);
  
  galeries.forEach(galerie => {
    const dateStr = galerie.date_creation || galerie.created_at || galerie.date_ajout;
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
        const month = date.getMonth();
        galeriesData[month]++;
      }
    }
  });

  oeuvres.forEach((oeuvre, index) => {
    // Le champ dans Django s'appelle date_creation pour les œuvres
    const dateStr = oeuvre.date_creation || oeuvre.created_at || oeuvre.date_ajout;
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        if (index === 0) {
          console.log('Première œuvre - date string:', dateStr);
          console.log('Première œuvre - date parsed:', date);
          console.log('Première œuvre - année:', date.getFullYear());
          console.log('Première œuvre - mois:', date.getMonth());
        }
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          oeuvresData[month]++;
        }
      } else {
        console.warn('Date invalide pour l\'œuvre:', oeuvre);
      }
    } else {
      console.warn('Oeuvre sans date:', oeuvre);
    }
  });

  console.log('Données œuvres par mois:', oeuvresData);
  console.log('Données galeries par mois:', galeriesData);

  // Calculer les galeries publiques et privées
  const galeriesPubliques = galeries.filter(g => !g.privee).length;
  const galeriesPrivees = galeries.filter(g => g.privee).length;

  const getBarChartOptions = () => {
    return {
      series: [
        {
          name: 'Galeries',
          data: galeriesData
        },
        {
          name: 'Œuvres',
          data: oeuvresData
        }
      ],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false
        },
        fontFamily: 'inherit'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
            hideOverflowingLabels: false
          }
        }
      },
      dataLabels: {
        enabled: true,
        offsetY: -20,
        style: {
          fontSize: '11px',
          colors: ['#304758'],
          fontWeight: 600
        },
        background: {
          enabled: false
        },
        formatter: function (val, opts) {
          // Afficher toujours la valeur, même 0
          return val;
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        labels: {
          style: {
            fontSize: '11px'
          }
        }
      },
      colors: ['#f59e0b', '#3b82f6'],
      fill: {
        opacity: 1
      },
      yaxis: {
        title: {
          text: 'Nombre',
          style: {
            fontSize: '12px',
            fontWeight: 500
          }
        },
        min: 0,
        forceNiceScale: true
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '13px',
        markers: {
          width: 10,
          height: 10,
          radius: 2
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function (val) {
            return val + ' élément' + (val > 1 ? 's' : '');
          }
        }
      },
      grid: {
        borderColor: '#f1f1f1',
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 10
        }
      }
    };
  };

  const getPieChartOptions = () => {
    const total = galeriesPubliques + galeriesPrivees;
    
    return {
      series: [galeriesPubliques, galeriesPrivees],
      chart: {
        type: 'donut',
        height: 350
      },
      labels: ['Galeries Publiques', 'Galeries Privées'],
      colors: ['#10b981', '#ef4444'],
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                fontSize: '16px',
                fontWeight: 600,
                formatter: function (w) {
                  return total;
                }
              },
              value: {
                show: true,
                fontSize: '24px',
                fontWeight: 700,
                formatter: function (val) {
                  return val;
                }
              }
            }
          }
        }
      },
      legend: {
        position: 'bottom',
        fontSize: '14px',
        markers: {
          width: 12,
          height: 12,
          radius: 12
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val, opts) {
          return opts.w.config.series[opts.seriesIndex] + ' (' + Math.round(val) + '%)';
        },
        style: {
          fontSize: '14px',
          fontWeight: 'bold'
        },
        dropShadow: {
          enabled: false
        }
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val + ' galerie' + (val > 1 ? 's' : '');
          }
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 300
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };
  };

  const barOptions = getBarChartOptions();
  const pieOptions = getPieChartOptions();

  return (
    <div className="grid lg:grid-cols-2 grid-cols-1 gap-5 mb-5">
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-xl font-semibold text-default-800">Statistiques des Galeries & Œuvres</h5>
            <span className="text-sm text-default-600">Année {currentYear}</span>
          </div>
          <ApexChartClient 
            getOptions={() => barOptions} 
            series={barOptions.series} 
            type="bar" 
            height={350} 
          />
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-xl font-semibold text-default-800">Répartition des Galeries</h5>
            <span className="text-sm text-default-600">Public / Privé</span>
          </div>
          <ApexChartClient 
            getOptions={() => pieOptions} 
            series={pieOptions.series} 
            type="donut" 
            height={350} 
          />
        </div>
      </div>
    </div>
  );
};

export default GaleriesStats;

