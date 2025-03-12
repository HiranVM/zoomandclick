const express = require('express');
const app = express();
const path = require('path');
const bodyparser = require('body-parser');
const session = require('express-session');
const nocache = require('nocache')
const paypal = require('paypal-rest-sdk')
//upload file show
app.use(express.static("uploads"));
require('dotenv').config();
app.set('view engine','ejs');
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const port = 3500;
const hostname = '127.0.0.1';

paypal.configure({
  'mode':'sandbox',
  'client_id':PAYPAL_CLIENT_ID,
  'client_secret':PAYPAL_CLIENT_SECRET
  
})

app.use(nocache())
//connection

const connection = require("./server/connection/connection");

//twilio
const twilioRouter = require("./server/routes/twilio_router");


app.use(express.urlencoded({extented:true}));
app.use(express.json());

app.use("/twilio-sms", twilioRouter);

app.use(
  session({
    secret: "secret",
    resave:false,
    cookie:{sameSite:"strict"},
    saveUninitialized:true
  })
)



app.set('views',[
  __dirname + "/views/admin",
  __dirname + "/views/user"
])

app.use('/js', express.static(path.join(__dirname, 'public/user/js')))
app.use('/css', express.static(path.join(__dirname, 'public/user/css')));
app.use('/images', express.static(path.join(__dirname, 'public/user/images')));
app.use('/fonts', express.static(path.join(__dirname, 'public/user/fonts')));
app.use('/ajs', express.static(path.join(__dirname, 'public/admin/ajs')));
app.use('/css1', express.static(path.join(__dirname, 'public/admin/css1')));
app.use('/img', express.static(path.join(__dirname, 'public/admin/img')));

app.use("/",require("./server/routes/user_router"));
app.use("/",require("./server/routes/admin_router"));
app.use("/", require("./server/routes/twilio_router"));
app.listen(port,hostname,()=>{
    console.log(`server link http://${hostname}:${port}`)
})

