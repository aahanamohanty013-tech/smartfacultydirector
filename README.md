# Smart Faculty Directory 🎓

A modern, full-stack web application designed to helping students navigate campus and find faculty members efficiently. It combines a beautiful **Glassmorphism UI** with intelligent backend algorithms to show real-time faculty availability.

## ✨ Key Features

### 🔍 Smart Search (Trie Algorithm)
- **Instant Autocomplete**: Uses a customized Trie data structure for O(L) search complexity.
- **Keyword Search**: Find faculty not just by name, but by department, specialization, or shortform (e.g., "AS" for Anjali Sharma).

### ⏱️ Real-Time Availability Intelligence
- **"Likely Available" vs "In Class"**: The system cross-references the current time with faculty timetables to infer status.
- **Best Visiting Time**: Automatically calculates the *next* free slot in a professor's schedule and suggests it (e.g., "Free after 2:30 PM").

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Features a premium purple/blue gradient aesthetic with frosted glass cards.
- **Responsive**: Fully optimized for desktop and mobile use.
- **Dedicated Pages**:
  - **Departments**: Visual grid of all engineering departments.
  - **Programs**: List of academic programs offered.
  - **Campus Map**: Integrated map view for navigation.

### 🛠️ Admin Dashboard
- **Manage Faculty**: Add new faculty members with details like Room No, Floor, and Specialization.
- **Timetable Management**: Interface to add/edit weekly class schedules.

---

## 🏗️ Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS (Glassmorphism)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Relational Data Model)
- **Algorithm**: In-Memory Trie for Search Optimization
- **Deployment**: Vercel (Serverless Architecture)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- PostgreSQL (Local or Cloud)

### 1. Installation
Clone the repository:
```bash
git clone https://github.com/your-username/smart-faculty-directory.git
cd smart-faculty-directory
```

### 2. Database Setup
1. Create a PostgreSQL database named `smart_faculty`.
2. Run the schema script to create tables:
   ```bash
   psql -d smart_faculty -f database/schema.sql
   ```
   *(Or run the SQL query in your PGAdmin/Neon dashboard)*

### 3. Backend Setup
```bash
cd server
npm install
npm run dev
```
*Server runs on port 5000.*

### 4. Frontend Setup
```bash
cd client
npm install
npm run dev
```
*Client runs on port 5173.*

---

## ☁️ Deployment (Vercel)

This project is configured for **Vercel**.
1. Import the project in Vercel.
2. Add your **Environment Variables** in Vercel Settings:
   - `DATABASE_URL`: Your cloud Postgres connection string (e.g. from Neon.tech).
3. Deploy! 🚀

---

## 📂 Project Structure
- **/client**: React Frontend App
- **/server**: Express API & Logic
  - `trie.js`: Custom Search Algorithm
  - `index.js`: Main Server Logic
- **/database**: SQL Schema
