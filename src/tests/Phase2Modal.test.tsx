// CampusMart — Tests for Phase 2 upcoming features modal

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Phase2Modal from '@/components/layout/Phase2Modal';

describe('Phase2Modal', () => {
  it('does not render when isOpen is false', () => {
    render(<Phase2Modal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal with Phase 2 upcoming features when isOpen is true', () => {
    render(<Phase2Modal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Upcoming AI Features')).toBeInTheDocument();
    expect(screen.getByText('AI Multi-Agent Orchestrator')).toBeInTheDocument();
    expect(screen.getByText('Fair Price Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Smart Listing Generator')).toBeInTheDocument();
    expect(screen.getByText('Personalized Recommendation Engine')).toBeInTheDocument();
    expect(screen.getByText('Automated Fraud & Trust Scoring')).toBeInTheDocument();
    expect(screen.getByText('Secure Real-Time Campus Chat')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<Phase2Modal isOpen={true} onClose={handleClose} />);
    const closeBtn = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when bottom Close button is clicked', () => {
    const handleClose = vi.fn();
    render(<Phase2Modal isOpen={true} onClose={handleClose} />);
    const bottomCloseBtn = screen.getByRole('button', { name: /^close$/i });
    fireEvent.click(bottomCloseBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
