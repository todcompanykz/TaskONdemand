import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging'

// Firebase configuration - should be provided via environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
let app: FirebaseApp | null = null
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  const apps = getApps()
  if (apps.length === 0) {
    app = initializeApp(firebaseConfig)
  } else {
    app = apps[0]
  }
}

// Get FCM messaging instance
let messaging: Messaging | null = null

export const getMessagingInstance = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') return null
  
  if (!firebaseConfig.apiKey) {
    console.warn('Firebase configuration is missing. Push notifications will not work.')
    return null
  }

  if (messaging) return messaging

  const supported = await isSupported()
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser.')
    return null
  }

  if (!app) {
    console.error('Firebase app is not initialized.')
    return null
  }

  try {
    messaging = getMessaging(app)
    return messaging
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error)
    return null
  }
}

// Get FCM token
export const getFCMToken = async (vapidKey?: string): Promise<string | null> => {
  try {
    const messagingInstance = await getMessagingInstance()
    if (!messagingInstance) return null

    const token = await getToken(messagingInstance, {
      vapidKey: vapidKey || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    })

    return token || null
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

// Handle foreground messages
export const onForegroundMessage = async (
  callback: (payload: any) => void
): Promise<(() => void) | null> => {
  try {
    const messagingInstance = await getMessagingInstance()
    if (!messagingInstance) return null

    return onMessage(messagingInstance, callback)
  } catch (error) {
    console.error('Error setting up foreground message handler:', error)
    return null
  }
}

export { app }
export default app
