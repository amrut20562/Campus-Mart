// CampusMart — React Router routes

import { createBrowserRouter } from 'react-router-dom';
import { RequireAuth, RequireAdmin, RedirectIfAuth } from '@/features/auth/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import SellPage from '@/pages/SellPage';
import EditListingPage from '@/pages/EditListingPage';
import MyListingsPage from '@/pages/MyListingsPage';
import SavedPage from '@/pages/SavedPage';
import RequestsPage from '@/pages/RequestsPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminPage from '@/pages/AdminPage';
import NotFoundPage from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'login',
        element: (
          <RedirectIfAuth>
            <LoginPage />
          </RedirectIfAuth>
        ),
      },
      {
        path: 'register',
        element: (
          <RedirectIfAuth>
            <RegisterPage />
          </RedirectIfAuth>
        ),
      },
      { path: 'products/:id', element: <ProductDetailPage /> },
      {
        path: 'sell',
        element: (
          <RequireAuth>
            <SellPage />
          </RequireAuth>
        ),
      },
      {
        path: 'products/:id/edit',
        element: (
          <RequireAuth>
            <EditListingPage />
          </RequireAuth>
        ),
      },
      {
        path: 'my-listings',
        element: (
          <RequireAuth>
            <MyListingsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'saved',
        element: (
          <RequireAuth>
            <SavedPage />
          </RequireAuth>
        ),
      },
      {
        path: 'requests',
        element: (
          <RequireAuth>
            <RequestsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin',
        element: (
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
