import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // Fetch user profile on mount if token exists
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await axios.get('http://localhost:8000/api/utilisateurs/profile/', {
          withCredentials: true,
          headers: {
            Authorization: `Token ${token}`
          }
        })
        setUser(response.data)
      } catch (error) {
        console.error('Error fetching profile:', error)
        // Token might be invalid, clear it
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [token])

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('token', authToken)
  }

  const logout = async () => {
    try {
      await axios.post('http://localhost:8000/api/utilisateurs/logout/', {}, {
        withCredentials: true,
        headers: {
          Authorization: `Token ${token}`
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    }
  }

  const updateUser = (userData) => {
    setUser(userData)
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

