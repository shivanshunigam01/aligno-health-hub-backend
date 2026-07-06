const mongoose=require('mongoose');
const softDelete={isDeleted:{type:Boolean,default:false,index:true},deletedAt:Date};

const bcrypt=require('bcryptjs');
const tokenSchema=new mongoose.Schema({jti:String,tokenHash:String,expiresAt:Date,createdAt:{type:Date,default:Date.now}});
const addressSchema=new mongoose.Schema({name:String,phone:String,line1:String,line2:String,city:String,state:String,pincode:String,country:{type:String,default:'India'},type:{type:String,enum:['home','work','other'],default:'home'},isDefault:{type:Boolean,default:false}},{timestamps:true});
const userSchema=new mongoose.Schema({name:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,lowercase:true,index:true},phone:{type:String,index:true},password:{type:String,required:true,select:false},role:{type:String,enum:['customer','admin','super_admin'],default:'customer',index:true},avatar:{secure_url:String,public_id:String},addresses:[addressSchema],isEmailVerified:{type:Boolean,default:false},emailVerificationOtp:String,emailVerificationExpires:Date,resetPasswordOtp:String,resetPasswordExpires:Date,loginOtp:String,loginOtpExpires:Date,isActive:{type:Boolean,default:true,index:true},isBlocked:{type:Boolean,default:false,index:true},refreshTokens:[tokenSchema],lastLoginAt:Date,passwordChangedAt:Date,...softDelete},{timestamps:true,toJSON:{virtuals:true},toObject:{virtuals:true}});
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, Number(process.env.BCRYPT_ROUNDS || 12));
  this.passwordChangedAt = new Date();
});
userSchema.methods.comparePassword=function(p){return bcrypt.compare(p,this.password)};
userSchema.index({name:'text',email:'text',phone:'text'});
module.exports=mongoose.model('User',userSchema);
