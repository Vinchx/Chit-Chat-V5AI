// Custom hook for admin authentication
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/admin-config';
import { hasValidAdminToken } from '@/lib/admin-session';

export function useAdminAuth() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isAdminAuthed, setIsAdminAuthed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'loading') return;

        // Check 1: User must be logged in
        if (!session) {
            router.push('/auth');
            return;
        }

        // Check 2: User must be admin
        if (!isAdmin(session.user.email)) {
            router.push('/dashboard');
            return;
        }

        // Check 3: Must have valid admin token
        if (!hasValidAdminToken()) {
            router.push('/vinchx/auth');
            return;
        }

        // All checks passed
        setIsAdminAuthed(true);
        setIsLoading(false);
    }, [session, status, router]);

    return { isAdminAuthed, isLoading, session };
}
