import puppeteer from 'puppeteer';

function getRiskCategory(iger) {
  const score = parseFloat(iger) || 0;
  if (score <= 25) return { label: 'Bajo', color: '#10B981', bg: '#D1FAE5', text: '#065F46' };
  if (score <= 50) return { label: 'Medio', color: '#F59E0B', bg: '#FEF3C7', text: '#92400E' };
  if (score <= 75) return { label: 'Alto', color: '#F97316', bg: '#FFEDD5', text: '#9A3412' };
  return { label: 'Crítico', color: '#EF4444', bg: '#FEE2E2', text: '#991B1B' };
}

export async function generateExecutiveReportPDF(data) {
  const { audit, resultados } = data;
  const riskCategory = getRiskCategory(resultados.iger);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte Ejecutivo - ${audit.nombre_organizacion}</title>
      <style>
        body {
          /* Evita dependencia de red para fuentes durante render en Puppeteer */
          font-family: Arial, Helvetica, sans-serif;
          color: #1E293B;
          margin: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #1E3A8A;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .logo-title {
          font-size: 20px;
          font-weight: 700;
          color: #1E3A8A;
        }
        .logo-title span {
          color: #38BDF8;
        }
        .report-subtitle {
          font-size: 13px;
          color: #64748B;
          margin-top: 2px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          background-color: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 20px;
        }
        .meta-item {
          font-size: 11px;
        }
        .meta-label {
          font-weight: 600;
          color: #475569;
        }
        .iger-card {
          background-color: #F1F5F9;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          margin-bottom: 20px;
          border: 1px solid #CBD5E1;
        }
        .iger-score {
          font-size: 32px;
          font-weight: 800;
          color: #1E3A8A;
        }
        .badge-risk {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          margin-top: 6px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1E3A8A;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 6px;
          margin-top: 24px;
          margin-bottom: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 11px;
        }
        th, td {
          border: 1px solid #E2E8F0;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #1E3A8A;
          color: #FFFFFF;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background-color: #F8FAFC;
        }
        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 20px;
        }
        .heatmap-cell {
          padding: 8px 10px;
          border-radius: 4px;
          color: #FFFFFF;
          font-size: 10px;
        }
        .heatmap-cell-title {
          font-weight: 700;
          font-size: 11px;
        }
        .footer {
          margin-top: 30px;
          border-top: 1px solid #E2E8F0;
          padding-top: 10px;
          font-size: 10px;
          color: #94A3B8;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo-title">JALFO <span>Consulting</span></div>
          <div class="report-subtitle">Portal de Clientes — Evaluación de Riesgo ISO/IEC 27002</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748B;">
          Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><span class="meta-label">Organización:</span> ${audit.nombre_organizacion}</div>
        <div class="meta-item"><span class="meta-label">Área Evaluada:</span> ${audit.area_evaluada}</div>
        <div class="meta-item"><span class="meta-label">Auditor Responsable:</span> ${audit.nombre_auditor}</div>
        <div class="meta-item"><span class="meta-label">DBA Entrevistado:</span> ${audit.nombre_dba}</div>
        <div class="meta-item"><span class="meta-label">Fecha de Auditoría:</span> ${new Date(audit.fecha_auditoria).toLocaleDateString('es-ES')}</div>
        <div class="meta-item"><span class="meta-label">Estado de la Evaluación:</span> ${audit.nombre_estado}</div>
      </div>

      <div class="iger-card">
        <div style="font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase;">Índice General de Exposición al Riesgo (IGER)</div>
        <div class="iger-score">${parseFloat(resultados.iger).toFixed(2)}%</div>
        <div class="badge-risk" style="background-color: ${riskCategory.bg}; color: ${riskCategory.text};">
          Nivel de Riesgo: ${riskCategory.label}
        </div>
      </div>

      <div class="section-title">Resumen por Dominios Funcionales</div>
      <table>
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
          ${resultados.resultados_dominios
            .map(
              (d) => `
            <tr>
              <td><strong>${d.nombre_dominio}</strong></td>
              <td>${parseFloat(d.nivel_cumplimiento || 0).toFixed(1)}%</td>
              <td>${parseFloat(d.exposicion_confidencialidad || 0).toFixed(1)}%</td>
              <td>${parseFloat(d.exposicion_integridad || 0).toFixed(1)}%</td>
              <td>${parseFloat(d.exposicion_disponibilidad || 0).toFixed(1)}%</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="section-title">Top 5 Controles con Mayor Exposición al Riesgo</div>
      <table>
        <thead>
          <tr>
            <th>Código ISO</th>
            <th>Control</th>
            <th>Dominio</th>
            <th>Exposición Promedio (%)</th>
          </tr>
        </thead>
        <tbody>
          ${resultados.top_mayor_exposicion
            .map(
              (c) => `
            <tr>
              <td><strong>ISO ${c.codigo_iso}</strong></td>
              <td>${c.nombre_control}</td>
              <td>${c.nombre_dominio}</td>
              <td style="color: #EF4444; font-weight: 700;">${parseFloat(c.exposicion_promedio).toFixed(1)}%</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="section-title">Mapa de Calor por Controles ISO 27002</div>
      <div class="heatmap-grid">
        ${resultados.resultados_controles
          .map((c) => {
            const exp = parseFloat(c.exposicion_promedio || 0);
            let bg = '#10B981'; // Green
            if (exp > 25 && exp <= 50) bg = '#F59E0B'; // Yellow
            else if (exp > 50 && exp <= 75) bg = '#F97316'; // Orange
            else if (exp > 75) bg = '#EF4444'; // Red

            return `
            <div class="heatmap-cell" style="background-color: ${bg};">
              <div class="heatmap-cell-title">ISO ${c.codigo_iso} - ${c.nombre_control}</div>
              <div>Madurez Final: ${parseFloat(c.madurez_final).toFixed(2)} / 5.00</div>
              <div>Exp. Riesgo: ${exp.toFixed(1)}%</div>
            </div>
          `;
          })
          .join('')}
      </div>

      <div class="section-title">Conclusiones y Recomendaciones de Gobernanza</div>
      <p style="font-size: 11px; text-align: justify; background: #F8FAFC; border-left: 3px solid #2563EB; padding: 10px;">
        Con base en el análisis de madurez y exposición al riesgo realizado bajo el estándar <strong>ISO/IEC 27002:2022</strong>, se recomienda dar prioridad inmediata a los controles identificados con un nivel de exposición mayor al 50%. En particular, se sugiere reforzar los procedimientos de encriptación, backups verificados y control de cuentas privilegiadas de la base de datos.
      </p>

      <div class="footer">
        Documento generado automáticamente por el Portal de Clientes JALFO Consulting · Confidencial
      </div>
    </body>
    </html>
  `;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true,
    });

    return pdfBuffer;
  } catch (error) {
    const rawMessage = error?.message || 'Error desconocido al renderizar PDF';
    if (rawMessage.includes('Could not find Chrome')) {
      throw new Error('Puppeteer no encontro el navegador Chrome/Chromium. Reinstala dependencias del backend para descargar el binario.');
    }
    throw new Error(`Fallo al generar PDF con Puppeteer: ${rawMessage}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
