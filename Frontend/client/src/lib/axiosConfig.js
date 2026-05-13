import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true // Enable sending cookies with cross-origin requests
});

api.interceptors.request.use(config => {
  return config;
}, error => Promise.reject(error));

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const fetchAxios = async (url, options = {}) => {
  try {
    const response = await api({
      url,
      method: options.method || 'GET',
      data: options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined,
      headers: options.headers,
    });
    return {
      ok: true,
      json: async () => response.data,
      text: async () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      ok: false,
      status: error.response?.status || 500,
      json: async () => error.response?.data || { message: error.message },
      text: async () => error.response?.data ? (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data)) : error.message
    };
  }
};

export default api;
