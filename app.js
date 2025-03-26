import mongoose from "mongoose";
import express from 'express';
import http from 'http'
import loginrouter from "./login.js";
import registerrouter from "./register.js";
import statsrouter from './getstats.js'
import dotenv from 'dotenv'
import needdigitalrouter from './needdigital.js'
import needcashrouter from './needcash.js'
import logoutrouter from './logout.js'
import { setupWebSocketServer } from "./socket.js";
import cors from 'cors';
dotenv.config()
const app=express()
app.use(express.json());
app.use(cors({
    origin: 'https://frontend-abx0.onrender.com', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true, 
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