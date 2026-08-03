import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { ShieldCheck, Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { correo, contrasena });
      const { token, usuario } = response.data;

      localStorage.setItem('jalfo_token', token);
      localStorage.setItem('jalfo_user', JSON.stringify(usuario));

      navigate('/');
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError(err.response?.data?.error || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)', padding: '1.5rem' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', background: 'rgba(255, 255, 255, 0.95)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #38BDF8, #2563EB)', padding: '0.875rem', borderRadius: '16px', color: 'white', marginBottom: '1rem', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)' }}>
            <ShieldCheck size={36} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A' }}>Portal de Clientes</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.25rem' }}>JALFO Consulting — Evaluación ISO 27002</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '8px', color: '#B91C1C', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="usuario@jalfoconsulting.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar al Portal'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0', textAlign: 'center', fontSize: '0.8125rem', color: '#64748B' }}>
          <div><strong>Cuentas demo de prueba:</strong></div>
          <div style={{ marginTop: '0.375rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span>Admin: <code>admin@jalfoconsulting.com</code> / <code>admin123</code></span>
            <span>Auditor: <code>auditor@jalfoconsulting.com</code> / <code>auditor123</code></span>
            <span>DBA: <code>dba@jalfoconsulting.com</code> / <code>dba123</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}
