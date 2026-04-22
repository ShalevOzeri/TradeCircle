# Social Network - Android 2 Final Project

## Setup

### 1. Install MongoDB (local or Atlas)
### 2. Server
```bash
cd server
npm install
# copy .env.example -> .env and edit
npm run dev
```

### 3. Client
```bash
cd client
npm install
npm start
```

## Structure
- `server/` - Node.js + Express + MongoDB + Socket.io
- `client/` - React + jQuery + D3.js

## Tech requirements covered
- MVC architecture
- Mongoose models: User, Group, Post, Message
- JWT authentication + role-based permissions
- Real-time chat via Socket.io
- D3.js statistics dashboards
- jQuery + Ajax for all client-server communication
- CSS3: text-shadow, transition, multiple-columns, @font-face, border-radius