import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase/config'

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const connectedRef = ref(db, '.info/connected')
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      setIsOnline(!!snapshot.val())
    })

    return () => unsubscribe()
  }, [])

  return isOnline
}
