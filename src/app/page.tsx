"use client";
import { use, useEffect, useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Wallet, ReceiptText, BanknoteArrowUp, Receipt, ArrowLeftRight, SquarePower } from "lucide-react";
import { motion } from "framer-motion";
// import { ethers } from "ethers";
import ERC20ABI from './ERC20ABI.json'; 
import {
  BrowserProvider,
  Contract,
  parseUnits,
  toBigInt,
  solidityPackedKeccak256
} from 'ethers';
import { SDK, HashLock, PrivateKeyProviderConnector, NetworkEnum, Web3ProviderConnector, WsProviderConnector } from "@1inch/cross-chain-sdk";
const env = require('dotenv');
import { randomBytes } from "crypto";
import { token_address_mapping_mainnet,native_currency_mapping, token_address_mapping_allnets, chain_id_mapping, chain_rpc_url, chain_blockchain_explorer, factory_address } from "@/lib/constants";

declare global {
  interface Window {
    ethereum?: any;
  }
}
interface Bill {
  _id: string;
  tourist_address: string;
  twd_amount: number;
  crypto: string;
  chain: string;
  crypto_amount: number;
  description: string;
  tips: number;
  photo?: string; // 若有圖片檔案，設定為可選屬性
  contract_address: string;
}
type CryptoSymbol = "ETH" | "USDT" | "USDC" | "Bitcoin";

const exchangeRates = {
  NTD_USD: 0.0301,
  USD_ETH: 3000,
  USD_USDT: 1,
  USD_USDC: 1,
  USD_Bitcoin: 65000,
};

const cryptoDisplayPrecision: Record<CryptoSymbol, number> = {
  ETH: 6,
  USDT: 4,
  USDC: 4,
  Bitcoin: 8,
};

function PaymentModal({
  bill,
  account,
  onClose,
}: {
  bill: Bill;
  account: string | null;
  onClose: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(300);
  const [txCode, setTxCode] = useState("");
  const [crypto, setCrypto] = useState("");

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 格式化倒數時間 mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      {/* Modal 內容 */}
      <div className="bg-gray-800 p-6 rounded-lg relative z-10 text-center">
        <div className="text-sm mb-1">
          Bill ID: {bill._id}
        </div>
        <h2 className="text-xl mb-4">Payment Countdown</h2>
        <div className="text-3xl font-bold mb-4">{formattedTime}</div>
        <img
          src={bill.photo}
          alt="Bill"
          className="mx-auto mb-4 w-[50vw] h-[50vw] max-w-[300px] max-h-[300px] object-cover rounded-lg"
        />
        {/* TxCode 輸入欄位 */}
        <div className="mb-4 text-left">
          <Label htmlFor="txCode" className="mb-1">
            QR payment TxCode
          </Label>
          <Input
            id="txCode"
            type="text"
            value={txCode}
            onChange={(e) => setTxCode(e.target.value)}
            placeholder="Input QR payment TxCode"
          />
        </div>
        {/* <div className="mb-4 text-left">
          <Label htmlFor="crypto" className="mb-1">
            Crypto
          </Label>
          <Select onValueChange={(value) => setCrypto(value)} value={crypto}>
            <SelectTrigger id="crypto">
              <SelectValue placeholder="請選擇" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ETH">ETH</SelectItem>
              <SelectItem value="USDT">USDT</SelectItem>
              <SelectItem value="USDC">USDC</SelectItem>
              <SelectItem value="Bitcoin">Bitcoin</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
        {/* 按鈕區 */}
        <div className="flex justify-center space-x-4">
          {/* <Button
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            onClick={onClose}
          >
            Cancel
          </Button> */}
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
            onClick={async () => {
              if (!txCode) {
                alert("Please fill in all fields!");
                return;
              }
              try {
                const provider = new BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
            
                const escrowAddress = bill.contract_address;
                const escrowABI = [
                  "function acceptOrder() external",
                  "function helperDeclaredPaid() external",
                  "function confirmPayment() external",
                  "function arbitrate() external"
                ];
            
                const escrowContract = new Contract(escrowAddress, escrowABI, signer);
            
                const tx = await escrowContract.helperDeclaredPaid();
                await tx.wait();
                console.log("helperDeclaredPaid() executed");
                const res = await fetch('/api/order/update', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      id: bill._id,
                      status: 2,
                      helper_address: account,
                      txcode: txCode,
                  }),
                });
            
                if (res.ok) {
                  console.log("訂單更新成功");
                  alert("Payment confirmed!");
                } else {
                  console.error("後端更新失敗");
                }
            
              } catch (err) {
                console.error("執行 helperDeclaredPaid 時發生錯誤", err);
                alert("helperDeclaredPaid Failed");
              }
              
              onClose();
            }}
          >
            Confirm Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
 
