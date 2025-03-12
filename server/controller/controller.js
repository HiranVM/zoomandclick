const bcrypt = require('bcrypt')
const UserSchema = require('../model/model')
const productSchema = require('../model/product_module')
const categorySchema = require('../model/add_category')
const mongoose = require('mongoose')
const cartSchema =require('../model/cart')
const order_model = require('../model/order')
const couponSchema = require('../model/coupon')
const bannerSchema = require('../model/banner')
const paypal = require('paypal-rest-sdk')
// const { Message } = require('twilio/lib/twiml/MessagingResponse')
const ITEMS_PER_PAGE = 9;
require('dotenv').config();

// index
exports.index= async(req,res)=>{
  if(req.session.user){
    const User = req.session.user
    const product = await productSchema.find().limit(4)
    const banner = await bannerSchema.find()
    res.render('indexlog',{User,product,banner});
  }else{
    const product = await productSchema.find().limit(4)
    const banner = await bannerSchema.find()
    res.render('index',{product,banner});
  }
}

//filter 
exports.filter = async (req,res)=>{
  try{
    
    const id = req.params.id;
    const categori = await categorySchema.findOne({_id:id});
    const product1 = await productSchema.find({category_name:categori.category})
    const product2 = await productSchema.find().limit(4)
    const Category = await categorySchema.find();
    const User = req.session.user
    res.render("shop", { product1,product2 ,Category,User });
  }
  catch(error){
    console.log(error);
    res.status(500).send({error:"internal server error"})
  }
}

//add addrress
exports.addaddress = async (req,res)=>{
 
  
    try{
      
      const userId = req.session.user?._id;
      const { name, address, phone, pincode, place, state } = req.body
      
      // Find the user by a specific identifier
      const user = await UserSchema.findOne({_id:userId});
      if (!user) {
        res.status(404).send('User not found.');
        return;
      }
      // Push the new address data to the existing address array
      user.address.push({ name, address, phone, pincode, place, state });
  
      // Save the updated user document
      await user.save();
      res.redirect("/checkout")
  }
  catch (err) {
    console.error(err);
    res.status(500).send('Error finding/updating user.');
  }
}
//add profile addrress
exports.addpaddress = async (req,res)=>{
 
  
    try{
      
      const userId = req.session.user?._id;
      const { name, address, phone, pincode, place, state } = req.body
      
      // Find the user by a specific identifier
      const user = await UserSchema.findOne({_id:userId});
      if (!user) {
        res.status(404).send('User not found.');
        return;
      }
      // Push the new address data to the existing address array
      user.address.push({ name, address, phone, pincode, place, state });
  
      // Save the updated user document
      await user.save();
      res.redirect(`/profile/${user._id}`)
  }
  catch (err) {
    console.error(err);
    res.status(500).send('Error finding/updating user.');
  }
}

//edit address
exports.editaddress =async (req,res)=>{
 try{
  const id = req.params.id;
 const userId = req.session.user?._id;
  const User = await UserSchema.findById(userId)
  const addressIndex = User.address.findIndex((address) => address._id.toString() === id);

  // Update the address fields
  User.address[addressIndex].name = req.body.name;
  User.address[addressIndex].address = req.body.address;
  User.address[addressIndex].phone = req.body.phone;
  User.address[addressIndex].pincode = req.body.pincode;
  User.address[addressIndex].place = req.body.place;
  User.address[addressIndex].state = req.body.state;

  // Save the updated user object
  await User.save();
  res.redirect('/checkout')
  
 }catch (error) {
  console.log(error);
  res.status(500).send('Internal Server Error');
  }
  
}
//edit profile address
exports.editpaddress =async (req,res)=>{
 try{
  const id = req.params.id;
 const userId = req.session.user?._id;
  const User = await UserSchema.findById(userId)
  const addressIndex = User.address.findIndex((address) => address._id.toString() === id);
 
  // Update the address fields
  User.address[addressIndex].name = req.body.name;
  User.address[addressIndex].address = req.body.address;
  User.address[addressIndex].phone = req.body.phone;
  User.address[addressIndex].pincode = req.body.pincode;
  User.address[addressIndex].place = req.body.place;
  User.address[addressIndex].state = req.body.state;

  // Save the updated user object
  await User.save();
  res.redirect(`/profile/${User._id}`)
  
 }catch (error) {
  console.log(error);
  res.status(500).send('Internal Server Error');
  }
  
}


