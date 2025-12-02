# Migración: Formato day_of_week

## Descripción
Esta migración convierte el formato de `day_of_week` en la tabla `schedules` del formato anterior (0=Lunes) al formato estándar JavaScript (0=Domingo).

## Cambios
- **Formato anterior**: 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo
- **Formato nuevo (JavaScript)**: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado

## Conversión
- Lunes: 0 → 1
- Martes: 1 → 2
- Miércoles: 2 → 3
- Jueves: 3 → 4
- Viernes: 4 → 5
- Sábado: 5 → 6
- Domingo: 6 → 0

## Instrucciones

### 1. Backup (IMPORTANTE)
Antes de ejecutar la migración, hacer un backup de la tabla schedules:

```sql
-- En Supabase Dashboard > SQL Editor
CREATE TABLE schedules_backup AS SELECT * FROM schedules;
```

### 2. Verificar datos actuales
```sql
SELECT day_of_week, COUNT(*) as count
FROM schedules
GROUP BY day_of_week
ORDER BY day_of_week;
```

### 3. Ejecutar migración
Copiar y ejecutar el contenido de `migrate-day-of-week.sql` en Supabase Dashboard > SQL Editor.

### 4. Verificar resultados
```sql
-- Debe mostrar días 0-6 con distribución similar al paso 2
SELECT day_of_week, COUNT(*) as count
FROM schedules
GROUP BY day_of_week
ORDER BY day_of_week;
```

### 5. Restaurar si es necesario
Si algo sale mal:
```sql
-- Eliminar datos actuales
DELETE FROM schedules;

-- Restaurar desde backup
INSERT INTO schedules SELECT * FROM schedules_backup;

-- Eliminar backup
DROP TABLE schedules_backup;
```

## Cambios en el código

### Backstage
- ✅ `schedule-editor.tsx`: Array `daysOfWeek` actualizado
- ✅ Lógica de "copiar día anterior" ajustada

### App móvil
- ✅ `app/shop/[id]/schedule.tsx`: Mapeo de días corregido
- ✅ Función `isOpenNow()` usa formato correcto

## Validación post-migración

1. En el backstage, editar horarios de una cafetería
2. Guardar cambios en diferentes días
3. Verificar en la app móvil que los horarios se muestren correctamente
4. Confirmar que la etiqueta "Abierto ahora" funcione correctamente
