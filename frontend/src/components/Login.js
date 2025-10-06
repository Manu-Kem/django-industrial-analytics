import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleDemoLogin = () => {
    setFormData({
      email: 'admin@factory.com',
      password: 'admin123'
    });
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-header">
          <h1 className="login-title">FactorySight</h1>
          <p className="login-subtitle">
            Plateforme d'analyse prédictive industrielle
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            placeholder="Entrez votre email"
            required
            data-testid="email-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mot de passe</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            placeholder="Entrez votre mot de passe"
            required
            data-testid="password-input"
          />
        </div>

        {error && (
          <div className="error-message" data-testid="error-message">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="login-btn"
          disabled={loading}
          data-testid="login-submit-btn"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            data-testid="demo-login-btn"
          >
            Utiliser les identifiants de démonstration
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;