import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [trendsData, setTrendsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // First try to get dashboard data
      const dashboardResponse = await axios.get(`${API}/dashboard`);
      setKpis(dashboardResponse.data);
      
      // Get trends data
      const trendsResponse = await axios.get(`${API}/analytics/trends?days=14`);
      setTrendsData(trendsResponse.data.data || []);
      
      setError('');
    } catch (err) {
      console.error('Error loading dashboard:', err);
      if (err.response?.status === 500 || (kpis && kpis.total_machines === 0)) {
        // Likely no data, suggest initialization
        setError('no_data');
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeSampleData = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/init-sample-data`);
      setHasInitialized(true);
      // Reload data after initialization
      await loadDashboardData();
    } catch (err) {
      setError('Failed to initialize sample data');
    } finally {
      setLoading(false);
    }
  };

  const generateRealtimeData = async () => {
    try {
      await axios.post(`${API}/simulate-data`);
      await loadDashboardData();
    } catch (err) {
      console.error('Error generating realtime data:', err);
    }
  };

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tendances de performance (14 derniers jours)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const chartData = {
    labels: trendsData.map(item => new Date(item.date).toLocaleDateString('fr-FR')),
    datasets: [
      {
        label: 'OEE (%)',
        data: trendsData.map(item => item.oee),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
      {
        label: 'Efficacité (%)',
        data: trendsData.map(item => item.efficiency),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
      },
    ],
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: '#ffffff', marginTop: '1rem' }}>
          Chargement du tableau de bord...
        </p>
      </div>
    );
  }

  if (error === 'no_data' || (kpis && kpis.total_machines === 0)) {
    return (
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <div className="controls-section">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
              Aucune donnée disponible
            </h3>
            <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
              Initialisez la plateforme avec des données d'exemple pour commencer à explorer les fonctionnalités.
            </p>
            {!hasInitialized && (
              <button
                onClick={initializeSampleData}
                className="btn btn-primary"
                disabled={loading}
                data-testid="init-sample-data-btn"
              >
                {loading ? 'Initialisation...' : 'Initialiser avec des données d\'exemple'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error && error !== 'no_data') {
    return (
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <div className="error-message" data-testid="dashboard-error">
          {error}
        </div>
        <button 
          onClick={loadDashboardData}
          className="btn btn-primary"
          data-testid="retry-btn"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">
          Vue d'ensemble de la performance industrielle
        </p>
      </div>

      <div className="controls-section">
        <div className="controls-grid">
          <button
            onClick={loadDashboardData}
            className="btn btn-secondary"
            data-testid="refresh-dashboard-btn"
          >
            🔄 Actualiser
          </button>
          <button
            onClick={generateRealtimeData}
            className="btn btn-success"
            data-testid="generate-data-btn"
          >
            📊 Générer données temps réel
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card" data-testid="machines-kpi">
          <div className="kpi-icon machines">⚙️</div>
          <div className="kpi-title">Total Machines</div>
          <div className="kpi-value">
            {kpis?.total_machines || 0}
          </div>
        </div>

        <div className="kpi-card" data-testid="oee-kpi">
          <div className="kpi-icon oee">📊</div>
          <div className="kpi-title">OEE Moyen</div>
          <div className="kpi-value">
            {kpis?.average_oee?.toFixed(1) || '0.0'}
            <span className="kpi-unit">%</span>
          </div>
        </div>

        <div className="kpi-card" data-testid="efficiency-kpi">
          <div className="kpi-icon efficiency">⚡</div>
          <div className="kpi-title">Efficacité</div>
          <div className="kpi-value">
            {kpis?.average_efficiency?.toFixed(1) || '0.0'}
            <span className="kpi-unit">%</span>
          </div>
        </div>

        <div className="kpi-card" data-testid="downtime-kpi">
          <div className="kpi-icon downtime">⏰</div>
          <div className="kpi-title">Temps d'arrêt</div>
          <div className="kpi-value">
            {kpis?.total_downtime?.toFixed(0) || '0'}
            <span className="kpi-unit">h</span>
          </div>
        </div>

        <div className="kpi-card" data-testid="output-kpi">
          <div className="kpi-icon output">📦</div>
          <div className="kpi-title">Production</div>
          <div className="kpi-value">
            {kpis?.production_output?.toFixed(0) || '0'}
            <span className="kpi-unit">unités</span>
          </div>
        </div>

        <div className="kpi-card" data-testid="mtbf-kpi">
          <div className="kpi-icon mtbf">🔧</div>
          <div className="kpi-title">MTBF</div>
          <div className="kpi-value">
            {kpis?.mtbf?.toFixed(0) || '0'}
            <span className="kpi-unit">h</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {trendsData.length > 0 && (
        <div className="chart-container" data-testid="trends-chart">
          <div className="chart-header">
            <h3 className="chart-title">Évolution des performances</h3>
            <p className="chart-subtitle">
              Analyse des tendances OEE et efficacité sur les 14 derniers jours
            </p>
          </div>
          <div style={{ height: '400px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {kpis?.maintenance_alerts > 0 && (
        <div className="chart-container" data-testid="maintenance-alerts">
          <div className="chart-header">
            <h3 className="chart-title">🚨 Alertes de maintenance</h3>
            <p className="chart-subtitle">
              {kpis.maintenance_alerts} machine(s) nécessitent une attention particulière
            </p>
          </div>
          <div style={{ 
            background: '#fef3c7', 
            padding: '1rem', 
            borderRadius: '8px',
            color: '#92400e'
          }}>
            <p>
              <strong>⚠️ Attention:</strong> Des machines présentent un temps d'arrêt élevé. 
              Consultez la section "Machines" pour plus de détails.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;