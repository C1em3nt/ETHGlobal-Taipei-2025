import { NextResponse ,NextRequest} from 'next/server';
//import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/connectDB';
import { Order } from '@/app/db_models/orders';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const tourist_address = searchParams.get('tourist_address');

		if (!tourist_address) {
			return NextResponse.json({
				status: 400,
				message: 'Missing tourist_address in query parameters',
			}, { status: 400 });
		}

		await connectToDatabase();

		const order = await Order.findOne({
			tourist_address,
			status: { $lt: 3 }
		})
		.sort({ createdAt: -1 }) // or `updatedAt`, depending on what "latest" means to you
		.limit(1);

        const body = order ? {
            hasData: true,
            order,
        } : {
            hasData: false,
        }

		return NextResponse.json(body, { status: 200 });

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