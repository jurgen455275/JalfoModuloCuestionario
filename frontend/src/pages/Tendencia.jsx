import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Building2, Calendar, Info } from 'lucide-react';

export default function Tendencia() {
  const [organizaciones, setOrganizaciones] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [tendenciaData, setTendenciaData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await api.get('/organizaciones');
        setOrganizaciones(res.data);
        if (res.data.length > 0) {
          setSelectedOrgId(res.data[0].id_organizacion);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrgs();
  }, []);

  useEffect(() => {
    if (!selectedOrgId) return;

    async function fetchTendencia() {
      try {
        const res = await api.get(`/tendencia/organizacion/${selectedOrgId}`);
        setTendenciaData(res.data);
      } catch (err) {
        console.error('Error al cargar tendencia:', err);
      }
    }
    fetchTendencia();
  }, [selectedOrgId]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A' }}>
          Comparativo Histórico de Auditorías (Tendencia)
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
          Evolución del Índice General de Riesgo (IGER) y nivel de madurez promedio a lo largo del tiempo.
        </p>
      </div>

      {/* Organization Selector */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            Seleccionar Organización:
          </label>
          <select
            className="form-select"
            style={{ maxWidth: '360px' }}
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
          >
            {organizaciones.map((o) => (
              <option key={o.id_organizacion} value={o.id_organizacion}>
                {o.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chart */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="#2563EB" />
            <span>Línea de Tiempo — IGER vs. Madurez Promedio</span>
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Info size={14} /> Solo se consideran auditorías en estado <strong>Finalizada</strong> (vista SQL <code>vw_tendencia_organizacion</code>).
          </span>
        </div>

        {tendenciaData.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            No hay auditorías en estado <strong>Finalizada</strong> registradas para esta organización.
          </div>
        ) : (
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={tendenciaData.map((d) => ({
                  ...d,
                  fecha: new Date(d.fecha_auditoria).toLocaleDateString('es-ES'),
                  iger_val: parseFloat(d.iger).toFixed(1),
                  madurez_val: parseFloat(d.madurez_promedio).toFixed(2),
                }))}
                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} unit="%" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="iger_val" name="Exposición IGER (%)" stroke="#EF4444" strokeWidth={3} dot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="madurez_val" name="Madurez Promedio (0-5)" stroke="#2563EB" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Historical Audits Table */}
      {tendenciaData.length > 0 && (
        <div className="card">
          <h2 className="card-title">Histórico de Evaluaciones Finalizadas</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID Auditoría</th>
                <th>Área Evaluada</th>
                <th>Fecha de Auditoría</th>
                <th>Madurez Promedio</th>
                <th>IGER (%)</th>
              </tr>
            </thead>
            <tbody>
              {tendenciaData.map((row) => (
                <tr key={row.id_auditoria}>
                  <td><strong>#{row.id_auditoria}</strong></td>
                  <td>{row.area_evaluada}</td>
                  <td>{new Date(row.fecha_auditoria).toLocaleDateString('es-ES')}</td>
                  <td><strong>{parseFloat(row.madurez_promedio).toFixed(2)}</strong> / 5.00</td>
                  <td>
                    <span style={{ fontWeight: 800, color: row.iger > 50 ? '#EF4444' : '#10B981' }}>
                      {parseFloat(row.iger).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
