import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        // For simplified authentication, just redirect to welcome page
        // Users will navigate manually after login/signup
        router.replace('/welcome');
    }, []);

    return null;
}
