const express = require('express')
const route = express.Router()
const controller = require('../controller/controller')
const User = require('../model/model')

const multer = require('multer');
var fs = require('fs');


const connect = require("../connection/connection");

let storage = multer.diskStorage({
  destination: (req,file,cb)=>{
      // make sure directory exists
      const uploadDir = './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      cb(null, uploadDir);
  
  },
  filename: (req,file,cb)=>{
     // remove spaces and special characters from original filename
     const originalname = file.originalname.replace(/[^a-zA-Z0-9]/g, "");
     // set filename to fieldname + current date + original filename
     cb(null, `${file.fieldname}_${Date.now()}_${originalname}`);
   },
});

let upload = multer({
  storage:storage,
})

let uploads = multer({
  storage:storage,
}).single('photo')


const isAuth = (req,res,next)=>{
  if(req.session.user){
    next();
  }else{
    res.redirect("/");
  }
}



const isblock = async(req,res,next)=>{
  if(req.session.user){
    const userId = req.session.user?._id
  const userblock = await User.findById(userId)
  if(userblock.isBlocked){
    console.log("block");
    req.session.user=null;
    req.session.authorized=false;
    res.redirect("/")
  }else {
    next()
  }
  }else{
    next()
  }
  
}

route.get("/invoice",(req, res) => {
    res.render("invoice");
  });
route.get("/404",(req, res) => {
    res.render("404");
  });
route.get("/wallet",(req, res) => {
    res.render("wallet");
  });





//get

route.get('/',controller.index);
route.get('/single/:id',isblock,controller.single);
route.get('/filter/:id',controller.filter);
route.get('/contact',isblock,controller.contact);
route.get('/about',isblock,controller.about);
route.get('/product_list',isblock,controller.product_list)
route.get('/checkout',isblock,controller.checkout);
route.get('/deleteCartItem/:id',controller.deleteCartItem);

route.get('/delete_address/:id',controller.deleteaddress);

route.get('/viewcart',isAuth,isblock,controller.userCart);
route.get('/addToCart/:id',controller.add_to_cart);

route.get("/order/:id",isblock,controller.order_details)
route.get('/order_detail/:id',isblock,controller.orderdetailspage);

route.get('/paypal-success/:id',controller.paypal_success)
route.get('/paypal-err',controller.paypal_err)
route.get('/payment/:id',isblock,controller.payment);

route.get('/profile/:id',isblock,controller.profile)
route.get('/wallet/:id',isblock,controller.wallet)

route.get('/invoice/:id',controller.invoice)




//post

route.post('/log_in',controller.find_user);
route.post('/log_out/:id',controller.log_out);

route.post('/pricerange',controller.pricerange);
route.post('/search_pro',controller.search_product);

route.post('/coupon',controller.coupon)
route.post("/order_cancel/:id",controller.ordercancel)

route.post('/viewcart',isAuth,isblock,controller.userCart);
route.post('/incrementQuantity',controller.incrementQuantity);
route.post('/decrementQuantity',controller.decrementQuantity);

route.post('/add_address',controller.addaddress);
route.post('/edit_address/:id',controller.editaddress);

route.post('/add_paddress',controller.addpaddress);
route.post('/edit_paddress/:id',controller.editpaddress);

route.post('/placeOrder/:id',controller.placeOrder);
route.post('/order_Return/:id',controller.return);

route.post('/profilephoto/:id', uploads,controller.profilepic)

module.exports=route