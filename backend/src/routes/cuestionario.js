import { Router } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

/**
 * Calculates and upserts madurez_calculada for controls in an audit based on answers
 */
export async function recalculateMaturity(client, id_auditoria, targetControlId = null) {
  let query = `
    SELECT p.id_control, p.peso_pregunta, tr.nombre AS nombre_respuesta
    FROM respuesta_auditoria ra
    JOIN pregunta p ON p.id_pregunta = ra.id_pregunta
    JOIN tipo_respuesta tr ON tr.id_tipo_respuesta = ra.id_tipo_respuesta
    WHERE ra.id_auditoria = $1
  `;
  const params = [id_auditoria];
  if (targetControlId) {
    query += ` AND p.id_control = $2`;
    params.push(targetControlId);
  }

  const res = await client.query(query, params);

  // Group by control
  const controlMap = {};
  res.rows.forEach((row) => {
    if (!controlMap[row.id_control]) {
      controlMap[row.id_control] = { num: 0, denom: 0 };
    }
    if (row.nombre_respuesta !== 'No aplica') {
      controlMap[row.id_control].denom += row.peso_pregunta;
      if (row.nombre_respuesta === 'Sí') {
        controlMap[row.id_control].num += row.peso_pregunta;
      }
    }
  });

  // Calculate & Upsert each affected control
  for (const [id_control_str, data] of Object.entries(controlMap)) {
    const id_control = parseInt(id_control_str, 10);
    const madurez_calculada = data.denom > 0 ? parseFloat(((data.num / data.denom) * 5).toFixed(2)) : 5.0;

    await client.query(
      `INSERT INTO madurez_control (id_auditoria, id_control, madurez_calculada)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_auditoria, id_control)
       DO UPDATE SET madurez_calculada = EXCLUDED.madurez_calculada, fecha_calculo = CURRENT_TIMESTAMP`,
      [id_auditoria, id_control, madurez_calculada]
    );
  }
}

// GET /api/cuestionario/catalogo
router.get('/catalogo', authenticateToken, async (req, res) => {
  try {
    const dominiosRes = await pool.query('SELECT * FROM dominio_funcional ORDER BY id_dominio ASC');
    const controlesRes = await pool.query(
      `SELECT c.*, cat.nombre_categoria
       FROM control c
       JOIN categoria_iso cat ON cat.id_categoria = c.id_categoria
       ORDER BY c.codigo_iso ASC`
    );
    const preguntasRes = await pool.query('SELECT * FROM pregunta ORDER BY orden ASC');
    const tiposRes = await pool.query('SELECT * FROM tipo_respuesta ORDER BY id_tipo_respuesta ASC');

    const dominios = dominiosRes.rows.map((d) => {
      const controles = controlesRes.rows
        .filter((c) => c.id_dominio === d.id_dominio)
        .map((c) => ({
          ...c,
          preguntas: preguntasRes.rows.filter((p) => p.id_control === c.id_control),
        }));
      return { ...d, controles };
    });

    res.json({ dominios, tipos_respuesta: tiposRes.rows });
  } catch (error) {
    console.error('Error al obtener catálogo de cuestionario:', error);
    res.status(500).json({ error: 'Error al obtener el catálogo del cuestionario' });
  }
});

// GET /api/cuestionario/auditoria/:id
router.get('/auditoria/:id', authenticateToken, async (req, res) => {
  const id_auditoria = req.params.id;
  try {
    // Get answers registered for this audit
    const respuestasRes = await pool.query(
      `SELECT ra.*, tr.nombre AS nombre_respuesta
       FROM respuesta_auditoria ra
       JOIN tipo_respuesta tr ON tr.id_tipo_respuesta = ra.id_tipo_respuesta
       WHERE ra.id_auditoria = $1`,
      [id_auditoria]
    );

    // Get maturity records
    const madurezRes = await pool.query(
      `SELECT * FROM madurez_control WHERE id_auditoria = $1`,
      [id_auditoria]
    );

    res.json({
      id_auditoria,
      respuestas: respuestasRes.rows,
      madurez_controles: madurezRes.rows,
    });
  } catch (error) {
    console.error('Error al obtener respuestas de auditoría:', error);
    res.status(500).json({ error: 'Error al obtener respuestas de la auditoría' });
  }
});

// POST /api/cuestionario/auditoria/:id/respuestas
router.post('/auditoria/:id/respuestas', authenticateToken, requireRole('Administrador del sistema', 'Auditor'), async (req, res) => {
  const id_auditoria = req.params.id;
  const { respuestas } = req.body; // Array of { id_pregunta, id_tipo_respuesta, observaciones }

  if (!Array.isArray(respuestas) || respuestas.length === 0) {
    return res.status(400).json({ error: 'Debe enviar un arreglo con las respuestas' });
  }

  try {
    await withTransaction(req.user.id_usuario, async (client) => {
      // Upsert answers
      for (const item of respuestas) {
        if (!item.id_pregunta || !item.id_tipo_respuesta) continue;

        await client.query(
          `INSERT INTO respuesta_auditoria (id_auditoria, id_pregunta, id_tipo_respuesta, observaciones, nivel_madurez_manual)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id_auditoria, id_pregunta)
           DO UPDATE SET id_tipo_respuesta = EXCLUDED.id_tipo_respuesta,
                         observaciones = EXCLUDED.observaciones,
                         nivel_madurez_manual = EXCLUDED.nivel_madurez_manual,
                         fecha_registro = CURRENT_TIMESTAMP`,
          [id_auditoria, item.id_pregunta, item.id_tipo_respuesta, item.observaciones || null,
           item.nivel_madurez_manual !== undefined && item.nivel_madurez_manual !== null ? parseInt(item.nivel_madurez_manual, 10) : null]
        );
      }

      // Recalculate maturity for all controls in audit
      await recalculateMaturity(client, id_auditoria);

      // Auto update status from 'Borrador' to 'En progreso' if applicable
      const auditRes = await client.query('SELECT id_estado FROM auditoria WHERE id_auditoria = $1', [id_auditoria]);
      if (auditRes.rows.length > 0) {
        const borradorRes = await client.query("SELECT id_estado FROM estado_auditoria WHERE nombre = 'Borrador'");
        const progresoRes = await client.query("SELECT id_estado FROM estado_auditoria WHERE nombre = 'En progreso'");
        
        if (borradorRes.rows.length > 0 && progresoRes.rows.length > 0) {
          if (auditRes.rows[0].id_estado === borradorRes.rows[0].id_estado) {
            await client.query('UPDATE auditoria SET id_estado = $1 WHERE id_auditoria = $2', [
              progresoRes.rows[0].id_estado,
              id_auditoria,
            ]);
          }
        }
      }
    });

    res.json({ message: 'Respuestas guardadas y nivel de madurez recalculado con éxito' });
  } catch (error) {
    console.error('Error al guardar respuestas del cuestionario:', error);
    res.status(500).json({ error: 'Error al procesar las respuestas del cuestionario' });
  }
});

export default router;
