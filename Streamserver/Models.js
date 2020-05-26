const mongoose = require("mongoose");
const subArraySchema = mongoose.Schema({}, { _id: false });


let UserModel = mongoose.model("user", {
    username: {
        index: true,
        unique: true,
        required: true,
        type: String
    },
    password: String,
    email:String,
    files:Number,
    data:Number
})

let FileManager=mongoose.model("filemanager",{
    senderid:mongoose.Types.ObjectId,
    recieverid:mongoose.Types.ObjectId,
    fileLink:String,
    Date:Date,
    filename:String,
    size:Number,
    sendername:String
})

module.exports={
    UserModel:UserModel,
    FileManager:FileManager
}