-- ============================================================
-- Script de datos semilla — Catálogo normativo en Oracle 21c
-- Proyecto Integrador — Administración de Bases de Datos
-- Ejecutar DESPUÉS de 01_ddl_esquema_oracle.sql
-- ============================================================

INSERT INTO rol (nombre_rol) VALUES ('Administrador del sistema');
INSERT INTO rol (nombre_rol) VALUES ('Auditor');
INSERT INTO rol (nombre_rol) VALUES ('DBA');

INSERT INTO tipo_respuesta (nombre) VALUES ('Sí');
INSERT INTO tipo_respuesta (nombre) VALUES ('No');
INSERT INTO tipo_respuesta (nombre) VALUES ('No aplica');

INSERT INTO estado_auditoria (nombre) VALUES ('Borrador');
INSERT INTO estado_auditoria (nombre) VALUES ('En progreso');
INSERT INTO estado_auditoria (nombre) VALUES ('Finalizada');

INSERT INTO categoria_iso (nombre_categoria) VALUES ('Organizacionales');
INSERT INTO categoria_iso (nombre_categoria) VALUES ('Personas');
INSERT INTO categoria_iso (nombre_categoria) VALUES ('Físicos');
INSERT INTO categoria_iso (nombre_categoria) VALUES ('Tecnológicos');

INSERT INTO dominio_funcional (nombre_dominio, descripcion) VALUES ('Control de acceso', 'Reglas, identidad y derechos de acceso lógico a la base de datos');
INSERT INTO dominio_funcional (nombre_dominio, descripcion) VALUES ('Acceso técnico y autenticación', 'Privilegios administrativos y mecanismos de autenticación segura');
INSERT INTO dominio_funcional (nombre_dominio, descripcion) VALUES ('Protección criptográfica de datos', 'Cifrado, enmascaramiento, prevención de fuga y eliminación segura');
INSERT INTO dominio_funcional (nombre_dominio, descripcion) VALUES ('Continuidad y disponibilidad', 'Respaldo y redundancia del motor de base de datos');
INSERT INTO dominio_funcional (nombre_dominio, descripcion) VALUES ('Registro y monitoreo', 'Bitácoras, alertas y sincronización de tiempo');
INSERT INTO dominio_funcional (nombre_dominio, descripcion) VALUES ('Gestión de cambios y configuración', 'Configuración base (hardening) y control de cambios');
INSERT INTO dominio_funcional (nombre_dominio, descripcion) VALUES ('Seguridad física de medios', 'Manejo de medios de almacenamiento físico usados por la BD');

