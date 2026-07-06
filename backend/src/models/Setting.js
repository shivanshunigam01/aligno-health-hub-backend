const mongoose=require('mongoose'); const softDelete={isDeleted:{type:Boolean,default:false,index:true},deletedAt:Date};

const settingSchema=new mongoose.Schema({key:{type:String,required:true,unique:true,index:true},value:{type:mongoose.Schema.Types.Mixed,required:true},group:{type:String,index:true},isPublic:{type:Boolean,default:false},...softDelete},{timestamps:true}); module.exports=mongoose.model('Setting',settingSchema);
