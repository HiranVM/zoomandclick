const mongoose=require("mongoose")

var bannerSchema=new mongoose.Schema({
    

    bannerName:{
        type:String,
        require:true
       
    },
    description:{
        type:String,
        require:true,
       
       
    },
    photo:{
        type:String,
        require:true,
       
       
    }
  
})

const Banner = new mongoose.model("banner",bannerSchema);


module.exports=Banner;