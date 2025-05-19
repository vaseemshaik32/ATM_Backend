import express from 'express'
import user from '../Models/Users.js'
import userstats from '../Models/userstats.js'
const router= express.Router()
router.post('/register',async (req,res)=>{
//create a new user obj and save it to the db
    try{  
        const {username,password,email}= req.body
        const newuser=new user({username,password,email})
        const result=await newuser.save()
        const newuserstats= new userstats({userid:result._id})
        const response= await newuserstats.save()

        res.status(200).json('registered successfully and created user stats')
        }
    catch (error) {
    console.error('Error saving user:', error);
    res.status(400).json('failed to register: ' + error.message);
}

    
})

export default router