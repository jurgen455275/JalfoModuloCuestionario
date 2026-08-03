-- ============================================================
-- Script DDL — Aplicación de Evaluación de Riesgo ISO/IEC 27002
-- Proyecto Integrador — Administración de Bases de Datos
-- Motor de referencia: PostgreSQL 14+
-- ============================================================

-- ------------------------------------------------------------
-- 0. Limpieza previa (permite reejecutar el script en desarrollo)
-- ------------------------------------------------------------
DROP VIEW IF EXISTS vw_tendencia_organizacion CASCADE;
DROP VIEW IF EXISTS vw_indice_general_riesgo CASCADE;
DROP VIEW IF EXISTS vw_exposicion_sistema CASCADE;
DROP VIEW IF EXISTS vw_exposicion_dominio CASCADE;
DROP VIEW IF EXISTS vw_exposicion_control CASCADE;
DROP VIEW IF EXISTS vw_cumplimiento_dominio CASCADE;
DROP VIEW IF EXISTS vw_cumplimiento_control CASCADE;
DROP VIEW IF EXISTS vw_madurez_final CASCADE;

DROP TRIGGER IF EXISTS trg_bitacora_usuario ON usuario;
DROP TRIGGER IF EXISTS trg_bitacora_madurez ON madurez_control;
DROP TRIGGER IF EXISTS trg_bitacora_auditoria ON auditoria;
DROP FUNCTION IF EXISTS fn_bitacora_usuario CASCADE;
DROP FUNCTION IF EXISTS fn_bitacora_madurez CASCADE;
DROP FUNCTION IF EXISTS fn_bitacora_auditoria CASCADE;

DROP TABLE IF EXISTS bitacora_sistema CASCADE;
DROP TABLE IF EXISTS evidencia_archivo CASCADE;
DROP TABLE IF EXISTS madurez_control CASCADE;
DROP TABLE IF EXISTS respuesta_auditoria CASCADE;
DROP TABLE IF EXISTS auditoria CASCADE;
DROP TABLE IF EXISTS estado_auditoria CASCADE;
DROP TABLE IF EXISTS tipo_respuesta CASCADE;
DROP TABLE IF EXISTS pregunta CASCADE;
DROP TABLE IF EXISTS control CASCADE;
DROP TABLE IF EXISTS dominio_funcional CASCADE;
DROP TABLE IF EXISTS categoria_iso CASCADE;
DROP TABLE IF EXISTS organizacion CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS rol CASCADE;

-- ------------------------------------------------------------
-- 1. Tablas de catálogo (lookup) — soportan la 3FN
-- ------------------------------------------------------------

