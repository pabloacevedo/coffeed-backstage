-- Migración para convertir day_of_week al formato JavaScript estándar
-- Formato anterior: 0=Lunes, 1=Martes, ..., 6=Domingo
-- Formato nuevo (JavaScript): 0=Domingo, 1=Lunes, ..., 6=Sábado

-- IMPORTANTE: Hacer backup antes de ejecutar

BEGIN;

-- Paso 1: Crear tabla temporal con los datos convertidos
-- Solo mantener un registro por (coffee_shop_id, day_of_week) - el más reciente
CREATE TEMP TABLE schedules_migrated AS
SELECT DISTINCT ON (coffee_shop_id, new_day_of_week)
    id,
    coffee_shop_id,
    new_day_of_week,
    open_time,
    close_time,
    closed,
    created_at,
    updated_at,
    deleted
FROM (
    SELECT
        id,
        coffee_shop_id,
        CASE day_of_week
            WHEN 0 THEN 1  -- Lunes: 0 → 1
            WHEN 1 THEN 2  -- Martes: 1 → 2
            WHEN 2 THEN 3  -- Miércoles: 2 → 3
            WHEN 3 THEN 4  -- Jueves: 3 → 4
            WHEN 4 THEN 5  -- Viernes: 4 → 5
            WHEN 5 THEN 6  -- Sábado: 5 → 6
            WHEN 6 THEN 0  -- Domingo: 6 → 0
            ELSE day_of_week
        END as new_day_of_week,
        open_time,
        close_time,
        closed,
        created_at,
        updated_at,
        deleted
    FROM schedules
    WHERE deleted = false
) sub
ORDER BY coffee_shop_id, new_day_of_week, updated_at DESC;

-- Paso 2: Eliminar todos los registros de schedules
DELETE FROM schedules;

-- Paso 3: Insertar con los valores convertidos
INSERT INTO schedules (id, coffee_shop_id, day_of_week, open_time, close_time, closed, created_at, updated_at, deleted)
SELECT id, coffee_shop_id, new_day_of_week, open_time, close_time, closed, created_at, updated_at, deleted
FROM schedules_migrated;

-- Paso 4: Eliminar tabla temporal
DROP TABLE schedules_migrated;

COMMIT;

-- Verificar los resultados
-- SELECT day_of_week, COUNT(*) FROM schedules GROUP BY day_of_week ORDER BY day_of_week;
