"use client";

import { ClipLoader } from "react-spinners";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function LoadingSpinner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Show loading when navigation starts
        setIsLoading(true);

        // Hide loading after a short delay to ensure content is rendered
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [pathname, searchParams]); // This will trigger when the route changes

    // Don't render anything if not loading
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
            <ClipLoader
                color="#001F4D"
                loading={true}
                size={50}
                aria-label="Loading Spinner"
            />
        </div>
    );
}