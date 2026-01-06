// src/app/main-layout.jsx
import Navbar from '@/components/Navbar';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  );
}