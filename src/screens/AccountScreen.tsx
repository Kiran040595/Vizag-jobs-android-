import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useStudentAuth } from '../context/StudentAuthContext';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import {
  fetchReplyNotifications,
  formatReplyNotificationTime,
  markReplyNotificationRead,
  replyNotificationKindLabel,
  type ReplyNotification,
} from '../services/replyNotifications';
import { colors, radius, spacing } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Account'>,
  NativeStackScreenProps<RootStackParamList>
>;

const LEGAL_LINKS = [
  { label: 'About Vizag Jobs', url: 'https://jobsinvizag.in/about' },
  { label: 'Privacy policy', url: 'https://jobsinvizag.in/privacy-policy' },
  { label: 'Terms of service', url: 'https://jobsinvizag.in/terms-of-service' },
  { label: 'Disclaimer', url: 'https://jobsinvizag.in/disclaimer' },
  { label: 'Employer portal', url: 'https://jobsinvizag.in/employer/login' },
];

export default function AccountScreen({ navigation }: Props) {
  const {
    isLoading,
    isStudent,
    isSupabaseConfigured,
    mappedProfile,
    profileComplete,
    session,
    signOut,
  } = useStudentAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<ReplyNotification[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setError('');
      if (session?.user?.id && isStudent) {
        void fetchReplyNotifications(session.user.id)
          .then((rows) => {
            if (active) setNotifications(rows);
          })
          .catch(() => {
            if (active) setNotifications([]);
          });
      } else if (active) {
        queueMicrotask(() => {
          if (active) setNotifications([]);
        });
      }
      return () => {
        active = false;
      };
    }, [session, isStudent]),
  );

  const onSignOut = async () => {
    setSigningOut(true);
    setError('');
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out.');
    } finally {
      setSigningOut(false);
    }
  };

  const onOpenNotification = async (item: ReplyNotification) => {
    if (session?.user?.id && !item.isRead) {
      try {
        await markReplyNotificationRead({
          notificationId: item.id,
          userId: session.user.id,
        });
        setNotifications((prev) =>
          prev.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)),
        );
      } catch {
        // ignore mark-read failures
      }
    }
    if (item.kind === 'application_status') {
      navigation.navigate('StudentApplications');
      return;
    }
    if (item.linkPath) {
      const url = item.linkPath.startsWith('http')
        ? item.linkPath
        : `https://jobsinvizag.in${item.linkPath}`;
      void Linking.openURL(url);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!session || !isStudent) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your account</Text>
        <Text style={styles.subtitle}>
          Sign in as a student to apply on Vizag Jobs, track applications, and manage your profile.
        </Text>
        {!isSupabaseConfigured ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Live auth needs Supabase credentials. Browsing jobs still works with sample data.
            </Text>
          </View>
        ) : null}
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('StudentLogin')}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>Student sign in</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('StudentRegister')}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>Create student account</Text>
        </Pressable>

        <Pressable
          style={[styles.menuBtn, { marginTop: spacing.xl }]}
          onPress={() => navigation.navigate('Feedback')}
        >
          <Text style={styles.menuTitle}>Send feedback</Text>
          <Text style={styles.menuBody}>Report a problem or suggest an improvement</Text>
        </Pressable>

        {LEGAL_LINKS.map((item) => (
          <Pressable
            key={item.url}
            style={styles.linkRow}
            onPress={() => Linking.openURL(item.url)}
          >
            <Text style={styles.linkText}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{mappedProfile?.fullName || 'Student account'}</Text>
      <Text style={styles.subtitle}>
        {mappedProfile?.contactEmail || session.user.email}
        {mappedProfile?.phone ? ` · ${mappedProfile.phone}` : ''}
      </Text>

      <View style={[styles.statusCard, profileComplete ? styles.statusOk : styles.statusWarn]}>
        <Text style={styles.statusTitle}>
          {profileComplete ? 'Profile complete' : 'Profile incomplete'}
        </Text>
        <Text style={styles.statusBody}>
          {profileComplete
            ? 'You can apply to jobs posted directly on Vizag Jobs.'
            : 'Finish your profile before applying on-platform.'}
        </Text>
      </View>

      <Pressable
        style={styles.menuBtn}
        onPress={() => navigation.navigate('StudentProfile')}
        accessibilityRole="button"
      >
        <Text style={styles.menuTitle}>Edit profile</Text>
        <Text style={styles.menuBody}>Education, skills, resume, and career preferences</Text>
      </Pressable>

      <Pressable
        style={styles.menuBtn}
        onPress={() => navigation.navigate('StudentApplications')}
        accessibilityRole="button"
      >
        <Text style={styles.menuTitle}>Applied jobs</Text>
        <Text style={styles.menuBody}>Track application status from employers</Text>
      </Pressable>

      <Pressable
        style={styles.menuBtn}
        onPress={() => navigation.navigate('Feedback')}
        accessibilityRole="button"
      >
        <Text style={styles.menuTitle}>Send feedback</Text>
        <Text style={styles.menuBody}>Report a problem or suggest an improvement</Text>
      </Pressable>

      <View style={styles.notifHeader}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {unreadCount ? <Text style={styles.badge}>{unreadCount} new</Text> : null}
      </View>
      {notifications.length === 0 ? (
        <Text style={styles.emptyNotif}>No notifications yet.</Text>
      ) : (
        notifications.slice(0, 8).map((item) => (
          <Pressable
            key={item.id}
            style={[styles.notifCard, !item.isRead && styles.notifUnread]}
            onPress={() => onOpenNotification(item)}
          >
            <Text style={styles.notifKind}>{replyNotificationKindLabel(item.kind)}</Text>
            <Text style={styles.notifTitle}>{item.title}</Text>
            {item.preview ? <Text style={styles.notifPreview}>{item.preview}</Text> : null}
            <Text style={styles.notifTime}>{formatReplyNotificationTime(item.createdAt)}</Text>
          </Pressable>
        ))
      )}

      {LEGAL_LINKS.map((item) => (
        <Pressable key={item.url} style={styles.linkRow} onPress={() => Linking.openURL(item.url)}>
          <Text style={styles.linkText}>{item.label}</Text>
        </Pressable>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.signOutBtn, signingOut && styles.disabled]}
        onPress={onSignOut}
        disabled={signingOut}
        accessibilityRole="button"
      >
        {signingOut ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.signOutText}>Sign out</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    color: colors.textMuted,
    lineHeight: 20,
  },
  banner: {
    backgroundColor: '#fef9c3',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerText: { color: '#854d0e', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  secondaryBtn: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  secondaryText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  statusCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusOk: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  statusWarn: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  statusTitle: { fontWeight: '800', color: colors.text, fontSize: 15 },
  statusBody: { marginTop: spacing.xs, color: colors.textMuted, lineHeight: 20 },
  menuBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  menuTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  menuBody: { marginTop: spacing.xs, color: colors.textMuted },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  badge: {
    backgroundColor: colors.primary,
    color: colors.white,
    overflow: 'hidden',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyNotif: { color: colors.textMuted, marginBottom: spacing.lg },
  notifCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  notifUnread: { borderColor: colors.blueSoftBorder, backgroundColor: colors.blueSoft },
  notifKind: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSubtle,
    textTransform: 'uppercase',
  },
  notifTitle: { marginTop: 4, fontWeight: '800', color: colors.text },
  notifPreview: { marginTop: 4, color: colors.textMuted },
  notifTime: { marginTop: 6, fontSize: 11, color: colors.textSubtle },
  linkRow: { paddingVertical: spacing.sm },
  linkText: { color: colors.primary, fontWeight: '700' },
  error: { color: '#be123c', fontWeight: '600', marginBottom: spacing.md },
  signOutBtn: {
    marginTop: spacing.lg,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  disabled: { opacity: 0.7 },
  signOutText: { color: colors.primary, fontWeight: '800' },
});
