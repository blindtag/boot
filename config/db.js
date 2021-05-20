const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');
const colors = require('colors');

const connectDB = async ()=>{
    try {
        await mongoose.connect(db, {useNewUrlParser: true, useCreateIndex:true, 
            useFindAndModify: false,
        useUnifiedTopology: true});
        console.log('MongoDB connected'.green.underline.bold)
    } catch (err) {
        console.error(err.message.red.underline.bold);
        process.exit(1);
    }
}
module.exports =connectDB;