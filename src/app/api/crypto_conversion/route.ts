import { NextResponse, NextRequest} from 'next/server';
import { getTokenConversionRate } from '@/helper/1inch';


// get token conversion rate based on currency & amount
export async function GET(request: NextRequest) {

    const searchParams = request.nextUrl.searchParams;
	const twd_amount = searchParams.get('twd_amount');
    const crypto = searchParams.get('crypto');

    if (!twd_amount || !crypto) {
        // return status error with message "Insert both twd_amount, crypto fields"
        return NextResponse.json({ status: 400,
            message: "Insert both twd_amount and crypto fields"
        }, {status: 400});
    }

    const rate = await getTokenConversionRate(crypto as string, "TWD");
    const crypto_amount = Number(twd_amount) / Number(rate);

	return NextResponse.json({
        crypto_amount,
    }, {status: 200})

}

export async function OPTIONS(){
	return NextResponse.json({ status: 200});
}