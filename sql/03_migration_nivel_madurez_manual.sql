-- ============================================================
-- Migración: Agregar nivel_madurez_manual en respuesta_auditoria
-- Ejecutar en la base de datos existente (sin reinicializar datos)
-- ============================================================

ALTER TABLE respuesta_auditoria
    ADD COLUMN IF NOT EXISTS nivel_madurez_manual SMALLINT
        CHECK (nivel_madurez_manual BETWEEN 0 AND 5);

COMMENT ON COLUMN respuesta_auditoria.nivel_madurez_manual IS
    'Nivel de madurez percibido por el auditor para esta pregunta (0 = Inexistente ... 5 = Optimizado). Nulo si no se indica.';
