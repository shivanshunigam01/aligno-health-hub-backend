const Wishlist=require('../models/Wishlist'); const api=require('../utils/apiResponse'); const asyncHandler=require('../utils/asyncHandler');
async function wl(u){return Wishlist.findOneAndUpdate({user:u,isDeleted:false},{user:u}, {upsert:true,new:true,setDefaultsOnInsert:true}).populate('products')}
exports.get=asyncHandler(async(req,res)=>api({res,message:'Wishlist fetched',data:await wl(req.user._id)}));
exports.add=asyncHandler(async(req,res)=>api({res,message:'Added to wishlist',data:await Wishlist.findOneAndUpdate({user:req.user._id},{$addToSet:{products:req.body.product},isDeleted:false},{upsert:true,new:true}).populate('products')}));
exports.remove=asyncHandler(async(req,res)=>api({res,message:'Removed from wishlist',data:await Wishlist.findOneAndUpdate({user:req.user._id},{$pull:{products:req.params.productId}},{new:true}).populate('products')}));
exports.clear=asyncHandler(async(req,res)=>api({res,message:'Wishlist cleared',data:await Wishlist.findOneAndUpdate({user:req.user._id},{products:[]},{new:true})}));
