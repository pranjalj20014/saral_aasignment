export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://127.0.0.1:1337';
  
  try {
    const response = await fetch(`${API_URL}/api${endpoint}`, mergedOptions);
    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};
