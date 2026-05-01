require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const app = require("./src/app");
const registerChatHandlers = require("./src/sockets/chatSocket");
const { setIO } = require("./src/sockets/io");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true }
});

setIO(io);
registerChatHandlers(io);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server on :${PORT}`));
  })
  .catch(err => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });