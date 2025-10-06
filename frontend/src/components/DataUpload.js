import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DataUpload = () => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = (file) => {
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      setError('Veuillez sélectionner un fichier CSV');
      return;
    }
    
    uploadFile(file);
  };

  const uploadFile = async (file) => {
    try {
      setUploading(true);
      setError('');
      setUploadResult(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/upload-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const downloadTemplate = () => {
    const csvContent = `machine_id,date,output,downtime,efficiency,quality_rate
machine-001,2024-01-15,1200,15,85.5,0.96
machine-002,2024-01-15,980,25,78.2,0.94
machine-003,2024-01-15,1150,10,92.1,0.98`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'template_donnees_production.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Import de données</h1>
        <p className="page-subtitle">
          Importez vos données de production au format CSV
        </p>
      </div>

      {error && (
        <div className="error-message" data-testid="upload-error">
          {error}
        </div>
      )}

      {uploadResult && (
        <div className="success-message" data-testid="upload-success">
          ✅ Import réussi: {uploadResult.message}
          <br />
          <small>Lignes traitées: {uploadResult.total_rows}</small>
        </div>
      )}

      <div className="controls-section">
        <div className="controls-grid">
          <button
            onClick={downloadTemplate}
            className="btn btn-secondary"
            data-testid="download-template-btn"
          >
            📥 Télécharger le modèle CSV
          </button>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Format de fichier attendu</h3>
          <p className="chart-subtitle">
            Votre fichier CSV doit contenir les colonnes suivantes:
          </p>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Colonne</th>
                <th>Description</th>
                <th>Format</th>
                <th>Obligatoire</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>machine_id</strong></td>
                <td>Identifiant unique de la machine</td>
                <td>Texte</td>
                <td>✅ Oui</td>
              </tr>
              <tr>
                <td><strong>date</strong></td>
                <td>Date de la production</td>
                <td>YYYY-MM-DD</td>
                <td>✅ Oui</td>
              </tr>
              <tr>
                <td><strong>output</strong></td>
                <td>Quantité produite</td>
                <td>Nombre décimal</td>
                <td>✅ Oui</td>
              </tr>
              <tr>
                <td><strong>downtime</strong></td>
                <td>Temps d'arrêt (heures)</td>
                <td>Nombre décimal</td>
                <td>✅ Oui</td>
              </tr>
              <tr>
                <td><strong>efficiency</strong></td>
                <td>Efficacité (%)</td>
                <td>0-100</td>
                <td>✅ Oui</td>
              </tr>
              <tr>
                <td><strong>quality_rate</strong></td>
                <td>Taux de qualité</td>
                <td>0.0-1.0</td>
                <td>❌ Non (défaut: 1.0)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div 
          className={`upload-area ${dragOver ? 'dragover' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          data-testid="upload-area"
        >
          {uploading ? (
            <div>
              <div className="loading-spinner"></div>
              <p className="upload-text">Import en cours...</p>
            </div>
          ) : (
            <div>
              <div className="upload-icon">📁</div>
              <p className="upload-text">
                Glissez-déposez votre fichier CSV ici ou cliquez pour sélectionner
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="file-input"
                id="file-upload"
                data-testid="file-input"
              />
              <label 
                htmlFor="file-upload" 
                className="btn btn-primary"
                data-testid="select-file-btn"
              >
                Sélectionner un fichier
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">💡 Conseils pour l'import</h3>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ 
            background: '#f0f9ff', 
            padding: '1rem', 
            borderRadius: '8px',
            border: '1px solid #bae6fd'
          }}>
            <h4 style={{ color: '#0c4a6e', marginBottom: '0.5rem' }}>✅ Format</h4>
            <p style={{ color: '#075985', fontSize: '0.875rem' }}>
              Utilisez le séparateur virgule (,) et l'encodage UTF-8
            </p>
          </div>
          
          <div style={{ 
            background: '#f0fdf4', 
            padding: '1rem', 
            borderRadius: '8px',
            border: '1px solid #bbf7d0'
          }}>
            <h4 style={{ color: '#14532d', marginBottom: '0.5rem' }}>📊 Données</h4>
            <p style={{ color: '#166534', fontSize: '0.875rem' }}>
              Les calculs OEE sont automatiques basés sur vos données
            </p>
          </div>
          
          <div style={{ 
            background: '#fefce8', 
            padding: '1rem', 
            borderRadius: '8px',
            border: '1px solid #fde047'
          }}>
            <h4 style={{ color: '#713f12', marginBottom: '0.5rem' }}>🔄 Doublons</h4>
            <p style={{ color: '#a16207', fontSize: '0.875rem' }}>
              Les données existantes ne seront pas écrasées
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;