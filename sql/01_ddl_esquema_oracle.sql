-- ============================================================
-- Script DDL — Aplicación de Evaluación de Riesgo ISO/IEC 27002
-- Proyecto Integrador — Administración de Bases de Datos
-- Motor de referencia: Oracle Database 21c
-- ============================================================

-- ------------------------------------------------------------
-- 0. Limpieza previa (permite reejecutar el script en Oracle)
-- ------------------------------------------------------------
BEGIN
  EXECUTE IMMEDIATE 'DROP VIEW vw_tendencia_organizacion'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP VIEW vw_indice_general_riesgo'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP VIEW vw_exposicion_sistema'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP VIEW vw_exposicion_dominio'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP VIEW vw_exposicion_control'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP VIEW vw_cumplimiento_dominio'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP VIEW vw_cumplimiento_control'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP VIEW vw_madurez_final'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_bitacora_usuario'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_bitacora_madurez'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_bitacora_auditoria'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE bitacora_sistema CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE evidencia_archivo CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE madurez_control CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE respuesta_auditoria CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE auditoria CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE estado_auditoria CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE tipo_respuesta CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE pregunta CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE control CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE dominio_funcional CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE categoria_iso CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE organizacion CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE usuario CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE rol CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL;
END;
/

-- ------------------------------------------------------------
-- 1. Tablas de catálogo (lookup) — 3FN en Oracle 21c
-- ------------------------------------------------------------

CREATE TABLE rol (
    id_rol       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_rol   VARCHAR2(50) NOT NULL UNIQUE
);

CREATE TABLE categoria_iso (
    id_categoria      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_categoria  VARCHAR2(50) NOT NULL UNIQUE
);

CREATE TABLE dominio_funcional (
    id_dominio     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_dominio VARCHAR2(100) NOT NULL UNIQUE,
    descripcion    CLOB
);

CREATE TABLE tipo_respuesta (
    id_tipo_respuesta NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre            VARCHAR2(20) NOT NULL UNIQUE
);

