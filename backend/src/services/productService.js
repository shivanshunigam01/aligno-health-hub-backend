const CrudService=require('./crudService'); const repo=require('../repositories/productRepository'); module.exports=new CrudService(repo);
