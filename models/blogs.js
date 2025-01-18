const mongoose = require('mongoose')
const {Schema} = mongoose

myBlog = new Schema({
    title:{type:String,require:true},
    content:{type:String, require:true},
    photo:{type:String,require:true},
    author:{type:mongoose.SchemaTypes.ObjectId,ref:'users'}
}, 
    {timestamps:true}
)

module.exports = mongoose.model('Blog',myBlog,'blogs')