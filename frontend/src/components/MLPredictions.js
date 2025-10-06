import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MLPredictions = () => {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trainLoading, setTrainLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modelTrained, setModelTrained] = useState(false);

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      const response = await axios.get(`${API}/machines`);
      setMachines(response.data);
      if (response.data.length > 0 && !selectedMachine) {
        setSelectedMachine(response.data[0].id);
      }
    } catch (err) {
      setError('Erreur lors du chargement des machines');
    }
  };

  const trainModel = async () => {
    try {
      setTrainLoading(true);
      setError('');
      setSuccess('');
      
      const response = await axios.post(`${API}/ml/train`);
      setSuccess(`Modèle entraîné avec succès! R² Score: ${response.data.efficiency_r2_score.toFixed(3)}, Échantillons d'entraînement: ${response.data.training_samples}`);
      setModelTrained(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'entraînement du modèle');
    } finally {
      setTrainLoading(false);
    }
  };

  const generatePredictions = async (daysAhead = 7) => {
    if (!selectedMachine) {
      setError('Veuillez sélectionner une machine');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API}/ml/predict/${selectedMachine}?days_ahead=${daysAhead}`);
      setPredictions(response.data);
      setSuccess(`${response.data.length} prédictions générées avec succès`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la génération des prédictions');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingPredictions = async () => {
    if (!selectedMachine) return;
    
    try {
      const response = await axios.get(`${API}/predictions/${selectedMachine}`);
      setPredictions(response.data);
    } catch (err) {
      console.error('Error loading predictions:', err);
    }
  };

  useEffect(() => {
    if (selectedMachine) {
      loadExistingPredictions();
    }
  }, [selectedMachine]);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#10b981'; // Green
    if (confidence >= 0.6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return 'Élevée';
    if (confidence >= 0.6) return 'Moyenne';
    return 'Faible';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Prédictions IA</h1>
        <p className="page-subtitle">
          Analyse prédictive des performances industrielles avec machine learning
        </p>
      </div>

      {error && (
        <div className="error-message" data-testid="predictions-error">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" data-testid="predictions-success">
          {success}
        </div>
      )}

      {/* Model Training Section */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">🤖 Entraînement du modèle ML</h3>
          <p className="chart-subtitle">
            Entraînez le modèle de machine learning sur les données historiques pour générer des prédictions
          </p>
        </div>
        
        <div className="controls-grid">
          <button
            onClick={trainModel}
            className="btn btn-primary"
            disabled={trainLoading}
            data-testid="train-model-btn"
          >
            {trainLoading ? '🔄 Entraînement en cours...' : '🎯 Entraîner le modèle'}
          </button>
          
          <div style={{ 
            padding: '0.75rem', 
            background: modelTrained ? '#d1fae5' : '#f3f4f6', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ 
              color: modelTrained ? '#065f46' : '#6b7280',
              fontWeight: '600'
            }}>
              {modelTrained ? '✅ Modèle entraîné' : '⏳ Modèle non entraîné'}
            </span>
          </div>
        </div>
      </div>

      {/* Prediction Controls */}
      <div className="controls-section">
        <div className="controls-grid">
          <div className="form-group">
            <label className="form-label">Machine à analyser</label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="form-input"
              data-testid="machine-select"
            >
              <option value="">Sélectionner une machine</option>
              {machines.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {machine.name} ({machine.type})
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => generatePredictions(7)}
            className="btn btn-success"
            disabled={loading || !selectedMachine}
            data-testid="generate-predictions-btn"
          >
            {loading ? '🔄 Génération...' : '📊 Prédictions 7 jours'}
          </button>
          
          <button
            onClick={() => generatePredictions(14)}
            className="btn btn-secondary"
            disabled={loading || !selectedMachine}
            data-testid="generate-14day-predictions-btn"
          >
            📈 Prédictions 14 jours
          </button>
        </div>
      </div>

      {/* Predictions Display */}
      {predictions.length > 0 && (
        <div className="chart-container" data-testid="predictions-results">
          <div className="chart-header">
            <h3 className="chart-title">📅 Prédictions générées</h3>
            <p className="chart-subtitle">
              Prévisions de performance pour la machine sélectionnée
            </p>
          </div>
          
          <div className="prediction-grid">
            {predictions.map((prediction, index) => (
              <div key={prediction.id || index} className="prediction-card">
                <div className="prediction-date">
                  {formatDate(prediction.date)}
                </div>
                
                <div className="prediction-metrics">
                  <div className="prediction-metric">
                    <div className="metric-label">Efficacité prédite</div>
                    <div className="metric-value" style={{ color: '#3b82f6' }}>
                      {prediction.predicted_efficiency}%
                    </div>
                  </div>
                  
                  <div className="prediction-metric">
                    <div className="metric-label">OEE prédit</div>
                    <div className="metric-value" style={{ color: '#10b981' }}>
                      {prediction.predicted_oee}%
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: '0.75rem',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    marginBottom: '0.25rem' 
                  }}>
                    Confiance: {getConfidenceText(prediction.confidence)}
                  </div>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{ 
                        width: `${prediction.confidence * 100}%`,
                        background: getConfidenceColor(prediction.confidence)
                      }}
                    />
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#9ca3af', 
                    marginTop: '0.25rem' 
                  }}>
                    {(prediction.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ML Info Section */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">ℹ️ À propos du modèle ML</h3>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ 
            background: '#f0f9ff', 
            padding: '1rem', 
            borderRadius: '8px',
            border: '1px solid #bae6fd'
          }}>
            <h4 style={{ color: '#0c4a6e', marginBottom: '0.5rem' }}>🧠 Algorithme</h4>
            <p style={{ color: '#075985', fontSize: '0.875rem' }}>
              Random Forest Regressor avec des caractéristiques basées sur la production historique, 
              le jour de la semaine et le mois.
            </p>
          </div>
          
          <div style={{ 
            background: '#f0fdf4', 
            padding: '1rem', 
            borderRadius: '8px',
            border: '1px solid #bbf7d0'
          }}>
            <h4 style={{ color: '#14532d', marginBottom: '0.5rem' }}>📊 Variables prédites</h4>
            <p style={{ color: '#166534', fontSize: '0.875rem' }}>
              • Efficacité de production<br/>
              • OEE (Overall Equipment Effectiveness)<br/>
              • Niveau de confiance des prédictions
            </p>
          </div>
          
          <div style={{ 
            background: '#fefce8', 
            padding: '1rem', 
            borderRadius: '8px',
            border: '1px solid #fde047'
          }}>
            <h4 style={{ color: '#713f12', marginBottom: '0.5rem' }}>⚠️ Précautions</h4>
            <p style={{ color: '#a16207', fontSize: '0.875rem' }}>
              Les prédictions sont basées sur les données historiques. 
              La précision diminue avec l'horizon temporel.
            </p>
          </div>
        </div>
      </div>

      {/* No data state */}
      {machines.length === 0 && (
        <div className="chart-container" data-testid="no-machines-ml">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
              Aucune machine disponible
            </h3>
            <p style={{ color: '#6b7280' }}>
              Ajoutez des machines et des données de production pour utiliser les prédictions IA.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MLPredictions;