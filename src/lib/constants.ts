export const token_address_mapping_mainnet  = {
    "USDC": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "ETH": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
}

export const token_address_mapping_allnets = {
    "USDC": {
        "Zircuit": "0xbf02",
        "Polygon": "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
        "Celo": "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
        "Ethereum": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        "Flow": ""
    },
}

export const chain_id_mapping = {
    "Zircuit": "0xbf02",
    "Polygon": "0x89",
    "Celo": "0xaef3",
    "Ethereum": "0xaa36a7",
    "Flow": "0x221",
};

export const chain_rpc_url = {
    "Zircuit": "https://garfield-testnet.zircuit.com",
    "Polygon": "https://polygon-rpc.com",
    "Celo": "https://alfajores-forno.celo-testnet.org",
    "Ethereum": "https://rpc.sepolia.org",
    "Flow": "https://testnet.evm.nodes.onflow.org",
}

export const chain_blockchain_explorer = {
    "Zircuit": "https://explorer.garfield-testnet.zircuit.com",
    "Polygon": "https://polygonscan.com",
    "Celo": "https://celo-alfajores.blockscout.com",
    "Ethereum": "https://sepolia.etherscan.io",
    "Flow": "https://evm-testnet.flowscan.io"
}

export const factory_address = {
    "Zircuit": "",
    "Polygon": "",
    "Celo": "",
    "Ethereum": "0x649C11cF3A651bEA08cb923395eCf26C54b18982",
    "Flow": "0x38f0657eE55E9D2ec8ce23E0042AB23b78c8a2c2"
}

export const native_currency_mapping = {
    "Polygon": {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
    },
    "Flow": {
        name: 'Flow',
        symbol: 'FLOW',
        decimals: 8, 
    },
    "Zircuit": {
        name: 'Zircuit',
        symbol: 'ZRC',
        decimals: 18, 
    },
    "Ethereum": {
        name: 'SepoliaETH',
        symbol: 'SETH',
        decimals: 18,
    },
}
