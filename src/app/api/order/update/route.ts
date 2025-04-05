import { NextResponse ,NextRequest} from 'next/server';
import { connectToDatabase } from '@/lib/connectDB';
import { Order } from '@/app/db_models/orders';

export async function POST(req: NextRequest) {
	await connectToDatabase();

	const {
		id: order_id,
		status,
		helper_address,
        txcode,
	} = await req.json();

	try {
		if (!order_id) {
			return NextResponse.json({
				status: 400,
				message: "Missing order_id in request body",
			}, { status: 400 });
		}

		// Find order
		const order = await Order.findById(order_id);

		if (!order) {
			return NextResponse.json({
				status: 404,
				message: `Order with ID ${order_id} not found`,
			}, { status: 404 });
		}

		// Update fields
		if (status !== undefined) order.status = status;
        if (helper_address !== undefined) order.helper_address = helper_address;
        if (txcode !== undefined) order.txcode = txcode;

		// Save updated order to DB
		await order.save();

		return NextResponse.json({
		}, {status: 200});
    
	} catch (error) {
		console.error('Error updating order:', error);
		return NextResponse.json({
			status: 500,
			message: "Internal server error",
		}, { status: 500 });
	}
}


export async function OPTIONS(){
	return NextResponse.json({ status: 200});
}