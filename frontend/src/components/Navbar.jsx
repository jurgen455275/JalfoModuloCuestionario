import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ExternalLink } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('jalfo_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('jalfo_token');
    localStorage.removeItem('jalfo_user');
    navigate('/login');
  };

  return (
    <header className="glass-nav" style={{ padding: '0.875rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <a
          href="https://jalfolandingpage-1.onrender.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#38BDF8', textDecoration: 'none', background: 'rgba(56, 189, 248, 0.1)', padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}
        >
          <span>Ir al Landing Corporativo</span>
          <ExternalLink size={14} />
        </a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <User size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{user.nombre_completo}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span className="badge badge-blue" style={{ fontSize: '0.6875rem', padding: '1px 6px' }}>{user.nombre_rol}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-sm"
          style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.2)' }}
          title="Cerrar sesión"
        >
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
}
