const jwt=require('jsonwebtoken');
const signAccessToken=(user)=>jwt.sign({id:user._id,role:user.role,email:user.email},process.env.JWT_ACCESS_SECRET,{expiresIn:process.env.JWT_ACCESS_EXPIRES||'15m'});
const signRefreshToken=(user,jti)=>jwt.sign({id:user._id,jti},process.env.JWT_REFRESH_SECRET,{expiresIn:process.env.JWT_REFRESH_EXPIRES||'30d'});
const verifyAccessToken=(t)=>jwt.verify(t,process.env.JWT_ACCESS_SECRET);
const verifyRefreshToken=(t)=>jwt.verify(t,process.env.JWT_REFRESH_SECRET);
module.exports={signAccessToken,signRefreshToken,verifyAccessToken,verifyRefreshToken};
