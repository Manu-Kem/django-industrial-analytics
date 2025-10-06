import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [timeRange, setTimeRange] = useState(30);
  const [trendsData, setTrendsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMachines();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [selectedMachine, timeRange]);

  const loadMachines = async () => {
    try {
      const response = await axios.get(`${API}/machines`);
      setMachines(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des machines');
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        days: timeRange.toString()
      });
      
      if (selectedMachine) {
        params.append('machine_id', selectedMachine);
      }
      
      const response = await axios.get(`${API}/analytics/trends?${params}`);
      setTrendsData(response.data.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Évolution des performances dans le temps',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Production et temps d\'arrêt par jour',
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Distribution du temps d\'arrêt',
      },
    },
  };

  // Prepare chart data
  const lineChartData = {
    labels: trendsData.map(item => new Date(item.date).toLocaleDateString('fr-FR')),
    datasets: [
      {
        label: 'OEE (%)',
        data: trendsData.map(item => item.oee),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Efficacité (%)',
        data: trendsData.map(item => item.efficiency),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const barChartData = {
    labels: trendsData.map(item => new Date(item.date).toLocaleDateString('fr-FR')),
    datasets: [
      {
        label: 'Production (unités)',
        data: trendsData.map(item => item.output),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        yAxisID: 'y',
      },
      {
        label: 'Temps d\'arrêt (heures)',
        data: trendsData.map(item => item.downtime),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        yAxisID: 'y1',
      },
    ],
  };

  // Calculate downtime distribution
  const downtimeRanges = {
    'Faible (0-10h)': 0,
    'Moyen (10-30h)': 0,
    'Élevé (30-50h)': 0,
    'Critique (>50h)': 0
  };

  trendsData.forEach(item => {
    const downtime = item.downtime;
    if (downtime <= 10) downtimeRanges['Faible (0-10h)']++;
    else if (downtime <= 30) downtimeRanges['Moyen (10-30h)']++;
    else if (downtime <= 50) downtimeRanges['Élevé (30-50h)']++;
    else downtimeRanges['Critique (>50h)']++;
  });

  const doughnutData = {
    labels: Object.keys(downtimeRanges),
    datasets: [
      {
        data: Object.values(downtimeRanges),
        backgroundColor: [
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#7c2d12'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      },
    ],
  };

  // Calculate statistics
  const calculateStats = () => {
    if (trendsData.length === 0) return null;
    
    const avgOEE = trendsData.reduce((sum, item) => sum + item.oee, 0) / trendsData.length;
    const avgEfficiency = trendsData.reduce((sum, item) => sum + item.efficiency, 0) / trendsData.length;
    const totalOutput = trendsData.reduce((sum, item) => sum + item.output, 0);
    const totalDowntime = trendsData.reduce((sum, item) => sum + item.downtime, 0);
    const avgDowntime = totalDowntime / trendsData.length;
    
    const maxOEE = Math.max(...trendsData.map(item => item.oee));
    const minOEE = Math.min(...trendsData.map(item => item.oee));
    
    return {
      avgOEE: avgOEE.toFixed(1),
      avgEfficiency: avgEfficiency.toFixed(1),
      totalOutput: totalOutput.toFixed(0),
      totalDowntime: totalDowntime.toFixed(1),
      avgDowntime: avgDowntime.toFixed(1),
      maxOEE: maxOEE.toFixed(1),
      minOEE: minOEE.toFixed(1),
      oeeVariation: (maxOEE - minOEE).toFixed(1)
    };
  };

  const stats = calculateStats();

  const selectedMachineName = machines.find(m => m.id === selectedMachine)?.name || 'Toutes les machines';

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Analytics avancées</h1>
        <p className="page-subtitle">
          Analyse approfondie des données de performance industrielle
        </p>
      </div>

      {error && (
        <div className="error-message" data-testid="analytics-error">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="controls-section">
        <div className="controls-grid">
          <div className="form-group">
            <label className="form-label">Machine à analyser</label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="form-input"
              data-testid="analytics-machine-select"
            >
              <option value="">Toutes les machines</option>
              {machines.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {machine.name} ({machine.type})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Période d'analyse</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="form-input"
              data-testid="analytics-time-range"
            >
              <option value={7}>7 derniers jours</option>
              <option value={14}>14 derniers jours</option>
              <option value={30}>30 derniers jours</option>
              <option value={60}>60 derniers jours</option>
            </select>
          </div>
          
          <button
            onClick={loadAnalytics}
            className="btn btn-primary"
            disabled={loading}
            data-testid="refresh-analytics-btn"
          >
            {loading ? '🔄 Chargement...' : '📊 Actualiser'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="kpi-grid" data-testid="analytics-stats">
          <div className="kpi-card">
            <div className="kpi-icon oee">📊</div>
            <div className="kpi-title">OEE Moyen</div>
            <div className="kpi-value">
              {stats.avgOEE}
              <span className="kpi-unit">%</span>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon efficiency">⚡</div>
            <div className="kpi-title">Efficacité Moyenne</div>
            <div className="kpi-value">
              {stats.avgEfficiency}
              <span className="kpi-unit">%</span>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon output">📦</div>
            <div className="kpi-title">Production Totale</div>
            <div className="kpi-value">
              {stats.totalOutput}
              <span className="kpi-unit">unités</span>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon downtime">⏰</div>
            <div className="kpi-title">Temps d'arrêt Total</div>
            <div className="kpi-value">
              {stats.totalDowntime}
              <span className="kpi-unit">h</span>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon mtbf">📈</div>
            <div className="kpi-title">Variation OEE</div>
            <div className="kpi-value">
              {stats.oeeVariation}
              <span className="kpi-unit">%</span>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon machines">🎯</div>
            <div className="kpi-title">Échantillons</div>
            <div className="kpi-value">
              {trendsData.length}
              <span className="kpi-unit">jours</span>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Header */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            📈 Analyse pour: {selectedMachineName}
          </h3>
          <p className="chart-subtitle">
            Période: {timeRange} derniers jours • {trendsData.length} points de données
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: '#ffffff', marginTop: '1rem' }}>
            Chargement des analytics...
          </p>
        </div>
      ) : trendsData.length === 0 ? (
        <div className="chart-container" data-testid="no-analytics-data">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
              Aucune donnée disponible
            </h3>
            <p style={{ color: '#6b7280' }}>
              Aucune donnée de production trouvée pour la période et la machine sélectionnées.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Line Chart - Performance Trends */}
          <div className="chart-container" data-testid="performance-trends-chart">
            <div className="chart-header">
              <h3 className="chart-title">Tendances de performance</h3>
              <p className="chart-subtitle">
                Évolution de l'OEE et de l'efficacité dans le temps
              </p>
            </div>
            <div style={{ height: '400px' }}>
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Bar Chart - Production vs Downtime */}
          <div className="chart-container" data-testid="production-downtime-chart">
            <div className="chart-header">
              <h3 className="chart-title">Production vs Temps d'arrêt</h3>
              <p className="chart-subtitle">
                Corrélation entre production quotidienne et temps d'arrêt
              </p>
            </div>
            <div style={{ height: '400px' }}>
              <Bar 
                data={barChartData} 
                options={{
                  ...barChartOptions,
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: {
                        display: true,
                        text: 'Production (unités)'
                      }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      title: {
                        display: true,
                        text: 'Temps d\'arrêt (heures)'
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                    }
                  }
                }} 
              />
            </div>
          </div>

          {/* Doughnut Chart - Downtime Distribution */}
          <div className="chart-container" data-testid="downtime-distribution-chart">
            <div className="chart-header">
              <h3 className="chart-title">Distribution du temps d'arrêt</h3>
              <p className="chart-subtitle">
                Répartition des jours par niveau de temps d'arrêt
              </p>
            </div>
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </>
      )}

      {/* Insights Section */}
      {stats && (
        <div className="chart-container" data-testid="analytics-insights">
          <div className="chart-header">
            <h3 className="chart-title">💡 Insights automatiques</h3>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem' 
          }}>
            {/* Performance Insight */}
            <div style={{ 
              background: stats.avgOEE >= 80 ? '#d1fae5' : stats.avgOEE >= 60 ? '#fef3c7' : '#fee2e2', 
              padding: '1rem', 
              borderRadius: '8px',
              border: `1px solid ${stats.avgOEE >= 80 ? '#bbf7d0' : stats.avgOEE >= 60 ? '#fde047' : '#fca5a5'}`
            }}>
              <h4 style={{ 
                color: stats.avgOEE >= 80 ? '#14532d' : stats.avgOEE >= 60 ? '#713f12' : '#991b1b', 
                marginBottom: '0.5rem' 
              }}>
                {stats.avgOEE >= 80 ? '✅ Performance excellente' : stats.avgOEE >= 60 ? '⚠️ Performance acceptable' : '🚨 Performance à améliorer'}
              </h4>
              <p style={{ 
                color: stats.avgOEE >= 80 ? '#166534' : stats.avgOEE >= 60 ? '#a16207' : '#991b1b', 
                fontSize: '0.875rem' 
              }}>
                OEE moyen de {stats.avgOEE}% sur la période. 
                {stats.avgOEE >= 80 ? ' Excellente efficacité maintenue.' : 
                 stats.avgOEE >= 60 ? ' Des améliorations sont possibles.' : 
                 ' Action corrective nécessaire.'}
              </p>
            </div>
            
            {/* Stability Insight */}
            <div style={{ 
              background: stats.oeeVariation <= 10 ? '#d1fae5' : stats.oeeVariation <= 20 ? '#fef3c7' : '#fee2e2', 
              padding: '1rem', 
              borderRadius: '8px',
              border: `1px solid ${stats.oeeVariation <= 10 ? '#bbf7d0' : stats.oeeVariation <= 20 ? '#fde047' : '#fca5a5'}`
            }}>
              <h4 style={{ 
                color: stats.oeeVariation <= 10 ? '#14532d' : stats.oeeVariation <= 20 ? '#713f12' : '#991b1b', 
                marginBottom: '0.5rem' 
              }}>
                {stats.oeeVariation <= 10 ? '📊 Performance stable' : stats.oeeVariation <= 20 ? '📈 Variation modérée' : '📉 Forte instabilité'}
              </h4>
              <p style={{ 
                color: stats.oeeVariation <= 10 ? '#166534' : stats.oeeVariation <= 20 ? '#a16207' : '#991b1b', 
                fontSize: '0.875rem' 
              }}>
                Variation OEE de {stats.oeeVariation}% (min: {stats.minOEE}%, max: {stats.maxOEE}%). 
                {stats.oeeVariation <= 10 ? ' Performance très stable.' : 
                 stats.oeeVariation <= 20 ? ' Stabilité acceptable.' : 
                 ' Forte variabilité nécessitant une investigation.'}
              </p>
            </div>
            
            {/* Downtime Insight */}
            <div style={{ 
              background: stats.avgDowntime <= 15 ? '#d1fae5' : stats.avgDowntime <= 30 ? '#fef3c7' : '#fee2e2', 
              padding: '1rem', 
              borderRadius: '8px',
              border: `1px solid ${stats.avgDowntime <= 15 ? '#bbf7d0' : stats.avgDowntime <= 30 ? '#fde047' : '#fca5a5'}`
            }}>
              <h4 style={{ 
                color: stats.avgDowntime <= 15 ? '#14532d' : stats.avgDowntime <= 30 ? '#713f12' : '#991b1b', 
                marginBottom: '0.5rem' 
              }}>
                {stats.avgDowntime <= 15 ? '⚡ Faible temps d\'arrêt' : stats.avgDowntime <= 30 ? '⏰ Temps d\'arrêt modéré' : '🛑 Temps d\'arrêt élevé'}
              </h4>
              <p style={{ 
                color: stats.avgDowntime <= 15 ? '#166534' : stats.avgDowntime <= 30 ? '#a16207' : '#991b1b', 
                fontSize: '0.875rem' 
              }}>
                Temps d'arrêt moyen de {stats.avgDowntime}h/jour. 
                {stats.avgDowntime <= 15 ? ' Excellent taux de disponibilité.' : 
                 stats.avgDowntime <= 30 ? ' Taux de disponibilité acceptable.' : 
                 ' Temps d\'arrêt excessif impactant la productivité.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;