import { createServer } from "node:http";
import { exec } from "node:child_process";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log('User connected');

    // Listen for incoming messages
    socket.on('message', (msg) => {
      console.log('Received message:', msg);
      exec(msg, (error, stdout, stderr) => {
        if (error) {
          if (stderr) {
            io.emit('message', stderr); // Broadcast the message to all clients
          }
          return;
        }
        io.emit('message', stdout);
      });
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});