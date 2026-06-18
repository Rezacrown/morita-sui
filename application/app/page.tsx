'use client';

import React, { useState } from 'react';
import Header from '@/components/landing/header';
import Hero from '@/components/landing/hero';
import BrandMarquee from '@/components/landing/marquee';
import HowItWorks from '@/components/landing/how-it-works';
import SandboxPlayground from '@/components/landing/sandbox-playground';
import MarketplacePreview from '@/components/landing/marketplace-preview';
import TechBento from '@/components/landing/tech-bento';
import FAQ from '@/components/landing/faq';
import Footer from '@/components/landing/footer';
import LoginModal from '@/components/landing/login-modal';

export default function LandingPage() {
  // Enoki auth simulated states
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [connectedUser, setConnectedUser] = useState<{ name: string; email: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLoginSuccess = (name: string, email: string) => {
    setIsWalletConnected(true);
    setConnectedUser({ name, email });
  };

  const handleDisconnectWallet = () => {
    setIsWalletConnected(false);
    setConnectedUser(null);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-border-dark font-sans selection:bg-blueberry-light">
      {/* 1. Header Navigation with top scrollbar progress indicator */}
      <Header />

      {/* 2. Hero Section Grouped with Marquee */}
      <div id="hero-section-card" className="relative z-10">
        <Hero 
          onOpenLoginModal={() => setShowLoginModal(true)}
          isWalletConnected={isWalletConnected}
        />
        <BrandMarquee />
      </div>

      {/* 
        PREMIUM FULL-SECTION STACKING LAYOUT
        Each container has its own solid background, thick top border, and top elevation shadow.
        As you scroll down, succeeding sections cleanly slide up and cover the preceding ones.
      */}

      {/* 3. Section Panel: HOW IT WORKS (Regular Flow) */}
      <div 
        id="how-it-works-panel" 
        className="relative z-20 bg-brand-bg border-t-3 border-border-dark min-h-[70vh]"
      >
        <HowItWorks />
      </div>

      {/* 4. Section Panel: INTERACTIVE PLAYGROUND (Sandbox - Regular Flow) */}
      <div 
        id="playground-panel" 
        className="relative z-20 bg-brand-bg border-t-3 border-border-dark min-h-[70vh]"
      >
        <SandboxPlayground />
      </div>

      {/* 5. Section Panel: MARKETPLACE PREVIEW (Regular Flow) */}
      <div 
        id="marketplace-panel" 
        className="relative z-20 bg-brand-bg border-t-3 border-border-dark min-h-[70vh]"
      >
        <MarketplacePreview />
      </div>

      {/* 6. Section Panel: SUI CORE POWERTRAIN BENTO (Regular Flow) */}
      <div 
        id="tech-bento-panel" 
        className="relative z-20 bg-brand-bg border-t-3 border-border-dark min-h-[70vh]"
      >
        <TechBento />
      </div>

      {/* 7. Section Panel: KNOWLEDGE ACCORDION (FAQ - Regular Flow) */}
      <div 
        id="faq-panel" 
        className="relative z-20 bg-brand-bg border-t-3 border-border-dark min-h-[70vh]"
      >
        <FAQ />
      </div>

      {/* 8. FOOTER PANEL (Regular Flow) */}
      <div 
        id="footer-panel" 
        className="relative z-20 bg-brand-bg border-t-3 border-border-dark"
      >
        <Footer />
      </div>

      {/* Simulated authentication modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
