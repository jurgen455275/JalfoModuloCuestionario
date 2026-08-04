import { Router } from 'express';
import { pool } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

// GET /api/organizaciones
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, 
              COUNT(a.id_auditoria)::int AS total_auditorias
       FROM organizacion o
       LEFT JOIN auditoria a ON a.id_organizacion = o.id_organizacion
       GROUP BY o.id_organizacion
       ORDER BY o.nombre ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar organizaciones:', error);
    res.status(500).json({ error: 'Error al obtener organizaciones' });
  }
});

// GET /api/organizaciones/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM organizacion WHERE id_organizacion = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organización no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la organización' });
  }
});

// POST /api/organizaciones
router.post('/', authenticateToken, requireRole('Administrador del sistema', 'Auditor'), async (req, res) => {
  const { nombre, sector, direccion, telefono_contacto } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la organización es obligatorio' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO organizacion (nombre, sector, direccion, telefono_contacto)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nombre, sector || null, direccion || null, telefono_contacto || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear organización:', error);
    res.status(500).json({ error: 'Error al crear la organización' });
  }
});

// PUT /api/organizaciones/:id
router.put('/:id', authenticateToken, requireRole('Administrador del sistema', 'Auditor'), async (req, res) => {
  const { nombre, sector, direccion, telefono_contacto } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la organización es obligatorio' });
  }

  try {
    const result = await pool.query(
      `UPDATE organizacion
       SET nombre = $1, sector = $2, direccion = $3, telefono_contacto = $4
       WHERE id_organizacion = $5 RETURNING *`,
      [nombre, sector || null, direccion || null, telefono_contacto || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organización no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar organización:', error);
    res.status(500).json({ error: 'Error al actualizar la organización' });
  }
});

// DELETE /api/organizaciones/:id
router.delete('/:id', authenticateToken, requireRole('Administrador del sistema'), async (req, res) => {
  try {
    const check = await pool.query('SELECT COUNT(*)::int FROM auditoria WHERE id_organizacion = $1', [req.params.id]);
    if (check.rows[0].count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar una organización que posee auditorías registradas' });
    }

    const result = await pool.query('DELETE FROM organizacion WHERE id_organizacion = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organización no encontrada' });
    }
    res.json({ message: 'Organización eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar organización:', error);
    res.status(500).json({ error: 'Error al eliminar la organización' });
  }
});

export default router;
