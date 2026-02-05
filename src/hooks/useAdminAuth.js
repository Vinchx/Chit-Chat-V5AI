// Custom hook for admin authentication
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { hasValidAdminToken } from '@/lib/admin-session';

export function useAdminAuth() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isAdminAuthed, setIsAdminAuthed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifyAdmin = async () => {
            // Still loading session
            if (status === 'loading') {
                return;
            }

            // Check 1: User must be logged in
            if (!session) {
                router.push('/auth');
                setIsLoading(false);
                return;
            }

            // Check 2: User must be admin (via API - server-side check)
            try {
                const response = await fetch('/api/admin/check');
                const data = await response.json();

                if (!data.isAdmin) {
                    console.log('User is not admin, redirecting to dashboard');
                    router.push('/dashboard');
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Failed to check admin status:', error);
                router.push('/dashboard');
                setIsLoading(false);
                return;
            }

            // Check 3: Must have valid admin token
            if (!hasValidAdminToken()) {
                console.log('No valid admin token, redirecting to admin auth');
                router.push('/vinchx/auth');
                setIsLoading(false);
                return;
            }

            // All checks passed
            setIsAdminAuthed(true);
            setIsLoading(false);
        };

        verifyAdmin();
    }, [session, status, router]); // Only depend on session, status, and router

    return { isAdminAuthed, isLoading, session };
}
