import mongoose from 'mongoose';

export function connectToDatabase() {
  mongoose.connect('mongodb://127.0.0.1:27017/ethglobal_taipei_2025');
}

//module.exports = { connectToDatabase };