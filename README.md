# Smart_faculty
Smart Faculty Directory is a full-stack web application designed to help students quickly find faculty members, check their real-time availability, and navigate the campus efficiently. Unlike traditional static directories, this system intelligently processes schedules and availability to save students time.

🚀 Features

🔍 Instant Faculty Search (Trie-based, ultra-fast)

⏱ Real-time Availability Status

📅 Smart Timetable Analysis

🕒 Best Visiting Time Suggestion

💎 Modern Glassmorphism UI

⚡ Serverless, Scalable Deployment

🧠 Problem Statement

In large universities, students often struggle to locate faculty members or know whether they are available. Traditional faculty directories only provide static information and fail to answer practical questions like:

Is the professor free right now?

When is the best time to meet them?

Where are they usually located?

Smart Faculty Directory solves this by transforming a simple directory into an intelligent, real-time system.

🏗️ Tech Stack & Rationale
Frontend

React.js + Vite + Tailwind CSS

React → Dynamic, interactive UI

Vite → Extremely fast development & build times

Tailwind → Efficient styling with modern Glassmorphism effects

Backend

Node.js + Express

Lightweight, scalable API

Handles searching, profiles, and schedule computation efficiently

Database

PostgreSQL (Neon/Vercel)

Structured relational data

Strong support for relationships (Faculty → Timetable → Slots)

High data integrity and performance

⚙️ Key Technical Highlight: Trie-Based Search
🔴 Challenge

Searching through hundreds of faculty names using traditional queries becomes slower as data grows.

🟢 Solution – Trie (Prefix Tree)

We implemented an in-memory Trie data structure on the backend.

Time complexity: O(L) where L is the length of the typed prefix

Search speed remains constant regardless of total faculty count

Enables real-time, instant suggestions

👉 Typing "Pra..." instantly returns "Prashant".

⏰ Smart Availability System

The system dynamically compares the current time with stored timetables.

If current time overlaps a lecture slot → “In Class”

Otherwise → “Likely Available”

🎯 Best Visiting Time

The backend scans upcoming slots and intelligently suggests the next free time window for meeting the faculty.

🌍 Deployment

Platform: Vercel

Architecture: Serverless

Why Vercel?

Global CDN for frontend

Auto-scaling serverless APIs

Fast, reliable, and production-ready
