const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = process.env.PORT || 3001;
const app = express();
var mongoose = require('mongoose');
const multer = require('multer');
const uuidv1 = require('uuid/v1');
mongoose.connect('mongodb://localhost/oose', { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Connected to Database!!")
});
let { UserModel, FileManager } = require('./Models');

const Fuse=require("fuse.js");
const options = {
    isCaseSensitive: false,
    findAllMatches: false,
    includeMatches: false,
    includeScore: false,
    useExtendedSearch: false,
    minMatchCharLength: 1,
    shouldSort: true,
    threshold: 0.6,
    location: 0,
    distance: 100,
    keys: [
        "username"    ]
};

list=[]
UserModel.find({},"username",(err,docs)=>{
    list=docs;
});


//middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

var Storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        let temp = uuidv1() + "" + file.originalname.trim();
        cb(null, temp)
    }
})
const Upload = multer({
    storage: Storage,
    limits: { fileSize: 1073741824 },
})
//Login
app.get('/login',(req,res)=>{
    UserModel.findOne({ username: req.query.username, password: req.query.password }, "username email files data",(err,docs)=>{
        if(docs===null)
        {
            res.send(false)
        }
        else{
            res.send(docs);

        }
    },e=>{
        console.log(e,"Error login")
        res.send(null)
    });
})

//Register
app.post('/register', (req, res) => {
    let newUser=new UserModel({
        username:req.body.username,
        password:req.body.password,
        email:req.body.email,
        files:0,
        data:0
    })
    newUser.save().then(docs=>{
        list.push(docs);
        res.send(docs)
    },e=>{
        res.send(false)
        console.log(e,"Erorr inside register");
    })
})

//User details
app.get("/getuser",(req,res)=>{
    console.log(req.query.userid)
    UserModel.findOne({ _id: req.query.userid }, "username email files data", (err, docs) => {
        res.send(docs);
    }, e => {
        console.log(e, "Error getuser")
        res.send(null)
    })
})

//getUser list
app.get("/getuserlist",(req,res)=>{
    let fuse = new Fuse(list, options);
    res.send(fuse.search(req.query.token).slice(0,7))
})

//getFile
app.put('/uploadfile', Upload.array('file', 1), (req, res) => {
    let link = "http://localhost:3001/" + req.files[0].path.replace(new RegExp(/\\/g), '/');
    new FileManager({
        senderid: req.body.senderid,
        recieverid: req.body.recieverid,
        fileLink: link,
        filename:req.body.filename,
        Date: req.body.date,
        size:req.body.size,
        sendername:req.body.sendername
    }).save().then(console.log).then(docs=>{
        console.log(docs)
        UserModel.findOne({ _id: req.body.senderid}, function (err, doc) {
            doc.data=doc.data + parseInt(req.body.size)
            doc.files=doc.files+1
            doc.save();
        });
        res.send(true)
    },e=>{
        console.log(e)
        res.send(false);
    })
})

//get File Notification
app.get('/getfilenoti',(req,res)=>{
    FileManager.find({recieverid:req.query.userid},(err,docs)=>{
        let temp=[]
        if(docs===undefined)
        {
            res.send([])
        }
        else{
            for (let i = 0; i < docs.length; i++) {
                if (docs[i].size !== undefined) {
                    temp.push(docs[i]);
                }

            }
            res.send(temp)
        }

    });
});

//edit user details
app.post('/edit',(req,res)=>{
    UserModel.findOne({ _id: req.body.userid }, function (err, doc) {
        doc.username=req.body.username;
        doc.email=req.body.email;
        doc.save();
    });
    res.send(true)
})

//del user account
app.post('/deluser',(req,res)=>{
    UserModel.deleteOne({_id:req.body.userid}, function(err, result){
        console.log(err,result)
        if (err) {
            res.send(false);
        } else {
            res.send(true);
        }
    })
})


app.listen(port,()=>{
    console.log("servers live nina!");
});