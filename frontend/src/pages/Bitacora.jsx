import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { ShieldAlert, Filter, Calendar, User, Clock } from 'lucide-react';

export default function Bitacora() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tabla, setTabla] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tabla) params.tabla = tabla;
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const res = await api.get('/bitacora', { params });
      setLogs(res.data);
    } catch (err) {
      console.error('Error al cargar bitácora:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A' }}>
          Bitácora del Sistema (Gobernanza y Auditoría)
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
          Registro automatizado mediante triggers PL/pgSQL para acciones sensibles (creación de auditorías, cambios de estado, ajustes manuales de madurez y cambios de usuario).
        </p>
      </div>

      {/* Filter Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label className="form-label">Tabla Afectada</label>
            <select className="form-select" value={tabla} onChange={(e) => setTabla(e.target.value)}>
              <option value="">Todas las tablas</option>
              <option value="auditoria">auditoria</option>
              <option value="madurez_control">madurez_control</option>
              <option value="usuario">usuario</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label className="form-label">Fecha Desde</label>
            <input
              type="date"
              className="form-input"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label className="form-label">Fecha Hasta</label>
            <input
              type="date"
              className="form-input"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary">
              <Filter size={16} />
              <span>Filtrar Logs</span>
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Cargando eventos de la bitácora...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>No hay registros de bitácora coincidentes.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha / Hora</th>
                  <th>Usuario Activo</th>
                  <th>Tabla Afectada</th>
                  <th>ID Reg.</th>
                  <th>Acción</th>
                  <th>Detalle del Evento</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  let badgeAccion = 'badge-blue';
                  if (log.accion === 'INSERT') badgeAccion = 'badge-green';
                  if (log.accion === 'UPDATE') badgeAccion = 'badge-yellow';
                  if (log.accion === 'DELETE') badgeAccion = 'badge-red';

                  return (
                    <tr key={log.id_bitacora}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                        {new Date(log.fecha_evento).toLocaleString('es-ES')}
                      </td>
                      <td>
                        <strong>{log.nombre_usuario || 'Sistema / Trigger'}</strong>
                        {log.correo_usuario && (
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{log.correo_usuario}</div>
                        )}
                      </td>
                      <td>
                        <code>{log.tabla_afectada}</code>
                      </td>
                      <td>#{log.id_registro_afectado}</td>
                      <td>
                        <span className={`badge ${badgeAccion}`}>{log.accion}</span>
                      </td>
                      <td style={{ maxWidth: '360px', wordBreak: 'break-word', fontSize: '0.8125rem' }}>
                        {log.detalle}
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
