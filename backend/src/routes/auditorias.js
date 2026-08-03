import { Router } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

// GET /api/auditorias
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT a.id_auditoria, a.area_evaluada, a.fecha_auditoria, a.fecha_creacion, a.fecha_finalizacion,
             o.id_organizacion, o.nombre AS nombre_organizacion,
             e.id_estado, e.nombre AS nombre_estado,
             u_aud.id_usuario AS id_auditor, u_aud.nombre_completo AS nombre_auditor,
             u_dba.id_usuario AS id_dba, u_dba.nombre_completo AS nombre_dba,
             igr.iger
      FROM auditoria a
      JOIN organizacion o ON o.id_organizacion = a.id_organizacion
      JOIN estado_auditoria e ON e.id_estado = a.id_estado
      JOIN usuario u_aud ON u_aud.id_usuario = a.id_auditor
      JOIN usuario u_dba ON u_dba.id_usuario = a.id_dba
      LEFT JOIN vw_indice_general_riesgo igr ON igr.id_auditoria = a.id_auditoria
    `;

    const params = [];
    if (req.user.nombre_rol === 'DBA') {
      query += ` WHERE a.id_dba = $1`;
      params.push(req.user.id_usuario);
    }

    query += ` ORDER BY a.fecha_auditoria DESC, a.id_auditoria DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener auditorías:', error);
    res.status(500).json({ error: 'Error al obtener las auditorías' });
  }
});

// GET /api/auditorias/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*,
              o.nombre AS nombre_organizacion, o.sector,
              e.nombre AS nombre_estado,
              u_aud.nombre_completo AS nombre_auditor, u_aud.correo AS correo_auditor,
              u_dba.nombre_completo AS nombre_dba, u_dba.correo AS correo_dba
       FROM auditoria a
       JOIN organizacion o ON o.id_organizacion = a.id_organizacion
       JOIN estado_auditoria e ON e.id_estado = a.id_estado
       JOIN usuario u_aud ON u_aud.id_usuario = a.id_auditor
       JOIN usuario u_dba ON u_dba.id_usuario = a.id_dba
       WHERE a.id_auditoria = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Auditoría no encontrada' });
    }

    const audit = result.rows[0];
    if (req.user.nombre_rol === 'DBA' && audit.id_dba !== req.user.id_usuario) {
      return res.status(403).json({ error: 'No tienes acceso a los resultados de esta auditoría' });
    }

    res.json(audit);
  } catch (error) {
    console.error('Error al obtener detalle de auditoría:', error);
    res.status(500).json({ error: 'Error al obtener la auditoría' });
  }
});

// POST /api/auditorias
router.post('/', authenticateToken, requireRole('Administrador del sistema', 'Auditor'), async (req, res) => {
  const { id_organizacion, id_dba, area_evaluada, fecha_auditoria } = req.body;
  const id_auditor = req.user.id_usuario;

  if (!id_organizacion || !id_dba || !area_evaluada || !fecha_auditoria) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (parseInt(id_auditor, 10) === parseInt(id_dba, 10)) {
    return res.status(400).json({ error: 'El auditor y el DBA asignado no pueden ser la misma persona' });
  }

  try {
    // Get initial state "Borrador"
    const estadoRes = await pool.query("SELECT id_estado FROM estado_auditoria WHERE nombre = 'Borrador'");
    const id_estado = estadoRes.rows[0].id_estado;

    // Use transaction to capture app.current_user_id in bitacora_sistema via trg_bitacora_auditoria
    const newAudit = await withTransaction(id_auditor, async (client) => {
      const insertRes = await client.query(
        `INSERT INTO auditoria (id_organizacion, id_auditor, id_dba, id_estado, area_evaluada, fecha_auditoria)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id_organizacion, id_auditor, id_dba, id_estado, area_evaluada, fecha_auditoria]
      );
      return insertRes.rows[0];
    });

    res.status(201).json(newAudit);
  } catch (error) {
    console.error('Error al crear auditoría:', error);
    res.status(500).json({ error: 'Error al crear la auditoría' });
  }
});

// PUT /api/auditorias/:id/estado
router.put('/:id/estado', authenticateToken, requireRole('Administrador del sistema', 'Auditor'), async (req, res) => {
  const { id_estado } = req.body;

  if (!id_estado) {
    return res.status(400).json({ error: 'id_estado es requerido' });
  }

  try {
    // Get state name to check if Finalizada
    const estadoRes = await pool.query('SELECT nombre FROM estado_auditoria WHERE id_estado = $1', [id_estado]);
    if (estadoRes.rows.length === 0) {
      return res.status(400).json({ error: 'Estado de auditoría no válido' });
    }
    const isFinalizada = estadoRes.rows[0].nombre === 'Finalizada';

    const updatedAudit = await withTransaction(req.user.id_usuario, async (client) => {
      const resUpdate = await client.query(
        `UPDATE auditoria
         SET id_estado = $1,
             fecha_finalizacion = CASE WHEN $2 = TRUE THEN CURRENT_TIMESTAMP ELSE fecha_finalizacion END
         WHERE id_auditoria = $3
         RETURNING *`,
        [id_estado, isFinalizada, req.params.id]
      );
      return resUpdate.rows[0];
    });

    if (!updatedAudit) {
      return res.status(404).json({ error: 'Auditoría no encontrada' });
    }

    res.json(updatedAudit);
  } catch (error) {
    console.error('Error al actualizar estado de auditoría:', error);
    res.status(500).json({ error: 'Error al cambiar estado de la auditoría' });
  }
});

export default router;
