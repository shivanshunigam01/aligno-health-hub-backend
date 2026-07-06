const mongoose=require('mongoose');
const softDelete={isDeleted:{type:Boolean,default:false,index:true},deletedAt:Date};

const categorySchema=new mongoose.Schema({name:{type:String,required:true,trim:true},slug:{type:String,required:true,unique:true,index:true},description:String,parent:{type:mongoose.Schema.Types.ObjectId,ref:'Category',default:null,index:true},ancestors:[{type:mongoose.Schema.Types.ObjectId,ref:'Category'}],image:{secure_url:String,public_id:String},seo:{title:String,description:String,keywords:[String]},sortOrder:{type:Number,default:0},isActive:{type:Boolean,default:true,index:true},...softDelete},{timestamps:true,toJSON:{virtuals:true},toObject:{virtuals:true}});
categorySchema.virtual('children',{ref:'Category',localField:'_id',foreignField:'parent'}); categorySchema.index({name:'text',description:'text'}); module.exports=mongoose.model('Category',categorySchema);