//delete address
exports.deleteaddress = async (req, res) => {
  try {
    const addId = req.params.id;
    const foundUser = await UserSchema.findOne({ "address._id": addId });
    if (!foundUser) {
      return res.status(404).send('User not found');
    }

    await UserSchema.findOneAndUpdate(
      { "address._id": addId },
      { $pull: { address: { _id: addId } } },
      { new: true }
    );

    res.redirect(`/profile/${foundUser._id}`);
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};



// single product

exports.single = async (req, res) => {
  try {
    const product_id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      return res.status(400).send('Invalid product ID');
    }

    const product = await productSchema.findById(product_id);
    if (!product) {
      return res.status(404).send('Product not found');
    }
    const User = req.session.user
    const productt = await productSchema.find().limit(4)
    const products = await productSchema.find().skip(4).limit(4)
    res.render('single', { User,product,products,productt });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};
//show product
exports.product_list = async (req, res) => {
  
  try{
    const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * ITEMS_PER_PAGE;
  const totalProducts = await productSchema.countDocuments();
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  const product = await productSchema.find().skip(skip)
  .limit(ITEMS_PER_PAGE);
  const product2 = await productSchema.find().limit(4)
  const Category = await categorySchema.find();
  const User = req.session.user
  res.render("shop", { product,Category, product2, currentPage: page,
    totalPages,User }); 
  } catch(error){
    console.log(error);
    res.status(500).sens({error:"internal server error"})
  }
  
};

//checkout
exports.checkout = async (req, res) => {
  const User = req.session.user
    try{
      const userId = req.session.user?._id;   
      const data = await UserSchema.findOne({_id:userId})
      const coupon = await couponSchema.find()
      const cart = await cartSchema.findOne({ userId: userId }).populate(
        "products.productId")
        const items = cart.products.map((item) => {
          const product = item.productId;
          const quantity = item.quantity;
          const price = product.price;
          if (!price) {
            throw new Error("Product price is required");
          }
          if (!product) {
            throw new Error("Product is required");
          }
    
          return {
            product: product._id,
            quantity: quantity,
            price: price,
          };

        })

        let totalPrice =0
        items.forEach((item) => {
          totalPrice += item.price * item.quantity;
        });
        const upcart = await cartSchema.findOneAndUpdate({ userId: userId },{
          total:totalPrice
        })
        if (cart) {
      const products = cart.products
      let currentDate = new Date()
      currentDate=currentDate.toISOString().substr(0, 10);

      res.render('checkout', { User, currentDate, coupon, upcart, products, data: data.address })
        }
    }
    catch (error) {
      console.error(error);
      res.status(500).send('Some Error occurred')
  };
}

//contact
exports.contact = (req, res) => {
    const User = req.session.user;
    res.render("contact",{User});
  };

  //payment
exports.payment = async (req, res) => {
  try{
    const id = req.params.id;
    const user_id = req.session.user?._id;
    const User = await UserSchema.findById(user_id)
    const cart = await cartSchema.findOne({userId:user_id} )
    const user = await UserSchema.findOne(
      { _id: user_id },
      { address: { $elemMatch: { _id: id } } }
    );
if(user){
   const address = user.address[0]

    res.render("payment",{User,cart,address});
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).send('Some Error occurred')
};
}

//about
exports.about = (req, res) => {
    const User = req.session.user;
    res.render("about",{User});
  };



//placeorder  
  let paypalTotal = 0;
exports.placeOrder = async (req, res) => {
  try {
    const id = req.params.id;

    const User = req.session.user;
    const user_id = req.session.user?._id;
    const payment_method = req.body.payment_method;


    const userSchema = await UserSchema.findById(user_id);


    const addressIndex = userSchema.address.findIndex((item) =>
      item._id.equals(id)
    );

    const specifiedAddress = userSchema.address[addressIndex];

    const cart = await cartSchema
      .findOne({ userId: user_id })
      .populate("products.productId");
    const items = cart.products.map((item) => {
      const product = item.productId;
      const quantity = item.quantity;
      const price = product.price;

      if (!price) {
        throw new Error("Product price is required");
      }
      if (!product) {
        throw new Error("Product is required");
      }

      return {
        product: product._id,
        quantity: quantity,
        price: price,
      };
    });
console.log(items);
    items.forEach(async(item) => {
      
      const pro= await productSchema.findById(item.product)

      const quan=pro.quantity-item.quantity
      await productSchema.findByIdAndUpdate(item.product,{quantity:quan})
    });

    let totalPrice = 50+(cart.total-cart.discount)


    if (payment_method === "COD"||payment_method === "wallet") {
     
      
      const order = new order_model({
        user: user_id,
        items: items,
        discount: cart.discount,
        total: totalPrice,
        status: "Pending",
        payment_method: payment_method,
        createdAt: new Date(),
        shipping_charge: 50,
        address: specifiedAddress,
      });

     

      

      await order.save();
      await cartSchema.deleteOne({ userId: user_id });

      if(payment_method === "wallet"){
        const Twallet= User.totalWallet-totalPrice
        await UserSchema.findByIdAndUpdate(user_id,{totalWallet:Twallet})
      }

      res.render("confirm", { User, user_id,order, specifiedAddress, cart });
  
    }

  else if (payment_method === "paypal") {
      let createPayment = {};
      
      const order = new order_model({
        user: user_id,
        items: items,
        discount: cart.discount,
        total: totalPrice,
        status: "Pending",
        payment_method: payment_method,
        createdAt: new Date(),
        shipping_charge: 50,
        address: specifiedAddress,
      });

     



      await order.save();

      
      cart.products.forEach((element) => {
        paypalTotal += totalPrice;
      });
        
      
      createPayment = {
        intent: "sale",
        payer: { payment_method: "paypal" },
        redirect_urls: {
          return_url: `https://zoomandclick.shop/paypal-success/${user_id}`,
          cancel_url: "https://zoomandclick.shop/paypal-err",
        },
        transactions: [
          {
            amount: {
              currency: "USD",
              total: (paypalTotal / 82).toFixed(2), // Divide by 82 to convert to USD
            },
            description: "Super User Paypal Payment",
          },
        ],
      };

      paypal.payment.create(createPayment, function (error, payment) {
        if (error) {
          throw error;
        } else {
          
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              res.redirect(payment.links[i].href);
            }
          }
        }
      });

      await cartSchema.deleteOne({ userId: user_id });
    } else {
      throw new Error("Invalid payment method");
    }
  } catch (error) {
    res.status(500).send({
      message:
        error.message ||
        "Some error occurred while creating a create operation",
    });
  }
};


  exports.find_user = async (req, res) => {
    if (!req.body.email || req.body.email.trim() === "" || !req.body.password || req.body.password.trim() === "") {
      const product = await productSchema.find().limit(4)
      const banner = await bannerSchema.find()
      return res.status(400).render("index",{product,banner, msg: "Email and password are required."});
    }
    const email = req.body.email;
  
    const password = req.body.password;
    const product = await productSchema.find().limit(4)
    const banner = await bannerSchema.find()
    try {
      const User = await UserSchema.findOne({ email: email });
  
      if (User) {
        if(User.isBlocked){
          
          res.render("index",{product,banner, msg: "user is blocked" })
        }else{
          const isMatch = await bcrypt.compare(password, User.password);
  
        if (isMatch) {
          
          req.session.user = User; // Store the user ID in the session
          
        User.isLogedin = true;
        await User.save(); // Save the updated user
        
        res.redirect("/",);
         
        } else {
         
          res.render("index", {product,banner, msg: "Invalid entry" });
        }
        }
        
      }else{
        
          res.render("index", {product,banner, msg: "You need to Signup first!" });
      }
    } catch (error) {
      console.error(error);
      res.send("An error occurred while logging in.");
    }
  };

