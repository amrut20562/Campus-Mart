// CampusMart — ProductCard unit tests (PROD-01)
// Implements automated test priority: "Product card renders badge and fallback image"

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from '@/pages/HomePage';
import type { ProductWithDetails } from '@/types/database.types';

// Mock AuthContext
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

// Mock FavouriteButton
vi.mock('@/features/favourites/FavouriteButton', () => ({
  default: () => <button data-testid="fav-btn">Fav</button>,
}));

const mockProduct: ProductWithDetails = {
  id: 'prod-123',
  seller_id: 'user-456',
  category_id: 1,
  title: 'Python Programming Textbook',
  description: 'Clean textbook in great condition.',
  condition: 'like_new',
  price: 450,
  transaction_mode: 'sell',
  status: 'available',
  is_hidden: false,
  image_path: '/images/python-textbook.png',
  location_text: 'Campus Library',
  age_months: 3,
  created_at: '2026-03-01T12:00:00Z',
  updated_at: '2026-03-01T12:00:00Z',
  categories: {
    id: 1,
    name: 'Textbooks',
    slug: 'textbooks',
    icon_key: 'book',
  },
  profiles: {
    id: 'user-456',
    full_name: 'Rahul Sharma',
    college: 'IIT Delhi',
    department: 'Computer Science',
  },
};

describe('ProductCard Component', () => {
  it('renders product details correctly', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    expect(screen.getByText('Python Programming Textbook')).toBeInTheDocument();
    expect(screen.getByText(/450/)).toBeInTheDocument();
    expect(screen.getByText(/Textbooks/)).toBeInTheDocument();
    expect(screen.getByText(/Like New/i)).toBeInTheDocument();
    expect(screen.getByText('IIT Delhi')).toBeInTheDocument();
  });

  it('renders status badge for available, reserved, and sold items', () => {
    const { rerender } = render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );
    expect(screen.getByText('Available')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ProductCard product={{ ...mockProduct, status: 'reserved' }} />
      </MemoryRouter>
    );
    expect(screen.getByText('Reserved')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ProductCard product={{ ...mockProduct, status: 'sold' }} />
      </MemoryRouter>
    );
    expect(screen.getByText('Sold')).toBeInTheDocument();
  });

  it('falls back to /placeholder-product.svg when image errors', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    const img = screen.getByRole('img', { name: mockProduct.title }) as HTMLImageElement;
    expect(img.src).toContain('/images/python-textbook.png');

    // Trigger onError
    fireEvent.error(img);
    expect(img.src).toContain('/placeholder-product.svg');
  });
});
