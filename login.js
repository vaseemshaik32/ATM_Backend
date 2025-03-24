import express from 'express'
import user from './Users.js'
import dotenv from 'dotenv'
import JWT from 'jsonwebtoken'
import userstats from './userstats.js'
const router= express.Router()
dotenv.config()
router.post('/login',async (req,res)=>{
//create a new user obj and save it to the db
    try{
        const {password,email,latitude,longitude}= req.body
        const curuser=await user.findOne({email:email})
        if (curuser.password===password){
            const token = JWT.sign(curuser._id.toString(),process.env.MY_JWT_SECRET);
            await userstats.findOneAndUpdate({userid:curuser._id},{status:true})
            try{
                await userstats.findOneAndUpdate({userid:curuser._id},{userlat:latitude,userlong:longitude})
                res.status(200).json({token, usernameforreact:curuser.username})
            }
            catch(error){
                res.status(200).json('logged in but failed to add location')
            }

        }
        else{res.status(400).json('incorrect password')}
        }
    catch(error){
        console.log(error)
        res.status(400).json('failed to login')
    }
    
})
export default router