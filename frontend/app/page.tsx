"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Shield, Zap, Lock, BarChart3, Globe, CheckCircle } from "lucide-react";
import LandingCandlestickChart from "./components/LandingCandlestickChart";

export default function LandingPage() {
  const [mockData, setMockData] = useState<any[]>([]);
  
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans selection:bg-[#238636] selection:text-white flex flex-col">
      
      {/* --- MARKETING HEADER (Distinct from App Navbar) --- */}
      <header className="w-full border-b border-[#30363d]/50 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#238636] flex items-center justify-center font-bold text-white text-lg">S</div>
            <span className="text-xl font-bold tracking-tight">SyncTrade</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/strategies" className="text-sm font-medium text-[#8b949e] hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link 
              href="/trade" 
              className="px-5 py-2.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(35,134,54,0.4)]"
            >
              Launch App <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <main className="flex-1">
        <section className="relative pt-24 pb-32 flex flex-col items-center text-center px-6 overflow-hidden">
          
          {/* Background Effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#238636] opacity-[0.08] blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-[#161b22] border border-[#30363d] text-xs font-medium text-[#8b949e]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#238636] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#238636]"></span>
              </span>
              Live on Arbitrum Sepolia Testnet
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-white leading-[1.1]">
              Professional Trading, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2ea043] to-[#58a6ff]">
                Fully Decentralized.
              </span>
            </h1>
            
            <p className="text-xl text-[#8b949e] max-w-2xl mx-auto mb-12 leading-relaxed">
              SyncTrade is a non-custodial social trading protocol. Copy the top-performing on-chain strategies instantly, transparently, and without giving up custody of your funds.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/trade" 
                className="w-full sm:w-auto px-8 py-4 bg-[#e6edf3] text-[#0d1117] hover:bg-white rounded-lg font-bold text-lg transition-all shadow-lg shadow-white/5"
              >
                Start Trading Now
              </Link>
              {/* <Link 
                href="/strategies" 
                className="w-full sm:w-auto px-8 py-4 bg-[#161b22] border border-[#30363d] text-[#e6edf3] hover:border-[#8b949e] rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                View Strategies
              </Link> */}
            </div>
          </div>
        </section>

        {/* --- TRUST STATS --- */}
        <section className="border-y border-[#30363d] bg-[#161b22]/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatBox label="Total Volume Traded" value="$42.5M+" />
            <StatBox label="Active Strategies" value="1,240+" />
            <StatBox label="Successful Copies" value="850K+" />
            <StatBox label="Protocol Uptime" value="100%" />
          </div>
        </section>

        {/* --- FEATURES GRID --- */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Trustless Finance</h2>
            <p className="text-[#8b949e] max-w-2xl mx-auto text-lg">
              We replace the "trust me" of traditional finance with "verify me" on the blockchain.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield size={32} className="text-[#238636]" />}
              title="Non-Custodial"
              desc="Your funds never leave your smart contract wallet until a trade is executed. You can withdraw your assets at any time, 24/7."
            />
            <FeatureCard 
              icon={<Zap size={32} className="text-[#e3b341]" />}
              title="Atomic Execution"
              desc="Trades are mirrored in the exact same block as the leader. This eliminates front-running and ensures you get the same entry price."
            />
            <FeatureCard 
              icon={<Lock size={32} className="text-[#f85149]" />}
              title="Verifiable History"
              desc="Every trade, win, and loss is recorded permanently on the blockchain. No fake screenshots, no deleted history, just raw data."
            />
            <FeatureCard 
              icon={<BarChart3 size={32} className="text-[#58a6ff]" />}
              title="Real-Time Analytics"
              desc="Deep dive into strategy performance with live charts, P&L breakdowns, and risk metrics before you decide to follow."
            />
            <FeatureCard 
              icon={<Globe size={32} className="text-[#a371f7]" />}
              title="Permissionless"
              desc="Anyone can become a strategy leader. Create your own fund, build a track record, and earn performance fees from followers."
            />
            <FeatureCard 
              icon={<CheckCircle size={32} className="text-[#2ea043]" />}
              title="Automated Risk Management"
              desc="Set your own stop-losses and take-profit limits. Even if the leader holds a losing trade, your rules protect your capital."
            />
          </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section className="py-24 bg-[#161b22] border-t border-[#30363d]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Three Steps to Success</h2>
                <div className="space-y-8">
                  <StepItem number="01" title="Connect & Discover" desc="Connect your wallet and browse the leaderboard. Filter strategies by ROI, risk level, and asset type." />
                  <StepItem number="02" title="Deposit & Follow" desc="Deposit USDC into the strategy vault. The smart contract automatically syncs your portfolio with the leader." />
                  <StepItem number="03" title="Earn & Withdraw" desc="Watch your portfolio grow. Claim your profits or withdraw your principal instantly whenever you want." />
                </div>
              </div>
              <div className="flex-1 bg-gradient-to-br from-[#1f6feb] to-[#238636] p-[1px] rounded-2xl">
                <div className="bg-[#0d1117] rounded-2xl p-4 h-[400px] w-full">
                  <div className="w-full h-full">
                    <LandingCandlestickChart />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-[#30363d] bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#238636] flex items-center justify-center text-white text-xs font-bold">S</div>
            <span className="font-bold text-[#8b949e]">SyncTrade Protocol</span>
          </div>
          <div className="flex gap-8 text-sm font-medium">
            <a href="#" className="text-[#8b949e] hover:text-[#58a6ff] transition-colors">Documentation</a>
            <a href="#" className="text-[#8b949e] hover:text-[#58a6ff] transition-colors">Twitter</a>
            <a href="#" className="text-[#8b949e] hover:text-[#58a6ff] transition-colors">Discord</a>
            <a href="#" className="text-[#8b949e] hover:text-[#58a6ff] transition-colors">GitHub</a>
          </div>
          <div className="text-[#484f58] text-sm">
            © 2026 SyncTrade. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- SUB COMPONENTS ---

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="text-center md:text-left">
      <div className="text-3xl md:text-4xl font-bold text-[#e6edf3] mb-2">{value}</div>
      <div className="text-xs text-[#8b949e] uppercase tracking-wider font-bold">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="group p-8 rounded-2xl bg-[#161b22] border border-[#30363d] hover:border-[#238636] transition-all hover:-translate-y-1">
      <div className="mb-6 p-3 rounded-lg bg-[#0d1117] w-fit border border-[#30363d] group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-[#e6edf3]">{title}</h3>
      <p className="text-[#8b949e] leading-relaxed">{desc}</p>
    </div>
  );
}

function StepItem({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#58a6ff] font-bold text-lg shrink-0">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2 text-[#e6edf3]">{title}</h3>
        <p className="text-[#8b949e]">{desc}</p>
      </div>
    </div>
  );
}