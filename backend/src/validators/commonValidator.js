const {body,param,query}=require('express-validator');
exports.id=[param('id').isMongoId()]; exports.pagination=[query('page').optional().isInt({min:1}),query('limit').optional().isInt({min:1,max:100})];
exports.product=[body('name').notEmpty(),body('category').isMongoId(),body('sku').notEmpty(),body('mrp').isFloat({min:0}),body('sellingPrice').isFloat({min:0}),body('stock').optional().isInt({min:0})];
exports.category=[body('name').notEmpty(),body('parent').optional({nullable:true}).isMongoId()];
exports.coupon=[body('code').notEmpty(),body('type').isIn(['percentage','flat']),body('value').isFloat({min:0})];
exports.review=[body('product').isMongoId(),body('rating').isInt({min:1,max:5}),body('comment').optional().trim()];
exports.address=[body('name').notEmpty(),body('phone').notEmpty(),body('line1').notEmpty(),body('city').notEmpty(),body('state').notEmpty(),body('pincode').isPostalCode('IN')];
