import axios from 'axios'

const api = axios.create({
  baseURL: 'https://arca-backend-208y.onrender.com',
})

export default api
