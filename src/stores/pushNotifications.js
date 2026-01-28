import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Subscription state
const isSubscribed = ref(false)
const permissionState = ref('default') // 'default', 'granted', 'denied'

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Check if push notifications are supported
 */
function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Request notification permission from user
 */
async function requestPermission() {
  if (!isPushSupported()) {
    console.log('Push notifications not supported')
    return false
  }

  const permission = await Notification.requestPermission()
  permissionState.value = permission
  return permission === 'granted'
}

/**
 * Subscribe to push notifications and save to Supabase
 */
async function subscribeToPush(userId) {
  if (!isPushSupported()) {
    console.log('Push notifications not supported')
    return { success: false, error: 'Not supported' }
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID public key not configured')
    return { success: false, error: 'VAPID key missing' }
  }

  try {
    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
    }

    // Extract subscription details
    const subscriptionJson = subscription.toJSON()
    const { endpoint } = subscriptionJson
    const p256dh = subscriptionJson.keys.p256dh
    const auth = subscriptionJson.keys.auth

    // Save to Supabase (upsert to handle re-subscriptions)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint,
        p256dh,
        auth
      }, {
        onConflict: 'user_id,endpoint'
      })

    if (error) {
      console.error('Error saving subscription:', error)
      return { success: false, error: error.message }
    }

    isSubscribed.value = true
    return { success: true }
  } catch (error) {
    console.error('Error subscribing to push:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Unsubscribe from push notifications
 */
async function unsubscribeFromPush(userId) {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      // Remove from Supabase
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint)

      // Unsubscribe from browser
      await subscription.unsubscribe()
    }

    isSubscribed.value = false
    return { success: true }
  } catch (error) {
    console.error('Error unsubscribing:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check current subscription status
 */
async function checkSubscriptionStatus() {
  if (!isPushSupported()) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    isSubscribed.value = !!subscription
    permissionState.value = Notification.permission
    return !!subscription
  } catch (error) {
    console.error('Error checking subscription:', error)
    return false
  }
}

export function usePushNotifications() {
  return {
    isSubscribed,
    permissionState,
    isPushSupported,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    checkSubscriptionStatus
  }
}
