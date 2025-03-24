import JWT from 'jsonwebtoken';
import dotenv from 'dotenv';
import { expiredTokens } from './app.js';
dotenv.config();

const auth = async (req, res, next) => {
    // Extract token from the URL query parameter (e.g., ?token=your-token)
    const tokenhash = req.query.token; // Retrieve the 'token' query parameter from the URL
    console.log(tokenhash);

    // Check if token exists or if it's expired
    if (!tokenhash || expiredTokens.has(tokenhash)) {
        return res.status(401).json('invalid token');
    }

    try {
        // Verify the token using JWT
        const curuid = JWT.verify(tokenhash, process.env.MY_JWT_SECRET);
        req.uid = curuid;
        req.hashtoken = tokenhash;
        next(); // Proceed to the next middleware or route
    } catch (error) {
        console.log(error);
        res.status(401).json('authentication failed');
    }
};

export default auth;
