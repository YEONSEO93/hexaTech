interface FeedbackMessageProps {
    type: 'success' | 'error' | 'info' | 'warn';
    message: string;
}

const FeedbackMessage = ({ type, message }: FeedbackMessageProps) => {
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
    }

    return (
        <p className={`${setTextColor(type)} text-sm mb-4`}>{message}</p>
    );
}

export default FeedbackMessage;