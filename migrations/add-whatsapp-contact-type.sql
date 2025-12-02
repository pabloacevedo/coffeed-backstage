-- Script opcional para agregar WhatsApp como tipo de contacto válido
-- Solo es necesario si existe una constraint CHECK en la tabla contacts que limite los tipos permitidos

-- Verificar si existe constraint de tipo en contacts
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'contacts'::regclass AND contype = 'c';

-- Si existe una constraint que limite a ('phone', 'instagram', 'web'),
-- ejecutar lo siguiente para agregar 'whatsapp':

-- ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_type_check;
-- ALTER TABLE contacts ADD CONSTRAINT contacts_type_check
--   CHECK (type IN ('phone', 'instagram', 'web', 'whatsapp'));

-- Nota: Si la columna 'type' es de tipo TEXT sin constraints, no es necesario ejecutar este script.
