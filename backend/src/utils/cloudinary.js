const cloudinary=require('cloudinary').v2;
cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET});
const uploadFile=(path,folder='aligno')=>cloudinary.uploader.upload(path,{folder,resource_type:'auto'});
const deleteFile=(publicId)=> publicId ? cloudinary.uploader.destroy(publicId) : Promise.resolve();
module.exports={cloudinary,uploadFile,deleteFile};
