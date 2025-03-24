import mongoose, { Schema } from "mongoose";
const userstat=new mongoose.Schema({
    status:{type:Boolean,required:true,default:false},
    needsdigital:{type:Boolean,default:false},
    needscash:{type:Boolean,default:false},
    tranamount:{type:Number,default:0},
    totalexchange:{type:Number,required:true,default:0},
    userid:{type:mongoose.Schema.Types.ObjectId,ref:'Users',required:true},
    userlat:{type:Number,required:true,default:0},
    userlong:{type:Number,required:true,default:0}
})
    const userstats= mongoose.model('userstats',userstat)
   export default userstats