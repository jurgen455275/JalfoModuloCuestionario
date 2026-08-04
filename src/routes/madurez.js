import { Router } from 'express';
import { withTransaction } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

// PUT /api/madurez/auditoria/:id_auditoria/control/:id_control
router.put('/auditoria/:id_auditoria/control/:id_control', authenticateToken, requireRole('Administrador del sistema', 'Auditor'), async (req, res) => {
  const { id_auditoria, id_control } = req.params;
  const { madurez_ajustada, justificacion_ajuste } = req.body;

  // Validation: If madurez_ajustada is provided (non-null), justificacion_ajuste IS REQUIRED
  if (madurez_ajustada !== null && madurez_ajustada !== undefined) {
    const val = parseFloat(madurez_ajustada);
    if (isNaN(val) || val < 0 || val > 5) {
      return res.status(400).json({ error: 'El valor de madurez ajustada debe ser un número entre 0 y 5' });
    }

    if (!justificacion_ajuste || justificacion_ajuste.trim() === '') {
      return res.status(400).json({
        error: 'Requisito obligatorio: Debe proporcionar una justificación detallada para realizar un ajuste manual de madurez.',
      });
    }
  }

  try {
    const updatedRecord = await withTransaction(req.user.id_usuario, async (client) => {
      const adjustmentVal = madurez_ajustada !== null && madurez_ajustada !== undefined ? parseFloat(madurez_ajustada) : null;
      const justifText = adjustmentVal !== null ? justificacion_ajuste.trim() : null;
      const userAjusteId = adjustmentVal !== null ? req.user.id_usuario : null;

      const result = await client.query(
        `UPDATE madurez_control
         SET madurez_ajustada = $1,
             justificacion_ajuste = $2,
             id_usuario_ajuste = $3
         WHERE id_auditoria = $4 AND id_control = $5
         RETURNING *`,
        [adjustmentVal, justifText, userAjusteId, id_auditoria, id_control]
      );

      if (result.rows.length === 0) {
        // If madurez_control doesn't exist yet for this control, insert it with default calculated 0.00
        const insertRes = await client.query(
          `INSERT INTO madurez_control (id_auditoria, id_control, madurez_calculada, madurez_ajustada, justificacion_ajuste, id_usuario_ajuste)
           VALUES ($1, $2, 0.00, $3, $4, $5)
           RETURNING *`,
          [id_auditoria, id_control, adjustmentVal, justifText, userAjusteId]
        );
        return insertRes.rows[0];
      }

      return result.rows[0];
    });

    res.json(updatedRecord);
  } catch (error) {
    console.error('Error al actualizar madurez ajustada:', error);
    res.status(500).json({ error: error.message || 'Error al procesar el ajuste manual de madurez' });
  }
});

export default router;