-- ------------------------------------------------------------
-- Controles ISO 27002:2022
-- ------------------------------------------------------------

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '5.15', 'Control de acceso',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Organizacionales'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Control de acceso'),
  'Asegurar el acceso autorizado y prevenir el acceso no autorizado a la información y otros activos asociados.',
  'Reglas para controlar el acceso lógico a la base de datos con base en requisitos de negocio y seguridad (principio de mínimo privilegio, necesidad de conocer).',
  3, 3, 3, 2
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '5.16', 'Gestión de identidad',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Organizacionales'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Control de acceso'),
  'Permitir la identificación única de las personas y sistemas que acceden a la base de datos.',
  'Ciclo de vida de las identidades (alta, modificación, baja) de usuarios y cuentas de servicio de la BD.',
  2, 2, 2, 1
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '5.18', 'Derechos de acceso',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Organizacionales'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Control de acceso'),
  'Garantizar que el acceso a la información esté definido, otorgado, revisado y revocado conforme a la política de control de acceso.',
  'Asignación, revisión periódica y revocación oportuna de permisos sobre esquemas, tablas y procedimientos.',
  3, 3, 3, 1
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '8.2', 'Derechos de acceso privilegiado',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Tecnológicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Acceso técnico y autenticación'),
  'Garantizar que solo personas autorizadas, con fines legítimos, tengan acceso privilegiado a los sistemas.',
  'Restricción, aprobación y monitoreo del uso de cuentas con privilegios elevados (DBA, sysadmin, root de BD).',
  3, 3, 3, 2
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '8.5', 'Autenticación segura',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Tecnológicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Acceso técnico y autenticación'),
  'Garantizar el acceso seguro a sistemas y servicios mediante técnicas de autenticación robustas.',
  'Uso de autenticación multifactor, políticas de contraseñas robustas y protección contra ataques de fuerza bruta en el motor de BD.',
  3, 3, 2, 1
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '8.24', 'Uso de criptografía',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Tecnológicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Protección criptográfica de datos'),
  'Garantizar el uso adecuado y eficaz de la criptografía para proteger la confidencialidad e integridad de la información.',
  'Cifrado de datos en reposo (tablespaces, respaldos) y en tránsito, y gestión del ciclo de vida de las llaves.',
  3, 3, 2, 1
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '8.11', 'Enmascaramiento de datos',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Tecnológicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Protección criptográfica de datos'),
  'Limitar la exposición de datos sensibles y apoyar el cumplimiento de requisitos legales.',
  'Anonimización, seudonimización o enmascaramiento dinámico de datos sensibles en entornos de prueba/desarrollo.',
  2, 3, 1, 1
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '8.12', 'Prevención de fuga de datos',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Tecnológicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Protección criptográfica de datos'),
  'Detectar y prevenir la divulgación no autorizada de información sensible.',
  'Controles (DLP, alertas de exportación masiva) que monitorean consultas y extracciones de datos sensibles.',
  2, 3, 1, 1
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '8.10', 'Eliminación de información',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Tecnológicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Protección criptográfica de datos'),
  'Prevenir la exposición innecesaria de información sensible y cumplir requisitos normativos.',
  'Eliminación segura de datos, respaldos vencidos y copias en entornos de prueba cuando ya no son necesarios.',
  1, 2, 1, 1
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '8.13', 'Copia de seguridad de la información',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Tecnológicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Continuidad y disponibilidad'),
  'Permitir la recuperación de datos ante pérdida de información o incidentes.',
  'Política de respaldo (frecuencia, retención, cifrado) con pruebas periódicas de restauración.',
  3, 1, 2, 3
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '8.14', 'Redundancia de instalaciones de procesamiento de información',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Tecnológicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Continuidad y disponibilidad'),
  'Asegurar la disponibilidad continua de las instalaciones de procesamiento de información.',
  'Alta disponibilidad, clústeres o replicación del motor de base de datos.',
  2, 1, 1, 3
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '8.15', 'Registro (logging)',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Tecnológicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Registro y monitoreo'),
  'Registrar eventos, generar evidencia y facilitar la detección de acciones que afecten la seguridad.',
  'Bitácoras de accesos, cambios y actividad administrativa sobre la base de datos.',
  2, 2, 2, 1
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '8.16', 'Actividades de monitoreo',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Tecnológicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Registro y monitoreo'),
  'Detectar comportamiento anómalo y potenciales incidentes de seguridad.',
  'Monitoreo continuo del motor de BD en busca de anomalías (picos de consultas, accesos fuera de horario).',
  2, 2, 2, 2
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '8.17', 'Sincronización de relojes',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Tecnológicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Registro y monitoreo'),
  'Permitir la correlación y el análisis de eventos de seguridad y apoyar investigaciones de incidentes.',
  'Sincronización de los relojes del servidor de BD con una fuente de tiempo confiable (NTP).',
  1, 1, 1, 1
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '8.9', 'Gestión de la configuración',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Tecnológicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Gestión de cambios y configuración'),
  'Garantizar que el hardware, software y servicios funcionen con la configuración de seguridad requerida.',
  'Definición, documentación y monitoreo de configuraciones seguras del motor de base de datos (hardening).',
  3, 2, 3, 2
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '8.32', 'Gestión de cambios',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Tecnológicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Gestión de cambios y configuración'),
  'Preservar la seguridad de la información cuando se realizan cambios en los sistemas.',
  'Procedimiento formal para planificar, probar, aprobar y documentar cambios sobre esquemas, procedimientos y configuración de la BD.',
  2, 1, 3, 2
);

INSERT INTO control (codigo_iso, nombre_control, id_categoria, id_dominio, objetivo, descripcion, peso, relacion_confidencialidad, relacion_integridad, relacion_disponibilidad)
VALUES (
  '7.10', 'Medios de almacenamiento',
  (SELECT id_categoria FROM categoria_iso WHERE nombre_categoria = 'Físicos'),
  (SELECT id_dominio FROM dominio_funcional WHERE nombre_dominio = 'Seguridad física de medios'),
  'Garantizar que solo se divulgue, modifique o destruya información autorizada almacenada en medios físicos.',
  'Gestión del ciclo de vida de medios removibles (cintas, discos externos) usados para respaldos.',
  1, 2, 1, 1
);

