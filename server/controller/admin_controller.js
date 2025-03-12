const categorySchema = require('../model/add_category');
const UserSchema = require('../model/model');
const productSchema = require('../model/product_module');
const orderSchema = require('../model/order');
const couponSchema = require('../model/coupon');
const bannerSchema = require('../model/banner')
const fs = require('fs');
const multer = require('multer');
const { order_details } = require('./controller');

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads')
  },
  filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now())
  }
});

var upload = multer({
  storage: storage,
}).single("photo");


//admin login
exports.admin_login = (req, res) => {
 
  try {
    const adcredentail = {
      email: "admin123@gmail.com" ,
      password: 123456789
    }
   
    if (req.body.email == adcredentail.email && req.body.password == adcredentail.password) {
        req.session.isAdAuth=true
        res.redirect("/admin");

    } else {
      res.render("ad_signin", { message: "Invalid entry" });
    }
  } catch (error) {
    console.error(error);
    res.send("An error occurred while logging in.");
  }
};

// admin
exports.admin= async (req, res) => {

  if(req.session.isAdAuth){

    
    const today = new Date().toISOString().split("T")[0];
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setDate(endOfDay.getDate() + 1);
    endOfDay.setMilliseconds(endOfDay.getMilliseconds() - 1);

    const orders = await orderSchema.find(); // Fetching all orders from the database

    // Extracting necessary data for the chart
    const salesData = orders.map(order => ({
      createdAt: order.createdAt.toISOString().split('T')[0], // Extracting date only
      total: order.total
    }));

    // Calculating the total sales for each date
    const salesByDate = salesData.reduce((acc, curr) => {
      acc[curr.createdAt] = (acc[curr.createdAt] || 0) + curr.total;
      return acc;
    }, {});

    // Converting the sales data into separate arrays for chart labels and values
    const chartLabels = Object.keys(salesByDate);
    const chartData = Object.values(salesByDate);
  
    const todaySales = await orderSchema
      .countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        
      })
      
   
  
    const totalsales = await orderSchema.countDocuments({ status: "Delivered" });
  
    const todayRevenue = await orderSchema.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lt: endOfDay },
          payment_method: { $in: ["wallet", "paypal"] },
        },
      },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
    ]);
  
    const revenue = todayRevenue.length > 0 ? todayRevenue[0].totalRevenue : 0;
  
    const TotalRevenue = await orderSchema.aggregate([
      {
        $match: { status: "Delivered" },
      },
      { $group: { _id: null, Revenue: { $sum: "$total" } } },
    ]);
  
    const Revenue = TotalRevenue.length > 0 ? TotalRevenue[0].Revenue : 0;

    
  
    const Orderpending = await orderSchema.countDocuments({ status: "Pending" });
    const OrderReturn = await orderSchema.countDocuments({
      status: "Returned",
    });
    const Ordershipped = await orderSchema.countDocuments({ status: "Shipped" });
    const OrderRefunted = await orderSchema.countDocuments({ status: "Refunded" });
  
    const Ordercancelled = await orderSchema.countDocuments({
      status: "cancelled",
    });
  
    const salesCountByMonth = await orderSchema.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
        },
      },
    ]);
  

  
    res.render("admin", {
      todaySales,
      totalsales,
      revenue,
      Revenue,
      Orderpending,
      Ordershipped,
      Ordercancelled,
      OrderRefunted,
      salesCountByMonth,
      OrderReturn,
      chartLabels: JSON.stringify(chartLabels),
      chartData: JSON.stringify(chartData)
    });

  }else{
    res.render('ad_signin')
  }
}
//logout
exports.logout= (req, res) => {
  req.session.isAdAuth=false
  res.redirect('/admin')
}


  // add  category

exports.add_category = async (req, res) => {
  
  try {
    const categoryInput = req.body.category.trim();

      if (categoryInput === "") {
        res.render("add_category", { msg: "Category name cannot be empty" });
      }else{
      const cat = await categorySchema.find();
      const categoryExists = cat.some((item) => item.category === req.body.category);
    
    if (categoryExists) {
      res.render("add_category", { msg: "Category already exists" });
    }else{
      const user = new categorySchema({
      category: req.body.category,
    });

    const data = await user.save();

    res.redirect("/category");
    }
    
      }

  } catch (err) {
    console.log(err);
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating a create operation",
    });
  }
};

