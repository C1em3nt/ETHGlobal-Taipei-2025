import { NextResponse ,NextRequest} from 'next/server';
//import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/connectDB';
import { Order } from '@/app/db_models/orders';


export async function POST(req: NextRequest) {

	await connectToDatabase();

	const formData = await req.formData();

	const tourist_address = formData.get('tourist_address') as string;
	const crypto = formData.get('crypto') as string;
	const chain = formData.get('chain') as string;
	const twd_amount = parseFloat(formData.get('twd_amount') as string);
	const crypto_amount = parseFloat(formData.get('crypto_amount') as string);
	const imageFile = formData.get('photo') as File; // if it's a file upload
	const description = formData.get('description') as string;


	const buffer = Buffer.from(await imageFile.arrayBuffer());
	const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
	
	// add account info to User db
	const newOrder = new Order({
		tourist_address,
        crypto,
        chain,
        twd_amount,
        crypto_amount,
        photo: base64Image,
		description,
	});

	await newOrder.save();

	return NextResponse.json({
        //id: newOrder._id
		...newOrder._doc,
    }, {status: 200});

}

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const order_id = searchParams.get('id');
	const status = searchParams.get('status');

	await connectToDatabase();

	try {
        // return specific order
		if (order_id) {
			const order = await Order.findById(order_id);

			if (!order) {
				return NextResponse.json({
					status: 404,
					message: `Order with ID ${order_id} not found`,
				}, { status: 404 });
			}

			return NextResponse.json(order, { status: 200 });
		}

		// return specific status
		if (status) {
			const order = await Order.findOne({ status });
		
			if (!order) {
				return NextResponse.json({
					status: 404,
					message: `No order found with status "${status}"`,
				}, { status: 404 });
			}
		
			return NextResponse.json(order, { status: 200 });
		}
		

		// If no ID provided, return all orders
		const orders = await Order.find();
		return NextResponse.json(orders, { status: 200 });

	} catch (error) {
		console.error('Error fetching order(s):', error);
		return NextResponse.json({
			status: 500,
			message: 'Internal server error',
		}, { status: 500 });
	}
}

export async function OPTIONS(){
	return NextResponse.json({ status: 200});
}