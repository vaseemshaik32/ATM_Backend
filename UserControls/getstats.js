import dotenv from 'dotenv'
import userstats from '../Models/userstats.js'
import auth from '../Middlewear/auth.js'
import express from 'express'
dotenv.config()
const router= express.Router()

router.get('/getstats', auth ,async (req,res)=>{
    try{
    const uid=req.uid
    console.log(uid)
    const userdata= await userstats.findOne({userid:uid})
    console.log(userdata)
    res.status(200).json(userdata)
    }
    catch(error){
        console.log(error)
        res.status(401).json('some error occoured while getting the data of user')
    }
})

export default router