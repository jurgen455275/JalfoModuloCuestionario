import { Router } from 'express';
import { pool } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateExecutiveReportPDF } from '../utils/pdfGenerator.js';

const router = Router();

// GET /api/reportes/auditoria/:id/pdf
router.get('/auditoria/:id/pdf', authenticateToken, async (req, res) => {
  const id_auditoria = req.params.id;

  try {
    // Get Audit Details
    const auditRes = await pool.query(
      `SELECT a.*,
              o.nombre AS nombre_organizacion, o.sector,
              e.nombre AS nombre_estado,
              u_aud.nombre_completo AS nombre_auditor,
              u_dba.nombre_completo AS nombre_dba
       FROM auditoria a
       JOIN organizacion o ON o.id_organizacion = a.id_organizacion
       JOIN estado_auditoria e ON e.id_estado = a.id_estado
       JOIN usuario u_aud ON u_aud.id_usuario = a.id_auditor
       JOIN usuario u_dba ON u_dba.id_usuario = a.id_dba
       WHERE a.id_auditoria = $1`,
      [id_auditoria]
    );

    if (auditRes.rows.length === 0) {
      return res.status(404).json({ error: 'Auditoría no encontrada' });
    }

    const audit = auditRes.rows[0];

    // Fetch views results
    const igerRes = await pool.query('SELECT iger FROM vw_indice_general_riesgo WHERE id_auditoria = $1', [id_auditoria]);
    const expSistemaRes = await pool.query('SELECT * FROM vw_exposicion_sistema WHERE id_auditoria = $1', [id_auditoria]);
    const dominiosRes = await pool.query(
      `SELECT cd.id_dominio, cd.nombre_dominio, cd.nivel_cumplimiento,
              ed.exposicion_confidencialidad, ed.exposicion_integridad, ed.exposicion_disponibilidad
       FROM vw_cumplimiento_dominio cd
       LEFT JOIN vw_exposicion_dominio ed ON ed.id_auditoria = cd.id_auditoria AND ed.id_dominio = cd.id_dominio
       WHERE cd.id_auditoria = $1
       ORDER BY cd.id_dominio ASC`,
      [id_auditoria]
    );

    const controlesRes = await pool.query(
      `SELECT ec.id_control, ec.codigo_iso, ec.nombre_control,
              mf.madurez_final,
              (ec.exposicion_confidencialidad + ec.exposicion_integridad + ec.exposicion_disponibilidad) / 3.0 AS exposicion_promedio
       FROM vw_exposicion_control ec
       JOIN vw_madurez_final mf ON mf.id_auditoria = ec.id_auditoria AND mf.id_control = ec.id_control
       WHERE ec.id_auditoria = $1
       ORDER BY ec.codigo_iso ASC`,
      [id_auditoria]
    );

    const mayorExposicionRes = await pool.query(
      `SELECT ec.codigo_iso, ec.nombre_control, d.nombre_dominio,
              (ec.exposicion_confidencialidad + ec.exposicion_integridad + ec.exposicion_disponibilidad) / 3.0 AS exposicion_promedio
       FROM vw_exposicion_control ec
       JOIN dominio_funcional d ON d.id_dominio = ec.id_dominio
       WHERE ec.id_auditoria = $1
       ORDER BY exposicion_promedio DESC
       LIMIT 5`,
      [id_auditoria]
    );

    const resultados = {
      iger: igerRes.rows[0]?.iger || 0,
      exposicion_sistema: expSistemaRes.rows[0] || {},
      resultados_dominios: dominiosRes.rows,
      resultados_controles: controlesRes.rows,
      top_mayor_exposicion: mayorExposicionRes.rows,
    };

    const pdfBuffer = await generateExecutiveReportPDF({ audit, resultados });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_Ejecutivo_Auditoria_${id_auditoria}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF de reporte ejecutivo:', error);
    res.status(500).json({ error: error.message || 'Error al generar el reporte ejecutivo PDF' });
  }
});

export default router;
