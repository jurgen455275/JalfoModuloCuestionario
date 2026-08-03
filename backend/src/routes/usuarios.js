import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool, withTransaction } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

// GET /api/usuarios/roles
router.get('/roles', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rol ORDER BY id_rol ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los roles' });
  }
});

// GET /api/usuarios
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id_usuario, u.nombre_completo, u.correo, u.activo, u.fecha_creacion,
              u.id_rol, r.nombre_rol
       FROM usuario u
       JOIN rol r ON r.id_rol = u.id_rol
       ORDER BY u.nombre_completo ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// POST /api/usuarios (Admin only)
router.post('/', authenticateToken, requireRole('Administrador del sistema'), async (req, res) => {
  const { nombre_completo, correo, contrasena, id_rol } = req.body;

  if (!nombre_completo || !correo || !contrasena || !id_rol) {
    return res.status(400).json({ error: 'Nombre, correo, contraseña y rol son obligatorios' });
  }

  try {
    // Check unique email
    const existing = await pool.query('SELECT id_usuario FROM usuario WHERE LOWER(correo) = LOWER($1)', [correo]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'El correo especificado ya se encuentra registrado' });
    }

    const saltRounds = 10;
    const contrasena_hash = await bcrypt.hash(contrasena, saltRounds);

    const result = await pool.query(
      `INSERT INTO usuario (nombre_completo, correo, contrasena_hash, id_rol, activo)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id_usuario, nombre_completo, correo, id_rol, activo, fecha_creacion`,
      [nombre_completo, correo, contrasena_hash, id_rol]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
});

// PUT /api/usuarios/:id (Admin only)
router.put('/:id', authenticateToken, requireRole('Administrador del sistema'), async (req, res) => {
  const { nombre_completo, correo, id_rol, activo } = req.body;

  if (!nombre_completo || !correo || !id_rol) {
    return res.status(400).json({ error: 'Nombre, correo y rol son obligatorios' });
  }

  try {
    // Perform in transaction so PL/pgSQL trigger fn_bitacora_usuario gets app.current_user_id
    const updatedUser = await withTransaction(req.user.id_usuario, async (client) => {
      const resUpdate = await client.query(
        `UPDATE usuario
         SET nombre_completo = $1, correo = $2, id_rol = $3, activo = $4
         WHERE id_usuario = $5
         RETURNING id_usuario, nombre_completo, correo, id_rol, activo`,
        [nombre_completo, correo, id_rol, activo !== undefined ? activo : true, req.params.id]
      );
      return resUpdate.rows[0];
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

// PUT /api/usuarios/:id/password (Admin only or user self)
router.put('/:id/password', authenticateToken, async (req, res) => {
  const { nueva_contrasena } = req.body;
  const targetId = parseInt(req.params.id, 10);

  if (req.user.nombre_rol !== 'Administrador del sistema' && req.user.id_usuario !== targetId) {
    return res.status(403).json({ error: 'No tienes permiso para cambiar la contraseña de este usuario' });
  }

  if (!nueva_contrasena || nueva_contrasena.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const saltRounds = 10;
    const contrasena_hash = await bcrypt.hash(nueva_contrasena, saltRounds);

    await pool.query('UPDATE usuario SET contrasena_hash = $1 WHERE id_usuario = $2', [contrasena_hash, targetId]);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
});

export default router;
