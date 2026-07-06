const mongoose=require('mongoose'); const softDelete={isDeleted:{type:Boolean,default:false,index:true},deletedAt:Date};

const wishlistSchema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},products:[{type:mongoose.Schema.Types.ObjectId,ref:'Product'}],...softDelete},{timestamps:true}); wishlistSchema.index({user:1},{unique:true}); module.exports=mongoose.model('Wishlist',wishlistSchema);
