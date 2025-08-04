const mongoose = require('mongoose') ;
require('dotenv').config({ path: './config/.env' });

if(!process.env.DB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

async function connectToDatabase(){
  try {
    await mongoose.connect(process.env.DB_URI);

    console.log(`Connected to database in dev mode`);
  } catch (error) {
    console.error('Error connecting to database: ', error);

    process.exit(1);
  }
}

module.exports = {connectToDatabase};