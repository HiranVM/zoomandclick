const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    phone:{
        type:Number,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    isBlocked:{
        default:false,
        type:Boolean
    },
    totalWallet: {
        type: Number,
        default: 0
    },
    wallet:{
        type:[Number]
    },
    isLogedin:{
        default:false,
        type:Boolean
    },
    photo:{
        type:String
    },
    coupons:{
        type:[String]
    },
    address:[{
        name:String,
        address:String,
        phone:Number,
        pincode:Number,
        place:String,
        state:String
    }]
})

const User = new mongoose.model("user_collection",UserSchema)

module.exports=User