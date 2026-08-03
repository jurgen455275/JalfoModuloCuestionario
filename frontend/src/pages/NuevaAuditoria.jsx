import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, Save, ShieldAlert } from 'lucide-react';

export default function NuevaAuditoria() {
  const navigate = useNavigate();
  const [organizaciones, setOrganizaciones] = useState([]);
  const [dbas, setDbas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    id_organizacion: '',
    id_dba: '',
    area_evaluada: '',
    fecha_auditoria: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userStr = localStorage.getItem('jalfo_user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    async function fetchData() {
      try {
        const [orgRes, usrRes] = await Promise.all([
          api.get('/organizaciones'),
          api.get('/usuarios'),
        ]);

        setOrganizaciones(orgRes.data);

        // Filter valid candidates for DBA (must not be current auditor)
        const validDbas = usrRes.data.filter((u) => u.id_usuario !== currentUser.id_usuario);
        setDbas(validDbas);

        if (orgRes.data.length > 0) {
          setFormData((prev) => ({ ...prev, id_organizacion: orgRes.data[0].id_organizacion }));
        }
        if (validDbas.length > 0) {
          setFormData((prev) => ({ ...prev, id_dba: validDbas[0].id_usuario }));
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (parseInt(currentUser.id_usuario, 10) === parseInt(formData.id_dba, 10)) {
      setError('El auditor asignado y el DBA entrevistado no pueden ser la misma persona.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/auditorias', formData);
      navigate(`/auditorias/${res.data.id_auditoria}/cuestionario`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la auditoría');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/auditorias" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#64748B', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          <ArrowLeft size={16} />
          <span>Volver a lista de auditorías</span>
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A' }}>Crear Nueva Auditoría ISO 27002</h1>
        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>Registrar evaluación de seguridad para una organización.</p>
      </div>

      <div className="card">
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEE2E2', border: '1px solid #EF4444', color: '#B91C1C', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Cargando catálogo de organizaciones y usuarios...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Organización Evaluada *</label>
              <select
                className="form-select"
                value={formData.id_organizacion}
                onChange={(e) => setFormData({ ...formData, id_organizacion: e.target.value })}
                required
              >
                {organizaciones.map((o) => (
                  <option key={o.id_organizacion} value={o.id_organizacion}>
                    {o.nombre} {o.sector ? `(${o.sector})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Área Evaluada *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Infraestructura de BD Producción, Core Bancario"
                value={formData.area_evaluada}
                onChange={(e) => setFormData({ ...formData, area_evaluada: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">DBA / Administrador de BD Entrevistado *</label>
              <select
                className="form-select"
                value={formData.id_dba}
                onChange={(e) => setFormData({ ...formData, id_dba: e.target.value })}
                required
              >
                {dbas.map((u) => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {u.nombre_completo} ({u.nombre_rol})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                Nota: Por norma de independencia, el auditor ({currentUser?.nombre_completo}) no puede ser la misma persona elegida como DBA.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Auditoría *</label>
              <input
                type="date"
                className="form-input"
                value={formData.fecha_auditoria}
                onChange={(e) => setFormData({ ...formData, fecha_auditoria: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
              <Link to="/auditorias" className="btn btn-secondary">
                Cancelar
              </Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Save size={18} />
                <span>{submitting ? 'Creando...' : 'Crear e Iniciar Cuestionario'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
