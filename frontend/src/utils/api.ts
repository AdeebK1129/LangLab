export const api = (path: string, options?: RequestInit) =>
    fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, options)
      .then(res => res.json());

  