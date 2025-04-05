import mongoose, { Schema, Document, Model } from 'mongoose';

interface IOrder {
  tourist_address?: string;
  crypto?: string;
  chain?: string;
  twd_amount?: number;
  crypto_amount?: number;
  photo?: string;
  status?: number;
  helper_address?: string;
  description?: string;
  txcode?: string;
}

interface IOrderDocument extends IOrder, Document {}

const OrderSchema: Schema = new Schema({
  tourist_address: {
    type: String,
    required: false,
  },
  crypto: {
    type: String,
    required: false,
  },
  chain: {
    type: String,
    required: false,
  },
  twd_amount: {
    type: Number,
    required: false,
  },
  crypto_amount: {
    type: Number,
    required: false,
  },
  photo: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  txcode: {
    type: String,
    required: false,
  },
  status: {
    type: Number,
    required: false,
    default: 0, // Optional default for status
  },
  helper_address: {
    type: String,
    required: false,
  },
}, { versionKey: false, timestamps: true }); // Add timestamps if you want createdAt/updatedAt

const Order: Model<IOrderDocument> = mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);

export { Order };

/* Note: Status code of "status"  
    0: Order created - waiting for helper
    1: helper selected to pay
    2: helper confirmed the payment, but tourist haven't confirm
    3: tourist confirmed the order, order completed
    4: order cancelled
    5: order reported
*/