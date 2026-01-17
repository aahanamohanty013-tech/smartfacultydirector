# Smart Faculty Directory & Campus Navigator

A React.js + Node.js application to find faculty members, check their real-time availability, and view their weekly schedule.

## Features
- **Instant Search**: Trie-based autocomplete for fast lookups.
- **Real-time Availability**: "Likely Available" or "In Class" status based on schedule.
- **Best Visiting Time**: Intelligently suggests the next free slot.
- **Admin Dashboard**: Manage faculty profiles and class schedules.

## Prerequisites
- **Node.js**: [Download](https://nodejs.org/)
- **PostgreSQL**: [Download](https://www.postgresql.org/download/)

## Setup Instructions

### 1. Database Setup
1. Make sure PostgreSQL is running.
2. Create the database:
   ```bash
   createdb -U postgres smart_faculty
   ```
   *(If your user is not `postgres`, adjust accordingly).*
3. Seed the database tables:
   ```bash
   psql -U postgres -d smart_faculty -f database/schema.sql
   ```

### 2. Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   *The server runs on http://localhost:5000*

### 3. Frontend Setup
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React app:
   ```bash
   npm run dev
   ```
4. Open the link shown (usually http://localhost:5173).

## Default Login / Config
- **Database Config**: The app attempts to connect to local Postgres with user `postgres` and password `password`. 
  - To change this, create a `.env` file in `server/` with:
    ```
    DB_USER=your_user
    DB_PASSWORD=your_password
    DB_NAME=smart_faculty
    ```
