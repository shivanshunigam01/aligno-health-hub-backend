const multer=require('multer'); const path=require('path');
const storage=multer.diskStorage({destination:(req,file,cb)=>cb(null,path.join(__dirname,'../temp')),filename:(req,file,cb)=>cb(null,Date.now()+'-'+file.originalname.replace(/[^a-zA-Z0-9.\-_]/g,''))});
const fileFilter=(req,file,cb)=> file.mimetype.startsWith('image/') || file.mimetype==='application/pdf' ? cb(null,true):cb(new Error('Unsupported file type'));
module.exports=multer({storage,fileFilter,limits:{fileSize:10*1024*1024}});
