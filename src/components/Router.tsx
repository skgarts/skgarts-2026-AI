import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import HomePage from '@/components/pages/HomePage';
import ServiceDetailPage from '@/components/pages/ServiceDetailPage';
import ProfilePage from '@/components/pages/ProfilePage';
import ClientAlbumsPage from '@/components/pages/ClientAlbumsPage';
import AlbumDetailPage from '@/components/pages/AlbumDetailPage';

// Layout component that includes ScrollToTop
function Layout() {
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
    element: <Layout />,
    errorElement: <ErrorPage />,
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
        path: "albums",
        element: <ClientAlbumsPage />,
        routeMetadata: {
          pageIdentifier: 'client-albums',
        },
      },
      {
        path: "album/:id",
        element: <AlbumDetailPage />,
        routeMetadata: {
          pageIdentifier: 'album-detail',
        },
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
