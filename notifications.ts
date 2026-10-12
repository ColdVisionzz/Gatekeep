import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const MESSAGES = [
  'Which 4 albums would describe today?',
  "What's in your rotation today?",
  'How niche were you today?',
  "Gatekeep today's niche treasures",
];

// One repeating trigger can't rotate its text, so each weekday gets its own weekly trigger.
// Cancel-then-reschedule makes this safe to call on every launch.
// ponytail: still fires on days already done; skip it by rescheduling after each share if that annoys users
export async function scheduleReminders() {
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminder', {
      name: 'Daily reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (let weekday = 1; weekday <= 7; weekday++) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Gatekeep', body: MESSAGES[weekday % MESSAGES.length] },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday, // 1 = Sunday
        hour: 19,
        minute: 0,
        channelId: 'reminder',
      },
    });
  }
}
