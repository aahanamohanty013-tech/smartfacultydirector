const getApiUrl = () => {
    if (import.meta.env.PROD) {
        return '';
    }
    return 'http://localhost:5001';
};

export const API_URL = getApiUrl();
