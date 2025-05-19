import express from 'express'
import user from '../Models/Users.js'
import dotenv from 'dotenv'
import JWT from 'jsonwebtoken'
import userstats from '../Models/userstats.js'
const router= express.Router()
dotenv.config()
router.post('/login', async (req, res) => {
    // create a new user obj and save it to the db
    try {
        const { password, email, latitude, longitude } = req.body;
        const curuser = await user.findOne({ email: email });
        if (!curuser) {
            return res.status(400).json('Please register first');
        }
        if (curuser.password === password) {
            // Include dynamic data in the payload
            const payload = {
                userID: curuser._id.toString(),
                iat: Math.floor(Date.now() / 1000), // Issued-at timestamp for uniqueness
            };
            const token = JWT.sign(payload, process.env.MY_JWT_SECRET);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', 
                sameSite: 'Lax', 
                path: '/', //all routes
                domain: '.onrender.com',
                maxAge: 3600000 // 1 hour expiration
            });
            await userstats.findOneAndUpdate({ userid: curuser._id }, { status: true });
            try {
                await userstats.findOneAndUpdate({ userid: curuser._id }, { userlat: latitude, userlong: longitude });
                res.status(200).json({ token, usernameforreact: curuser.username });
            } catch (error) {
                res.status(200).json('logged in but failed to add location');
            }

        } else {
            res.status(400).json('incorrect password');
        }
    } catch (error) {
        console.log(error);
        res.status(400).json('failed to login');
    }
});
export default router