CREATE TABLE rol (
    id_rol       SERIAL PRIMARY KEY,
    nombre_rol   VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE categoria_iso (
    id_categoria      SERIAL PRIMARY KEY,
    nombre_categoria  VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE dominio_funcional (
    id_dominio     SERIAL PRIMARY KEY,
    nombre_dominio VARCHAR(100) NOT NULL UNIQUE,
    descripcion    TEXT
);

CREATE TABLE tipo_respuesta (
    id_tipo_respuesta SERIAL PRIMARY KEY,
    nombre            VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE estado_auditoria (
    id_estado SERIAL PRIMARY KEY,
    nombre    VARCHAR(30) NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- 2. Usuarios y organizaciones
-- ------------------------------------------------------------

CREATE TABLE usuario (
    id_usuario       SERIAL PRIMARY KEY,
    id_rol           INT NOT NULL REFERENCES rol(id_rol),
    nombre_completo  VARCHAR(150) NOT NULL,
    correo           VARCHAR(150) NOT NULL UNIQUE,
    contrasena_hash  VARCHAR(255) NOT NULL,
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organizacion (
    id_organizacion   SERIAL PRIMARY KEY,
    nombre            VARCHAR(200) NOT NULL,
    sector            VARCHAR(100),
    direccion         VARCHAR(250),
    telefono_contacto VARCHAR(30)
);

-- ------------------------------------------------------------
-- 2.1 Bitácora de auditoría del sistema (VALOR AGREGADO F)
-- ------------------------------------------------------------

CREATE TABLE bitacora_sistema (
    id_bitacora           SERIAL PRIMARY KEY,
    id_usuario            INT REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    tabla_afectada        VARCHAR(50) NOT NULL,
    id_registro_afectado  INT NOT NULL,
    accion                VARCHAR(20) NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
    detalle               TEXT,
    fecha_evento          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3. Catálogo normativo: controles y preguntas
-- ------------------------------------------------------------

CREATE TABLE control (
    id_control                 SERIAL PRIMARY KEY,
    codigo_iso                 VARCHAR(10) NOT NULL UNIQUE,
    nombre_control              VARCHAR(150) NOT NULL,
    id_categoria                INT NOT NULL REFERENCES categoria_iso(id_categoria),
    id_dominio                  INT NOT NULL REFERENCES dominio_funcional(id_dominio),
    objetivo                    TEXT NOT NULL,
    descripcion                 TEXT NOT NULL,
    peso                        SMALLINT NOT NULL CHECK (peso BETWEEN 1 AND 3),
    relacion_confidencialidad   SMALLINT NOT NULL CHECK (relacion_confidencialidad BETWEEN 1 AND 3),
    relacion_integridad         SMALLINT NOT NULL CHECK (relacion_integridad BETWEEN 1 AND 3),
    relacion_disponibilidad     SMALLINT NOT NULL CHECK (relacion_disponibilidad BETWEEN 1 AND 3)
);

CREATE TABLE pregunta (
    id_pregunta     SERIAL PRIMARY KEY,
    id_control      INT NOT NULL REFERENCES control(id_control) ON DELETE CASCADE,
    codigo_pregunta VARCHAR(15) NOT NULL UNIQUE,
    texto_pregunta  TEXT NOT NULL,
    peso_pregunta   SMALLINT NOT NULL CHECK (peso_pregunta BETWEEN 1 AND 3),
    orden           SMALLINT NOT NULL
);

-- ------------------------------------------------------------
-- 4. Auditorías
-- ------------------------------------------------------------

CREATE TABLE auditoria (
    id_auditoria       SERIAL PRIMARY KEY,
    id_organizacion    INT NOT NULL REFERENCES organizacion(id_organizacion),
    id_auditor         INT NOT NULL REFERENCES usuario(id_usuario),
    id_dba             INT NOT NULL REFERENCES usuario(id_usuario),
    id_estado          INT NOT NULL REFERENCES estado_auditoria(id_estado),
    area_evaluada      VARCHAR(150) NOT NULL,
    fecha_auditoria    DATE NOT NULL,
    fecha_creacion     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_finalizacion TIMESTAMP,
    CHECK (id_auditor <> id_dba)
);

-- ------------------------------------------------------------
-- 5. Respuestas del cuestionario y evidencia
-- ------------------------------------------------------------

CREATE TABLE respuesta_auditoria (
    id_respuesta       SERIAL PRIMARY KEY,
    id_auditoria       INT NOT NULL REFERENCES auditoria(id_auditoria) ON DELETE CASCADE,
    id_pregunta        INT NOT NULL REFERENCES pregunta(id_pregunta),
    id_tipo_respuesta  INT NOT NULL REFERENCES tipo_respuesta(id_tipo_respuesta),
    observaciones      TEXT,
    fecha_registro     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_auditoria, id_pregunta)
);

CREATE TABLE evidencia_archivo (
    id_evidencia    SERIAL PRIMARY KEY,
    id_respuesta    INT NOT NULL REFERENCES respuesta_auditoria(id_respuesta) ON DELETE CASCADE,
    nombre_archivo  VARCHAR(255) NOT NULL,
    ruta_archivo    VARCHAR(500) NOT NULL,
    fecha_carga     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 6. Madurez por control y auditoría (calculada + ajuste manual)
-- ------------------------------------------------------------

CREATE TABLE madurez_control (
    id_madurez           SERIAL PRIMARY KEY,
    id_auditoria         INT NOT NULL REFERENCES auditoria(id_auditoria) ON DELETE CASCADE,
    id_control           INT NOT NULL REFERENCES control(id_control),
    madurez_calculada    DECIMAL(3,2) NOT NULL CHECK (madurez_calculada BETWEEN 0 AND 5),
    madurez_ajustada     DECIMAL(3,2) CHECK (madurez_ajustada BETWEEN 0 AND 5),
    justificacion_ajuste TEXT,
    id_usuario_ajuste    INT REFERENCES usuario(id_usuario),
    fecha_calculo        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_auditoria, id_control),
    CHECK (madurez_ajustada IS NULL OR justificacion_ajuste IS NOT NULL)
);

-- ------------------------------------------------------------
-- 7. Índices de apoyo
-- ------------------------------------------------------------

CREATE INDEX idx_pregunta_control       ON pregunta(id_control);
CREATE INDEX idx_respuesta_auditoria    ON respuesta_auditoria(id_auditoria);
CREATE INDEX idx_respuesta_pregunta     ON respuesta_auditoria(id_pregunta);
CREATE INDEX idx_madurez_auditoria      ON madurez_control(id_auditoria);
CREATE INDEX idx_control_dominio        ON control(id_dominio);
CREATE INDEX idx_auditoria_organizacion ON auditoria(id_organizacion);
CREATE INDEX idx_bitacora_usuario         ON bitacora_sistema(id_usuario);
CREATE INDEX idx_bitacora_tabla_registro  ON bitacora_sistema(tabla_afectada, id_registro_afectado);
CREATE INDEX idx_bitacora_fecha           ON bitacora_sistema(fecha_evento);

-- ============================================================
-- 8. VISTAS DE CÁLCULO
-- ============================================================

CREATE VIEW vw_madurez_final AS
SELECT
    mc.id_auditoria,
    mc.id_control,
    mc.madurez_calculada,
    mc.madurez_ajustada,
    COALESCE(mc.madurez_ajustada, mc.madurez_calculada) AS madurez_final,
    (5 - COALESCE(mc.madurez_ajustada, mc.madurez_calculada)) / 5.0 AS brecha
FROM madurez_control mc;

CREATE VIEW vw_exposicion_control AS
SELECT
    mf.id_auditoria,
    c.id_control,
    c.codigo_iso,
    c.nombre_control,
    c.id_dominio,
    mf.madurez_final,
    mf.brecha,
    (c.peso * c.relacion_confidencialidad * mf.brecha) / 9.0 * 100 AS exposicion_confidencialidad,
    (c.peso * c.relacion_integridad       * mf.brecha) / 9.0 * 100 AS exposicion_integridad,
    (c.peso * c.relacion_disponibilidad   * mf.brecha) / 9.0 * 100 AS exposicion_disponibilidad
FROM vw_madurez_final mf
JOIN control c ON c.id_control = mf.id_control;

CREATE VIEW vw_exposicion_dominio AS
SELECT
    ec.id_auditoria,
    c.id_dominio,
    d.nombre_dominio,
    SUM(c.peso * c.relacion_confidencialidad * ec.brecha) / NULLIF(SUM(c.peso * c.relacion_confidencialidad), 0) * 100 AS exposicion_confidencialidad,
    SUM(c.peso * c.relacion_integridad       * ec.brecha) / NULLIF(SUM(c.peso * c.relacion_integridad), 0) * 100       AS exposicion_integridad,
    SUM(c.peso * c.relacion_disponibilidad   * ec.brecha) / NULLIF(SUM(c.peso * c.relacion_disponibilidad), 0) * 100   AS exposicion_disponibilidad
FROM vw_exposicion_control ec
JOIN control c ON c.id_control = ec.id_control
JOIN dominio_funcional d ON d.id_dominio = c.id_dominio
GROUP BY ec.id_auditoria, c.id_dominio, d.nombre_dominio;

CREATE VIEW vw_exposicion_sistema AS
SELECT
    ec.id_auditoria,
    SUM(c.peso * c.relacion_confidencialidad * ec.brecha) / NULLIF(SUM(c.peso * c.relacion_confidencialidad), 0) * 100 AS exposicion_confidencialidad,
    SUM(c.peso * c.relacion_integridad       * ec.brecha) / NULLIF(SUM(c.peso * c.relacion_integridad), 0) * 100       AS exposicion_integridad,
    SUM(c.peso * c.relacion_disponibilidad   * ec.brecha) / NULLIF(SUM(c.peso * c.relacion_disponibilidad), 0) * 100   AS exposicion_disponibilidad
FROM vw_exposicion_control ec
JOIN control c ON c.id_control = ec.id_control
GROUP BY ec.id_auditoria;

CREATE VIEW vw_indice_general_riesgo AS
SELECT
    id_auditoria,
    (exposicion_confidencialidad + exposicion_integridad + exposicion_disponibilidad) / 3.0 AS iger
FROM vw_exposicion_sistema;

CREATE VIEW vw_cumplimiento_control AS
SELECT
    ra.id_auditoria,
    p.id_control,
    COUNT(*) FILTER (WHERE tr.nombre = 'Sí') * 100.0
        / NULLIF(COUNT(*) FILTER (WHERE tr.nombre <> 'No aplica'), 0) AS nivel_cumplimiento
FROM respuesta_auditoria ra
JOIN pregunta p ON p.id_pregunta = ra.id_pregunta
JOIN tipo_respuesta tr ON tr.id_tipo_respuesta = ra.id_tipo_respuesta
GROUP BY ra.id_auditoria, p.id_control;

CREATE VIEW vw_cumplimiento_dominio AS
SELECT
    cc.id_auditoria,
    c.id_dominio,
    d.nombre_dominio,
    SUM(cc.nivel_cumplimiento * c.peso) / NULLIF(SUM(c.peso), 0) AS nivel_cumplimiento
FROM vw_cumplimiento_control cc
JOIN control c ON c.id_control = cc.id_control
JOIN dominio_funcional d ON d.id_dominio = c.id_dominio
GROUP BY cc.id_auditoria, c.id_dominio, d.nombre_dominio;

-- ============================================================
-- 9. VISTA DE VALOR AGREGADO (D)
-- ============================================================

CREATE VIEW vw_tendencia_organizacion AS
SELECT
    a.id_organizacion,
    o.nombre AS nombre_organizacion,
    a.id_auditoria,
    a.area_evaluada,
    a.fecha_auditoria,
    igr.iger,
    AVG(mf.madurez_final) AS madurez_promedio
FROM auditoria a
JOIN organizacion o               ON o.id_organizacion = a.id_organizacion
JOIN vw_indice_general_riesgo igr ON igr.id_auditoria = a.id_auditoria
JOIN vw_madurez_final mf          ON mf.id_auditoria = a.id_auditoria
WHERE a.id_estado = (SELECT id_estado FROM estado_auditoria WHERE nombre = 'Finalizada')
GROUP BY a.id_organizacion, o.nombre, a.id_auditoria, a.area_evaluada, a.fecha_auditoria, igr.iger
ORDER BY a.id_organizacion, a.fecha_auditoria;

-- ============================================================
-- 10. TRIGGERS DE BITÁCORA (VALOR AGREGADO F)
-- ============================================================

CREATE OR REPLACE FUNCTION fn_bitacora_auditoria() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO bitacora_sistema (id_usuario, tabla_afectada, id_registro_afectado, accion, detalle)
        VALUES (
            NEW.id_auditor, 'auditoria', NEW.id_auditoria, 'INSERT',
            'Auditoría creada para la organización ' || NEW.id_organizacion ||
            ' (área evaluada: ' || NEW.area_evaluada || ')'
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.id_estado IS DISTINCT FROM NEW.id_estado THEN
        INSERT INTO bitacora_sistema (id_usuario, tabla_afectada, id_registro_afectado, accion, detalle)
        VALUES (
            COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::int, NEW.id_auditor),
            'auditoria', NEW.id_auditoria, 'UPDATE',
            'Cambio de estado de auditoría: id_estado ' || OLD.id_estado || ' -> ' || NEW.id_estado
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bitacora_auditoria
AFTER INSERT OR UPDATE ON auditoria
FOR EACH ROW EXECUTE FUNCTION fn_bitacora_auditoria();

CREATE OR REPLACE FUNCTION fn_bitacora_madurez() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.madurez_ajustada IS NOT NULL
       AND (TG_OP = 'INSERT' OR OLD.madurez_ajustada IS DISTINCT FROM NEW.madurez_ajustada) THEN
        INSERT INTO bitacora_sistema (id_usuario, tabla_afectada, id_registro_afectado, accion, detalle)
        VALUES (
            NEW.id_usuario_ajuste, 'madurez_control', NEW.id_madurez,
            CASE WHEN TG_OP = 'INSERT' THEN 'INSERT' ELSE 'UPDATE' END,
            'Ajuste manual de madurez del control ' || NEW.id_control ||
            ' a ' || NEW.madurez_ajustada || ' — justificación: ' || COALESCE(NEW.justificacion_ajuste, '(no registrada)')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bitacora_madurez
AFTER INSERT OR UPDATE ON madurez_control
FOR EACH ROW EXECUTE FUNCTION fn_bitacora_madurez();

CREATE OR REPLACE FUNCTION fn_bitacora_usuario() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE'
       AND (OLD.id_rol IS DISTINCT FROM NEW.id_rol OR OLD.activo IS DISTINCT FROM NEW.activo) THEN
        INSERT INTO bitacora_sistema (id_usuario, tabla_afectada, id_registro_afectado, accion, detalle)
        VALUES (
            NULLIF(current_setting('app.current_user_id', true), '')::int,
            'usuario', NEW.id_usuario, 'UPDATE',
            'Cambio de cuenta: id_rol ' || OLD.id_rol || ' -> ' || NEW.id_rol ||
            ', activo ' || OLD.activo || ' -> ' || NEW.activo
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bitacora_usuario
AFTER UPDATE ON usuario
FOR EACH ROW EXECUTE FUNCTION fn_bitacora_usuario();
