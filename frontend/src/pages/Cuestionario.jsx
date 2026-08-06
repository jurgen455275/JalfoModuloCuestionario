import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, Save, CheckCircle, HelpCircle, FileText, ChevronDown, ChevronRight, BarChart2 } from 'lucide-react';

export default function Cuestionario() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [auditoria, setAuditoria] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [tiposRespuesta, setTiposRespuesta] = useState([]);
  const [respuestas, setRespuestas] = useState({}); // { id_pregunta: { id_tipo_respuesta, observaciones } }
  const [activeDomain, setActiveDomain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [audRes, catRes, respRes] = await Promise.all([
          api.get(`/auditorias/${id}`),
          api.get('/cuestionario/catalogo'),
          api.get(`/cuestionario/auditoria/${id}`),
        ]);

        setAuditoria(audRes.data);
        setCatalogo(catRes.data.dominios);
        setTiposRespuesta(catRes.data.tipos_respuesta);

        if (catRes.data.dominios.length > 0) {
          setActiveDomain(catRes.data.dominios[0].id_dominio);
        }

        // Map existing answers
        const mapped = {};
        respRes.data.respuestas.forEach((r) => {
          mapped[r.id_pregunta] = {
            id_tipo_respuesta: r.id_tipo_respuesta,
            observaciones: r.observaciones || '',
            nivel_madurez_manual: r.nivel_madurez_manual ?? null,
          };
        });
        setRespuestas(mapped);
      } catch (err) {
        console.error('Error al cargar cuestionario:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleAnswerChange = (id_pregunta, id_tipo_respuesta) => {
    setRespuestas((prev) => ({
      ...prev,
      [id_pregunta]: {
        ...prev[id_pregunta],
        id_tipo_respuesta,
      },
    }));
  };

  const handleObsChange = (id_pregunta, observaciones) => {
    setRespuestas((prev) => ({
      ...prev,
      [id_pregunta]: {
        ...prev[id_pregunta],
        observaciones,
      },
    }));
  };

  const handleMadurezChange = (id_pregunta, nivel) => {
    setRespuestas((prev) => ({
      ...prev,
      [id_pregunta]: {
        ...prev[id_pregunta],
        nivel_madurez_manual: prev[id_pregunta]?.nivel_madurez_manual === nivel ? null : nivel,
      },
    }));
  };

  const handleSave = async (redirect = false) => {
    setSaving(true);
    setMessage('');

    // Prepare payload
    const payload = Object.entries(respuestas).map(([id_pregunta_str, val]) => ({
      id_pregunta: parseInt(id_pregunta_str, 10),
      id_tipo_respuesta: val.id_tipo_respuesta,
      observaciones: val.observaciones,
      nivel_madurez_manual: val.nivel_madurez_manual !== undefined ? val.nivel_madurez_manual : null,
    }));

    try {
      await api.post(`/cuestionario/auditoria/${id}/respuestas`, { respuestas: payload });
      setMessage('Avance guardado y nivel de madurez recalculado correctamente.');

      if (redirect) {
        navigate(`/auditorias/${id}/resultados`);
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('Error al guardar el cuestionario');
    } finally {
      setSaving(false);
    }
  };

  // Calculate stats
  let totalPreguntas = 0;
  let respondidas = 0;
  catalogo.forEach((d) => {
    d.controles.forEach((c) => {
      c.preguntas.forEach((p) => {
        totalPreguntas++;
        if (respuestas[p.id_pregunta]?.id_tipo_respuesta) {
          respondidas++;
        }
      });
    });
  });

  const percent = totalPreguntas > 0 ? Math.round((respondidas / totalPreguntas) * 100) : 0;

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Cargando cuestionario ISO 27002...</div>;
  }

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/auditorias" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#64748B', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} />
            <span>Volver a lista de auditorías</span>
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A' }}>
            Cuestionario de Evaluación — {auditoria?.nombre_organizacion}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            Área: <strong>{auditoria?.area_evaluada}</strong> · DBA: <strong>{auditoria?.nombre_dba}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => handleSave(false)} className="btn btn-secondary" disabled={saving}>
            <Save size={18} />
            <span>{saving ? 'Guardando...' : 'Guardar Borrador'}</span>
          </button>
          <button onClick={() => handleSave(true)} className="btn btn-primary" disabled={saving}>
            <BarChart2 size={18} />
            <span>Guardar y Ver Resultados</span>
          </button>
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
          <span>Progreso del Cuestionario ({respondidas} de {totalPreguntas} preguntas)</span>
          <span style={{ color: '#2563EB', fontWeight: 800 }}>{percent}% Completado</span>
        </div>
        <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #38BDF8, #2563EB)', transition: 'width 0.3s ease' }}></div>
        </div>

        {message && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#D1FAE5', border: '1px solid #10B981', color: '#065F46', borderRadius: '6px', fontSize: '0.8125rem' }}>
            {message}
          </div>
        )}
      </div>

      {/* Domain Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        {catalogo.map((dom) => {
          const isActive = activeDomain === dom.id_dominio;
          return (
            <button
              key={dom.id_dominio}
              onClick={() => setActiveDomain(dom.id_dominio)}
              style={{
                padding: '0.625rem 1rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isActive ? '#2563EB' : '#E2E8F0',
                background: isActive ? '#1E3A8A' : 'white',
                color: isActive ? 'white' : '#475569',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 4px 12px rgba(30, 58, 138, 0.2)' : 'none',
              }}
            >
              {dom.nombre_dominio}
            </button>
          );
        })}
      </div>

      {/* Domain Questions Content */}
      {catalogo
        .filter((dom) => dom.id_dominio === activeDomain)
        .map((dom) => (
          <div key={dom.id_dominio} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: '#F8FAFC', borderLeft: '4px solid #2563EB', padding: '1rem 1.25rem', borderRadius: '6px' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1E3A8A', marginBottom: '0.25rem' }}>
                Dominio: {dom.nombre_dominio}
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#64748B' }}>{dom.descripcion}</p>
            </div>

            {dom.controles.map((ctrl) => (
              <div key={ctrl.id_control} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                  <div>
                    <span className="badge badge-purple" style={{ marginRight: '0.5rem' }}>
                      {ctrl.nombre_categoria}
                    </span>
                    <span className="badge badge-blue">Peso: {ctrl.peso}</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E3A8A', marginTop: '0.5rem' }}>
                      ISO {ctrl.codigo_iso} - {ctrl.nombre_control}
                    </h3>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', textAlign: 'right' }}>
                    <div>Relación C / I / D:</div>
                    <strong style={{ color: '#0F172A' }}>
                      C:{ctrl.relacion_confidencialidad} · I:{ctrl.relacion_integridad} · D:{ctrl.relacion_disponibilidad}
                    </strong>
                  </div>
                </div>

                <p style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '1.25rem', background: '#F1F5F9', padding: '0.75rem', borderRadius: '6px' }}>
                  <strong>Objetivo:</strong> {ctrl.objetivo}
                </p>

                {/* Questions list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {ctrl.preguntas.map((p) => {
                    const currentResp = respuestas[p.id_pregunta] || {};

                    return (
                      <div key={p.id_pregunta} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem', color: '#1E293B' }}>
                            <span style={{ color: '#2563EB', fontWeight: 700, marginRight: '0.5rem' }}>
                              [{p.codigo_pregunta}]
                            </span>
                            {p.texto_pregunta}
                            <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.5rem' }}>
                              (Peso: {p.peso_pregunta})
                            </span>
                          </div>

                          {/* Response Radio Buttons */}
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {tiposRespuesta.map((tr) => {
                              const isSelected = currentResp.id_tipo_respuesta === tr.id_tipo_respuesta;
                              let activeBg = '#2563EB';
                              if (tr.nombre === 'Sí') activeBg = '#10B981';
                              if (tr.nombre === 'No') activeBg = '#EF4444';
                              if (tr.nombre === 'No aplica') activeBg = '#64748B';

                              return (
                                <button
                                  key={tr.id_tipo_respuesta}
                                  type="button"
                                  onClick={() => handleAnswerChange(p.id_pregunta, tr.id_tipo_respuesta)}
                                  style={{
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: '6px',
                                    border: `1px solid ${isSelected ? activeBg : '#CBD5E1'}`,
                                    background: isSelected ? activeBg : 'white',
                                    color: isSelected ? 'white' : '#475569',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {tr.nombre}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Observation Input */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {/* Maturity Level Selector */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>
                              Nivel de madurez:
                            </span>
                            {[
                              { nivel: 0, label: '0 - Inexistente', color: '#6B7280', bg: '#F3F4F6' },
                              { nivel: 1, label: '1 - Inicial',     color: '#DC2626', bg: '#FEF2F2' },
                              { nivel: 2, label: '2 - Repetible',   color: '#EA580C', bg: '#FFF7ED' },
                              { nivel: 3, label: '3 - Definido',    color: '#D97706', bg: '#FFFBEB' },
                              { nivel: 4, label: '4 - Gestionado',  color: '#16A34A', bg: '#F0FDF4' },
                              { nivel: 5, label: '5 - Optimizado',  color: '#2563EB', bg: '#EFF6FF' },
                            ].map(({ nivel, label, color, bg }) => {
                              const isSelected = currentResp.nivel_madurez_manual === nivel;
                              return (
                                <button
                                  key={nivel}
                                  type="button"
                                  title={label}
                                  onClick={() => handleMadurezChange(p.id_pregunta, nivel)}
                                  style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '6px',
                                    border: `2px solid ${isSelected ? color : '#CBD5E1'}`,
                                    background: isSelected ? bg : 'white',
                                    color: isSelected ? color : '#94A3B8',
                                    fontWeight: 800,
                                    fontSize: '0.8125rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isSelected ? `0 0 0 2px ${color}33` : 'none',
                                  }}
                                >
                                  {nivel}
                                </button>
                              );
                            })}
                            {currentResp.nivel_madurez_manual !== null && currentResp.nivel_madurez_manual !== undefined && (
                              <span style={{
                                fontSize: '0.75rem',
                                color: '#475569',
                                background: '#F1F5F9',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '999px',
                                fontWeight: 600,
                              }}>
                                {[
                                  'Inexistente','Inicial','Repetible','Definido','Gestionado','Optimizado'
                                ][currentResp.nivel_madurez_manual]}
                              </span>
                            )}
                          </div>

                          {/* Observation text input */}
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
                            placeholder="Observación o hallazgo del auditor (opcional)..."
                            value={currentResp.observaciones || ''}
                            onChange={(e) => handleObsChange(p.id_pregunta, e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
