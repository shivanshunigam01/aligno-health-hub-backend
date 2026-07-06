const swaggerJsdoc=require('swagger-jsdoc');
module.exports=swaggerJsdoc({definition:{openapi:'3.0.0',info:{title:'Aligno Health Hub API',version:'1.0.0'},servers:[{url:'/api/v1'}],components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer',bearerFormat:'JWT'}}}},apis:['./src/routes/*.js','./src/models/*.js']});
