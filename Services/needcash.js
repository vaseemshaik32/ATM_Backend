import userstats from "../Models/userstats.js";
import express from 'express'
import auth from "../Middlewear/auth.js";
import getdis from "../Middlewear/distance.js";
const router=express.Router()
router.put('/getstats/needcash', auth, async(req,res)=>{
    try{const idofsender=req.uid
    const amountneeded= req.body.amount
    await userstats.findOneAndUpdate({userid:idofsender},{needscash:true,needsdigital:false,tranamount:amountneeded})
    const {userlat,userlong} =await userstats.findOne({userid:idofsender})    
    const Receivers= await userstats.find({ 
         $and: [
                {status:true},
                { needsdigital: true },
                { tranamount: { $gte: amountneeded} }
            ]
    }).populate('userid', 'username');
    
    const receivers=[]
    for (let i = 0; i < Receivers.length; i++) {
    const receiver = Receivers[i];
    const distance = getdis(userlat,userlong,receiver.userlat,receiver.userlong);
    receivers.push([ distance, receiver ])}
    receivers.sort((a, b) => a[0] - b[0]);
    res.status(200).json(receivers)}
    catch(error){console.log(error);res.status(401).json(error)}
} )

export default router