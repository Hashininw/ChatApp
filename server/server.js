import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import {Server}from "socket.io";


//Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

//Initialize socket.io server
export const io = new Server(server,{
    cors:{origin:"*"}
})

//Store online users
export const userSocketMap = {};

//Socket.io connection handler
io.on("connection", (socket)=>{
    const userId = socket.handshake.query.userId;
    if(userId){ 
        userSocketMap[userId]=socket.id;
        console.log(`User ${userId} connected`); // Debug log
    }


    //Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect",()=>{
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

//Middleware setup
app.use(cors());
app.use(express.json({limit:'4mb'}));

//Routes setup
app.use("/api/status",(req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

//Connect to MongoDB
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));