import ApexChartClient from '@/components/client-wrapper/ApexChartClient';
import { useState, useEffect } from 'react';

const GaleriesStats = ({ galeries = [], oeuvres = [] }) => {
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState('evolution');
  
  // Your existing data calculations remain the same...
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
    <div className="p-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytique des Créations</h2>
          <p className="text-gray-600 mt-2">Performance et répartition des galeries et œuvres en {currentYear}</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'evolution' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('evolution')}
          >
            Évolution
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'repartition' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('repartition')}
          >
            Répartition
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'evolution' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Évolution Mensuelle</h3>
                <p className="text-gray-600">Créations de galeries et œuvres sur l'année</p>
              </div>
              <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
                Année {currentYear}
              </span>
            </div>
            <ApexChartClient 
              getOptions={() => getBarChartOptions()} 
              series={getBarChartOptions().series} 
              type="bar" 
              height={350} 
            />
          </div>
        </div>
      )}

      {activeTab === 'repartition' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Stats Summary Cards */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Galeries Publiques</p>
                  <p className="text-3xl font-bold mt-1">{galeriesPubliques}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Galeries Privées</p>
                  <p className="text-3xl font-bold mt-1">{galeriesPrivees}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Répartition des Galeries</h3>
              <span className="text-sm text-gray-500">Public vs Privé</span>
            </div>
            
            {mounted && (
              <div className="space-y-6">
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
      )}
    </div>
  );
};

export default GaleriesStats;