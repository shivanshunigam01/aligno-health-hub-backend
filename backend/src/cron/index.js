const cron=require('node-cron'); const User=require('../models/User'); const logger=require('../config/logger');
cron.schedule('0 3 * * *',async()=>{try{await User.updateMany({},{$pull:{refreshTokens:{expiresAt:{$lt:new Date()}}}}); logger.info('Expired refresh tokens cleaned')}catch(e){logger.error(e)}});
