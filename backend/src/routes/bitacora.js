import { Router } from 'express';
import { pool } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

// GET /api/bitacora (Admin only)
router.get('/', authenticateToken, requireRole('Administrador del sistema'), async (req, res) => {
  const { tabla, fecha_inicio, fecha_fin } = req.query;

  try {
    let query = `
      SELECT b.id_bitacora, b.tabla_afectada, b.id_registro_afectado, b.accion, b.detalle, b.fecha_evento,
             u.id_usuario, u.nombre_completo AS nombre_usuario, u.correo AS correo_usuario
      FROM bitacora_sistema b
      LEFT JOIN usuario u ON u.id_usuario = b.id_usuario
      WHERE 1=1
    `;
    const params = [];

    if (tabla) {
      params.push(tabla);
      query += ` AND b.tabla_afectada = $${params.length}`;
    }

    if (fecha_inicio) {
      params.push(fecha_inicio);
      query += ` AND b.fecha_evento >= $${params.length}::timestamp`;
    }

    if (fecha_fin) {
      params.push(`${fecha_fin} 23:59:59`);
      query += ` AND b.fecha_evento <= $${params.length}::timestamp`;
    }

    query += ` ORDER BY b.fecha_evento DESC, b.id_bitacora DESC LIMIT 200`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar bitácora del sistema:', error);
    res.status(500).json({ error: 'Error al consultar la bitácora del sistema' });
  }
});

export default router;
