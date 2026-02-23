import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Tracks navigation — no external logging needed
export default function NavigationTracker() {
    const location = useLocation();

    useEffect(() => {
        // Update document title on navigation (optional UX improvement)
        const pageName = location.pathname.replace(/^\//, '') || 'Home';
        document.title = pageName ? `AuraCycle · ${pageName}` : 'AuraCycle';
    }, [location]);

    return null;
}
