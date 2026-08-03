import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, Download, FileText, CheckCircle, ShieldCheck } from 'lucide-react';

export default function ReporteEjecutivo() {
  const { id } = useParams();
  const [auditoria, setAuditoria] = useState(null);
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [audRes, resRes] = await Promise.all([
          api.get(`/auditorias/${id}`),
          api.get(`/resultados/auditoria/${id}`),
        ]);
        setAuditoria(audRes.data);
        setResultados(resRes.data);
      } catch (err) {
        console.error('Error al cargar datos del reporte:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/reportes/auditoria/${id}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Ejecutivo_Auditoria_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      alert('Error al generar el reporte en PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Generando vista previa del reporte ejecutivo...</div>;
  }

  const iger = parseFloat(resultados?.iger || 0);

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to={`/auditorias/${id}/resultados`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#64748B', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} />
            <span>Volver a Resultados</span>
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A' }}>Reporte Ejecutivo Exportable</h1>
        </div>

        <button onClick={handleDownloadPDF} className="btn btn-primary" disabled={downloading}>
          <Download size={18} />
          <span>{downloading ? 'Generando PDF con Puppeteer...' : 'Descargar PDF Oficial'}</span>
        </button>
      </div>

      {/* Report Preview Document */}
      <div className="card glass-panel" style={{ padding: '3rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #1E3A8A', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A' }}>
              JALFO <span style={{ color: '#38BDF8' }}>Consulting</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748B' }}>Portal de Clientes — Evaluación ISO/IEC 27002:2022</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8125rem', color: '#64748B' }}>
            <div>Documento Ejecutivo</div>
            <strong>Auditoría #{id}</strong>
          </div>
        </div>

        {/* Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '2rem', fontSize: '0.875rem' }}>
          <div><strong>Organización:</strong> {auditoria?.nombre_organizacion}</div>
          <div><strong>Área Evaluada:</strong> {auditoria?.area_evaluada}</div>
          <div><strong>Auditor Responsable:</strong> {auditoria?.nombre_auditor}</div>
          <div><strong>DBA Entrevistado:</strong> {auditoria?.nombre_dba}</div>
          <div><strong>Fecha de Evaluación:</strong> {new Date(auditoria?.fecha_auditoria).toLocaleDateString('es-ES')}</div>
          <div><strong>Estado:</strong> {auditoria?.nombre_estado}</div>
        </div>

        {/* IGER Score Header */}
        <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Índice General de Exposición al Riesgo (IGER)
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#1E3A8A', margin: '0.5rem 0' }}>
            {iger.toFixed(2)}%
          </div>
          <span className="badge badge-purple" style={{ fontSize: '0.875rem', padding: '0.375rem 1rem' }}>
            Auditoría de Seguridad de Base de Datos
          </span>
        </div>

        {/* Executive Table Summary */}
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1E3A8A', marginBottom: '1rem' }}>
          Resumen de Exposición por Dominios Funcionales
        </h3>
        <table className="data-table" style={{ marginBottom: '2rem' }}>
          <thead>
            <tr>
              <th>Dominio Funcional</th>
              <th>Cumplimiento (%)</th>
              <th>Exp. Confidencialidad (%)</th>
              <th>Exp. Integridad (%)</th>
              <th>Exp. Disponibilidad (%)</th>
            </tr>
          </thead>
          <tbody>
            {resultados?.resultados_dominios?.map((d) => (
              <tr key={d.id_dominio}>
                <td><strong>{d.nombre_dominio}</strong></td>
                <td>{parseFloat(d.nivel_cumplimiento || 0).toFixed(1)}%</td>
                <td>{parseFloat(d.exposicion_confidencialidad || 0).toFixed(1)}%</td>
                <td>{parseFloat(d.exposicion_integridad || 0).toFixed(1)}%</td>
                <td>{parseFloat(d.exposicion_disponibilidad || 0).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Conclusions */}
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1E3A8A', marginBottom: '0.75rem' }}>
          Conclusiones y Recomendaciones de Gobernanza
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.6', background: '#F8FAFC', borderLeft: '4px solid #2563EB', padding: '1rem', borderRadius: '4px' }}>
          El informe refleja el estado de los controles de seguridad sobre los motores de base de datos evaluados. Se aconseja priorizar las recomendaciones para reducir las brechas en los dominios de mayor exposición técnica.
        </p>
      </div>
    </div>
  );
}