//get category

exports.find_category = async (req, res) => {
  
  categorySchema
  .find()
  .then((category_find) => {
    res.render("category", { category_find });
  })
  .catch((err) => {
    res.status(500).send({
      message:
        err.message || "error occured while retrieving user information",
    });
  });
    
     
};

//get category update/edit page 

exports.edit_category=async (req, res) => {
  try {
    const {id} = req.params;
    
    const user = await categorySchema.findById(id);
    if (user == null) {
      res.redirect('/category');
    } else {
      res.render("update_category", { user });
    }
  } catch (err) {
    res.redirect('/category');
    console.log(err); // log the error for debugging purposes}
}};

//update category

exports.updatecategory = (req, res) => {
  const { id } = req.params;
  
  
  categorySchema.findByIdAndUpdate(id, {
    category: req.body.category,
    description: req.body.description,
  }, )
    .then(() => {
      res.redirect("/category" );
    })
    .catch((error) => {
      res.send(error);
    });
}


//delete category
exports.deletecategory=async(req,res)=>{
  try {
    const id = req.params.id;
    const result = await categorySchema.findByIdAndRemove(id);

    if (result) {
      // Check if user was found and removed
      res.redirect("/category");
      
    } else {

      res.redirect("/category");
    }
    
  } catch (err) {
    res.status(500).send(err.message); // Send error response with status code 500
  }
}

//get add product page 

exports.addproductpage=async (req, res) => {
  
  try {

    const data = await categorySchema.find()
 
    res.render('add_product', { data });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};



//add product

exports.addproduct = async (req, res) => {
  try {
    const productname = req.body.name.trim();
    const data = await categorySchema.find()

    if (productname === "") {
      res.render("add_product", { data, msg: "Product name cannot be empty" });
    }else{
      const pro = await productSchema.find();
    const productExists = pro.some((item) => item.name === req.body.name);
    
    if (productExists) {
      
      res.render("add_product", { data, msg: "product already exists" });
    }else{

    const product = new productSchema({
      name: req.body.name,
      price: req.body.price,
      quantity:req.body.quantity,
      details:req.body.details,
      category_name: req.body.category,
      photo: req.files.map((file) => file.filename) // use req.file.buffer to get the file buffer
    });

     await product.save();

    res.redirect( "/product");
  }
    }

    
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating a create operation",
    });
  }
};


// get products
 exports.find_product = async (req, res) => {
  
  try {
    const product_data = await productSchema.find().exec();
    
    

    res.render("product", {
      product_data
      
    });
  } catch (error) {
    console.error(error);
    res.send({ message: error.message });
  }
};

// get order page
 exports.order_status = async (req, res) => {
 
  try {
    const order_data = await orderSchema.find().populate("user").populate("items.product").populate("items.quantity")
    
    

    res.render("order_status", {
      order_data
      
    });
  } catch (error) {
    console.error(error);
    res.send({ message: error.message });
  }
};

// order updaste
exports.orderUpdate = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    const newStatus = req.body.status;

    // Update the order using findByIdAndUpdate
    await orderSchema.findByIdAndUpdate(orderId, { status: newStatus });

    res.redirect('/order');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// order details
exports.orderdetail =async (req,res)=>{
  try{
    const id = req.params.id;
    
    const order_data = await orderSchema.findOne({_id: id}).populate("user").populate("items.product").populate("items.quantity")
   res.render('order_details',{order_data})
    
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

//get update product page

exports.edit_product = async (req, res) => {
  try {
    const { id } = req.params;
   

   

    const user = await productSchema.findById(id);
    const category = await categorySchema.find();

    if (!user) {
      return res.redirect('/product');
    }

    return res.render('update_product', { user, category });
  } catch (err) {
    console.error(err);
    return res.redirect('/product');
  }
};

//update product

exports.updateproduct=  async(req,res)=>{
  try {
    const { id } = req.params;
    let new_image = "";
    if (req.file) {
      new_image = req.file.filename;
      try {
        fs.unlinkSync("./uploads/" + req.body.photo);
      } catch (error) {
        console.log(error);
      }
    } else {
      new_image = req.body.photo;
    }
   

    // Update the product using findByIdAndUpdate
    const updatedProduct = await productSchema.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        price: req.body.price,
        quantity: req.body.quantity,
        details: req.body.details,
        category_name: req.body.category,
        photo: new_image,
      },
     
      { new: true }
      
    );
    
    // Set { new: true } to return the updated document

    if (updatedProduct) {
      req.session.message = {
        type: "success",
        message: "User update successful",
      };
      req.session.authorized=true
      res.redirect("/product");
    } else {
      // Product not found
      req.session.message = {
        type: "error",
        message: "Product not found",
      };
      res.redirect("/product");
    }
  } catch (error) {
    console.error(error);
    res.send(error);
  }
}


