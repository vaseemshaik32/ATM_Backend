import userstats from "../Models/userstats.js";
import express, { json } from 'express'
import auth from "../Middlewear/auth.js";
import getdis from "../Middlewear/distance.js";
const router=express.Router()
router.put('/getstats/needdigital', auth, async(req,res)=>{
    try{const idofreceiver=req.uid
    const amountneeded= req.body.amount
    await userstats.findOneAndUpdate({userid:idofreceiver},{needsdigital:true,needscash:false,tranamount:amountneeded})
    const {userlat,userlong} = await userstats.findOne({userid:idofreceiver})
    console.log(userlat)
    
    const Donors=  await userstats.find({
            $and: [
                {status:true},
                { needscash: true },
                { tranamount: { $gte: amountneeded} }
            ]
        }).populate('userid', 'username'); // Populate only the username field from the Users model

    const donors=[]
    for (let i = 0; i < Donors.length; i++) {
    const donor = Donors[i];
    const distance = getdis(userlat,userlong,donor.userlat,donor.userlong);
    donors.push([ distance, donor ])}
    res.status(200).json(donors)}
    catch(error){console.log(error);
        res.status(401).json(error)}
} )
export default router