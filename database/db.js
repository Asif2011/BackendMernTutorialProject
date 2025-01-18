const mongoose = require('mongoose');
const {mongo_db_string}= require('../config/settings')


dbConnect = async () => {
    try {
        const conn = await mongoose.connect(mongo_db_string)
        // console.log(`connection established to ${conn.connection.host}`);
        console.log('connection established')
        } 
        catch (error) {
        console.log(`connection erro: ${ error }`);
        }
    }

module.exports = dbConnect