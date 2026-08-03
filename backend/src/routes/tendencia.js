import { Router } from 'express';
import { pool } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/tendencia/organizacion/:id_organizacion
router.get('/organizacion/:id_organizacion', authenticateToken, async (req, res) => {
  const { id_organizacion } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM vw_tendencia_organizacion
       WHERE id_organizacion = $1
       ORDER BY fecha_auditoria ASC, id_auditoria ASC`,
      [id_organizacion]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar tendencia histórica:', error);
    res.status(500).json({ error: 'Error al consultar la tendencia de la organización' });
  }
});

export default router;
