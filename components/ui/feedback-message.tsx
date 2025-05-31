import { useEffect, useState } from "react";

interface FeedbackMessageProps {
    type: 'success' | 'error' | 'info' | 'warn';
    message: string;
    timeout?: number; // in milliseconds, optional
}

const FeedbackMessage = ({ type, message, timeout = 3000 }: FeedbackMessageProps) => {
    const [showFeedback, setShowFeedback] = useState(true);

    useEffect(() => {
        if (!showFeedback) return;
        const timer = setTimeout(() => setShowFeedback(false), timeout);
        return () => clearTimeout(timer);
    }, [showFeedback, timeout]);

    const setTextColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'text-green-500';
            case 'error':
                return 'text-red-500';
            case 'info':
                return 'text-blue-500';
            case 'warn':
                return 'text-yellow-500';
            default:
                return '';
        }
    };

    if (!showFeedback) return null;

    return (
        <p className={`${setTextColor(type)} text-sm mb-4`}>{message}</p>
    );
};

export default FeedbackMessage;