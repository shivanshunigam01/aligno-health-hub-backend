const api=require('../utils/apiResponse'); const asyncHandler=require('../utils/asyncHandler'); const auth=require('../services/authService');
const cookie=(res,name,val,ms)=>res.cookie(name,val,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:ms});
function setCookies(res,t){cookie(res,'accessToken',t.accessToken,15*60e3);cookie(res,'refreshToken',t.refreshToken,30*864e5)}
exports.register=asyncHandler(async(req,res)=>{const t=await auth.register(req.body); setCookies(res,t); api({res,statusCode:201,message:'Registration successful',data:t})});
exports.login=asyncHandler(async(req,res)=>{const t=await auth.login(req.body); setCookies(res,t); api({res,message:'Login successful',data:t})});
exports.refresh=asyncHandler(async(req,res)=>{const t=await auth.refresh(req.cookies.refreshToken||req.body.refreshToken); setCookies(res,t); api({res,message:'Token refreshed',data:t})});
exports.logout=asyncHandler(async(req,res)=>{await auth.logout(req.user?._id,req.cookies.refreshToken||req.body.refreshToken); res.clearCookie('accessToken');res.clearCookie('refreshToken'); api({res,message:'Logged out'})});
exports.verifyEmail=asyncHandler(async(req,res)=>api({res,message:'Email verified',data:await auth.verifyEmail(req.body.email,req.body.otp)}));
exports.forgotPassword=asyncHandler(async(req,res)=>api({res,message:'Password reset OTP sent',data:await auth.forgot(req.body.email)}));
exports.resetPassword=asyncHandler(async(req,res)=>api({res,message:'Password reset successful',data:await auth.reset(req.body.email,req.body.otp,req.body.password)}));
exports.me=asyncHandler(async(req,res)=>api({res,message:'Profile fetched',data:auth.safeUser(req.user)}));
exports.updateProfile=asyncHandler(async(req,res)=>{const allowed=['name','phone']; for(const key of allowed){if(req.body[key]!==undefined) req.user[key]=req.body[key]} await req.user.save(); api({res,message:'Profile updated',data:auth.safeUser(req.user)})});
exports.deleteAccount=asyncHandler(async(req,res)=>{req.user.isActive=false; req.user.isDeleted=true; req.user.deletedAt=new Date(); await req.user.save(); api({res,message:'Account deleted'})});
