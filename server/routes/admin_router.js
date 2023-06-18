const express = require('express');
const route = express.Router();
const multer = require('multer')
const fs = require('fs')
const admin_controller = require('../controller/admin_controller');
const Category = require('../model/add_category');

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

route.use(express.urlencoded({extended:true}));
route.use(express.json());

route.get("/add_category",async (req, res) => {
  const category_find = await Category.find().exec()
  res.render("add_category",{category_find});
});
route.get("/ad_signin", (req, res) => {
  res.render("ad_signin");
});
route.get("/chart", (req, res) => {
  res.render("chart");
});


const isAdAuth = (req,res,next)=>{
  if(req.session.isAdAuth){
    next()
  }else{
    res.redirect("/ad_signin")
  }
}


//get
route.get("/admin",admin_controller.admin);
route.get("/logout",admin_controller.logout);

route.get("/salesreport",admin_controller.salesreport)

route.get("/orderdetail/:id",admin_controller.orderdetail);
route.get("/order",isAdAuth,admin_controller.order_status)

route.get("/add_coupon_page", admin_controller.addcouponpage)
route.get("/delete_coupon/:id", admin_controller.deletecoupon)
route.get("/edit_coupon/:id", admin_controller.editcoupon)
route.get("/coupon",isAdAuth, admin_controller.find_coupon);

route.get("/product", isAdAuth,admin_controller.find_product);
route.get("/delete_product/:id", admin_controller.deleteproduct)
route.get("/edit_pdt/:id",admin_controller.edit_product)
route.get("/add_product_page",isAdAuth, admin_controller.addproductpage)

route.get("/category",isAdAuth, admin_controller.find_category)
route.get("/edit/:id",admin_controller.edit_category)
route.get("/delete_category/:id", admin_controller.deletecategory)

route.get("/user",isAdAuth,admin_controller.find_user)
route.get("/block_user/:id",admin_controller.block_user)
route.get("/unblock_user/:id",admin_controller.unblock_user)

route.get("/banner", isAdAuth,admin_controller.banner_page)
route.get("/addbanner_page", isAdAuth,admin_controller.addbannerpage)
route.get("/editbanner_page/:id",admin_controller.editbannerpage)
route.get("/delete_banner/:id",admin_controller.delete_banner)


//post
route.post("/update_category/:id",admin_controller.updatecategory);
route.post("/add_category",isAdAuth,admin_controller.add_category);

route.post("/order_update/:id",admin_controller.orderUpdate);

route.post("/update_product/:id",upload.array('photo', 5),admin_controller.updateproduct);
route.post("/add_product",upload.array('photo', 5),admin_controller.addproduct);

route.post("/add_coupon",isAdAuth,admin_controller.addcoupon);
route.post("/update_coupon/:id", admin_controller.updatecoupon)

route.post("/ad_signin",admin_controller.admin_login);

route.post("/order_refund/:id",admin_controller.refund);

route.post("/filterorder",admin_controller.filterorder);

route.post("/addbanner", uploads,admin_controller.addbanner)
route.post("/editbanner/:id", uploads,admin_controller.editbanner)

module.exports=route;