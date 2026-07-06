require('dotenv').config(); const connect=require('../config/db'); Promise.resolve(connect()).then(()=>require('mongoose').connection.syncIndexes()).then(()=>process.exit(0));
