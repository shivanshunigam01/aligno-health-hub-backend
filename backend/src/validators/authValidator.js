const {body}=require('express-validator');
exports.register=[body('name').trim().notEmpty(),body('email').isEmail().normalizeEmail(),body('password').isStrongPassword({minLength:8,minLowercase:1,minUppercase:1,minNumbers:1,minSymbols:1}),body('phone').optional().isLength({min:8,max:15})];
exports.login=[body('email').isEmail().normalizeEmail(),body('password').notEmpty()];
exports.emailOtp=[body('email').isEmail().normalizeEmail(),body('otp').isLength({min:6,max:6})];
exports.forgot=[body('email').isEmail().normalizeEmail()];
exports.reset=[body('email').isEmail().normalizeEmail(),body('otp').isLength({min:6,max:6}),body('password').isStrongPassword({minLength:8,minLowercase:1,minUppercase:1,minNumbers:1,minSymbols:1})];
