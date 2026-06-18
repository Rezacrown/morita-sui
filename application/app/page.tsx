'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
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
  const router = useRouter();
  const { isLoggedIn, userMode } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg text-border-dark font-sans selection:bg-blueberry-light">
      <Header />
      <div id="hero-section-card" className="relative z-10">
        <Hero
          onOpenLoginModal={() => setShowLoginModal(true)}
          isWalletConnected={isLoggedIn && userMode === 'gamer'}
        />
        <BrandMarquee />
      </div>
      <div id="how-it-works-panel" className="relative z-20 bg-brand-bg border-t-3 border-border-dark min-h-[70vh]">
        <HowItWorks />
      </div>
      <div id="playground-panel" className="relative z-20 bg-brand-bg border-t-3 border-border-dark min-h-[70vh]">
        <SandboxPlayground />
      </div>
      <div id="marketplace-panel" className="relative z-20 bg-brand-bg border-t-3 border-border-dark min-h-[70vh]">
        <MarketplacePreview />
      </div>
      <div id="tech-bento-panel" className="relative z-20 bg-brand-bg border-t-3 border-border-dark min-h-[70vh]">
        <TechBento />
      </div>
      <div id="faq-panel" className="relative z-20 bg-brand-bg border-t-3 border-border-dark min-h-[70vh]">
        <FAQ />
      </div>
      <div id="footer-panel" className="relative z-20 bg-brand-bg border-t-3 border-border-dark">
        <Footer />
      </div>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
