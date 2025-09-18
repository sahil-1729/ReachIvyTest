import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer,
    {
        cors: {
          origin: "http://localhost:3001"
        }
      }
  );

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("audio-data", (data) => {
        console.log(data)
      console.log("Received audio data:", {
        audio: data.audio,
        size: data.size,
        type: data.type,
        timestamp: data.timestamp,
        audioLength: data.audio.length
      });
      
      // Here you can process the audio data
      // For example, save to file, send to speech-to-text service, etc.
      
      // Send confirmation back to client
      socket.emit("audio-received", {
        audio: data.audio,
        message: "Audio data received successfully",
        timestamp: new Date().toISOString(),
        size: data.size
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
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