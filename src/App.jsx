import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('...Loading...')

  async function fetchData() {
    const result = await fetch('http://localhost:3000/api/hello')
    const data = await result.json()
    setMessage(data.message)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>Message: {message}</div>
  )
}

export default App
