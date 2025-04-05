"use client";

import { useEffect, useState } from "react";
declare global {
  interface Window {
    ethereum?: any;
  }
}

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { Wallet, ReceiptText, BanknoteArrowUp } from "lucide-react";

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    amount: "",
    currency: "",
    description: "",
    reward: "",
    file: null as File | null,
  });

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
      } catch (error) {
        console.error("User rejected connection", error);
      }
    } else {
      alert("請先安裝 MetaMask！");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) return;
    const newBill = {
      id: Date.now(),
      uploader: account,
      ...formData,
    };
    setBills((prev) => [...prev, newBill]);
    setFormData({ amount: "", currency: "", description: "", reward: "", file: null });
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
      <aside className="w-full md:w-64 bg-gray-900 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-700 flex md:flex-col items-center md:items-start gap-4">
        <h2 className="text-xl md:text-2xl font-bold">ETHGlobal Taipei</h2>
        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="flex md:flex-col w-full gap-2 bg-transparent p-0 mt-6">
            <TabsTrigger value="payment" className="justify-start w-full">
              <BanknoteArrowUp className="mr-2 h-5 w-5" /> Pending Payments
            </TabsTrigger>
            <TabsTrigger value="upload" className="justify-start w-full">
              <ReceiptText className="mr-2 h-5 w-5" /> New Bill
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </aside>

      <section className="flex-1 relative p-6 md:p-10">
        <div className="absolute top-4 right-4">
          {account ? (
            <div className="text-green-400 text-sm text-right">
              已連接:<br /> {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          ) : (
            <Button size="sm" onClick={connectWallet}>
              <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
            </Button>
          )}
        </div>

        <Tabs defaultValue="payment">
          <TabsContent value="payment">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">📋 Open Requests</h1>
              <div className="space-y-4">
                {bills.length === 0 ? (
                  <p className="text-gray-400">目前沒有待支付項目。</p>
                ) : (
                  bills.map((bill) => (
                    <div
                      key={bill.id}
                      className="bg-gray-800 p-4 rounded-lg border border-gray-700"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-400">
                          👤 {bill.uploader?.slice(0, 6)}...{bill.uploader?.slice(-4)}
                        </div>
                        <div className="text-sm">💰 {bill.amount} {bill.currency}</div>
                      </div>
                      <div className="text-gray-300 text-sm mb-2">📝 {bill.description}</div>
                      <div className="text-sm text-yellow-400">Reward: {bill.reward} ETH</div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="upload">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">🧾 Upload a New Bill</h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Amount</Label>
                  <Input name="amount" value={formData.amount} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input name="currency" value={formData.currency} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea name="description" value={formData.description} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label>Reward Offered (ETH)</Label>
                  <Input name="reward" value={formData.reward} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>QR Code Image</Label>
                  <Input type="file" accept="image/*" onChange={handleFileChange} required />
                </div>
                <Button type="submit">Create Request</Button>
              </form>
            </motion.div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