exports.deleteproduct=async(req,res)=>{
  try {
    const id = req.params.id;
    const result = await productSchema.findByIdAndRemove(id);

    if (result) {
      // Check if user was found and removed
      res.redirect("/product");
      
    } else {

      res.redirect("/product");
    }
    
  } catch (err) {
    res.status(500).send(err.message); // Send error response with status code 500
  }
}

// find user

exports.find_user = async (req, res) => {
  
  try {
    const user_data = await UserSchema.find().exec();
    
    

    res.render("user", {
      user_data: user_data,
      
    });
  } catch (error) {
    console.error(error);
    res.send({ message: error.message });
  }
};

//block user


exports.block_user = (req, res) => {
  const { id } = req.params;

  UserSchema.findByIdAndUpdate(id, {
    isBlocked: true,
  }, { new: true })
    .then((updatedUser) => {
      res.redirect('/user'); 
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed to update user.");
    });
};


exports.unblock_user = (req, res) => {
  const { id } = req.params;

  UserSchema.findByIdAndUpdate(id, {
    isBlocked: false,
  }, { new: true })
    .then((updatedUser) => {
      res.redirect('/user'); 
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed to update user.");
    });
};


//get add coupon page 

exports.addcouponpage=async (req, res) => {
  
  try {

    const data = await categorySchema.find()
 
    res.render('add_coupon', { data });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};



//add coupon

exports.addcoupon = async (req, res) => {
  try {
    const couponInput = req.body.coupon.trim();
    const data = await categorySchema.find()
    const offer = req.body.offer;
    if(offer>50||!offer){
      res.render("add_coupon", { data, msg: "Offer cannot be greater than 50" });
    }
    else if(couponInput === "") {
      res.render("add_coupon", { data, msg: "Coupon name cannot be empty" });
    }else{
          const cou = await couponSchema.find();
    const couponExists = cou.some((item) => item.coupon === req.body.coupon);
    
    if (couponExists) {
      const data = await categorySchema.find()
      res.render("add_coupon", { data, msg: "coupon already exists" });
    }else{

    const coupon = new couponSchema({
      coupon: req.body.coupon,
      category: req.body.category,
      expiryDate:req.body.expiryDate,
      offer:req.body.offer,
      
      
    });

    const data = await coupon.save();

    res.redirect( "/coupon");
  }
    }



  } catch (err) {
    console.log(err);
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating a create operation",
    });
  }
};

// get products
exports.find_coupon = async (req, res) => {
  
  try {
    const coupon_data = await couponSchema.find().exec();
    
    

    res.render("coupon", {
      coupon_data
      
    });
  } catch (error) {
    console.error(error);
    res.send({ message: error.message });
  }
};


//get update product page

exports.editcoupon = async (req, res) => {
  try {
    const { id } = req.params;
   

   

    const coupon = await couponSchema.findById(id);
    const category = await categorySchema.find();

    if (!coupon) {
      return res.redirect('/coupon');
    }

    return res.render('update_coupon', { coupon, category });
  } catch (err) {
    console.error(err);
    return res.redirect('/product');
  }
};

//update product

exports.updatecoupon=  async(req,res)=>{
  try {
    const { id } = req.params;

    // Update the coupon using findByIdAndUpdate
    const updatedCoupon = await couponSchema.findByIdAndUpdate(
      id,
      {
        coupon: req.body.coupon,
        category: req.body.category,
        expiryDate:req.body.expiryDate,
        offer:req.body.offer,
      },
     
      { new: true }
      
    );
    
    // Set { new: true } to return the updated document

    if (updatedCoupon) {
      req.session.message = {
        type: "success",
        message: "User update successful",
      };
      req.session.authorized=true
      res.redirect("/coupon");
    } else {
      // Product not found
      req.session.message = {
        type: "error",
        message: "Product not found",
      };
      res.redirect("/coupon");
    }
  } catch (error) {
    console.error(error);
    res.send(error);
  }
}