//logout
exports.log_out = async (req, res) => {
  const { id } = req.params;
  await UserSchema.findByIdAndUpdate(id, {
    isLogedin: false,
  })
    req.session.authorized=false
    req.session.user = null
    res.redirect("/")
 
};

//cart
exports.userCart = async (req, res) => {
  
  const User = req.session.user
  if(User){
      try {
          const userId = req.session.user?._id;   
          
          const cart = await cartSchema.findOne({ userId: userId }).populate(
            "products.productId"
          )
          if(cart){
            const productCount = cart.products.length;
          
          if (productCount>0) {
            const products = cart.products
            res.render('cart', { User, products,productCount })
          } else {
            res.render('cart',{User})
          }}else{
            res.render('cart',{User})
          }
          
          // res.render('user/cart',{user,products})
      } catch (error) {
          console.error(error);
          res.status(500).send('Some Error occurred')
      }
  } else {
    res.render('cart',{msg:"you need to Login first"})
  }
}

//addtocart
exports.add_to_cart = async (req, res) => {
  try {
      const userId = req.session.user?._id;
      const productId = req.params.id;
      const product_data = await productSchema.findById(productId)  
      if(product_data.quantity<1){
        return res.json({
          status: "success",
          message: "out of stock",
         });
      }else{
        let userCart = await cartSchema.findOne({ userId: userId })

      if(!userCart) {
          // If the user's cart doesn't exist, create a new cart
          const newCart = new cartSchema({ userId: userId, products: [] });
          await newCart.save();
          userCart = newCart;
      }

      const productIndex = userCart.products.findIndex(
          (product) => product.productId == productId
      );

     
      if(productIndex === -1) {
          // If the product is not in the cart, add it
          userCart.products.push({ productId, quantity: 1 })
      }
       else {
        
          if(product_data.quantity<=userCart.products[productIndex].quantity){
            return res.json({
              status: "success",
              message: "out of stock",
             });
          }else{
                     // If the product is already in the cart, increase its quantity by 1
                     userCart.products[productIndex].quantity +=1;
          }
          
          
      }
      await userCart.save();
      res.json({
        status: "success",
        message: "added to cart",
       });
      }
      

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
  } 
};

