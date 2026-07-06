const {validationResult}=require('express-validator'); const AppError=require('../utils/AppError');
module.exports=(req,res,next)=>{const r=validationResult(req); if(r.isEmpty()) return next(); next(new AppError('Validation failed',422,r.array().map(e=>({field:e.path,message:e.msg}))));};
