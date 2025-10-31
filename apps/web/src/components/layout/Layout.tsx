import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

// Lazy load ChatWidget for code splitting
const ChatWidget = lazy(() => import('../widgets/ChatWidget'));

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {/* Lazy-loaded ChatWidget */}
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  );
}
