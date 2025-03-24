import express from 'express'
import dotenv from 'dotenv'
import userstats from './userstats.js'
import auth from './auth.js'
import { expiredTokens } from './app.js'
const router= express.Router()
dotenv.config()
router.put('/logout', auth, async (req,res)=>{
    try{
        /* 
        we have to revert everything we did in the login phase.
        1.set the latitude and longitude to 0.
        2.set the status to false
        3.add this token to the used tokens set
        4.set needscash and needsdigital to false
        5.all are in uderstats
        */ 
       const tok = req.hashtoken
       await userstats.findOneAndUpdate({userid:req.uid},{latitude:0,longitude:0})
       await userstats.findOneAndUpdate({userid:req.uid},{status:false})
       await userstats.findOneAndUpdate({userid:req.uid},{needscash:false,needsdigital:false})
       await userstats.findOneAndUpdate({userid:req.uid},{tranamount:0})
       expiredTokens.add(tok)


        }
    catch(error){
        console.log(error)
        res.status(400).json('failed to logout')
    }
    
})
export default router



