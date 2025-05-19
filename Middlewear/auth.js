import JWT from 'jsonwebtoken'
import dotenv from 'dotenv'
import { expiredTokens } from '../app.js'
dotenv.config()
const auth= async (req,res,next)=>{
    const tokenhash = req.cookies?.token 
    console.log(tokenhash)
    if (!tokenhash || expiredTokens.has(tokenhash)){return res.status(401).json('invalid token')}
    try{
        const curuid= JWT.verify(tokenhash, process.env.MY_JWT_SECRET)
        req.uid=curuid.userID
        req.hashtoken=tokenhash
        next()
    }
    catch(error){
        console.log(error)
        res.status(401).json('authentication failed')}

    
}

export default auth 