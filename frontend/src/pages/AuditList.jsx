import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { ClipboardList, PlusCircle, FileText, BarChart2, CheckCircle2, PlayCircle } from 'lucide-react';

export default function AuditList() {
  const [auditorias, setAuditorias] = useState([]);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem('jalfo_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isDba = user?.nombre_rol === 'DBA';

  const fetchAuditorias = async () => {
    try {
      const res = await api.get('/auditorias');
      setAuditorias(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditorias();
  }, []);

  const handleStatusChange = async (id_auditoria, id_estado) => {
    try {
      await api.put(`/auditorias/${id_auditoria}/estado`, { id_estado });
      fetchAuditorias();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar estado de auditoría');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A' }}>Auditorías de Seguridad ISO 27002</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>Evaluaciones de controles de bases de datos y cálculo de exposición al riesgo.</p>
        </div>
        {!isDba && (
          <Link to="/auditorias/nueva" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Nueva Auditoría</span>
          </Link>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Cargando auditorías...</div>
        ) : auditorias.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>No hay auditorías registradas.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Organización</th>
                  <th>Área Evaluada</th>
                  <th>Fecha</th>
                  <th>Auditor Asignado</th>
                  <th>DBA Entrevistado</th>
                  <th>Estado</th>
                  <th>IGER (%)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {auditorias.map((a) => {
                  let badgeClass = 'badge-yellow';
                  if (a.nombre_estado === 'Finalizada') badgeClass = 'badge-green';
                  if (a.nombre_estado === 'Borrador') badgeClass = 'badge-blue';

                  return (
                    <tr key={a.id_auditoria}>
                      <td>
                        <strong>#{a.id_auditoria}</strong>
                      </td>
                      <td>
                        <strong>{a.nombre_organizacion}</strong>
                      </td>
                      <td>{a.area_evaluada}</td>
                      <td>{new Date(a.fecha_auditoria).toLocaleDateString('es-ES')}</td>
                      <td>{a.nombre_auditor}</td>
                      <td>{a.nombre_dba}</td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{a.nombre_estado}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: a.iger > 50 ? '#EF4444' : '#10B981' }}>
                          {a.iger ? `${parseFloat(a.iger).toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          {!isDba && a.nombre_estado !== 'Finalizada' && (
                            <Link to={`/auditorias/${a.id_auditoria}/cuestionario`} className="btn btn-primary btn-sm" title="Llenar/Editar Cuestionario">
                              <ClipboardList size={14} />
                              <span>Cuestionario</span>
                            </Link>
                          )}

                          <Link to={`/auditorias/${a.id_auditoria}/resultados`} className="btn btn-secondary btn-sm" title="Ver Resultados e Indicadores">
                            <BarChart2 size={14} />
                            <span>Resultados</span>
                          </Link>

                          <Link to={`/auditorias/${a.id_auditoria}/reporte`} className="btn btn-secondary btn-sm" title="Reporte Ejecutivo PDF">
                            <FileText size={14} />
                            <span>Reporte</span>
                          </Link>

                          {!isDba && a.nombre_estado === 'En progreso' && (
                            <button
                              onClick={() => handleStatusChange(a.id_auditoria, 3)} // 3 = Finalizada
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#065F46', borderColor: '#10B981' }}
                              title="Marcar como Finalizada"
                            >
                              <CheckCircle2 size={14} />
                              <span>Finalizar</span>
                            </button>
                          )}
                        </div>
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
