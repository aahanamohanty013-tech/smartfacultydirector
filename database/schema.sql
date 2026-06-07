-- Database Schema for Smart Faculty Directory

-- Faculty details
DROP TABLE IF EXISTS faculty CASCADE;
CREATE TABLE faculty (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    room_number VARCHAR(20),
    floor_number VARCHAR(20),
    aliases TEXT[], -- Array of strings for nicknames/initials
    specialization VARCHAR(255),
    research_interests TEXT,
    bio TEXT
);

-- Users table for Admin/Faculty authentication
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL
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

-- Students table
DROP TABLE IF EXISTS students CASCADE;
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- Appointments table
DROP TABLE IF EXISTS appointments CASCADE;
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' -- 'Pending', 'Scheduled', 'Declined'
);

-- Notifications table
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Queue entries table
DROP TABLE IF EXISTS queue_entries CASCADE;
CREATE TABLE queue_entries (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    urgency VARCHAR(20) NOT NULL, -- 'High', 'Medium', 'Low'
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Waiting' -- 'Waiting', 'Serving', 'Completed', 'Cancelled'
);

-- Seed Data: Faculty (Basic seeding, main seeding occurs in seed.js)
INSERT INTO faculty (name, department, room_number, floor_number, aliases, specialization, research_interests, bio) VALUES
('Dr. Prashant Kumar', 'Computer Science', 'CS-101', '1st Floor', ARRAY['Prash', 'PK'], 'Artificial Intelligence', 'Machine learning in healthcare, deep neural networks, computer vision, natural language processing.', 'Dr. Prashant is an associate professor in CSE department with 10+ years of research experience in deep learning and healthcare analytics.'),
('Dr. Anjali Sharma', 'Mathematics', 'MATH-202', '2nd Floor', ARRAY['Anjali', 'AS'], 'Machine Learning', 'Linear algebra, optimization algorithms, probability models, graph theory and cryptography.', 'Dr. Anjali is a passionate researcher focusing on numerical analysis and mathematical foundations of neural networks.'),
('Dr. Vikram Singh', 'Physics', 'PHY-305', '3rd Floor', ARRAY['Vikram', 'VS'], 'Quantum Computing', 'Quantum computing algorithms, semiconductor physics, simulation of electromagnetic fields, nanotechnology.', 'Dr. Vikram leads the quantum optics lab and works on next-generation computing technologies and nanomaterials.');
