const mongoose=require('mongoose');
const softDelete={isDeleted:{type:Boolean,default:false,index:true},deletedAt:Date};

const bannerSchema=new mongoose.Schema({title:{type:String,required:true},subtitle:String,offer:String,ctaText:{type:String,default:'Shop Now'},layout:{type:String,enum:['designed','overlay'],default:'designed'},image:{secure_url:String,public_id:String},redirectUrl:String,priority:{type:Number,default:0,index:true},placement:{type:String,default:'home',index:true},isActive:{type:Boolean,default:true,index:true},startsAt:Date,endsAt:Date,...softDelete},{timestamps:true}); module.exports=mongoose.model('Banner',bannerSchema);
