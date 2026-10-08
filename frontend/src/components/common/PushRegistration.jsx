import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useNavigate } from 'react-router-dom';
import { registerPushDevice } from '../../api/newsApi';

export default function PushRegistration() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return undefined;
    }

    let active = true;
    let listeners = [];

    async function registerDevice() {
      const platform = Capacitor.getPlatform();
      if (platform !== 'android' && platform !== 'ios') return;

      const registrationListener = await PushNotifications.addListener('registration', async ({ value }) => {
        if (!active) return;
        try {
          await registerPushDevice(value, platform);
        } catch (error) {
          console.error('Failed to register push token with API', error);
        }
      });
      const errorListener = await PushNotifications.addListener('registrationError', (error) => {
        console.error('Firebase push registration failed', error);
      });
      const actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const notificationPath = action.notification.data?.url;
        navigate(typeof notificationPath === 'string' && /^\/news(?:\/[a-z0-9-]+)?$/i.test(notificationPath)
          ? notificationPath
          : '/news');
      });
      listeners = [registrationListener, errorListener, actionListener];

      let permission = await PushNotifications.checkPermissions();
      if (permission.receive === 'prompt') {
        permission = await PushNotifications.requestPermissions();
      }
      if (permission.receive !== 'granted') {
        console.info('Push notifications were not enabled by the user.');
        return;
      }

      await PushNotifications.register();
    }

    registerDevice().catch((error) => {
      console.error('Could not initialize Firebase push notifications', error);
    });

    return () => {
      active = false;
      listeners.forEach((listener) => listener.remove());
    };
  }, [navigate]);

  return null;
}
