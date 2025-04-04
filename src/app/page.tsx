"use client";

declare global {
  interface Window {
    ethereum?: any;
  }
}
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { Wallet, Wallet2, Globe2 } from "lucide-react";

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);

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

  return (
    <main className="min-h-screen flex bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 p-6 border-r border-gray-700 flex flex-col gap-4">
        <h2 className="text-2xl font-bold mb-6">🧠 Web3 App</h2>
        <Tabs defaultValue="home" className="flex flex-col gap-2">
          <TabsList className="flex flex-col gap-2 bg-transparent p-0">
            <TabsTrigger value="home" className="justify-start w-full">
              <Globe2 className="mr-2 h-5 w-5" /> 首頁
            </TabsTrigger>
            <TabsTrigger value="wallet" className="justify-start w-full">
              <Wallet2 className="mr-2 h-5 w-5" /> 我的錢包
            </TabsTrigger>
            <TabsTrigger value="about" className="justify-start w-full">
              🧬 關於
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </aside>

      {/* Main Content */}
      <section className="flex-1 relative p-10">
        {/* Wallet button top-right */}
        <div className="absolute top-6 right-6">
          {account ? (
            <div className="text-green-400 text-sm">
              已連接: {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          ) : (
            <Button onClick={connectWallet}>
              <Wallet className="mr-2 h-4 w-4" /> 連接錢包
            </Button>
          )}
        </div>

        <Tabs defaultValue="home">
          <TabsContent value="home">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-3xl font-bold mb-4">🌍 歡迎來到 Web3 世界</h1>
              <p className="text-gray-300">
                使用 MetaMask 錢包連接，探索去中心化應用。
              </p>
            </motion.div>
          </TabsContent>

          <TabsContent value="wallet">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-3xl font-bold mb-4">💼 我的錢包</h1>
              {account ? (
                <p>錢包地址：{account}</p>
              ) : (
                <p>請先連接你的 MetaMask 錢包。</p>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="about">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-3xl font-bold mb-4">📚 關於本站</h1>
              <p>
                本站使用 Next.js + Tailwind CSS + Shadcn UI + ethers.js 打造，是個極簡且酷炫的 Web3 框架。
              </p>
            </motion.div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}