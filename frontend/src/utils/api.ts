/**
 * Makes a fetch request to the API base URL with the given path and options
 * @param path The API endpoint path
 * @param options Optional request configuration
 * @return Promise that resolves to the JSON response
 */
export const api = (path: string, options?: RequestInit) =>
  fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, options)
      .then((res) => res.json());