//deletecart
exports.deleteCartItem = async (req, res) => {
  try {
    
      const productId = req.params.id
      const userId = req.session.user?._id
      const productDeleted = await cartSchema.findOneAndUpdate(
          {userId: userId},
          {$pull:{ products:{productId: productId}}},
          {new: true}
      )
      if(productDeleted) {
          res.redirect("/viewcart")
      } else {
          console.log("product not deleted");
      }
  } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
  }
}

//increase cart
exports.incrementQuantity = async (req, res) => {
  
  const userId = req.session.user?._id
  const cartId = req.body.cartId
  // console.log(userId);

  try {
       let cart = await cartSchema.findOne(
          {userId: userId}).populate("products.productId")
      let cartIndex = cart.products.findIndex(items=> items.productId.equals(cartId))
      cart.products[cartIndex].quantity += 1
      let result = await cart.save()
      // console.log(result);
      const proId = cart.products[cartIndex].productId._id;
      const pro = await productSchema.findById(proId)
      const remain = pro.quantity-cart.products[cartIndex].quantity
      let mess=""
      if(remain>0){
      mess=remain
      }else{
        mess="out of stock"
      }
      const total = cart.products[cartIndex].quantity * cart.products[cartIndex].productId.price
      const quantity = cart.products[cartIndex].quantity;

      res.json({
          success:"Quantity updated",
          total,
          quantity,
          mess
      })
  } catch (error) {
      console.log(error);
      res.json({ success: false, message: "Failed to update quantity" });
  }

}

