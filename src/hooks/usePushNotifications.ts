/**
 * Registers Expo push tokens and surfaces local notifications for unread
 * reply / application inbox items while the app is running.
 */
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useStudentAuth } from '../context/StudentAuthContext';
import { fetchReplyNotifications } from '../services/replyNotifications';
import { getJobAlertPrefs } from '../lib/jobAlerts';
import {
  downloadStudentJson,
  getAuthUserId,
  isMissingRelation,
  uploadStudentJson,
} from '../lib/studentCloudJson';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const SEEN_KEY = 'vizagJobs_seen_notif_ids_v1';
const TOKEN_FILE = 'push-token.json';
const POLL_MS = 60_000;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

const readSeenIds = async (): Promise<Set<string>> => {
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
};

const writeSeenIds = async (ids: Set<string>): Promise<void> => {
  const trimmed = Array.from(ids).slice(-200);
  await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
};

const upsertPushTokenTable = async (
  userId: string,
  token: string,
  platform: string,
): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase.from('device_push_tokens').upsert(
    {
      user_id: userId,
      token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,token' },
  );
  if (error) {
    if (isMissingRelation(error.message)) return false;
    return false;
  }
  return true;
};

async function registerForPushAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId =
    Constants.easConfig?.projectId ||
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
      ?.projectId;

  try {
    const result = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return result.data || null;
  } catch {
    // Native builds without EAS project id still get local notifications.
    return null;
  }
}

async function persistPushToken(token: string): Promise<void> {
  const userId = await getAuthUserId();
  if (!userId) return;
  const platform = Platform.OS;
  const tableOk = await upsertPushTokenTable(userId, token, platform);
  if (!tableOk) {
    await uploadStudentJson(userId, TOKEN_FILE, {
      token,
      platform,
      updatedAt: new Date().toISOString(),
    });
  } else {
    // Keep a storage copy for ops tooling that reads the file.
    void downloadStudentJson(userId, TOKEN_FILE);
  }
}

async function pollAndNotify(userId: string): Promise<void> {
  const prefs = await getJobAlertPrefs();
  if (!prefs.pushEnabled) return;

  const rows = await fetchReplyNotifications(userId);
  const unread = rows.filter((row) => !row.isRead);
  if (unread.length === 0) return;

  const seen = await readSeenIds();
  const fresh = unread.filter((row) => !seen.has(row.id));
  if (fresh.length === 0) return;

  for (const item of fresh.slice(0, 5)) {
    seen.add(item.id);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: item.title || 'Vizag Jobs',
        body: item.preview || 'You have an update on Vizag Jobs.',
        data: { kind: item.kind, linkPath: item.linkPath, notificationId: item.id },
      },
      trigger: null,
    });
  }
  await writeSeenIds(seen);
}

export function usePushNotifications(): void {
  const { session, isStudent } = useStudentAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      if (Platform.OS === 'web') return;
      if (!isSupabaseConfigured) return;

      const token = await registerForPushAsync();
      if (!cancelled && token && session?.user?.id) {
        await persistPushToken(token);
      }

      if (!session?.user?.id || !isStudent) return;

      const run = async () => {
        try {
          await pollAndNotify(session.user.id);
        } catch {
          // ignore poll errors
        }
      };

      await run();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        void run();
      }, POLL_MS);
    };

    void boot();

    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && session?.user?.id && isStudent) {
        void pollAndNotify(session.user.id).catch(() => undefined);
      }
    });

    return () => {
      cancelled = true;
      appSub.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session?.user?.id, isStudent]);
}