-- ------------------------------------------------------------
-- Preguntas por control (49)
-- ------------------------------------------------------------

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '5.15-1', '¿Existe una política documentada de control de acceso a la base de datos?', 1, 1 FROM control WHERE codigo_iso = '5.15';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '5.15-2', '¿Se aplica el principio de mínimo privilegio en la asignación de accesos?', 2, 2 FROM control WHERE codigo_iso = '5.15';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '5.15-3', '¿Se revisa periódicamente el cumplimiento de la política de control de acceso?', 2, 3 FROM control WHERE codigo_iso = '5.15';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '5.16-1', '¿Cada usuario y cuenta de servicio tiene una identidad única e individual?', 1, 1 FROM control WHERE codigo_iso = '5.16';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '5.16-2', '¿Existe un proceso formal de alta/baja de identidades vinculado a RRHH o al ciclo del proyecto?', 2, 2 FROM control WHERE codigo_iso = '5.16';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '5.16-3', '¿Se audita periódicamente la existencia de cuentas huérfanas o duplicadas?', 2, 3 FROM control WHERE codigo_iso = '5.16';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '5.18-1', '¿Existe un procedimiento formal para otorgar derechos de acceso a la BD?', 1, 1 FROM control WHERE codigo_iso = '5.18';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '5.18-2', '¿Los derechos de acceso otorgados corresponden efectivamente al rol del usuario?', 2, 2 FROM control WHERE codigo_iso = '5.18';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '5.18-3', '¿Se revisan y revocan oportunamente los derechos de acceso (ej. al cambiar de puesto)?', 2, 3 FROM control WHERE codigo_iso = '5.18';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.2-1', '¿Existe un inventario de cuentas con privilegios administrativos sobre la BD?', 1, 1 FROM control WHERE codigo_iso = '8.2';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.2-2', '¿El uso de cuentas privilegiadas requiere aprobación y está restringido a tareas específicas?', 2, 2 FROM control WHERE codigo_iso = '8.2';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.2-3', '¿Se monitorea y registra el uso de cuentas privilegiadas?', 2, 3 FROM control WHERE codigo_iso = '8.2';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.5-1', '¿Existe una política de contraseñas robustas para el acceso a la BD?', 1, 1 FROM control WHERE codigo_iso = '8.5';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.5-2', '¿Se utiliza autenticación multifactor para accesos administrativos?', 2, 2 FROM control WHERE codigo_iso = '8.5';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.5-3', '¿Existen mecanismos de bloqueo ante intentos repetidos de autenticación fallida?', 2, 3 FROM control WHERE codigo_iso = '8.5';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.24-1', '¿Existe una política de uso de criptografía para proteger los datos de la BD?', 1, 1 FROM control WHERE codigo_iso = '8.24';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.24-2', '¿Los datos sensibles están cifrados en reposo y en tránsito?', 2, 2 FROM control WHERE codigo_iso = '8.24';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.24-3', '¿Existe un proceso formal de gestión (rotación, resguardo) de llaves criptográficas?', 2, 3 FROM control WHERE codigo_iso = '8.24';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.11-1', '¿Existe un procedimiento de enmascaramiento de datos sensibles?', 1, 1 FROM control WHERE codigo_iso = '8.11';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.11-2', '¿Se aplica enmascaramiento en entornos de prueba/desarrollo?', 2, 2 FROM control WHERE codigo_iso = '8.11';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.11-3', '¿Se revisa periódicamente qué datos requieren enmascaramiento?', 2, 3 FROM control WHERE codigo_iso = '8.11';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.12-1', '¿Existen controles para detectar extracciones masivas o no autorizadas de datos?', 1, 1 FROM control WHERE codigo_iso = '8.12';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.12-2', '¿Se generan alertas ante posibles fugas de información?', 2, 2 FROM control WHERE codigo_iso = '8.12';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.12-3', '¿Se da seguimiento y cierre formal a las alertas de fuga de datos?', 2, 3 FROM control WHERE codigo_iso = '8.12';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.10-1', '¿Existe una política de eliminación segura de información?', 1, 1 FROM control WHERE codigo_iso = '8.10';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.10-2', '¿Se eliminan de forma segura los datos, respaldos y copias que ya no son necesarios?', 2, 2 FROM control WHERE codigo_iso = '8.10';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.10-3', '¿Se documenta evidencia de las eliminaciones realizadas?', 2, 3 FROM control WHERE codigo_iso = '8.10';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.13-1', '¿Existe una política formal de respaldo de la base de datos (frecuencia, retención)?', 1, 1 FROM control WHERE codigo_iso = '8.13';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.13-2', '¿Se ejecutan los respaldos conforme a lo definido en la política?', 2, 2 FROM control WHERE codigo_iso = '8.13';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.13-3', '¿Se realizan pruebas periódicas de restauración de los respaldos?', 2, 3 FROM control WHERE codigo_iso = '8.13';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.14-1', '¿Existen mecanismos de redundancia o alta disponibilidad para la BD?', 1, 1 FROM control WHERE codigo_iso = '8.14';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.14-2', '¿Los mecanismos de redundancia han sido probados (failover)?', 2, 2 FROM control WHERE codigo_iso = '8.14';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.14-3', '¿Se monitorea el estado de la redundancia de forma continua?', 2, 3 FROM control WHERE codigo_iso = '8.14';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.15-1', '¿Se registran (log) los accesos y cambios realizados sobre la BD?', 1, 1 FROM control WHERE codigo_iso = '8.15';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.15-2', '¿Los registros están protegidos contra modificación o eliminación no autorizada?', 2, 2 FROM control WHERE codigo_iso = '8.15';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.15-3', '¿Se revisan periódicamente los registros generados?', 2, 3 FROM control WHERE codigo_iso = '8.15';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.16-1', '¿Existen herramientas o procesos de monitoreo activo sobre la BD?', 1, 1 FROM control WHERE codigo_iso = '8.16';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.16-2', '¿Se generan alertas automáticas ante comportamientos anómalos?', 2, 2 FROM control WHERE codigo_iso = '8.16';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.16-3', '¿Existen métricas o indicadores de monitoreo revisados periódicamente?', 2, 3 FROM control WHERE codigo_iso = '8.16';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.17-1', '¿Los servidores de BD están sincronizados con una fuente de tiempo confiable (NTP)?', 2, 1 FROM control WHERE codigo_iso = '8.17';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.17-2', '¿Se verifica periódicamente que la sincronización de relojes se mantenga correcta?', 3, 2 FROM control WHERE codigo_iso = '8.17';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.9-1', '¿Existe una configuración base (baseline) documentada y segura del motor de BD?', 1, 1 FROM control WHERE codigo_iso = '8.9';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.9-2', '¿Se verifica periódicamente que la configuración vigente cumpla con el baseline?', 2, 2 FROM control WHERE codigo_iso = '8.9';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.9-3', '¿Existen alertas ante cambios no autorizados en la configuración?', 2, 3 FROM control WHERE codigo_iso = '8.9';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.32-1', '¿Existe un procedimiento formal de gestión de cambios para la BD?', 1, 1 FROM control WHERE codigo_iso = '8.32';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.32-2', '¿Los cambios se prueban antes de aplicarse en producción?', 2, 2 FROM control WHERE codigo_iso = '8.32';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '8.32-3', '¿Los cambios quedan documentados y aprobados formalmente?', 2, 3 FROM control WHERE codigo_iso = '8.32';

INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '7.10-1', '¿Existe un procedimiento para el manejo seguro de medios de almacenamiento físico?', 1, 1 FROM control WHERE codigo_iso = '7.10';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '7.10-2', '¿Los medios físicos con datos de la BD se almacenan en un lugar seguro?', 2, 2 FROM control WHERE codigo_iso = '7.10';
INSERT INTO pregunta (id_control, codigo_pregunta, texto_pregunta, peso_pregunta, orden)
SELECT id_control, '7.10-3', '¿Existe un proceso de destrucción segura de medios en desuso?', 2, 3 FROM control WHERE codigo_iso = '7.10';

-- ------------------------------------------------------------
-- Usuario Administrador Inicial
-- ------------------------------------------------------------

INSERT INTO usuario (id_rol, nombre_completo, correo, contrasena_hash, activo)
VALUES (
  (SELECT id_rol FROM rol WHERE nombre_rol = 'Administrador del sistema'),
  'Administrador Principal',
  'admin@jalfoconsulting.com',
  '$2b$10$7Z8lRkU8e7c1H2j3K4l5u.2m5n6o7p8q9r0s1t2u3v4w5x6y7z8a',
  1
);

COMMIT;
