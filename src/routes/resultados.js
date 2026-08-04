import { Router } from 'express';
import { pool } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/resultados/auditoria/:id
router.get('/auditoria/:id', authenticateToken, async (req, res) => {
  const id_auditoria = req.params.id;

  try {
    // 1. IGER
    const igerRes = await pool.query(
      'SELECT iger FROM vw_indice_general_riesgo WHERE id_auditoria = $1',
      [id_auditoria]
    );

    // 2. Exposicion Sistema (C, I, D)
    const expSistemaRes = await pool.query(
      'SELECT * FROM vw_exposicion_sistema WHERE id_auditoria = $1',
      [id_auditoria]
    );

    // 3. Resultados por Dominio (Cumplimiento + Exposicion C/I/D)
    const dominiosRes = await pool.query(
      `SELECT cd.id_dominio, cd.nombre_dominio,
              cd.nivel_cumplimiento,
              ed.exposicion_confidencialidad, ed.exposicion_integridad, ed.exposicion_disponibilidad,
              (ed.exposicion_confidencialidad + ed.exposicion_integridad + ed.exposicion_disponibilidad) / 3.0 AS exposicion_promedio
       FROM vw_cumplimiento_dominio cd
       LEFT JOIN vw_exposicion_dominio ed ON ed.id_auditoria = cd.id_auditoria AND ed.id_dominio = cd.id_dominio
       WHERE cd.id_auditoria = $1
       ORDER BY cd.id_dominio ASC`,
      [id_auditoria]
    );

    // 4. Resultados por Control (Madurez, Cumplimiento, Exposicion C/I/D)
    const controlesRes = await pool.query(
      `SELECT ec.id_control, ec.codigo_iso, ec.nombre_control, ec.id_dominio,
              mf.madurez_calculada, mf.madurez_ajustada, mf.madurez_final, mf.brecha,
              cc.nivel_cumplimiento,
              ec.exposicion_confidencialidad, ec.exposicion_integridad, ec.exposicion_disponibilidad,
              (ec.exposicion_confidencialidad + ec.exposicion_integridad + ec.exposicion_disponibilidad) / 3.0 AS exposicion_promedio,
              mc.justificacion_ajuste, u_aj.nombre_completo AS usuario_ajuste
       FROM vw_exposicion_control ec
       JOIN vw_madurez_final mf ON mf.id_auditoria = ec.id_auditoria AND mf.id_control = ec.id_control
       LEFT JOIN vw_cumplimiento_control cc ON cc.id_auditoria = ec.id_auditoria AND cc.id_control = ec.id_control
       LEFT JOIN madurez_control mc ON mc.id_auditoria = ec.id_auditoria AND mc.id_control = ec.id_control
       LEFT JOIN usuario u_aj ON u_aj.id_usuario = mc.id_usuario_ajuste
       WHERE ec.id_auditoria = $1
       ORDER BY ec.codigo_iso ASC`,
      [id_auditoria]
    );

    // 5. Controles de Menor Madurez (Ascendente por madurez_final)
    const menorMadurezRes = await pool.query(
      `SELECT ec.codigo_iso, ec.nombre_control, mf.madurez_final, d.nombre_dominio
       FROM vw_madurez_final mf
       JOIN control ec ON ec.id_control = mf.id_control
       JOIN dominio_funcional d ON d.id_dominio = ec.id_dominio
       WHERE mf.id_auditoria = $1
       ORDER BY mf.madurez_final ASC
       LIMIT 5`,
      [id_auditoria]
    );

    // 6. Controles de Mayor Exposición (Descendente por promedio de exposición C/I/D)
    const mayorExposicionRes = await pool.query(
      `SELECT ec.codigo_iso, ec.nombre_control, d.nombre_dominio,
              (ec.exposicion_confidencialidad + ec.exposicion_integridad + ec.exposicion_disponibilidad) / 3.0 AS exposicion_promedio,
              ec.exposicion_confidencialidad, ec.exposicion_integridad, ec.exposicion_disponibilidad
       FROM vw_exposicion_control ec
       JOIN dominio_funcional d ON d.id_dominio = ec.id_dominio
       WHERE ec.id_auditoria = $1
       ORDER BY exposicion_promedio DESC
       LIMIT 5`,
      [id_auditoria]
    );

    res.json({
      id_auditoria,
      iger: igerRes.rows[0]?.iger || 0,
      exposicion_sistema: expSistemaRes.rows[0] || { exposicion_confidencialidad: 0, exposicion_integridad: 0, exposicion_disponibilidad: 0 },
      resultados_dominios: dominiosRes.rows,
      resultados_controles: controlesRes.rows,
      top_menor_madurez: menorMadurezRes.rows,
      top_mayor_exposicion: mayorExposicionRes.rows,
    });
  } catch (error) {
    console.error('Error al consultar vistas de resultados:', error);
    res.status(500).json({ error: 'Error al consultar los resultados de la auditoría' });
  }
});

export default router;
