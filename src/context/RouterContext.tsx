import { createContext, useContext, useState, ReactNode } from 'react';
import { Page } from '../types';

interface RouterContextType {
  page: Page;
  navigate: (page: Page) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>({ name: 'landing' });

  const navigate = (newPage: Page) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <RouterContext.Provider value={{ page, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
