import React from 'react';

export function getRiskLevel(exposure) {
  const exp = parseFloat(exposure) || 0;
  if (exp <= 25) return { level: 'Bajo', class: 'risk-low', color: '#10B981', bg: '#ECFDF5', text: '#047857' };
  if (exp <= 50) return { level: 'Medio', class: 'risk-medium', color: '#F59E0B', bg: '#FFFBEB', text: '#B45309' };
  if (exp <= 75) return { level: 'Alto', class: 'risk-high', color: '#F97316', bg: '#FFEDD5', text: '#C2410C' };
  return { level: 'Crítico', class: 'risk-critical', color: '#EF4444', bg: '#FEE2E2', text: '#B91C1C' };
}

export default function Heatmap({ items, type = 'control', onSelectControl }) {
  if (!items || items.length === 0) {
    return <div style={{ color: '#64748B', fontSize: '0.875rem' }}>No hay datos disponibles para el mapa de calor.</div>;
  }

  return (
    <div>
      {/* Risk Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', fontSize: '0.75rem', fontWeight: 600 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10B981' }}></span>
          0 - 25% Bajo (Verde)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F59E0B' }}></span>
          25 - 50% Medio (Amarillo)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F97316' }}></span>
          50 - 75% Alto (Naranja)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#EF4444' }}></span>
          75 - 100% Crítico (Rojo)
        </span>
      </div>

      {/* Grid of Heatmap Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {items.map((item) => {
          const exp = type === 'control' ? item.exposicion_promedio : item.exposicion_promedio || item.exposicion_confidencialidad;
          const risk = getRiskLevel(exp);

          return (
            <div
              key={item.id_control || item.id_dominio}
              onClick={() => onSelectControl && onSelectControl(item)}
              style={{
                backgroundColor: risk.bg,
                border: `1.5px solid ${risk.color}`,
                borderRadius: '10px',
                padding: '1rem',
                cursor: onSelectControl ? 'pointer' : 'default',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              className="heatmap-item-card"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: risk.text }}>
                  {type === 'control' ? `ISO ${item.codigo_iso}` : item.nombre_dominio}
                </span>
                <span className="badge" style={{ backgroundColor: risk.color, color: 'white', fontSize: '0.6875rem' }}>
                  {risk.level}
                </span>
              </div>

              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.75rem', lineHeight: '1.3' }}>
                {type === 'control' ? item.nombre_control : item.nombre_dominio}
              </div>

              <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {type === 'control' && (
                  <div>
                    Madurez: <strong>{parseFloat(item.madurez_final).toFixed(2)}</strong> / 5.00
                  </div>
                )}
                <div>
                  Exp. Riesgo: <strong>{parseFloat(exp).toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
