-- Seed / re-seed the salon database from the CSV files in this folder.
--
-- Usage (from /seed-data):
--   psql "<connection-string>" -f seed.sql
--
-- This wipes the four reference tables and reloads them. Run after
-- `dotnet ef database update`. Identity sequences are bumped to MAX(Id)
-- so newly created rows continue from the right number.

BEGIN;

-- Order matters: appointments references the others.
TRUNCATE appointments, customers, services, staff RESTART IDENTITY CASCADE;

\copy staff(           "Id", "FullName", "Role", "PhoneNumber", "IsActive", "CreatedAt")                                                                                                                          FROM 'staff.csv'         WITH (FORMAT csv, HEADER true)
\copy services(        "Id", service_name, "Description", duration_minutes, "Price", "IsActive", "CreatedAt")                                                                                                     FROM 'services.csv'      WITH (FORMAT csv, HEADER true)
\copy customers(       "Id", full_name, phone_number, "Email", "Gender", "DateOfBirth", "Notes", "CreatedAt")                                                                                                     FROM 'customers.csv'     WITH (FORMAT csv, HEADER true)
\copy appointments(    "Id", customer_id, guest_name, staff_id, service_id, appointment_date, appointment_time, "Status", "Remarks", amount_paid, payment_method, completed_at, "CreatedAt")                     FROM 'appointments.csv'  WITH (FORMAT csv, HEADER true)

-- Bump identity sequences past the manually inserted IDs.
SELECT setval(pg_get_serial_sequence('staff',        'Id'), COALESCE((SELECT MAX("Id") FROM staff),        1));
SELECT setval(pg_get_serial_sequence('services',     'Id'), COALESCE((SELECT MAX("Id") FROM services),     1));
SELECT setval(pg_get_serial_sequence('customers',    'Id'), COALESCE((SELECT MAX("Id") FROM customers),    1));
SELECT setval(pg_get_serial_sequence('appointments', 'Id'), COALESCE((SELECT MAX("Id") FROM appointments), 1));

COMMIT;
