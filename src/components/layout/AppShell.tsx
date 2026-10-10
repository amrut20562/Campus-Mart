// CampusMart — AppShell (shared layout with navbar)

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Agentation } from 'agentation';
import Navbar from './Navbar';
import Phase2Modal from './Phase2Modal';
import { ToastProvider } from '@/components/feedback/ToastContext';

const CURRENT_YEAR = new Date().getFullYear();

export default function AppShell() {
  const [showPhase2Modal, setShowPhase2Modal] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-canvas">
        {/* Electric Cobalt announcement bar (DESIGN.md — the single chromatic element) */}
        <div
          style={{ backgroundColor: 'var(--color-electric-cobalt)' }}
          className="w-full min-h-12 py-2.5 sm:py-3 flex items-center justify-center shrink-0 shadow-xs"
          role="banner"
        >
          <p className="text-caption text-white font-medium tracking-tight text-center px-4">
            CampusMart — Your Campus Marketplace · Phase 1 Prototype
          </p>
        </div>

        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="mt-12 border-t border-hairline-gray bg-card py-6 shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-caption text-ash-gray">
              © {CURRENT_YEAR} CampusMart AI — Phase 1 Prototype
            </p>
            <button
              type="button"
              onClick={() => setShowPhase2Modal(true)}
              className="text-caption text-gallery-black px-4 py-1.5 border border-hairline-gray rounded-full hover:bg-soft-lift hover:border-gallery-black/30 transition-all flex items-center gap-1.5 cursor-pointer"
              aria-label="View upcoming AI features in Phase 2"
            >
              <Sparkles size={13} className="text-electric-cobalt" aria-hidden />
              <span>AI features — Phase 2</span>
            </button>
          </div>
        </footer>

        {/* Phase 2 upcoming features popup */}
        <Phase2Modal
          isOpen={showPhase2Modal}
          onClose={() => setShowPhase2Modal(false)}
        />

        {/* Visual feedback tool available across all routes */}
        <Agentation />
      </div>
    </ToastProvider>
  );
}
