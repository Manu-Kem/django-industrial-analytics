import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Machines = () => {
  const [machines, setMachines] = useState([]);
  const [productionData, setProductionData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMachine, setNewMachine] = useState({
    name: '',
    type: '',
    site: '',
    status: 'operational'
  });

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      setLoading(true);
      const machinesResponse = await axios.get(`${API}/machines`);
      setMachines(machinesResponse.data);
      
      // Load production data for each machine
      const productionPromises = machinesResponse.data.map(async (machine) => {
        try {
          const prodResponse = await axios.get(`${API}/production?machine_id=${machine.id}&days=7`);
          return { machineId: machine.id, data: prodResponse.data };
        } catch {
          return { machineId: machine.id, data: [] };
        }
      });
      
      const productionResults = await Promise.all(productionPromises);
      const productionMap = {};
      productionResults.forEach(result => {
        productionMap[result.machineId] = result.data;
      });
      
      setProductionData(productionMap);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des machines');
      console.error('Error loading machines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMachine = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/machines`, newMachine);
      setNewMachine({ name: '', type: '', site: '', status: 'operational' });
      setShowAddForm(false);
      loadMachines();
    } catch (err) {
      setError('Erreur lors de l\'ajout de la machine');
    }
  };

  const calculateAverageOEE = (data) => {
    if (!data || data.length === 0) return 0;
    const total = data.reduce((sum, item) => sum + (item.oee || 0), 0);
    return (total / data.length).toFixed(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'status-operational';
      case 'maintenance':
        return 'status-maintenance';
      case 'offline':
        return 'status-offline';
      default:
        return 'status-operational';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'operational':
        return 'Opérationnel';
      case 'maintenance':
        return 'Maintenance';
      case 'offline':
        return 'Hors ligne';
      default:
        return 'Inconnu';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: '#ffffff', marginTop: '1rem' }}>
          Chargement des machines...
        </p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestion des machines</h1>
        <p className="page-subtitle">
          Vue d'ensemble et gestion du parc industriel
        </p>
      </div>

      {error && (
        <div className="error-message" data-testid="machines-error">
          {error}
        </div>
      )}

      <div className="controls-section">
        <div className="controls-grid">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
            data-testid="add-machine-btn"
          >
            {showAddForm ? '❌ Annuler' : '➕ Ajouter une machine'}
          </button>
          <button
            onClick={loadMachines}
            className="btn btn-secondary"
            data-testid="refresh-machines-btn"
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Add Machine Form */}
      {showAddForm && (
        <div className="chart-container" data-testid="add-machine-form">
          <div className="chart-header">
            <h3 className="chart-title">Ajouter une nouvelle machine</h3>
          </div>
          <form onSubmit={handleAddMachine} style={{ maxWidth: '500px' }}>
            <div className="form-group">
              <label className="form-label">Nom de la machine</label>
              <input
                type="text"
                value={newMachine.name}
                onChange={(e) => setNewMachine({...newMachine, name: e.target.value})}
                className="form-input"
                required
                data-testid="machine-name-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                value={newMachine.type}
                onChange={(e) => setNewMachine({...newMachine, type: e.target.value})}
                className="form-input"
                required
                data-testid="machine-type-select"
              >
                <option value="">Sélectionner un type</option>
                <option value="Conveyor">Convoyeur</option>
                <option value="Robot">Robot</option>
                <option value="Packaging">Emballage</option>
                <option value="Inspection">Inspection</option>
                <option value="Assembly">Assemblage</option>
                <option value="Welding">Soudure</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Site</label>
              <input
                type="text"
                value={newMachine.site}
                onChange={(e) => setNewMachine({...newMachine, site: e.target.value})}
                className="form-input"
                required
                data-testid="machine-site-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select
                value={newMachine.status}
                onChange={(e) => setNewMachine({...newMachine, status: e.target.value})}
                className="form-input"
                data-testid="machine-status-select"
              >
                <option value="operational">Opérationnel</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Hors ligne</option>
              </select>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              data-testid="submit-machine-btn"
            >
              Ajouter la machine
            </button>
          </form>
        </div>
      )}

      {/* Machines Grid */}
      {machines.length === 0 ? (
        <div className="chart-container" data-testid="no-machines">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
              Aucune machine trouvée
            </h3>
            <p style={{ color: '#6b7280' }}>
              Ajoutez votre première machine pour commencer à suivre les performances.
            </p>
          </div>
        </div>
      ) : (
        <div className="machine-grid">
          {machines.map((machine) => {
            const machineProduction = productionData[machine.id] || [];
            const avgOEE = calculateAverageOEE(machineProduction);
            const lastProduction = machineProduction[0];
            
            return (
              <div key={machine.id} className="machine-card" data-testid={`machine-${machine.id}`}>
                <div className="machine-header">
                  <div>
                    <h3 className="machine-name">{machine.name}</h3>
                    <p className="machine-type">{machine.type} • {machine.site}</p>
                  </div>
                  <span className={`status-badge ${getStatusColor(machine.status)}`}>
                    {getStatusText(machine.status)}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1rem',
                  marginTop: '1rem'
                }}>
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '0.75rem', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      OEE Moyen (7j)
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                      {avgOEE}%
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '0.75rem', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Dernière efficacité
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                      {lastProduction?.efficiency?.toFixed(1) || 'N/A'}
                      {lastProduction && '%'}
                    </div>
                  </div>
                </div>
                
                {lastProduction && (
                  <div style={{ 
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#f0f9ff',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ color: '#374151' }}>
                      <strong>Dernière production:</strong> {lastProduction.date}
                    </div>
                    <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>
                      Output: {lastProduction.output?.toFixed(0)} • 
                      Downtime: {lastProduction.downtime?.toFixed(0)}h
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Machines;