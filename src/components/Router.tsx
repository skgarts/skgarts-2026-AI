import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import { initializeImageProtection } from '@/lib/image-protection';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import HomePage from '@/components/pages/HomePage';
import ServiceDetailPage from '@/components/pages/ServiceDetailPage';
import ProfilePage from '@/components/pages/ProfilePage';
import GalleryManagementPage from '@/components/pages/GalleryManagementPage';
import ClientGalleryViewPage from '@/components/pages/ClientGalleryViewPage';
import MediaPickerPage from '@/components/pages/MediaPickerPage';
import Layout from '@/components/Layout';
import { useEffect } from 'react';

// Root layout component that includes ScrollToTop
function RootLayout() {
  useEffect(() => {
    initializeImageProtection();
  }, []);

  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: <HomePage />,
            routeMetadata: {
              pageIdentifier: 'home',
            },
          },
          {
            path: "services/:slug",
            element: <ServiceDetailPage />,
            routeMetadata: {
              pageIdentifier: 'service-detail',
            },
          },
          {
            path: "profile",
            element: <ProfilePage />,
            routeMetadata: {
              pageIdentifier: 'profile',
            },
          },
          {
            path: "gallery-management",
            element: <GalleryManagementPage />,
            routeMetadata: {
              pageIdentifier: 'gallery-management',
            },
          },
          {
            path: "gallery/:clientId",
            element: <ClientGalleryViewPage />,
            routeMetadata: {
              pageIdentifier: 'client-gallery-view',
            },
          },
          {
            path: "media-picker",
            element: <MediaPickerPage />,
            routeMetadata: {
              pageIdentifier: 'media-picker',
            },
          },
        ],
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return (
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}
