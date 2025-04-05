import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const token_address_mapping  = {
    "USDC": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
}


export async function getTokenConversionRate(token: string, currency: string,) {

    if (!(token in token_address_mapping)) {
        throw new Error(`Unsupported token: ${token}`);
    }
    const token_address = token_address_mapping[token as keyof typeof token_address_mapping].toLowerCase()

    const url = "https://api.1inch.dev/price/v1.1/1";
    const apiKey = process.env.inch_API_KEY;
  
    const config = {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "tokens": [
                token_address,
            ],
            "currency": currency
        })
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        return data[token_address];
    } catch (error) {
        console.error(error);
    }
}

