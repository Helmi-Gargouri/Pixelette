import ApexChartClient from '@/components/client-wrapper/ApexChartClient';
import { useState, useEffect } from 'react';

const GaleriesStats = ({ galeries = [], oeuvres = [] }) => {
  const currentYear = new Date().getFullYear();
  const galeriesData = Array(12).fill(0);
  const oeuvresData = Array(12).fill(0);
  
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

  oeuvres.forEach(oeuvre => {
    const dateStr = oeuvre.date_creation || oeuvre.created_at || oeuvre.date_ajout;
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
        const month = date.getMonth();
        oeuvresData[month]++;
      }
    }
  });

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
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        fontFamily: 'inherit',
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 8,
          borderRadiusApplication: 'end',
        }
      },
      dataLabels: {
        enabled: false
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
            fontSize: '12px',
            fontWeight: 500
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      colors: ['#3b82f6', '#10b981'],
      fill: {
        opacity: 1,
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.3,
          gradientToColors: ['#3b82f6', '#10b981'],
          opacityFrom: 0.9,
          opacityTo: 0.8,
        }
      },
      yaxis: {
        title: {
          text: 'Nombre',
          style: {
            fontSize: '12px',
            fontWeight: 500
          }
        },
        min: 0
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '13px',
        markers: {
          width: 12,
          height: 12,
          radius: 6
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        theme: 'light',
        y: {
          formatter: function (val) {
            return val + ' élément' + (val > 1 ? 's' : '');
          }
        }
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 5,
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 10
        }
      }
    };
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true) }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Statistiques des Galeries & Œuvres</h2>
          <p className="text-gray-600">Analyse des créations sur l'année {currentYear}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Galeries</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Œuvres</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Évolution Mensuelle</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Année {currentYear}</span>
          </div>
          <ApexChartClient 
            getOptions={() => getBarChartOptions()} 
            series={getBarChartOptions().series} 
            type="bar" 
            height={350} 
          />
        </div>

        {/* Pie Chart Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Répartition des Galeries</h3>
            <span className="text-sm text-gray-500">Public vs Privé</span>
          </div>
          
          {mounted && (
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{galeriesPubliques}</div>
                  <div className="text-sm text-blue-600 font-medium">Publiques</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{galeriesPrivees}</div>
                  <div className="text-sm text-purple-600 font-medium">Privées</div>
                </div>
              </div>

              {/* Chart */}
              {galeriesPubliques + galeriesPrivees > 0 ? (
                <div className="relative">
                  <div className="mx-auto" style={{ maxWidth: '280px' }}>
                    <ApexChartClient
                      getOptions={() => ({
                        chart: {
                          type: 'donut',
                          height: 280
                        },
                        labels: ['Galeries Publiques', 'Galeries Privées'],
                        colors: ['#3b82f6', '#8b5cf6'],
                        legend: {
                          position: 'bottom',
                          fontSize: '13px'
                        },
                        dataLabels: {
                          enabled: true,
                          dropShadow: { enabled: false },
                          style: {
                            fontSize: '13px',
                            fontWeight: 600
                          }
                        },
                        plotOptions: {
                          pie: {
                            donut: {
                              size: '65%',
                              labels: {
                                show: true,
                                total: {
                                  show: true,
                                  label: 'Total',
                                  fontSize: '16px',
                                  fontWeight: 600
                                }
                              }
                            }
                          }
                        }
                      })}
                      series={[galeriesPubliques, galeriesPrivees]}
                      type="donut"
                      height={280}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">Aucune donnée disponible</div>
                  <div className="text-gray-500 text-sm">Les galeries apparaîtront ici une fois créées</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GaleriesStats;