//decrease cart
exports.decrementQuantity = async (req, res) => {
  
  const cartItemId = req.body.cartItemId
  const userId = req.session.user?._id
  try {
      const cart = await cartSchema.findOne({ userId: userId }).populate("products.productId")
      const cartIndex = cart.products.findIndex((item) => item.productId.equals(cartItemId))
      if (cartIndex === -1) {
          return res.json({ success: false, message: "cart item not found"});
      }
      cart.products[cartIndex].quantity -=1
      await cart.save()
      const proId = cart.products[cartIndex].productId._id;
      const pro = await productSchema.findById(proId)
      const remain = pro.quantity-cart.products[cartIndex].quantity
      let mess=""
      if(remain>0){
      mess=remain
      }else{
        mess="out of stock"
      }

      const total = cart.products[cartIndex].quantity * cart.products[cartIndex].productId.price;
      const quantity = cart.products[cartIndex].quantity;
      res.json ({
          success: true,
          message: "Quantity updated successfully",
          total,
          quantity,
          mess
      });
  } catch (error) {
      res.json({ success: false, message: "Failed to update Quantity" })
  }
}

//order page
exports.order_details = async (req,res)=>{
  try {
    const id =req.params.id;
    const order_data = await order_model.find({user:id}).populate("items.product").populate("items.quantity")
    const User = await UserSchema.findById(id)
    

    res.render("order", {
      order_data,User
    });
  } catch (error) {
    console.error(error);
    res.send({ message: error.message });
  }
};

