import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import Heatmap, { getRiskLevel } from '../components/Heatmap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, ShieldAlert, FileText, Edit3, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Resultados() {
  const { id } = useParams();
  const [auditoria, setAuditoria] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Manual Adjustment Modal state
  const [selectedControl, setSelectedControl] = useState(null);
  const [madurezAjustada, setMadurezAjustada] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [adjustmentError, setAdjustmentError] = useState('');
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false);

  const userStr = localStorage.getItem('jalfo_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isDba = user?.nombre_rol === 'DBA';

  const fetchResultados = async () => {
    try {
      const [audRes, resRes] = await Promise.all([
        api.get(`/auditorias/${id}`),
        api.get(`/resultados/auditoria/${id}`),
      ]);
      setAuditoria(audRes.data);
      setData(resRes.data);
    } catch (err) {
      console.error('Error al cargar resultados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResultados();
  }, [id]);

  const handleOpenAdjustmentModal = (control) => {
    setSelectedControl(control);
    setMadurezAjustada(control.madurez_ajustada !== null ? control.madurez_ajustada : control.madurez_calculada);
    setJustificacion(control.justificacion_ajuste || '');
    setAdjustmentError('');
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    setAdjustmentError('');

    if (!justificacion || justificacion.trim() === '') {
      setAdjustmentError('Requisito obligatorio: Debe ingresar una justificación detallada para el ajuste manual.');
      return;
    }

    setSubmittingAdjustment(true);

    try {
      await api.put(`/madurez/auditoria/${id}/control/${selectedControl.id_control}`, {
        madurez_ajustada: parseFloat(madurezAjustada),
        justificacion_ajuste: justificacion.trim(),
      });

      setSelectedControl(null);
      fetchResultados();
    } catch (err) {
      setAdjustmentError(err.response?.data?.error || 'Error al guardar el ajuste de madurez');
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Calculando indicadores y cargando vistas SQL de riesgo...</div>;
  }

  const iger = parseFloat(data?.iger || 0);
  const riskClass = getRiskLevel(iger);
  const expSistema = data?.exposicion_sistema || {};

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/auditorias" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#64748B', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} />
            <span>Volver a lista de auditorías</span>
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A' }}>
            Resultados de Evaluación de Riesgo ISO 27002
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            Organización: <strong>{auditoria?.nombre_organizacion}</strong> · Área: <strong>{auditoria?.area_evaluada}</strong>
          </p>
        </div>

        <Link to={`/auditorias/${id}/reporte`} className="btn btn-primary">
          <FileText size={18} />
          <span>Ver Reporte Ejecutivo PDF</span>
        </Link>
      </div>

      {/* Main KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* IGER Score Card */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #1E3A8A, #0F172A)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.8, letterSpacing: '0.05em' }}>
            Índice General de Riesgo (IGER)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0.5rem 0', color: '#38BDF8' }}>
            {iger.toFixed(1)}%
          </div>
          <span className="badge" style={{ backgroundColor: riskClass.color, color: 'white', fontWeight: 700 }}>
            Nivel: {riskClass.level}
          </span>
        </div>

        {/* Confidentiality Exposure */}
        <div className="card">
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748B' }}>
            Exp. Confidencialidad
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563EB', marginTop: '0.375rem' }}>
            {parseFloat(expSistema.exposicion_confidencialidad || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
            Impacto en privacidad y cifrado de datos
          </div>
        </div>

        {/* Integrity Exposure */}
        <div className="card">
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748B' }}>
            Exp. Integridad
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', marginTop: '0.375rem' }}>
            {parseFloat(expSistema.exposicion_integridad || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
            Protección contra modificaciones no autorizadas
          </div>
        </div>

        {/* Availability Exposure */}
        <div className="card">
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748B' }}>
            Exp. Disponibilidad
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DC2626', marginTop: '0.375rem' }}>
            {parseFloat(expSistema.exposicion_disponibilidad || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
            Continuidad operativa y respaldos BD
          </div>
        </div>
      </div>

      {/* Chart & Domain Compliance */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 className="card-title">Cumplimiento y Exposición Promedio por Dominio Funcional</h2>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.resultados_dominios || []} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="nombre_dominio" tick={{ fontSize: 11, fill: '#475569' }} interval={0} angle={-15} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} unit="%" />
              <Tooltip formatter={(value) => `${parseFloat(value).toFixed(1)}%`} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="nivel_cumplimiento" name="Nivel Cumplimiento (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="exposicion_promedio" name="Exposición Promedio (%)" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Heatmap Component */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Mapa de Calor de Riesgo por Controles ISO 27002</h2>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Haz clic en un control para realizar un ajuste manual de madurez.</span>
        </div>
        <Heatmap items={data?.resultados_controles || []} type="control" onSelectControl={!isDba ? handleOpenAdjustmentModal : null} />
      </div>

      {/* Tops Tables (Highest Risk & Lowest Maturity) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Top Highest Risk Controls */}
        <div className="card">
          <h2 className="card-title" style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} />
            <span>Controles con Mayor Exposición al Riesgo</span>
          </h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Código ISO</th>
                <th>Control</th>
                <th>Exposición (%)</th>
              </tr>
            </thead>
            <tbody>
              {data?.top_mayor_exposicion?.map((c) => (
                <tr key={c.codigo_iso}>
                  <td><strong>ISO {c.codigo_iso}</strong></td>
                  <td>{c.nombre_control}</td>
                  <td>
                    <span style={{ fontWeight: 800, color: '#DC2626' }}>
                      {parseFloat(c.exposicion_promedio).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Lowest Maturity Controls */}
        <div className="card">
          <h2 className="card-title" style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={20} />
            <span>Controles con Menor Nivel de Madurez</span>
          </h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Código ISO</th>
                <th>Control</th>
                <th>Madurez Final</th>
              </tr>
            </thead>
            <tbody>
              {data?.top_menor_madurez?.map((c) => (
                <tr key={c.codigo_iso}>
                  <td><strong>ISO {c.codigo_iso}</strong></td>
                  <td>{c.nombre_control}</td>
                  <td>
                    <span style={{ fontWeight: 800, color: '#D97706' }}>
                      {parseFloat(c.madurez_final).toFixed(2)} / 5.00
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Controls Table */}
      <div className="card">
        <h2 className="card-title">Detalle General de Controles ISO 27002</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Código ISO</th>
                <th>Nombre del Control</th>
                <th>Cumplimiento (%)</th>
                <th>Madurez Cal.</th>
                <th>Madurez Ajus.</th>
                <th>Madurez Final</th>
                <th>Exp. Promedio (%)</th>
                {!isDba && <th>Ajuste Manual</th>}
              </tr>
            </thead>
            <tbody>
              {data?.resultados_controles?.map((c) => (
                <tr key={c.id_control}>
                  <td><strong>ISO {c.codigo_iso}</strong></td>
                  <td>{c.nombre_control}</td>
                  <td>{parseFloat(c.nivel_cumplimiento || 0).toFixed(1)}%</td>
                  <td>{parseFloat(c.madurez_calculada).toFixed(2)}</td>
                  <td>
                    {c.madurez_ajustada !== null ? (
                      <span className="badge badge-purple" title={`Justificación: ${c.justificacion_ajuste}`}>
                        {parseFloat(c.madurez_ajustada).toFixed(2)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <strong>{parseFloat(c.madurez_final).toFixed(2)}</strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: getRiskLevel(c.exposicion_promedio).color }}>
                      {parseFloat(c.exposicion_promedio).toFixed(1)}%
                    </span>
                  </td>
                  {!isDba && (
                    <td>
                      <button onClick={() => handleOpenAdjustmentModal(c)} className="btn btn-secondary btn-sm">
                        <Edit3 size={14} />
                        <span>Ajustar</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Maturity Adjustment Modal */}
      {selectedControl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-purple">ISO {selectedControl.codigo_iso}</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E3A8A', marginTop: '0.25rem' }}>
                  Ajuste Manual de Madurez
                </h2>
              </div>
              <button onClick={() => setSelectedControl(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
              Control: <strong>{selectedControl.nombre_control}</strong>
              <br />
              Madurez Calculada por Cuestionario: <strong>{parseFloat(selectedControl.madurez_calculada).toFixed(2)}</strong> / 5.00
            </p>

            {adjustmentError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#B91C1C', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {adjustmentError}
              </div>
            )}

            <form onSubmit={handleSaveAdjustment}>
              <div className="form-group">
                <label className="form-label">Madurez Ajustada (0.00 a 5.00) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  className="form-input"
                  value={madurezAjustada}
                  onChange={(e) => setMadurezAjustada(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Justificación Técnica Obligatoria *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Detalle los hallazgos técnicos, compensatorios o de auditoría que justifican la sobreescritura de la madurez calculada..."
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  required
                ></textarea>
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                  Nota: Esta acción queda registrada en la bitácora del sistema con su usuario y timestamp.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setSelectedControl(null)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingAdjustment}>
                  {submittingAdjustment ? 'Guardando...' : 'Aplicar Ajuste Manual'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
