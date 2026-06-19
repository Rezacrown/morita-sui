'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeftRight, 
  Wallet, 
  Key, 
  Cpu, 
  Database, 
  Layers, 
  Lock, 
  Shield, 
  ArrowRight, 
  Sparkles, 
  Code2, 
  Terminal, 
  Coins
} from 'lucide-react';

export default function SandboxPlayground() {
  return (
    <section id="interactive-playground" className="border-b-3 border-border-dark py-20 lg:py-32 bg-brand-bg relative overflow-hidden">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(30,32,68,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,32,68,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
      
      {/* Accent Circle Vector */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blueberry-cream/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 rounded-full bg-blueberry/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Block of Sandbox Playgrounds */}
        <div className="text-center max-w-3xl mx-auto mb-20 md:mb-28">
          <span className="text-xs font-mono font-black tracking-widest bg-blueberry text-white px-3 py-1.5 rounded-full uppercase inline-block border-2 border-border-dark shadow-[1.5px_1.5px_0px_0px_var(--color-border-dark)]">
            🎬 CORE PROTOCOL WALKTHROUGH
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl mt-5 uppercase text-border-dark tracking-tighter leading-none">
            HOW MORITA WORKS <br />
            <span className="text-blueberry">UNDER THE HOOD</span>
          </h2>
          <p className="font-sans text-sm sm:text-base text-border-dark/75 mt-4 leading-relaxed max-w-2xl mx-auto">
            Scroll down to explore how Morita bridges game state differences, processes gas-sponsored barter swaps, and deploys high-performance ledger access for developers and players.
          </p>
        </div>

        {/* VERTICAL TIMELINE / CORRIDOR */}
        <div className="relative mt-12">
          
          {/* Centered Timeline Spine Line (Visible on md and above) */}
          <div className="absolute left-1/2 top-4 bottom-4 w-1 border-l-2 border-dashed border-border-dark/25 transform -translate-x-1/2 hidden md:block" />

          {/* SECTION HEADER : THE GAMER PARADIGM */}
          <div className="w-full flex justify-center mb-16 relative z-10">
            <span className="bg-white border-2 border-border-dark text-border-dark text-xs font-mono font-black py-2 px-6 rounded-xl uppercase tracking-wider shadow-[3px_3px_0px_0px_var(--color-border-dark)]">
              PART I : THE PLAYER BARTER FLOW
            </span>
          </div>

          {/* STEP 1: Alternating Left-Right (Text Left, Visual Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center mb-28 relative">
            {/* Timeline node circle anchor */}
            <div className="absolute left-1/2 top-1/2 w-6 h-6 rounded-full bg-blueberry border-4 border-white shadow-[2px_2px_0px_0px_#161614] transform -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center z-20">
              <span className="text-[8px] font-mono font-black text-white">1</span>
            </div>

            {/* Left Content Column */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="space-y-4 text-left md:pr-8"
              id="step-1-text"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blueberry-cream text-blueberry-dark rounded-md border border-blueberry-light text-[10px] font-mono font-black uppercase">
                <Wallet className="w-3.5 h-3.5" />
                Step 01 / Frictionless Login
              </div>
              
              <h3 className="font-display font-black text-2xl lg:text-4xl text-border-dark uppercase tracking-tight">
                No Extension. <br />No Seed Phrase. <br />
                <span className="text-blueberry">Just Social Identity.</span>
              </h3>
              
              <p className="font-sans text-sm sm:text-base text-border-dark/80 leading-relaxed">
                Traditional Web3 barriers immediately turn players away. Morita implements Mysten Labs&apos; <strong>Enoki zkLogin framework</strong>. 
                Players authenticate using their preexisting secure Google, Discord, or twitch login credentials.
              </p>
              
              <div className="p-4 bg-white/50 border border-dashed border-border-dark/20 rounded-xl font-mono text-[11px] text-border-dark/70 space-y-2">
                <span className="font-bold text-blueberry uppercase block">🔐 ZERO-KNOWLEDGE PROOF IN ACTION</span>
                <p className="leading-snug">
                  Morita converts JWT social session tokens directly into temporary cryptographic SUI keys. The client executes and processes ledger requests securely in the background.
                </p>
              </div>
            </motion.div>

            {/* Right Visual Graphic Column */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="bg-white border-3 border-border-dark rounded-2xl p-6 shadow-[6px_6px_0px_0px_var(--color-border-dark)] relative overflow-hidden"
              id="step-1-visual"
            >
              <div className="absolute top-2 right-2 flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>

              <div className="border-b border-border-dark/10 pb-4 mb-4">
                <span className="text-[10px] font-mono text-border-dark/40 uppercase block font-bold">CLIENT PASSPORT MODAL</span>
                <span className="text-xs font-mono font-black text-border-dark">AUTHENTICATION PORTAL</span>
              </div>

              {/* Vector representation of simplified zkLogin block */}
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border-2 border-border-dark rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-600 text-sm font-mono">G</div>
                    <div>
                      <span className="text-xs font-black text-border-dark block">SIGN IN WITH GOOGLE</span>
                      <span className="text-[9px] text-border-dark/50 font-mono">Secure JWT Authentication</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#3b4df9]/10 text-[#3b4df9] font-black px-2 py-0.5 rounded font-mono">ENOKI SUPPORT</span>
                </div>

                <div className="p-3 bg-slate-50 border-2 border-border-dark rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm font-mono">T</div>
                    <div>
                      <span className="text-xs font-black text-border-dark block">SIGN IN WITH TWITCH</span>
                      <span className="text-[9px] text-border-dark/50 font-mono">Real-time Streamer Binding</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-border-dark/30 font-mono">AVAILABLE</span>
                </div>

                <div className="text-center text-[10px] text-border-dark/40 font-mono pt-1">
                  🔒 Ephemeral Key Generated Client-Side &bull; No Key Custody
                </div>
              </div>
            </motion.div>
          </div>

          {/* STEP 2: Alternating (Visual Left, Text Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center mb-28 relative">
            
            {/* Timeline node circle anchor */}
            <div className="absolute left-1/2 top-1/2 w-6 h-6 rounded-full bg-[#e5fc84] border-4 border-white shadow-[2px_2px_0px_0px_#161614] transform -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center z-20">
              <span className="text-[8px] font-mono font-black text-border-dark">2</span>
            </div>

            {/* Left Column (Visual) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="bg-white border-3 border-border-dark rounded-2xl p-6 shadow-[6px_6px_0px_0px_var(--color-border-dark)] relative overflow-hidden md:order-1 order-2"
              id="step-2-visual"
            >
              <div className="absolute top-2 right-2 flex gap-1">
                <span className="text-[9px] font-mono font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">GAS FREE</span>
              </div>

              <div className="border-b border-border-dark/10 pb-4 mb-4">
                <span className="text-[10px] font-mono text-border-dark/40 uppercase block font-bold">ESCROW LEDGER STEP</span>
                <span className="text-xs font-mono font-black text-border-dark">ATOMIC SUI KIOSK EXCHANGE</span>
              </div>

              {/* Graphic container demonstrating transfer */}
              <div className="p-4 bg-blueberry-cream/20 rounded-xl border-2 border-border-dark relative flex flex-col items-center justify-center gap-6 py-8">
                
                {/* 2-Way Flow Graphic */}
                <div className="flex items-center justify-between w-full max-w-xs relative bg-white border-2 border-border-dark rounded-xl p-3 z-10 shadow-[3px_3px_0px_0px_#161614]">
                  
                  {/* Left item */}
                  <div className="text-center space-y-1">
                    <span className="text-[8px] font-mono font-bold bg-[#B3B9FF] text-indigo-950 px-1 py-0.5 rounded uppercase">Katana</span>
                    <div className="w-10 h-10 mx-auto rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#3b4df9]" />
                    </div>
                    <span className="text-[8px] text-border-dark font-mono block">Game client A</span>
                  </div>

                  {/* Escrow Animation Circle */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <span className="text-[7px] font-mono text-[#3b4df9] mt-1 font-bold">1-TX ESCROW</span>
                  </div>

                  {/* Right item */}
                  <div className="text-center space-y-1">
                    <span className="text-[8px] font-mono font-bold bg-[#E5FC84] text-lime-950 px-1 py-0.5 rounded uppercase">Shield</span>
                    <div className="w-10 h-10 mx-auto rounded-lg bg-lime-50 border border-lime-200 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[#3b4df9]" />
                    </div>
                    <span className="text-[8px] text-border-dark font-mono block">Game client B</span>
                  </div>

                </div>

                <div className="w-full text-center font-mono text-[9px] text-border-dark/50 border-t border-border-dark/10 pt-3">
                  🌐 Transaction Block ID: fx_atomic_0x99eA2...
                </div>
              </div>
            </motion.div>

            {/* Right Column (Text) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="space-y-4 text-left md:pl-8 md:order-2 order-1"
              id="step-2-text"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-lime-100 text-lime-900 rounded-md border border-lime-300 text-[10px] font-mono font-black uppercase">
                <Lock className="w-3.5 h-3.5" />
                Step 02 / Atomic Escrow
              </div>
              
              <h3 className="font-display font-black text-2xl lg:text-4xl text-border-dark uppercase tracking-tight">
                Secure Barters, <br/>Gasless Execution, <br/>
                <span className="text-blueberry">No Cheat Risk.</span>
              </h3>
              
              <p className="font-sans text-sm sm:text-base text-border-dark/80 leading-relaxed">
                Players swap inventory assets atomically. 
                Instead of sending items and blindly trusting the recipient, Morita creates single-transaction locks using native <strong>Sui Kiosk rules</strong>. 
                If any participant backing crashes, raw items remain safely in respective passports.
              </p>

              <div className="p-4 bg-[#e5fc84]/20 border border-dashed border-lime-400 rounded-xl font-mono text-[11px] text-border-dark/70 space-y-2">
                <span className="font-bold text-[#3b4df9] uppercase block">💸 SPONSORED BY ENOKI RECOVERY</span>
                <p className="leading-snug">
                  Morita integrates Enoki Gas Stations. Players require zero native SUI tokens, keeping trade processes 100% free of gas overhead.
                </p>
              </div>
            </motion.div>

          </div>


          {/* SECTION HEADER : THE DEVELOPER PARADIGM */}
          <div className="w-full flex justify-center mb-16 relative z-10 pt-10">
            <span className="bg-white border-2 border-border-dark text-border-dark text-xs font-mono font-black py-2 px-6 rounded-xl uppercase tracking-wider shadow-[3px_3px_0px_0px_var(--color-border-dark)]">
              PART II : THE DEVELOPER WORKFLOW
            </span>
          </div>

          {/* STEP 3: Alternating (Text Left, Visual Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center mb-28 relative">
            
            {/* Timeline node circle anchor */}
            <div className="absolute left-1/2 top-1/2 w-6 h-6 rounded-full bg-indigo-500 border-4 border-white shadow-[2px_2px_0px_0px_#161614] transform -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center z-20">
              <span className="text-[8px] font-mono font-black text-white">3</span>
            </div>

            {/* Left Column (Text) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="space-y-4 text-left md:pr-8"
              id="step-3-text"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#b3b9ff]/30 text-[#090b1b] rounded-md border border-[#3b4df9]/20 text-[10px] font-mono font-black uppercase">
                <Code2 className="w-3.5 h-3.5" />
                Step 03 / SDK Integration
              </div>
              
              <h3 className="font-display font-black text-2xl lg:text-4xl text-border-dark uppercase tracking-tight">
                Connect Game Code <br/>Via Simple <br/>
                <span className="text-blueberry">HTTP REST Endpoints.</span>
              </h3>
              
              <p className="font-sans text-sm sm:text-base text-border-dark/80 leading-relaxed">
                Game developers are not required to learn Rust, write custom SUI smart contracts, or manage high-risk cryptographic private keys on-client. 
                Integrating Morita takes minutes over simple <strong>REST API pipelines</strong>.
              </p>

              <div className="p-4 bg-white/50 border border-dashed border-border-dark/20 rounded-xl font-mono text-[11px] text-border-dark/70 space-y-2">
                <span className="font-bold text-blueberry uppercase block">💡 MULTI-ENGINE COMPATIBLE</span>
                <p className="leading-snug">
                  Query items directly inside Unity, Unreal, WebGL, Godot, or custom node-js servers using our simplified REST parameters.
                </p>
              </div>
            </motion.div>

            {/* Right Column (Visual) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="bg-[#151515] text-[#D4D4D4] border-3 border-border-dark rounded-2xl p-5 shadow-[6px_6px_0px_0px_var(--color-border-dark)] overflow-hidden font-mono text-xs"
              id="step-3-visual"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3 text-[10px] text-slate-500">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blueberry-light" />
                  <span>REST_MINT_REQUEST.sh</span>
                </div>
                <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded font-black">201 OK</span>
              </div>

              {/* Mock Code Block */}
              <pre className="text-[10px] sm:text-xs text-[#9CDCFE] leading-relaxed whitespace-pre-wrap">
{`curl -X POST "https://api.morita.xyz/v1/game/item/mint" \\
  -H "Authorization: Bearer morita_sk_xxxx_live" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sender_game": "cyber-2099",
    "recipient_social_id": "google|alex_mercer",
    "item_metadata": {
      "name": "Void Katana",
      "model_rarity": "Legendary"
    }
  }'`}
              </pre>

              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[8px] text-slate-500">
                <span>SECURED OVER API SIGNATURES</span>
                <span>FAST REDISTRIBUTION BLUEPRINTS</span>
              </div>
            </motion.div>

          </div>

          {/* STEP 4: Alternating (Visual Left, Text Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center mb-20 relative">
            
            {/* Timeline node circle anchor */}
            <div className="absolute left-1/2 top-1/2 w-6 h-6 rounded-full bg-teal-400 border-4 border-white shadow-[2px_2px_0px_0px_#161614] transform -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center z-20">
              <span className="text-[8px] font-mono font-black text-border-dark">4</span>
            </div>

            {/* Left Column (Visual) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="bg-white border-3 border-border-dark rounded-2xl p-6 shadow-[6px_6px_0px_0px_var(--color-border-dark)] relative overflow-hidden md:order-1 order-2"
              id="step-4-visual"
            >
              <div className="absolute top-2 right-2">
                <span className="text-[8px] font-mono font-black bg-cyan-100 text-cyan-900 px-2 py-0.5 rounded border border-cyan-300">WALRUS SYNC</span>
              </div>

              <div className="border-b border-border-dark/10 pb-4 mb-4">
                <span className="text-[10px] font-mono text-border-dark/40 uppercase block font-bold">DECENTRALIZED MEMORY</span>
                <span className="text-xs font-mono font-black text-[#3b4df9]">WALRUS PERMANENT BLOB HOUSING</span>
              </div>

              {/* Storage node visualization layout */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "Mesh 3D", count: "12.4 MB", desc: "Walrus Epoch" },
                  { name: "Texture", count: "2.1 MB", desc: "Permanent" },
                  { name: "Stats JSON", count: "48 KB", desc: "On-Chain" }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 border-2 border-border-dark rounded-xl bg-slate-50 text-center space-y-1">
                    <Database className="w-5 h-5 text-indigo-600 mx-auto" />
                    <span className="text-[10px] font-black text-border-dark block">{item.name}</span>
                    <span className="text-[8px] font-mono bg-indigo-50 text-indigo-800 px-1 py-0.2 rounded font-black block">{item.count}</span>
                    <span className="text-[7px] font-mono text-border-dark/40 block">{item.desc}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-border-dark/10 text-center font-mono text-[8px] text-border-dark/40">
                ⚡ Milliseconds retrieval times &bull; Low gas storage overhead
              </div>
            </motion.div>

            {/* Right Column (Text) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="space-y-4 text-left md:pl-8 md:order-2 order-1"
              id="step-4-text"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-cyan-100 text-cyan-950 rounded-md border border-cyan-200 text-[10px] font-mono font-black uppercase">
                <Database className="w-3.5 h-3.5" />
                Step 04 / Decentralized Storage
              </div>
              
              <h3 className="font-display font-black text-2xl lg:text-4xl text-border-dark uppercase tracking-tight">
                Scalable Storage <br/>Backed By <br/>
                <span className="text-blueberry">Walrus Nodes.</span>
              </h3>
              
              <p className="font-sans text-sm sm:text-base text-border-dark/80 leading-relaxed">
                Instead of storing heavy mesh textures, 3D assets, animated vector visual packs, and complex models inside expensive storage networks or vulnerable servers, Morita utilizes Mysten Labs&apos; <strong>Walrus Protocol</strong>.
              </p>

              <div className="p-4 bg-cyan-50/55 border border-dashed border-cyan-300 rounded-xl font-mono text-[11px] text-border-dark/70 space-y-2">
                <span className="font-bold text-[#3b4df9] uppercase block">💾 CRYPTOGRAPHIC VERIFIABILITY</span>
                <p className="leading-snug">
                  The ledger holds lightweight cryptographic pointers to Walrus epochs, ensuring game items remain secure and decentralized.
                </p>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </section>
  );
}
