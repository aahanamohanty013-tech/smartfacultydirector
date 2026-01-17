-- Database Schema for Smart Faculty Directory

-- Users table for Admin authentication (Simple for now)
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- In real app, use bcrypt
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL
);

-- Faculty details
DROP TABLE IF EXISTS faculty CASCADE;
CREATE TABLE faculty (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    room_number VARCHAR(20),
    floor_number VARCHAR(20),
    aliases TEXT[], -- Array of strings for nicknames/initials
    specialization VARCHAR(255)
);

-- Timetable entries
DROP TABLE IF EXISTS timetables CASCADE;
CREATE TABLE timetables (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL, -- 'Monday', 'Tuesday', etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    course_name VARCHAR(100),
    location VARCHAR(50) -- Optional, if class is in a different room
);

-- Seed Data: Faculty
INSERT INTO faculty (name, department, room_number, floor_number, aliases) VALUES
('Dr. Prashant Kumar', 'Computer Science', 'CS-101', '1st Floor', ARRAY['Prash', 'PK']),
('Dr. Anjali Sharma', 'Mathematics', 'MATH-202', '2nd Floor', ARRAY['Anjali', 'AS']),
('Dr. Vikram Singh', 'Physics', 'PHY-305', '3rd Floor', ARRAY['Vikram', 'VS']);

-- Seed Data: Timetables (Generic data for testing)
-- Assuming today might be Monday, Tuesday, etc. Adding coverage.
INSERT INTO timetables (faculty_id, day_of_week, start_time, end_time, course_name) VALUES
-- Prashant (CS)
(1, 'Monday', '09:00', '10:00', 'CS101 Intro'),
(1, 'Monday', '11:00', '12:00', 'CS202 Algorithms'),
(1, 'Tuesday', '10:00', '11:30', 'CS303 AI'),
(1, 'Wednesday', '14:00', '15:00', 'CS101 Intro'),
(1, 'Friday', '09:00', '11:00', 'Lab Session'),

-- Anjali (Math)
(2, 'Monday', '10:00', '11:00', 'MATH101 Calculus'),
(2, 'Wednesday', '10:00', '11:30', 'MATH202 Linear Algebra'),
(2, 'Thursday', '12:00', '13:30', 'MATH303 Stats');
