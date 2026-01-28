const webpush = require('web-push')

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Check VAPID keys are configured
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('VAPID keys not configured')
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Push notifications not configured' })
    }
  }

  // Configure web-push
  webpush.setVapidDetails(
    'mailto:family-news@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )

  try {
    const { title, body, url, excludeUserId } = JSON.parse(event.body)

    // Fetch all subscriptions from Supabase (except the user who triggered)
    const subscriptionsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?user_id=neq.${excludeUserId}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    )

    if (!subscriptionsResponse.ok) {
      throw new Error('Failed to fetch subscriptions')
    }

    const subscriptions = await subscriptionsResponse.json()

    if (subscriptions.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No subscriptions to notify', sent: 0 })
      }
    }

    // Send notification to each subscription
    const notificationPayload = JSON.stringify({
      title: title || 'Family News',
      body: body || 'New article shared!',
      url: url || '/'
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }

        try {
          await webpush.sendNotification(pushSubscription, notificationPayload)
          return { success: true, endpoint: sub.endpoint }
        } catch (error) {
          // If subscription is expired/invalid, we could delete it
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('Subscription expired, should be removed:', sub.endpoint)
            // Optionally delete expired subscription
            await fetch(
              `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
              {
                method: 'DELETE',
                headers: {
                  'apikey': SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
              }
            )
          }
          return { success: false, endpoint: sub.endpoint, error: error.message }
        }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Notifications sent',
        sent: successful,
        failed: failed
      })
    }
  } catch (error) {
    console.error('Error sending notifications:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
