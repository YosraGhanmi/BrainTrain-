-- Time slots: a second, Ramadan set of slots next to the school-year one,
-- and the school's default timetables for both.

ALTER TABLE "time_slots" ADD COLUMN "ramadan" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX "time_slots_label_key";
CREATE UNIQUE INDEX "time_slots_label_ramadan_key" ON "time_slots"("label", "ramadan");

-- Default school-year timetable (same as DEFAULT_TIME_SLOTS in
-- lib/scheduling/slots.ts). A label that already exists keeps the day and
-- time Reception gave it; only missing ones are added.
INSERT INTO "time_slots" ("id", "label", "ramadan", "dayOfWeek", "startTime", "endTime", "updatedAt")
SELECT v.id, v.label, false, v.day, v.start_time, v.end_time, CURRENT_TIMESTAMP
FROM (VALUES
    ('default-school-g1',  'G1',  3, '14:00', '16:00'),
    ('default-school-g2',  'G2',  3, '16:00', '18:00'),
    ('default-school-g3',  'G3',  5, '14:00', '16:00'),
    ('default-school-g4',  'G4',  5, '16:00', '18:00'),
    ('default-school-g5',  'G5',  6, '09:00', '11:00'),
    ('default-school-g6',  'G6',  6, '11:00', '13:00'),
    ('default-school-g7',  'G7',  6, '14:00', '16:00'),
    ('default-school-g8',  'G8',  6, '16:00', '18:00'),
    ('default-school-g9',  'G9',  0, '09:00', '11:00'),
    ('default-school-g10', 'G10', 0, '11:00', '13:00')
) AS v(id, label, day, start_time, end_time)
ON CONFLICT ("label", "ramadan") DO NOTHING;

-- Default Ramadan timetable (same as DEFAULT_RAMADAN_TIME_SLOTS). G2 moves
-- from Wednesday to Sunday.
INSERT INTO "time_slots" ("id", "label", "ramadan", "dayOfWeek", "startTime", "endTime", "updatedAt")
SELECT v.id, v.label, true, v.day, v.start_time, v.end_time, CURRENT_TIMESTAMP
FROM (VALUES
    ('default-ramadan-g1',  'G1',  3, '13:00', '14:40'),
    ('default-ramadan-g2',  'G2',  0, '13:00', '14:40'),
    ('default-ramadan-g3',  'G3',  5, '13:00', '14:40'),
    ('default-ramadan-g4',  'G4',  5, '14:50', '16:30'),
    ('default-ramadan-g5',  'G5',  6, '09:00', '10:40'),
    ('default-ramadan-g6',  'G6',  6, '11:00', '12:40'),
    ('default-ramadan-g7',  'G7',  6, '13:00', '14:40'),
    ('default-ramadan-g8',  'G8',  6, '14:50', '16:30'),
    ('default-ramadan-g9',  'G9',  0, '09:00', '10:40'),
    ('default-ramadan-g10', 'G10', 0, '11:00', '12:40')
) AS v(id, label, day, start_time, end_time)
ON CONFLICT ("label", "ramadan") DO NOTHING;
