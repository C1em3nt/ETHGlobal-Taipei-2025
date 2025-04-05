import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/connectDB';
import { Order } from '@/app/db_models/orders'

export async function POST(req: NextRequest) {
	await connectToDatabase();

	const formData = await req.formData();
	const file = formData.get('photo') as File;
	const order_id = formData.get('order_id') as string

	if (!file || !order_id) {
		return NextResponse.json({
			status: 400,
			message: 'Missing photo or order_id',
		}, { status: 400 });
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

	const order = await Order.findById(order_id);
	if (!order) {
		return NextResponse.json({
			status: 404,
			message: 'Order not found',
		}, { status: 404 });
	}

	order.photo = base64Image;
	await order.save();

	return NextResponse.json({
		status: 200,
		message: 'Photo uploaded successfully',
	});
}