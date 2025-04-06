# QRyptoPay (Crypto Pay)

## Description
QR code payments are widely used around the world—but what happens when you're abroad without a local bank account? 
That’s where QRyptoPay comes in.
With QRyptoPay, you can simply scan and upload the local QR code and pay using crypto—no local bank needed.

## How it's made!
We built QRyptoPay with Next.js for both the frontend and backend, and Foundry for smart contract development.

We implemented a factory contract that creates a new contract instance for each transaction. When a tourist uploads a QR code, the system deploys a new contract instance. Both the tourist and the local user interact with this contract. The contract includes functions for locking crypto funds from the tourist, confirming local currency payment from the local user, and transferring crypto accordingly.

For real-time currency conversion, we integrated the 1inch API to fetch swap rates between local currencies and stablecoins. This data is used to calculate the equivalent crypto amount the tourist should send. 

Each transaction contract includes simple escrow logic: it holds the tourist’s crypto until a local user confirms the local currency payment to the merchant. After confirmation, the crypto will then be transferred to the local user.

## Procedure
There will be two parties involved, tourists who don't have access to local bank, and local users who will help tourists pay in exchange of crypto funds.
1. Toursits will scan and upload the qrcode, a smart contract is created and send the crypto specified by tourists to our derived smart contract
2. Local users will browse QRpytoPay platform, then select the payment order they wanted to join.
3. After paying for tourists with scanning the qrcode, local users will press finish button to interact with the derived smart contract.
4. Users will need to press the acknowledgement button for verification issues.
5. The order is then completed, the crypto funds will be sent to local user!

## Contract Deployment
**We deployed the factory contract on Polygon & Flow!!**

- Polygon: https://polygonscan.com/address/0x7067aca18e7ae83355aca8ae6ef4d577e2b84654#code
- Flow: https://evm-testnet.flowscan.io/address/0x38f0657ee55e9d2ec8ce23e0042ab23b78c8a2c2?tab=contract
