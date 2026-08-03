import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function initDb() {
  console.log('⚡ Inicializando base de datos PostgreSQL para JALFO Portal...');

  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/jalfo_portal';
  const pool = new Pool({ connectionString });

  try {
    const ddlPath = path.join(__dirname, '../../sql/01_ddl_esquema.sql');
    const seedPath = path.join(__dirname, '../../sql/02_seed_catalogo.sql');

    console.log('📖 Leyendo scripts SQL...');
    const ddlSql = fs.readFileSync(ddlPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('🔨 Ejecutando 01_ddl_esquema.sql...');
    await pool.query(ddlSql);

    console.log('🌱 Ejecutando 02_seed_catalogo.sql...');
    await pool.query(seedSql);

    // Create demo accounts for each role with known passwords
    const saltRounds = 10;
    const adminPass = await bcrypt.hash('admin123', saltRounds);
    const auditorPass = await bcrypt.hash('auditor123', saltRounds);
    const dbaPass = await bcrypt.hash('dba123', saltRounds);

    console.log('👤 Creando usuarios demo (Administrador, Auditor, DBA)...');

    // Admin
    await pool.query(
      `INSERT INTO usuario (id_rol, nombre_completo, correo, contrasena_hash, activo)
       VALUES ((SELECT id_rol FROM rol WHERE nombre_rol = 'Administrador del sistema'), 'Carlos Admin', 'admin@jalfoconsulting.com', $1, TRUE)
       ON CONFLICT (correo) DO UPDATE SET contrasena_hash = EXCLUDED.contrasena_hash`,
      [adminPass]
    );

    // Auditor
    await pool.query(
      `INSERT INTO usuario (id_rol, nombre_completo, correo, contrasena_hash, activo)
       VALUES ((SELECT id_rol FROM rol WHERE nombre_rol = 'Auditor'), 'Laura Auditora', 'auditor@jalfoconsulting.com', $1, TRUE)
       ON CONFLICT (correo) DO UPDATE SET contrasena_hash = EXCLUDED.contrasena_hash`,
      [auditorPass]
    );

    // DBA
    await pool.query(
      `INSERT INTO usuario (id_rol, nombre_completo, correo, contrasena_hash, activo)
       VALUES ((SELECT id_rol FROM rol WHERE nombre_rol = 'DBA'), 'Roberto DBA', 'dba@jalfoconsulting.com', $1, TRUE)
       ON CONFLICT (correo) DO UPDATE SET contrasena_hash = EXCLUDED.contrasena_hash`,
      [dbaPass]
    );

    // Demo organization
    await pool.query(
      `INSERT INTO organizacion (nombre, sector, direccion, telefono_contacto)
       VALUES ('Banco Financiero Internacional', 'Banca y Finanzas', 'Av. Central 450', '+506 2222-8888')
       ON CONFLICT DO NOTHING`
    );

    console.log('✅ Base de datos inicializada correctamente.');
    console.log('🔑 Usuarios creados para desarrollo:');
    console.log('   - Admin: admin@jalfoconsulting.com / admin123');
    console.log('   - Auditor: auditor@jalfoconsulting.com / auditor123');
    console.log('   - DBA: dba@jalfoconsulting.com / dba123');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
  } finally {
    await pool.end();
  }
}

initDb();
