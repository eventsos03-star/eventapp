interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;

    handler?: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    }) => void;

    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };

    theme?: {
        color?: string;
    };
}

interface RazorpayInstance {
    open: () => void;
    close: () => void;
}

interface Window {
    Razorpay: new (
        options: RazorpayOptions
    ) => RazorpayInstance;
}