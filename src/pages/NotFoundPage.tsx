// CampusMart — 404 Not Found Page

import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-heading-sm font-medium tracking-tight mb-3">404</p>
      <h1 className="text-subheading font-medium tracking-tight mb-2">Page not found</h1>
      <p className="text-caption text-ash-gray mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary">Go home</Link>
    </div>
  );
}
