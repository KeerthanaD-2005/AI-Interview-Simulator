import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

export async function getHealth() {
  const { data } = await api.get('/api/health')
  return data
}

export default api