//deletecoupon
exports.deletecoupon =async(req,res)=>{
  try {
    const id = req.params.id;
    const result = await couponSchema.findByIdAndRemove(id);

    if (result) {
      // Check if user was found and removed
      res.redirect("/coupon");
      
    } else {

      res.redirect("/coupon");
    }
    
  } catch (err) {
    res.status(500).send(err.message); // Send error response with status code 500
  }
}

//refund
exports.refund = async (req,res)=>{
  try{
    const orderId = req.params.id;
    const newStatus = "Refunded"
    await orderSchema.findByIdAndUpdate(orderId, { status: newStatus });
    const order = await orderSchema.findById(orderId)
    const user = await UserSchema.findById(order.user)

    console.log(order.total);
    const wallets = user.totalWallet + order.total;
    user.wallet.push(order.total)
    user.totalWallet=wallets
    await user.save();
    res.redirect('/order');
  } catch (error) {
    console.error(error);
    res.send(error);
  }
}

//filter
exports.filterorder = async (req,res)=>{
  try{
    const preDate = new Date(req.body.preDate) 
    const postDate = new Date(req.body.postDate) 
    
    
    const order_data = await orderSchema.find({
      createdAt: { $gte: preDate, $lte: postDate }
    }).populate("user").populate("items.product").populate("items.quantity")
    res.render('salesreport',{order_data,preDate:req.body.preDate,postDate:req.body.postDate});
  } catch (error) {
    console.error(error);
    res.send(error);
  }
}

//banner_page
exports.banner_page = async (req,res)=>{
  try{
    const banner = await bannerSchema.find()
    res.render('banner_page',{banner})
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating a create operation",
    });
  }
}

//addbannerpage
exports.addbannerpage =async(req,res)=>{
  try{
    res.render('add_banner')
  } catch(error){
    console.log(error)
    res.status(500).send({
      message:
      error.message || "Some error occurred while creating a create operation"
    })
  }
}

//add banner
exports.addbanner = async (req, res) => {
  try {
    if (!req.file) {
      console.log("no file");
      throw new Error('No file uploaded');
    }
    const banner = new bannerSchema({
      bannerName: req.body.banner,
      description: req.body.description,
      photo: req.file.filename // use req.file.buffer to get the file buffer
    });

    await banner.save();

    res.redirect( "/banner");

  } catch (err) {
    console.log(err);
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating a create operation",
    });
  }
};

//editbannerpage
exports.editbannerpage =async(req,res)=>{
  try{
    const bannerId = req.params.id;
    const banner = await bannerSchema.findById(bannerId)
    res.render('update_banner',{banner})
  } catch(error){
    console.log(error)
    res.status(500).send({
      message:
      error.message || "Some error occurred while creating a create operation"
    })
  }
}

//edit banner
exports.editbanner = async (req, res) => {
  try {
    const bannerId = req.params.id;
    let new_image = "";
    if (req.file) {
      new_image = req.file.filename;
      try {
        fs.unlinkSync("./uploads/" + req.body.photo);
      } catch (error) {
        console.log(error);
      }
    } else {
      new_image = req.body.photo;
    }
   
    await bannerSchema.findByIdAndUpdate(bannerId,{
      bannerName: req.body.banner,
      description: req.body.description,
      photo: new_image 
    },{ new: true });

    res.redirect( "/banner");

  } catch (err) {
    console.log(err);
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating a create operation",
    });
  }
};
exports.delete_banner = async(req,res)=>{
  try {
  const id = req.params.id;
  const result = await bannerSchema.findByIdAndRemove(id);

  if (result) {
    // Check if user was found and removed
    res.redirect("/banner");
    
  } else {

    res.redirect("/banner");
  }
  
} catch (err) {
  res.status(500).send(err.message); // Send error response with status code 500
}
}


//sales report
exports.salesreport = async(req,res)=>{
  try{
    const preDate = ""
    const postDate = ""
    const order_data = await orderSchema.find().populate("user").populate("items.product").populate("items.quantity")
    res.render("salesreport",{order_data,preDate,postDate})
  } catch (err) {
  res.status(500).send(err.message); // Send error response with status code 500
}
}