CREATE TABLE estado_auditoria (
    id_estado NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre    VARCHAR2(30) NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- 2. Usuarios y organizaciones
-- ------------------------------------------------------------

CREATE TABLE usuario (
    id_usuario       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_rol           NUMBER NOT NULL REFERENCES rol(id_rol),
    nombre_completo  VARCHAR2(150) NOT NULL,
    correo           VARCHAR2(150) NOT NULL UNIQUE,
    contrasena_hash  VARCHAR2(255) NOT NULL,
    activo           NUMBER(1) DEFAULT 1 NOT NULL CHECK (activo IN (0, 1)),
    fecha_creacion   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE organizacion (
    id_organizacion   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre            VARCHAR2(200) NOT NULL,
    sector            VARCHAR2(100),
    direccion         VARCHAR2(250),
    telefono_contacto VARCHAR2(30)
);

-- ------------------------------------------------------------
-- 2.1 Bitácora de auditoría del sistema (VALOR AGREGADO F)
-- ------------------------------------------------------------

CREATE TABLE bitacora_sistema (
    id_bitacora           NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario            NUMBER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    tabla_afectada        VARCHAR2(50) NOT NULL,
    id_registro_afectado  NUMBER NOT NULL,
    accion                VARCHAR2(20) NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
    detalle               CLOB,
    fecha_evento          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ------------------------------------------------------------
-- 3. Catálogo normativo: controles y preguntas
-- ------------------------------------------------------------

CREATE TABLE control (
    id_control                 NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_iso                 VARCHAR2(10) NOT NULL UNIQUE,
    nombre_control              VARCHAR2(150) NOT NULL,
    id_categoria                NUMBER NOT NULL REFERENCES categoria_iso(id_categoria),
    id_dominio                  NUMBER NOT NULL REFERENCES dominio_funcional(id_dominio),
    objetivo                    CLOB NOT NULL,
    descripcion                 CLOB NOT NULL,
    peso                        NUMBER(3) NOT NULL CHECK (peso BETWEEN 1 AND 3),
    relacion_confidencialidad   NUMBER(3) NOT NULL CHECK (relacion_confidencialidad BETWEEN 1 AND 3),
    relacion_integridad         NUMBER(3) NOT NULL CHECK (relacion_integridad BETWEEN 1 AND 3),
    relacion_disponibilidad     NUMBER(3) NOT NULL CHECK (relacion_disponibilidad BETWEEN 1 AND 3)
);

CREATE TABLE pregunta (
    id_pregunta     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_control      NUMBER NOT NULL REFERENCES control(id_control) ON DELETE CASCADE,
    codigo_pregunta VARCHAR2(15) NOT NULL UNIQUE,
    texto_pregunta  CLOB NOT NULL,
    peso_pregunta   NUMBER(3) NOT NULL CHECK (peso_pregunta BETWEEN 1 AND 3),
    orden           NUMBER(3) NOT NULL
);

-- ------------------------------------------------------------
-- 4. Auditorías
-- ------------------------------------------------------------

CREATE TABLE auditoria (
    id_auditoria       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_organizacion    NUMBER NOT NULL REFERENCES organizacion(id_organizacion),
    id_auditor         NUMBER NOT NULL REFERENCES usuario(id_usuario),
    id_dba             NUMBER NOT NULL REFERENCES usuario(id_usuario),
    id_estado          NUMBER NOT NULL REFERENCES estado_auditoria(id_estado),
    area_evaluada      VARCHAR2(150) NOT NULL,
    fecha_auditoria    DATE NOT NULL,
    fecha_creacion     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_finalizacion TIMESTAMP,
    CHECK (id_auditor <> id_dba)
);

-- ------------------------------------------------------------
-- 5. Respuestas del cuestionario y evidencia
-- ------------------------------------------------------------

CREATE TABLE respuesta_auditoria (
    id_respuesta       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_auditoria       NUMBER NOT NULL REFERENCES auditoria(id_auditoria) ON DELETE CASCADE,
    id_pregunta        NUMBER NOT NULL REFERENCES pregunta(id_pregunta),
    id_tipo_respuesta  NUMBER NOT NULL REFERENCES tipo_respuesta(id_tipo_respuesta),
    observaciones      CLOB,
    fecha_registro     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unq_aud_preg UNIQUE (id_auditoria, id_pregunta)
);

CREATE TABLE evidencia_archivo (
    id_evidencia    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_respuesta    NUMBER NOT NULL REFERENCES respuesta_auditoria(id_respuesta) ON DELETE CASCADE,
    nombre_archivo  VARCHAR2(255) NOT NULL,
    ruta_archivo    VARCHAR2(500) NOT NULL,
    fecha_carga     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ------------------------------------------------------------
-- 6. Madurez por control y auditoría (calculada + ajuste manual)
-- ------------------------------------------------------------

CREATE TABLE madurez_control (
    id_madurez           NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_auditoria         NUMBER NOT NULL REFERENCES auditoria(id_auditoria) ON DELETE CASCADE,
    id_control           NUMBER NOT NULL REFERENCES control(id_control),
    madurez_calculada    NUMBER(3,2) NOT NULL CHECK (madurez_calculada BETWEEN 0 AND 5),
    madurez_ajustada     NUMBER(3,2) CHECK (madurez_ajustada BETWEEN 0 AND 5),
    justificacion_ajuste CLOB,
    id_usuario_ajuste    NUMBER REFERENCES usuario(id_usuario),
    fecha_calculo        TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unq_aud_ctrl UNIQUE (id_auditoria, id_control),
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
CREATE INDEX idx_bitacora_tabla_reg       ON bitacora_sistema(tabla_afectada, id_registro_afectado);
CREATE INDEX idx_bitacora_fecha           ON bitacora_sistema(fecha_evento);

-- ============================================================
-- 8. VISTAS DE CÁLCULO EN ORACLE 21c
-- ============================================================

CREATE OR REPLACE VIEW vw_madurez_final AS
SELECT
    mc.id_auditoria,
    mc.id_control,
    mc.madurez_calculada,
    mc.madurez_ajustada,
    NVL(mc.madurez_ajustada, mc.madurez_calculada) AS madurez_final,
    (5 - NVL(mc.madurez_ajustada, mc.madurez_calculada)) / 5.0 AS brecha
FROM madurez_control mc;

CREATE OR REPLACE VIEW vw_exposicion_control AS
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

CREATE OR REPLACE VIEW vw_exposicion_dominio AS
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

CREATE OR REPLACE VIEW vw_exposicion_sistema AS
SELECT
    ec.id_auditoria,
    SUM(c.peso * c.relacion_confidencialidad * ec.brecha) / NULLIF(SUM(c.peso * c.relacion_confidencialidad), 0) * 100 AS exposicion_confidencialidad,
    SUM(c.peso * c.relacion_integridad       * ec.brecha) / NULLIF(SUM(c.peso * c.relacion_integridad), 0) * 100       AS exposicion_integridad,
    SUM(c.peso * c.relacion_disponibilidad   * ec.brecha) / NULLIF(SUM(c.peso * c.relacion_disponibilidad), 0) * 100   AS exposicion_disponibilidad
FROM vw_exposicion_control ec
JOIN control c ON c.id_control = ec.id_control
GROUP BY ec.id_auditoria;

CREATE OR REPLACE VIEW vw_indice_general_riesgo AS
SELECT
    id_auditoria,
    (exposicion_confidencialidad + exposicion_integridad + exposicion_disponibilidad) / 3.0 AS iger
FROM vw_exposicion_sistema;

CREATE OR REPLACE VIEW vw_cumplimiento_control AS
SELECT
    ra.id_auditoria,
    p.id_control,
    COUNT(CASE WHEN tr.nombre = 'Sí' THEN 1 END) * 100.0
        / NULLIF(COUNT(CASE WHEN tr.nombre <> 'No aplica' THEN 1 END), 0) AS nivel_cumplimiento
FROM respuesta_auditoria ra
JOIN pregunta p ON p.id_pregunta = ra.id_pregunta
JOIN tipo_respuesta tr ON tr.id_tipo_respuesta = ra.id_tipo_respuesta
GROUP BY ra.id_auditoria, p.id_control;

CREATE OR REPLACE VIEW vw_cumplimiento_dominio AS
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

CREATE OR REPLACE VIEW vw_tendencia_organizacion AS
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
GROUP BY a.id_organizacion, o.nombre, a.id_auditoria, a.area_evaluada, a.fecha_auditoria, igr.iger;

-- ============================================================
-- 10. PAQUETE Y TRIGGERS DE BITÁCORA EN PL/SQL (ORACLE 21c)
-- ============================================================

CREATE OR REPLACE PACKAGE pkg_app_context AS
  PROCEDURE set_user_id(p_user_id IN NUMBER);
  FUNCTION get_user_id RETURN NUMBER;
END pkg_app_context;
/

CREATE OR REPLACE PACKAGE BODY pkg_app_context AS
  g_user_id NUMBER := NULL;
  PROCEDURE set_user_id(p_user_id IN NUMBER) IS
  BEGIN
    g_user_id := p_user_id;
  END set_user_id;

  FUNCTION get_user_id RETURN NUMBER IS
  BEGIN
    RETURN g_user_id;
  END get_user_id;
END pkg_app_context;
/

CREATE OR REPLACE TRIGGER trg_bitacora_auditoria
AFTER INSERT OR UPDATE ON auditoria
FOR EACH ROW
DECLARE
  v_user_id NUMBER;
BEGIN
  v_user_id := pkg_app_context.get_user_id();
  IF INSERTING THEN
    INSERT INTO bitacora_sistema (id_usuario, tabla_afectada, id_registro_afectado, accion, detalle)
    VALUES (
      :NEW.id_auditor, 'auditoria', :NEW.id_auditoria, 'INSERT',
      'Auditoría creada para la organización ' || :NEW.id_organizacion || ' (área evaluada: ' || :NEW.area_evaluada || ')'
    );
  ELSIF UPDATING AND (:OLD.id_estado <> :NEW.id_estado OR (:OLD.id_estado IS NULL AND :NEW.id_estado IS NOT NULL)) THEN
    INSERT INTO bitacora_sistema (id_usuario, tabla_afectada, id_registro_afectado, accion, detalle)
    VALUES (
      NVL(v_user_id, :NEW.id_auditor), 'auditoria', :NEW.id_auditoria, 'UPDATE',
      'Cambio de estado de auditoría: id_estado ' || :OLD.id_estado || ' -> ' || :NEW.id_estado
    );
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_bitacora_madurez
AFTER INSERT OR UPDATE ON madurez_control
FOR EACH ROW
BEGIN
  IF :NEW.madurez_ajustada IS NOT NULL
     AND (INSERTING OR :OLD.madurez_ajustada IS NULL OR :OLD.madurez_ajustada <> :NEW.madurez_ajustada) THEN
    INSERT INTO bitacora_sistema (id_usuario, tabla_afectada, id_registro_afectado, accion, detalle)
    VALUES (
      :NEW.id_usuario_ajuste, 'madurez_control', :NEW.id_madurez,
      CASE WHEN INSERTING THEN 'INSERT' ELSE 'UPDATE' END,
      'Ajuste manual de madurez del control ' || :NEW.id_control || ' a ' || :NEW.madurez_ajustada || ' — justificación: ' || NVL(:NEW.justificacion_ajuste, '(no registrada)')
    );
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_bitacora_usuario
AFTER UPDATE ON usuario
FOR EACH ROW
DECLARE
  v_user_id NUMBER;
BEGIN
  v_user_id := pkg_app_context.get_user_id();
  IF :OLD.id_rol <> :NEW.id_rol OR :OLD.activo <> :NEW.activo THEN
    INSERT INTO bitacora_sistema (id_usuario, tabla_afectada, id_registro_afectado, accion, detalle)
    VALUES (
      v_user_id, 'usuario', :NEW.id_usuario, 'UPDATE',
      'Cambio de cuenta: id_rol ' || :OLD.id_rol || ' -> ' || :NEW.id_rol || ', activo ' || :OLD.activo || ' -> ' || :NEW.activo
    );
  END IF;
END;
/
