import React, { useContext } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const navigation = [
    {
      name: 'Tableau de bord',
      path: '/',
      icon: '📊'
    },
    {
      name: 'Machines',
      path: '/machines',
      icon: '⚙️'
    },
    {
      name: 'Import de données',
      path: '/upload',
      icon: '📤'
    },
    {
      name: 'Prédictions IA',
      path: '/predictions',
      icon: '🤖'
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: '📈'
    }
  ];

  return (
    <div className="layout-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">FactorySight</h2>
          <p className="sidebar-subtitle">Analytics Platform</p>
        </div>

        <ul className="nav-menu">
          {navigation.map((item) => (
            <li key={item.path} className="nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `nav-link ${isActive || (item.path === '/' && location.pathname === '/') ? 'active' : ''}`
                }
                data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="user-section">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <h4>{user?.username || 'User'}</h4>
              <p>{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="logout-btn"
            data-testid="logout-btn"
          >
            Déconnexion
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;