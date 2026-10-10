// CampusMart — Phase 2 Features Modal
// Displays upcoming AI capabilities and roadmap planned for Phase 2

import { useEffect } from 'react';
import { X, Sparkles, TrendingUp, Camera, Compass, ShieldCheck, MessageSquare, Cpu } from 'lucide-react';

interface Phase2ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UPCOMING_FEATURES = [
  {
    icon: Cpu,
    title: 'AI Multi-Agent Orchestrator',
    description: 'FastAPI microservice coordinating autonomous worker agents for pricing, listing generation, and moderation.',
  },
  {
    icon: TrendingUp,
    title: 'Fair Price Intelligence',
    description: 'Predictive pricing model suggesting optimal selling prices based on item condition and historical campus transactions.',
  },
  {
    icon: Camera,
    title: 'Smart Listing Generator',
    description: 'Computer vision that analyzes uploaded photos to auto-populate title, category, specifications, and condition.',
  },
  {
    icon: Compass,
    title: 'Personalized Recommendation Engine',
    description: 'Context-aware feed prioritizing items relevant to your college, department, graduation year, and course needs.',
  },
  {
    icon: ShieldCheck,
    title: 'Automated Fraud & Trust Scoring',
    description: 'Continuous anomaly detection flagging duplicate listings, suspicious price deviations, and prohibited items.',
  },
  {
    icon: MessageSquare,
    title: 'Secure Real-Time Campus Chat',
    description: 'End-to-end buyer-seller communication with automated deal negotiation assistance and meet-up suggestions.',
  },
];

export default function Phase2Modal({ isOpen, onClose }: Phase2ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phase2-modal-title"
      onClick={onClose}
    >
      <div
        className="dialog-content max-w-xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-hairline-gray">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-soft-lift border border-hairline-gray text-xs font-medium text-electric-cobalt mb-2">
              <Sparkles size={12} aria-hidden />
              <span>Phase 2 Roadmap</span>
            </div>
            <h2 id="phase2-modal-title" className="text-subheading font-medium tracking-tight">
              Upcoming AI Features
            </h2>
            <p className="text-caption text-ash-gray mt-1">
              Phase 1 provides the verified marketplace foundation. The following intelligence capabilities are coming in Phase 2:
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-1.5 shrink-0 ml-3"
            aria-label="Close modal"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        {/* Feature list */}
        <div className="overflow-y-auto py-4 flex flex-col gap-3.5 pr-1">
          {UPCOMING_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-3.5 bg-soft-lift rounded flex gap-3.5 items-start border border-hairline-gray"
                style={{ borderRadius: '2px' }}
              >
                <div className="w-8 h-8 rounded-full bg-card border border-hairline-gray flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={15} className="text-gallery-black" aria-hidden />
                </div>
                <div>
                  <h3 className="text-body-sm font-medium tracking-tight leading-snug">
                    {feat.title}
                  </h3>
                  <p className="text-caption text-ash-gray mt-0.5 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-hairline-gray flex items-center justify-between gap-3 mt-auto">
          <p className="text-xs text-ash-gray">
            Architecture: FastAPI Orchestrator + Supabase
          </p>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary py-2 px-6 text-caption"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
