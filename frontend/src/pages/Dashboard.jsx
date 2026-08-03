import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { ClipboardList, Building2, CheckCircle, PlusCircle, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

export default function Dashboard() {
  const [auditorias, setAuditorias] = useState([]);
  const [organizaciones, setOrganizaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem('jalfo_user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    async function fetchData() {
      try {
        const [audRes, orgRes] = await Promise.all([
          api.get('/auditorias'),
          api.get('/organizaciones').catch(() => ({ data: [] })),
        ]);
        setAuditorias(audRes.data);
        setOrganizaciones(orgRes.data);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalFinalizadas = auditorias.filter((a) => a.nombre_estado === 'Finalizada').length;

  return (
    <div>
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ISO/IEC 27002:2022
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem' }}>
              Bienvenido, {user?.nombre_completo}
            </h1>
            <p style={{ opacity: 0.9, fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              Sistema de evaluación de madurez y gestión de exposición al riesgo para motores de bases de datos.
            </p>
          </div>

          {(user?.nombre_rol === 'Administrador del sistema' || user?.nombre_rol === 'Auditor') && (
            <Link to="/auditorias/nueva" className="btn" style={{ background: '#38BDF8', color: '#0F172A', fontWeight: 700 }}>
              <PlusCircle size={18} />
              <span>Nueva Auditoría</span>
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: '#DBEAFE', color: '#1E40AF', padding: '0.875rem', borderRadius: '12px' }}>
            <ClipboardList size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>Total Auditorías</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A' }}>{auditorias.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: '#D1FAE5', color: '#065F46', padding: '0.875rem', borderRadius: '12px' }}>
            <CheckCircle size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>Auditorías Finalizadas</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065F46' }}>{totalFinalizadas}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: '#FEF3C7', color: '#92400E', padding: '0.875rem', borderRadius: '12px' }}>
            <Building2 size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>Organizaciones Registradas</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#92400E' }}>{organizaciones.length}</div>
          </div>
        </div>
      </div>

      {/* Recent Audits Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="#2563EB" />
            <span>Auditorías Recientes</span>
          </h2>
          <Link to="/auditorias" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>Ver todas</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Cargando información...</div>
        ) : auditorias.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>No se han registrado auditorías aún.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organización</th>
                  <th>Área Evaluada</th>
                  <th>Fecha</th>
                  <th>Auditor</th>
                  <th>DBA Entrevistado</th>
                  <th>Estado</th>
                  <th>IGER (%)</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {auditorias.slice(0, 5).map((a) => {
                  let badgeClass = 'badge-yellow';
                  if (a.nombre_estado === 'Finalizada') badgeClass = 'badge-green';
                  if (a.nombre_estado === 'Borrador') badgeClass = 'badge-blue';

                  return (
                    <tr key={a.id_auditoria}>
                      <td><strong>{a.nombre_organizacion}</strong></td>
                      <td>{a.area_evaluada}</td>
                      <td>{new Date(a.fecha_auditoria).toLocaleDateString('es-ES')}</td>
                      <td>{a.nombre_auditor}</td>
                      <td>{a.nombre_dba}</td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{a.nombre_estado}</span>
                      </td>
                      <td>
                        <strong>{a.iger ? `${parseFloat(a.iger).toFixed(1)}%` : '—'}</strong>
                      </td>
                      <td>
                        <Link to={`/auditorias/${a.id_auditoria}/resultados`} className="btn btn-secondary btn-sm">
                          Ver Resultados
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