//order cancel
exports.ordercancel = async (req, res) => {
  try {
    const orderId = req.params.id;
    const reason = req.body.reason
    const cancelled ="cancelled"
    const orda = await order_model.findById(orderId)
    // Update the order using findByIdAndUpdate
    await order_model.findByIdAndUpdate(orderId, { status: cancelled,reason:reason });
    const order_data = await order_model.find({user:orda.user}).populate("items.product").populate("items.quantity")
    res.render('order',{order_data});
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// order details
exports.orderdetailspage =async (req,res)=>{
  try{
    const id = req.params.id;
    const use = req.session.user;
    const User = await UserSchema.findById(use._id)
    const order_data = await order_model.findOne({_id: id}).populate("user").populate("items.product").populate("items.quantity")
   res.render('orderdetail',{order_data,User})
    
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

//search product 
exports.search_product = async (req,res)=>{
  try{
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const totalProducts = await productSchema.countDocuments();
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
    const pro = req.body.product;
    const product2 = await productSchema.find().limit(4)
    const product1 = await productSchema.find({ name: { $regex: new RegExp(`^${pro}`, 'i') } }).skip(skip)
    .limit(ITEMS_PER_PAGE);

    const Category = await categorySchema.find();
    const User = req.session.user;
    const product = await productSchema.find().skip(skip)
    .limit(ITEMS_PER_PAGE);

   
    if(product1.length > 0){
      res.render('shop',{User,Category,product,product2,product1});
    }else{
      res.render('shop',{User,Category,product,product2, currentPage: page,
        totalPages, message:"there is no product"});
    }
  }catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

//price range
exports.pricerange = async (req,res)=>{
  try{
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const totalProducts = await productSchema.countDocuments();
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
    const Category = await categorySchema.find();
    const User = req.session.user;
    const min_price = req.body.min_price;
    const max_price = req.body.max_price;
    const product2 = await productSchema.find().limit(4)
    const product = await productSchema.find({
      price: { $gte: min_price, $lte: max_price }
    });
    const procount = await productSchema.find({
      price: { $gte: min_price, $lte: max_price }
    }).countDocuments();


   if(!procount){
      const product = await productSchema.find().skip(skip)
      .limit(ITEMS_PER_PAGE);
      res.render('shop',{User,Category,product2,product, currentPage: page,
        totalPages , msg:"there is no products in this price range"});
    }
    if(product){
        const productss = await productSchema.find()
        res.render('shop',{User,Category,product2,product:productss,product1:product});
      
    }
  }catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}


//paypalsucess
exports.paypal_success= async(req,res)=>{
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  
  const user_id = req.params.id;
  
  const User = await UserSchema.findById(user_id)
  // Update session to maintain user authentication
  req.session.user=User;
 
  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
          "currency": "USD",
            "total": paypalTotal
        }
    }]
  };
  paypal.payment.execute(paymentId, execute_payment_json, function  (error, payment) {
    //When error occurs when due to non-existent transaction, throw an error else log the transaction details in the console then send a Success string reposponse to the user.

  

  if  (error)  {
      console.log(error.response);
      throw error;
  } else  {
     res.render("confirms",{payment,User, user_id,});
  }
});

}

//paypalerror
exports.paypal_err=(req,res)=>{
  console.log(req.query);
  res.send("payment error")
}

//coupon
exports.coupon = async (req,res)=>{
  try{

  
  const user_id = req.session.user?._id;
  const code = req.body.coupon;
  const coupon = await couponSchema.findOne({coupon:code});
  if(coupon){
    const currentDate = new Date()
    const expDate = new Date(coupon.expiryDate)
    const User = await UserSchema.findById(user_id)
    const couponIndex = User.coupons.findIndex(item => item === code);
    const foundcoup = User.coupons[couponIndex]
    if(currentDate > expDate){
      res.json({
        status: "success",
        message: "coupon expired",
    });
    }
    else if(foundcoup){
      res.json({
        status: "success",
        message: "coupon already used",
    });
    }else{
      const cart = await cartSchema.findOne({ userId: user_id }).populate(
      "products.productId")
      const items = cart.products.map((item) => {
        const product = item.productId;
        const category_name = product.category_name;
        if (!category_name) {
          throw new Error("Product category is required");
        }
        if (!product) {
          throw new Error("Product is required");
        }
  
        return {
          product: product._id,
          category_name: category_name,
        };

      })
      let categoryMatch = true;

        for (const item of items) {
          if (item.category_name !== coupon.category) {
            categoryMatch = false;
            res.json({
              status: "success",
              message: "category not matching",
          });
          break;
          }
        }

        if (categoryMatch) {
          const discount = cart.total * (coupon.offer / 100);
          await cartSchema.findOneAndUpdate({ userId: user_id }, { discount: discount });
            User.coupons.push(coupon.coupon);
          

          await User.save();
          res.json({
            status: "success",
            message: "coupon added",
            discount: discount.toFixed(2),
            stotal: (cart.total - discount).toFixed(2),
        });
        } 
      
      }
    } else {
      res.json({
        status: "success",
        message: "Invalid coupon",
    });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

//remove coupon



//profile
exports.profile = async (req,res)=>{
  try{
    const id = req.params.id
    const User = await UserSchema.findById(id)
    if(User){
      res.render('profile',{User})
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

//return
exports.return= async (req,res)=>{
  try{
    const orderId =req.params.id;
    const returned = "Returned"
    const reason = req.body.reason;
    const orda = await order_model.findById(orderId)
    await order_model.findByIdAndUpdate(orderId, { status: returned,reason:reason });
    const order_data = await order_model.find({user:orda.user}).populate("items.product").populate("items.quantity")
    res.render('order',{order_data});
  }catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}
//invoice
exports.invoice= async (req,res)=>{
  try{
    const orderId =req.params.id;
    const order_data = await order_model.find({_id:orderId}).populate("items.product").populate("items.quantity")
   
    res.render('invoice',{order_data:order_data[0]});
  }catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

//profilepic
exports.profilepic = async(req,res)=>{
  try{
    const userId = req.params.id;
  
    await UserSchema.findByIdAndUpdate(userId,{
      photo:req.file.filename
    })
    res.redirect(`/profile/${userId}`)
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating a create operation",
    });
  }
}

//wallet
exports.wallet = async (req,res)=>{
  try{
    const user_id= req.params.id;
    const User = await UserSchema.findById(user_id);
    const orderrefund= await order_model.find({
        user:user_id,
        status:"Refunded"
    });
    const order_data = await order_model.find({
      user: user_id,
      payment_method: "wallet"
    });
    
    res.render('wallet',{User,order_data,orderrefund})
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating a create operation",
    });
  }
  

}
 