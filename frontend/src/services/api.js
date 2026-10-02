import axios from 'axios'

const TOKEN_KEY = 'access_token'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error.response) {
    return 'Unable to reach the server. Check your connection and try again.'
  }

  const detail = error.response.data?.detail
  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => item.msg || JSON.stringify(item))
      .join(' ')
  }

  return fallback
}

export async function getHealth() {
  const { data } = await api.get('/api/health')
  return data
}

export async function registerUser(payload) {
  const { data } = await api.post('/api/auth/register', payload)
  return data
}

export async function loginUser(payload) {
  const { data } = await api.post('/api/auth/login', payload)
  return data
}

export async function getCurrentUser() {
  const { data } = await api.get('/api/auth/me')
  return data
}

export async function createInterview(payload) {
  const { data } = await api.post('/api/interviews', payload)
  return data
}

export async function getInterview(id) {
  const { data } = await api.get(`/api/interviews/${id}`)
  return data
}

export async function submitInterviewAnswer(id, answerText) {
  const { data } = await api.post(`/api/interviews/${id}/answer`, { answer_text: answerText })
  return data
}

export async function getInterviewHistory() {
  const { data } = await api.get('/api/interviews')
  return data
}

export default api
