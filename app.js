import mongoose from "mongoose";
import express from 'express';
import client from "./Servers/redis.js";
import http from 'http'
import cookieParser from "cookie-parser";
import loginrouter from "./UserControls/login.js";
import registerrouter from "./UserControls/register.js";
import statsrouter from './UserControls/getstats.js'
import dotenv from 'dotenv'
import needdigitalrouter from './Services/needdigital.js'
import needcashrouter from './Services/needcash.js'
import logoutrouter from './UserControls/logout.js'
import { setupWebSocketServer } from "./Servers/socket.js";
import cors from 'cors';
dotenv.config()
const app=express()
app.use(cookieParser())
app.use(express.json());
app.use(cors({
    origin: ['https://chicken-fish.site', 'https://www.chicken-fish.site'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true, 
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'] 
}));

export const expiredTokens = new Set();
const server = http.createServer(app); 
setupWebSocketServer(server)
mongoose.connect(process.env.MONGO_URL) .then(() => console.log('connected'))
.catch(err => console.error('Could not connect to MongoDB:', err));
app.get('/',(req,res)=>res.json('hello world'))
app.use('/api',loginrouter)
app.use('/api',registerrouter)
app.use('/api',statsrouter)
app.use('/api',needdigitalrouter)
app.use('/api',needcashrouter)
app.use('/api',logoutrouter)
const PORT =  3000;
server.listen(PORT, () => console.log(`Server running at port ${PORT}`));


// "username":"vaseem","password":"king","email":"abcd@gmail.com"