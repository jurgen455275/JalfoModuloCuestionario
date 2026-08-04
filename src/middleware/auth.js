import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación no proporcionado' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'jalfo_super_secret_jwt_key_27002_iso';
    const decoded = jwt.verify(token, secret);

    // Verify user is still active
    const userResult = await pool.query(
      `SELECT u.id_usuario, u.nombre_completo, u.correo, u.activo, u.id_rol, r.nombre_rol
       FROM usuario u
       JOIN rol r ON r.id_rol = u.id_rol
       WHERE u.id_usuario = $1`,
      [decoded.id_usuario]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].activo) {
      return res.status(403).json({ error: 'Usuario no encontrado o inactivo' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};
