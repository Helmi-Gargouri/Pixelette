import ApexChartClient from '@/components/client-wrapper/ApexChartClient';

const OeuvresChart = ({ oeuvres = [] }) => {
  // Calculer le nombre d'œuvres par mois de l'année en cours
  const currentYear = new Date().getFullYear();
  const monthlyData = Array(12).fill(0);
  
  oeuvres.forEach(oeuvre => {
    const date = new Date(oeuvre.date_ajout || oeuvre.created_at);
    if (date.getFullYear() === currentYear) {
      const month = date.getMonth();
      monthlyData[month]++;
    }
  });

  const getOeuvresChartOptions = () => ({
    series: [
      {
        name: 'Œuvres ajoutées',
        data: monthlyData
      }
    ],
    chart: {
      height: 350,
      type: 'area',
      toolbar: {
        show: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    },
    colors: ['#2b7fff'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      }
    },
    yaxis: {
      title: {
        text: 'Nombre d\'œuvres'
      }
    }
  });

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-xl font-semibold text-default-800">Évolution des Œuvres</h5>
          <div className="flex items-center gap-2">
            <span className="text-sm text-default-600">Année {currentYear}</span>
          </div>
        </div>
        <ApexChartClient 
          getOptions={getOeuvresChartOptions} 
          series={getOeuvresChartOptions().series} 
          type="area" 
          height={350} 
        />
      </div>
    </div>
  );
};

export default OeuvresChart;

