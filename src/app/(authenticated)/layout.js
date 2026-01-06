// src/app/(authenticated)/layout.js
import Navbar from '@/components/Navbar';

export default function AuthenticatedLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  );
}