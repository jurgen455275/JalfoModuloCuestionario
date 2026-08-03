# Portal de Clientes — JALFO Consulting
## Sistema de Evaluación de Riesgo de Seguridad en Bases de Datos (ISO/IEC 27002:2022)

Este proyecto comprende la herramienta interna para el **Portal de Clientes** de **JALFO Consulting**, construida para evaluar el nivel de madurez y exposición al riesgo de seguridad en motores de bases de datos operadas o administradas por DBAs.

---

## 🛠️ Stack Técnico

- **Frontend:** React 18 + Vite, Recharts, Lucide Icons, Vanilla CSS (Glassmorphism & Paleta Corporativa JALFO).
- **Backend:** Node.js + Express.
- **Base de Datos:** PostgreSQL 14+ (14 tablas en 3FN, 8 vistas SQL de cálculo de riesgo, 3 triggers en PL/pgSQL).
- **Acceso a Datos:** Driver `pg` (node-postgres) directo con transacciones SQL (`SET LOCAL app.current_user_id = $1`). **Sin ORMs con migración automática**.
- **Autenticación & Roles:** JWT + contraseñas con `bcrypt` (Roles: Administrador del sistema, Auditor, DBA).
- **Generación de Reportes PDF:** `puppeteer` para la exportación del reporte ejecutivo en PDF.

---

## 📁 Estructura del Proyecto

```
jalfo-portal/
├── sql/
│   ├── 01_ddl_esquema.sql      (Tablas, vistas de cálculo IGER/madurez, triggers PL/pgSQL)
│   └── 02_seed_catalogo.sql     (17 controles ISO 27002, 7 dominios, 49 preguntas, roles)
├── backend/                    (Servidor Express API)
│   ├── src/
│   │   ├── config/db.js        (Pool pg y wrapper de transacciones auditadas)
│   │   ├── middleware/         (JWT auth y control de roles)
│   │   ├── routes/             (Auth, organizaciones, usuarios, auditorías, cuestionario, madurez, resultados, reportes PDF, tendencia, bitácora)
│   │   ├── utils/pdfGenerator.js (Plantilla HTML + Puppeteer PDF)
│   │   └── server.js           (Punto de entrada de la API Express)
│   ├── scripts/initDb.js       (Script para inicializar BD y crear cuentas demo)
│   ├── .env.example
│   └── package.json
├── frontend/                   (Aplicación React + Vite)
│   ├── src/
│   │   ├── api/client.js       (Cliente Axios con JWT)
│   │   ├── components/         (Layout, Navbar, Sidebar, Heatmap, ProtectedRoute)
│   │   ├── pages/              (Login, Dashboard, Organizaciones, Usuarios, Auditorías, Cuestionario, Resultados, ReporteEjecutivo, Tendencia, Bitácora)
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🗄️ Inicialización de la Base de Datos

### Opción A: Mediante el Script de Node.js (Recomendado)

1. Crea la base de datos en tu servidor PostgreSQL:
   ```sql
   CREATE DATABASE jalfo_portal;
   ```
2. Configura tu variable de entorno en `backend/.env`:
   ```env
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/jalfo_portal
   ```
3. Ejecuta el script de inicialización desde la carpeta `backend/`:
   ```bash
   cd backend
   npm install
   npm run db:setup
   ```

### Opción B: Ejecución Manual de Scripts SQL

Ejecuta secuencialmente los scripts ubicados en `sql/` sobre la base de datos `jalfo_portal`:

```bash
psql -U postgres -d jalfo_portal -f sql/01_ddl_esquema.sql
psql -U postgres -d jalfo_portal -f sql/02_seed_catalogo.sql
```

---

## 🔑 Cuentas Demo Precargadas

| Rol | Correo Electrónico | Contraseña |
| --- | --- | --- |
| **Administrador del Sistema** | `admin@jalfoconsulting.com` | `admin123` |
| **Auditor** | `auditor@jalfoconsulting.com` | `auditor123` |
| **DBA** | `dba@jalfoconsulting.com` | `dba123` |

---

## 🚀 Cómo Ejecutar la Aplicación

### 1. Iniciar el Backend (Express API)

```bash
cd backend
npm install
npm run dev
```
El servidor backend se iniciará en `http://localhost:3001`.

### 2. Iniciar el Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
El portal de clientes estará disponible en `http://localhost:5174`.

---

## 📊 Reglas de Negocio e Integridad de Datos

1. **Cálculo de Madurez Nivel Control (NM):**
   $$\text{NM}(\text{control}) = \frac{\sum (\text{peso\_pregunta}_i \times \text{respuesta}_i)}{\sum \text{peso\_pregunta\_aplicable}} \times 5$$
   - `respuesta_i = 1` si es "Sí", `0` si es "No". Las preguntas respondidas como "No aplica" se excluyen del denominador y numerador.
2. **Ajuste Manual de Madurez (Modelo Híbrido):**
   La API exige obligatoriamente `justificacion_ajuste` al ingresar una `madurez_ajustada`, rechazando con código HTTP 400 si se omite.
3. **Vistas SQL Directas:**
   Las métricas de exposición C/I/D, cumplimiento por dominio, IGER y tendencia histórica se consultan directamente de las 8 vistas SQL sin recalcularse en la aplicación.
4. **Bitácora del Sistema (Gobernanza):**
   Cada transacción sensible se ejecuta con:
   ```sql
   BEGIN;
   SET LOCAL app.current_user_id = $1;
   -- Sentencia UPDATE / INSERT
   COMMIT;
   ```
   para alimentar automáticamente la tabla `bitacora_sistema` a través de los triggers PL/pgSQL `fn_bitacora_auditoria`, `fn_bitacora_madurez` y `fn_bitacora_usuario`.
