import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const MESSAGES = [
  'Which 4 albums would describe today?',
  "What's in your rotation today?",
  'How niche were you today?',
  "Gatekeep today's niche treasures",
];
const DAYS_AHEAD = 14;

// One-shot reminders for the next 14 days at 19:00, skipping today when it is already done.
// Cancel-then-reschedule makes this safe to call on every launch and resume.
// ask: show the permission prompt; without it, do nothing unless permission was already granted.
// ponytail: reminders stop after 14 days without opening the app; every launch tops them up.
export async function scheduleReminders({ ask, skipToday }: { ask: boolean; skipToday: boolean }) {
  const { granted } = ask ? await Notifications.requestPermissionsAsync() : await Notifications.getPermissionsAsync();
  if (!granted) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminder', {
      name: 'Daily reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = new Date();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 19, 0);
    if (date <= now || (i === 0 && skipToday)) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Gatekeep', body: MESSAGES[date.getDay() % MESSAGES.length] },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: 'reminder' },
    });
  }
}
