import mongoose from "mongoose";
const userschema= mongoose.Schema({
    username:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    email:{type:String,required:true}
})
const user= mongoose.model('Users', userschema)
export default user