type SwapModalProps = {
  account: string | null;
  onClose: () => void;
  onConfirmSwap: (amount: string, srcToken: string, dstToken: string) => void;
};

const tokenOptions = [
  { label: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  { label: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
  { label: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
  // 你可以再加更多 token
];

export const SwapModal = ({ account, onClose, onConfirmSwap }: SwapModalProps) => {
  const [amount, setAmount] = useState("1");
  const [srcToken, setSrcToken] = useState(tokenOptions[0].address);
  const [dstToken, setDstToken] = useState(tokenOptions[2].address);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white text-black p-6 rounded-lg z-10 w-[90%] max-w-md text-center">
        <h2 className="text-xl font-bold mb-4">Swap Tokens</h2>
        <p className="mb-4">You're about to initiate a Fusion+ swap using your connected wallet.</p>

        <div className="mb-4 text-left">
          <label className="block text-sm font-medium mb-1">Amount</label>
          <Input
            type="number"
            value={amount}
            min="0"
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div className="mb-4 text-left">
          <label className="block text-sm font-medium mb-1">From (Source Token)</label>
          <Select value={srcToken} onValueChange={setSrcToken}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              {tokenOptions.map((token) => (
                <SelectItem key={token.address} value={token.address}>
                  {token.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6 text-left">
          <label className="block text-sm font-medium mb-1">To (Destination Token)</label>
          <Select value={dstToken} onValueChange={setDstToken}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              {tokenOptions.map((token) => (
                <SelectItem key={token.address} value={token.address}>
                  {token.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="default"
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => {
              onConfirmSwap(amount, srcToken, dstToken); // 傳入三個參數
              onClose();
            }}
          >
            Confirm Swap
          </Button>
        </div>
      </div>
    </div>
  );
};
// const SwapModal = ({ account, onClose, onConfirmSwap }: SwapModalProps) => {
//   const [swapAmount, setSwapAmount] = useState("");
//   const [crypto, setCrypto] = useState("");

//   return (
//     <div className="fixed inset-0 flex items-center justify-center z-50">
//       {/* 背景遮罩 */}
//       <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
//         <div className="mb-4 text-left">
//           <Label htmlFor="swapAmount" className="mb-1">
//             Amount
//           </Label>
//           <Input
//             id="swapAmount"
//             type="text"
//             value={swapAmount}
//             onChange={(e) => setSwapAmount(e.target.value)}
//             placeholder="Input QR payment TxCode"
//           />
//         </div>
//         <div className="mb-4 text-left">
//           <Label htmlFor="crypto" className="mb-1">
//             Crypto
//           </Label>
//           <Select onValueChange={(value) => setCrypto(value)} value={crypto}>
//             <SelectTrigger id="crypto">
//               <SelectValue placeholder="請選擇" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="ETH">ETH</SelectItem>
//               <SelectItem value="USDT">USDT</SelectItem>
//               <SelectItem value="USDC">USDC</SelectItem>
//               <SelectItem value="Bitcoin">Bitcoin</SelectItem>
//             </SelectContent>
//           </Select>
//           <Label htmlFor="crypto" className="mb-1">
//             Crypto
//           </Label>
//           <Select onValueChange={(value) => setCrypto(value)} value={crypto}>
//             <SelectTrigger id="crypto">
//               <SelectValue placeholder="請選擇" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="ETH">ETH</SelectItem>
//               <SelectItem value="USDT">USDT</SelectItem>
//               <SelectItem value="USDC">USDC</SelectItem>
//               <SelectItem value="Bitcoin">Bitcoin</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//         {/* 按鈕區 */}
//         <div className="flex justify-center space-x-4">
//           <Button 
//             className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
//             onClick={async () => {
//               try {
                
//               } catch (err) {

//               }
//               alert("Swap confirmed!");
//               onClose();
//             }}
//           >
//             Swap
//           </Button>
//         </div>
//       </div>
//   );
// }

export default function Home() {
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [paymentCountdown, setPaymentCountdown] = useState(-1);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [closedBills, setClosedBills] = useState<any[]>([]);
  const [showSwapModal, setShowSwapModal] = useState(false);

  const [formData, setFormData] = useState({
    orderID: "",
    tourist_address: "",
    twd_amount: "",
    usd_amount: "",
    crypto: "",
    description: "",
    tips: "0",
    crypto_amount: 0,
    chain: "",
    photo: null as File | null,
  });

  useEffect(() => {
    let intervalId:any;
    
    const fetchOrder = async () => {

      try {
        const res = await fetch(`/api/order/pending?tourist_address=${account}`);
        const data = await res.json();
        if (data?.hasData) {
          // setSelectedBill(data.order);
          if (res.ok) {
            // const order = await res.json();
            if (data.order.status === 2) {
              setPaymentCountdown(300);
              clearInterval(intervalId);
            }
          }
          
        }
        
      } catch (error) {
        console.error("Fetch orders failed:", error);
      }
    };

    // 初次載入時呼叫一次
    fetchOrder();
    // 每 5 秒呼叫一次 API
    intervalId = setInterval(fetchOrder, 5000);

    // 清除定時器
    return () => clearInterval(intervalId);
  }, [account]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/order?status=0');
        if (res.ok) {
          const allBill = await res.json();
          setBills(allBill);
        }
      } catch (error) {
        console.error('Fetch orders failed:', error);
      }
    };

    // 頁面初次載入時先呼叫一次
    fetchOrders();
    // 設定每 5 秒呼叫一次 API
    const intervalId = setInterval(fetchOrders, 5000);

    // 清除定時器
    return () => clearInterval(intervalId);
  }, []);
  
  useEffect(() => {
    const fetchClosedOrders = async () => {
      try {
        const res = await fetch('/api/order?status=3');
        if (res.ok) {
          const allBill = await res.json();
          console.log(allBill);
          setClosedBills(allBill);
        }
      } catch (error) {
        console.error('Fetch orders failed:', error);
      }
    };

    // 頁面初次載入時先呼叫一次
    fetchClosedOrders ();
    // 設定每 5 秒呼叫一次 API
    const intervalId = setInterval(fetchClosedOrders, 5000);

    // 清除定時器
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (paymentCountdown <= 0) return;
    const interval = setInterval(() => {
      setPaymentCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentCountdown]);

  useEffect(() => {
    if (paymentCountdown === 0 && selectedBill) {
      alert("付款時間已到，請使用者注意！");
    }
  }, [paymentCountdown, selectedBill]);

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts[0]);
      });
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
        const res = await fetch(`/api/order/pending?tourist_address=${accounts[0]}`);
        const data = await res.json();
        // console.log(data);
        if (data?.hasData) {
            setSelectedBill(data.order);
        }
      } catch (error) {
        console.error("User rejected connection", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // const swap = async (amount: string, srcToken: string, dstToken: string) => {
  //   try {

  //     const browserProvider = new BrowserProvider(window.ethereum);
  //     const signer = await browserProvider.getSigner();
  //     const walletAddress = await signer.getAddress();
  
  //     // 2. 提供給 1inch SDK 用的 Web3ProviderConnector
  //     const blockchainProvider = new Web3ProviderConnector(window.ethereum);
  
  //     // 3. 建立 SDK 實例
  //     const sdk = new SDK({
  //       url: "https://api.1inch.dev/fusion-plus",
  //       authKey: process.env.inch_API_KEY!,
  //       blockchainProvider
  //     });
  
  //     // 3. 設定基本參數
  //     const srcChainId = NetworkEnum.ETHEREUM;
  //     const dstChainId = NetworkEnum.POLYGON;
  //     const srcTokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
  //     const dstTokenAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // WETH
  //     const amount = "1000000"; // 1 USDC (6 decimals)
  
  //     // 4. 拿 quote
  //     const quote = await sdk.getQuote({
  //       srcChainId,
  //       dstChainId,
  //       srcTokenAddress,
  //       dstTokenAddress,
  //       amount,
  //       enableEstimate: true,
  //       walletAddress
  //     });
  
  //     console.log("Got quote:", quote);
  
  //     // 5. 準備 secrets/hashLock
  //     const secretsCount = quote.getPreset().secretsCount;
  //     const secrets = Array.from({ length: secretsCount }).map(() => '0x' + Buffer.from(randomBytes(32)).toString('hex'));
  //     const secretHashes = secrets.map(secret => HashLock.hashSecret(secret));
  
  //     // const hashLock = secretsCount === 1
  //     //   ? HashLock.forSingleFill(secrets[0])
  //     //   : HashLock.forMultipleFills(
  //     //       secretHashes.map((h, i) => solidityPackedKeccak256(['uint64', 'bytes32'], [BigInt(i), h.toString()]))
  //     //     );
  
  //     const hashLock = secretsCount === 1
  //     ? HashLock.forSingleFill(secrets[0])
  //     : HashLock.forMultipleFills(
  //         secretHashes.map((secretHash, i) =>
  //             solidityPackedKeccak256(['uint64', 'bytes32'], [i, secretHash.toString()])
  //         )
  //     );
  //     // 6. 建立訂單
  //     const quoteResponse = await sdk.placeOrder(quote, {
  //       walletAddress,
  //       hashLock,
  //       secretHashes
  //     });
  
  //     const orderHash = quoteResponse.orderHash;
  //     console.log("Order placed:", orderHash);
  
  //     // 7. 開始 polling 填單
  //     const poll = setInterval(async () => {
  //       const order = await sdk.getOrderStatus(orderHash);
  //       console.log("order status:", order.status);
  
  //       if (order.status === "executed") {
  //         clearInterval(poll);
  //         console.log("🎉 Order complete!");
  //         alert("Swap 已完成！");
  //       }
  
  //       const fillsObject = await sdk.getReadyToAcceptSecretFills(orderHash);
  //       if (fillsObject.fills.length > 0) {
  //         fillsObject.fills.forEach(async fill => {
  //           await sdk.submitSecret(orderHash, secrets[fill.idx]);
  //           console.log(`🔐 Secret submitted for fill ${fill.idx}`);
  //         });
  //       }
  //     }, 5000);
  
  //   } catch (err) {
  //     console.error("Swap failed:", err);
  //     alert("Swap 發生錯誤，請查看 console。");
  //   }
  // };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, photo: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }
    if (!formData.twd_amount || !formData.crypto || !formData.description) {
      alert("Please fill out all required fields!");
      return;
    }
    if (formData.crypto_amount <= 0) {
      alert("Please enter a valid amount!");
      return;
    }
    if (formData.tips && isNaN(parseFloat(formData.tips))) {
      alert("Tips must be a number!");
      return;
    }
    if (!formData.chain) {
      alert("Please select a blockchain!");
      return;
    }
    if (!formData.photo) {
      alert("Please upload a QR code image!");
      return;
    }
  
    let newEscrowAddr = "";
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log(formData.chain);
      // await window.ethereum.request({
      //   method: 'wallet_addEthereumChain',
      //   params: [
      //     {
      //       chainId: chain_id_mapping[formData.chain as keyof typeof chain_id_mapping],
      //       chainName: formData.chain,
      //       rpcUrls: [chain_rpc_url[formData.chain as keyof typeof chain_rpc_url]],
      //       nativeCurrency: native_currency_mapping[formData.chain as keyof typeof native_currency_mapping],
      //       blockExplorerUrls: [chain_blockchain_explorer[formData.chain as keyof typeof chain_blockchain_explorer]],
      //     },
      //   ],
      // });  
      const factoryAddress = factory_address[formData.chain as keyof typeof factory_address];
      const factoryABI = [
        "function createEscrow(address _token, uint256 _mainAmount, uint256 _collateralAmount) external",
        "function escrowAddresses(uint256) view returns (address)",
        "function escrowCount() view returns (uint256)"
      ];
  
      const chainKey = formData.chain as keyof typeof token_address_mapping_allnets["USDC"];
      const tokenAddress = token_address_mapping_allnets["USDC"][chainKey]; // USDC (6 decimals)
      const token = new Contract(tokenAddress, ERC20ABI, signer);
      const factory = new Contract(factoryAddress, factoryABI, signer);
  
      // ======== Get crypto amount from API =========
      const res = await fetch(
        `/api/crypto_conversion?twd_amount=${formData.twd_amount}&crypto=${formData.crypto}`
      );
  
      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();
  
      const mainAmount = parseUnits(data.crypto_amount.toFixed(6), 6); // USDC: 6 decimals
      const collateralAmount = mainAmount / 5n;
      const totalAmount = mainAmount + collateralAmount;
  
      console.log("mainAmount:", mainAmount.toString());
      console.log("collateralAmount:", collateralAmount.toString());
  
      const approveTx = await token.approve(factoryAddress, totalAmount);
      await approveTx.wait();
      console.log("Approved USDC transfer");
  
      const tx = await factory.createEscrow(tokenAddress, mainAmount, collateralAmount);
      const receipt = await tx.wait();
      console.log("Escrow created:", receipt);
  
      const count = await factory.escrowCount();
      newEscrowAddr = await factory.escrowAddresses(count);
      console.log("New Escrow Address:", newEscrowAddr);
  
      alert("Escrow Successed!");
    } catch (err) {
      console.error("交易失敗", err);
      alert("Escrow failed");
    }

    const form = new FormData();
    form.append("tourist_address", account);
    form.append("crypto", formData.crypto);
    form.append("chain", formData.chain);
    form.append("twd_amount", formData.twd_amount);
    form.append("crypto_amount", String(formData.crypto_amount));
    form.append("photo", formData.photo);
    form.append("description", formData.description);
    form.append("contract_address", newEscrowAddr);
    // form.append("amountUSD", formData.usd_amount);
    // form.append("tips", formData.tips);

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Upload failed");

      const savedBill = await res.json();

      setSelectedBill(savedBill);
      setFormData({
        orderID: "",
        tourist_address: "",
        twd_amount: "",
        usd_amount: "",
        crypto: "",
        description: "",
        tips: "0",
        chain: "",
        crypto_amount: 0,
        photo: null,
      });
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  const amountNTD_ = parseFloat(formData.twd_amount);
  const usdAmount = isNaN(amountNTD_) ? 0 : amountNTD_ * exchangeRates.NTD_USD;
  
  const tipUSD = parseFloat(formData.tips);
  let cryptoAmount = 0;
  let usdToCryptoRate = 1;
  const selectedCrypto = formData.crypto as CryptoSymbol;
  
  if (usdAmount && selectedCrypto) {
    usdToCryptoRate = exchangeRates[`USD_${selectedCrypto}`] || 1;
    cryptoAmount = usdAmount / usdToCryptoRate;
  }

  const cryptoTips = isNaN(tipUSD) ? 0 : tipUSD / usdToCryptoRate;
  
  const totalCrypto = cryptoAmount + cryptoTips;

  useEffect(() => {
    if (formData.twd_amount) {
      const amountNTD = parseFloat(formData.twd_amount);
      setFormData((prev) => ({
        ...prev,
        usd_amount: (amountNTD * exchangeRates.NTD_USD).toFixed(2),
      }));
    }
  }, [formData.twd_amount]);

  // useEffect(() => {
  //   if (formData.crypto && totalCrypto > 0) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       crypto_amount: parseFloat(totalCrypto.toFixed(6)),
  //     }));
  //   }
  // }, [totalCrypto, formData.crypto]);

  const precision = cryptoDisplayPrecision[formData.crypto as CryptoSymbol] || 6;

  useEffect(() => {
    const fetchCryptoAmount = async () => {
      if (formData.twd_amount && formData.crypto) {
        try {
          const res = await fetch(
            `/api/crypto_conversion?twd_amount=${formData.twd_amount}&crypto=${formData.crypto}`
          );
          console.log(res);
          const data = await res.json();
          setFormData((prev) => ({
            ...prev,
            crypto_amount: parseFloat(data.crypto_amount.toFixed(precision)),
          }));
        } catch (err) {
          console.error("Failed to fetch crypto conversion", err);
        }
      }
    };
  
    fetchCryptoAmount();
  }, [formData.twd_amount, formData.crypto]);


  const minutes = Math.floor(paymentCountdown / 60);
  const seconds = paymentCountdown % 60;
  const formattedCountdown = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <Tabs defaultValue="payment" className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 p-6 border-b md:border-b-0 md:border-r border-gray-700">
        <h2 className="text-xl md:text-2xl font-bold">QRyptoPay</h2>
        <TabsList className="flex md:flex-col mt-12 gap-3 bg-transparent p-0">
          <TabsTrigger value="payment" className="justify-start w-full">
            <BanknoteArrowUp className="mr-2 h-5 w-5" /> Pending Payments
          </TabsTrigger>
          <TabsTrigger value="closed" className="justify-start w-full">
            <Receipt className="mr-2 h-5 w-5" /> Closed Payments
          </TabsTrigger>
          <TabsTrigger value="upload" className="justify-start w-full">
            <ReceiptText className="mr-2 h-5 w-5" /> New Bill
          </TabsTrigger>
        </TabsList>
      </aside>

      {/* Main Content */}
      <section className="flex-1 relative p-6 md:p-10">
        <div className="absolute top-4 right-4">
          {account ? (
            <div className="text-green-400 text-sm text-right">
              Connected:<br /> {account}
            </div>
          ) : (
            <Button size="sm" onClick={connectWallet} className="hover:bg-white hover:text-black mt-2">
              <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
            </Button>
          )}
          {/* <Button
            size="sm"
            onClick={() => setShowSwapModal(true)}
            className="hover:bg-white hover:text-black mt-2"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" /> Swap
          </Button> */}
        </div>
        {/* {showSwapModal && (
          <SwapModal
            account={account}
            onClose={() => setShowSwapModal(false)}
            onConfirmSwap={(amount, srcToken, dstToken) => {
              swap(amount, srcToken, dstToken);
            }}
          />
        )} */}
        <TabsContent value="payment">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">📋 Pending List</h1>
            <div className="space-y-4">
              {bills.length === 0 ? (
                <p className="text-gray-400">There is no pending payment.</p>
              ) : (
                bills.map((bill) => (
                  <div
                    key={bill._id}
                    className="relative bg-gray-800 p-4 rounded-lg border border-gray-700 w-full"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-gray-400">
                        Request by: {bill.tourist_address}
                      </div>
                    </div>
                    <div className="text-sm">
                      Description: {bill.description}
                    </div>
                    <div className="text-sm">
                        Amount: {bill.twd_amount} NTD
                    </div>
     
                    <div className="text-sm text-yellow-400">
                      Crypto you get: {bill.crypto_amount} {bill.crypto}
                    </div>
                    {/* 右下角的 Pay 按鈕 */}
                    <Button
                      size="sm"
                      variant="default"
                      className="absolute bottom-4 right-4 bg-green-500 hover:bg-white hover:text-green-500 text-white border border-green-500"
                      onClick={async () => {
                        setSelectedPayment(bill);
                        try {
                          const provider = new BrowserProvider(window.ethereum);
                          const signer = await provider.getSigner();
                          // await window.ethereum.request({
                          //   method: 'wallet_addEthereumChain',
                          //   params: [
                          //     {
                          //       chainId: chain_id_mapping[selectedBill.chain as keyof typeof chain_id_mapping], // 80001 in hex
                          //       chainName: selectedBill.chain,
                          //       rpcUrls: [chain_rpc_url[selectedBill.chain as keyof typeof chain_rpc_url]],
                          //       nativeCurrency: {
                          //         name: 'MATIC',
                          //         symbol: 'MATIC',
                          //         decimals: 18,
                          //       },
                          //       blockExplorerUrls: [chain_blockchain_explorer[selectedBill.chain as keyof typeof chain_blockchain_explorer]],
                          //     },
                          //   ],
                          // });
                          const escrowAddress = bill.contract_address;
                          const escrowABI = [
                            "function acceptOrder() external",
                            "function helperDeclaredPaid() external",
                            "function confirmPayment() external",
                            "function arbitrate() external"
                          ];
                      
                          const escrowContract = new Contract(escrowAddress, escrowABI, signer);
                      
                          const tx = await escrowContract.acceptOrder();
                          await tx.wait();
                          console.log("acceptOrder() executed");
                          const res = await fetch('/api/order/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: bill._id,
                              status: 1,
                            }),
                          });
                      
                          // if (res.ok) {
                          //   console.log("訂單更新成功");
                          //   alert("你已成功接單！");
                          // } else {
                          //   console.error("後端更新失敗");
                          // }
                      
                        } catch (err) {
                          console.error("執行 acceptOrder 時發生錯誤", err);
                          alert("acceptOrder Failed");
                        }
                      }}
                    >
                      Pay
                    </Button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </TabsContent>
        {/* 當選擇一筆帳單時顯示 Modal */}
        {selectedPayment && (
          <PaymentModal
            bill={selectedPayment}
            account={account}
            onClose={() => setSelectedPayment(null)}
          />
        )}
        <TabsContent value="closed">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Complete Payment</h1>
            <div className="space-y-4">
              {closedBills.length === 0 ? (
                <p className="text-gray-400">There is no complete payment.</p>
              ) : (
                closedBills.map((bill) => (
                  <div
                    key={bill._id}
                    className="relative bg-gray-800 p-4 rounded-lg border border-gray-700 w-full"
                  >
                    <div className="text-sm text-gray-400">
                      Request by: {bill.tourist_address}
                    </div>
                    <div className="text-sm text-gray-400">
                      Paid by: {bill.helper_address}
                    </div>
                    <div className="text-sm">
                      Description: {bill.description}
                    </div>
                    <div className="text-sm">
                        Amount: {bill.twd_amount} NTD
                      </div>
     
                    <div className="text-sm text-yellow-400">
                      Crypto: {bill.crypto_amount} {bill.crypto}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="upload">
          {selectedBill? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-2xl md:text-3xl font-bold mb-6">Order Detail</h1>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4">
                <p>
                  <span className="font-bold">OrderID:</span> {selectedBill._id}
                </p>
                <p>
                  <span className="font-bold">Uploader:</span> {selectedBill.tourist_address}
                </p>
                <p>
                  <span className="font-bold">Amount:</span> {selectedBill.twd_amount} NTD / {selectedBill.twd_amount * exchangeRates.NTD_USD} USD
                </p>
                <p>
                  <span className="font-bold">Crypto:</span> {selectedBill.crypto_amount} {selectedBill.crypto} 
                </p>
                <p>
                  <span className="font-bold">Description:</span> {selectedBill.description}
                </p>
                {/* <p>
                  <span className="font-bold">Tips:</span> {selectedBill.tips} USD
                </p> */}
                <p>
                  <span className="font-bold">Chain:</span> {selectedBill.chain}
                </p>
              </div>
              <div className="flex gap-4">
                {(paymentCountdown > 0) ? (
                  <Button
                    variant="default"
                    className="hover:bg-green-500 hover:text-white"
                    onClick={async () => {
                      setSelectedBill(null);

                      try {
                        const provider = new BrowserProvider(window.ethereum);
                        const signer = await provider.getSigner();
                    
                        const escrowAddress = selectedBill.contract_address;
                        const escrowABI = [
                          "function acceptOrder() external",
                          "function helperDeclaredPaid() external",
                          "function confirmPayment() external",
                          "function arbitrate() external"
                        ];
                    
                        const escrowContract = new Contract(escrowAddress, escrowABI, signer);
                    
                        const tx = await escrowContract.confirmPayment();
                        await tx.wait();
                        console.log("confirmPayment() executed");
                        const res = await fetch('/api/order/update', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                              id: selectedBill._id,
                              status: 3,
                          }),
                        });
                    
                        if (res.ok) {
                          console.log("訂單更新成功");
                          alert("Payment complete!");
                        } else {
                          console.error("後端更新失敗");
                        }
                    
                      } catch (err) {
                        console.error("執行 confirmPayment 時發生錯誤", err);
                        alert("confirmPayment Failed");
                      }
                      setPaymentCountdown(-1);
                    }}>
                    Done ({formattedCountdown})
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    disabled
                    className="cursor-not-allowed"
                  >
                    Done
                  </Button>
                )}
                <Button
                  variant="default"
                  className="hover:bg-red-500 hover:text-white"
                  onClick={() => {
                    alert("Report submitted!");
                  }}
                >
                  Report
                </Button>
              </div>
            </motion.div>
          ) : (
            // 若尚未上傳則顯示上傳表單
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-2xl md:text-3xl font-bold mb-6">🧾 Upload a New Bill</h1>
              <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
                {/* Image Upload Section */}
                <label
                  htmlFor="upload-input"
                  className="cursor-pointer w-full md:w-1/2 bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col justify-center items-center text-center hover:border-blue-400 transition-all duration-200"
                >
                  {formData.photo ? (
                    <img
                      src={URL.createObjectURL(formData.photo)}
                      alt="QR Preview"
                      className="max-w-full h-auto rounded-lg"
                    />
                  ) : (
                    <div className="text-gray-400">Upload QR code</div>
                  )}
                  <input
                    id="upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                </label>

                {/* Form Fields Section */}
                <div className="md:w-1/2 space-y-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-4">
                      <Label className="text-sm whitespace-nowrap">Amount (NTD)</Label>
                      <Input
                        name="twd_amount"
                        value={formData.twd_amount}
                        onChange={handleInputChange}
                        placeholder="NTD"
                        className="w-[100px]"
                        required
                      />
                      <div className="text-sm text-gray-400 whitespace-nowrap">
                        ≈ {formData.usd_amount} USD
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-4">
                      <Label className="text-sm whitespace-nowrap">Crypto</Label>
                      <Select
                        value={formData.crypto}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, crypto: value }))
                        }
                      >
                        <SelectTrigger className="">
                          <SelectValue placeholder="Choose crypto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ETH">ETH</SelectItem>
                          <SelectItem value="USDT">USDT</SelectItem>
                          <SelectItem value="USDC">USDC</SelectItem>
                          <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Description</Label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="e.g. ChunShuiTang Bubble Tea"
                      required
                    />
                  </div>
                  
                  {/*tips <div className="space-y-1">
                    <Label className="text-sm">Optional Tips (USD)</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {["1.00", "2.00"].map((value) => {
                        const isSelected = formData.tips === value;
                        return (
                          <Button
                            key={value}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            className={cn(
                              "px-4 py-2",
                              !isSelected && "bg-white text-black border border-gray-400 shadow-sm"
                            )}
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, tips: value }))
                            }
                          >
                            ${value}
                          </Button>
                        );
                      })}
                      <Input
                        name="tips"
                        value={formData.tips === "0" ? "" : formData.tips}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setFormData((prev) => ({
                            ...prev,
                            tips: val === "" ? "0" : val,
                          }));
                        }}
                        placeholder="Other"
                        className="w-[120px]"
                      />
                    </div>
                  </div> */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-4">
                      <Label className="text-sm whitespace-nowrap">Chain</Label>
                      <Select
                        value={formData.chain}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, chain: value }))
                        }
                      >
                        <SelectTrigger className="">
                          <SelectValue placeholder="Choose Chain" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ethereum">Ethereum Sepolia Testnet</SelectItem>
                          <SelectItem value="Polygon">Polygon</SelectItem>
                          <SelectItem value="Zircuit">Zircuit Garfield Testnet</SelectItem>
                          <SelectItem value="Celo">Celo Alfajores Testnet</SelectItem>
                          <SelectItem value="Flow">Flow EVM testnet</SelectItem>
                          <SelectItem value="RootStock">RootStock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.crypto_amount > 0 && (
                    <div className="text-sm text-yellow-400 text-right pr-1">
                      ≈ {formData.crypto_amount} {formData.crypto}
                    </div>
                  )}
                  {formData.crypto_amount > 0 && (
                    <div className="text-sm text-yellow-400 text-right pr-1">
                    with Collateral ≈ {(formData.crypto_amount*1.2).toFixed(precision)} {formData.crypto}
                    </div>
                  )}
 
                  <Button type="submit" className="w-full mt-2">📤 Upload</Button>
                </div>
              </form>
            </motion.div>
          )}
        </TabsContent>
      </section>
    </Tabs>
  );
}