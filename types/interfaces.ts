export interface ApiError extends Error {
    statusCode?: number;
}

export interface Error {
    name: string;
    message: string;
    stack?: string;
}

export interface QstashProps {
    payload: any;
    DESTINATION_URL: string;
}
