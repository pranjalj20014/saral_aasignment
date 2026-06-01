export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };
  
  try {
    const response = await fetch(`/api${endpoint}`, mergedOptions);
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Unexpected non-JSON response: ${text.substring(0, 50)}`);
    }

    return { response, data };
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};
