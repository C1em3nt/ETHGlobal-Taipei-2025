import { NextResponse, NextRequest} from 'next/server';
//import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/connectDB';
import { getTokenConversionRate } from '@/helper/1inch';

//import Hotel from '../../db_models/hotel';


export async function POST(req: NextRequest){
	await connectToDatabase();
	
	const { name, address, description, price, imageLink, tags, rating} = await req.json();
	

	// add account info to User db
	const newHotel = new Hotel({
		name,
		address,
		description,
		price,
		imageLink,
		tags,
		rating,
	});

	await newHotel.save();

	return NextResponse.json({ status: 200, message: {id: newHotel._id} });
}

// list all/one hotel
export async function GET(request: NextRequest) {
    getTokenConversionRate("USDC", "TWD");

	

    return NextResponse.json({status:200, message:""})

}

export async function OPTIONS(){
	return NextResponse.json({ status: 200});
}