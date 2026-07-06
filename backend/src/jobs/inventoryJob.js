const Product=require('../models/Product'); module.exports=async()=>Product.find({stock:{$lte:5},isDeleted:false}).select('name sku stock');
