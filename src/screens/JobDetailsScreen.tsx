import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme';
import type { Job } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { formatRelativePostedAt } from '../lib/freshness';
import { isJobSaved, toggleSavedJob } from '../lib/savedJobs';
import { applyButtonLabel, isInternalApplyJob, jobSupportsApply } from '../lib/jobApplyMode';
import { useStudentAuth } from '../context/StudentAuthContext';
import { fetchMyApplicationForJob } from '../services/jobApplications';
import { fetchJobById, fetchJobs } from '../services/jobs';
import { getDailyUpdatesChannelUrl, getJobGroupLink } from '../lib/jobGroupLink';
import { buildJobPlaceholder } from '../lib/jobDeepLink';
import { buildJobSharePayload } from '../lib/jobShare';
import { openExternalUrl } from '../lib/openExternalUrl';
import { findSimilarJobs } from '../lib/similarJobs';
import {
  fetchPublishedJobQuestions,
  submitJobQuestion,
  validateQuestionInput,
  type JobQuestion,
} from '../services/jobQuestions';
import MarkdownBody from '../components/MarkdownBody';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetails'>;

const Row = ({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
  onPress?: () => void;
}) => {
  if (!value) return null;
  const content = (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.metaLabel}>{label}:</Text>
      <Text style={[styles.metaValue, onPress ? styles.metaLink : null]}>{value}</Text>
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="link">
        {content}
      </Pressable>
    );
  }
  return content;
};

const MarkdownSection = ({ title, body }: { title: string; body?: string | null }) => {
  if (!body) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <MarkdownBody>{body}</MarkdownBody>
    </View>
  );
};

export default function JobDetailsScreen({ navigation, route }: Props) {
  const params = route.params ?? {};
  const lookupKey = params.jobId || params.slug || params.job?.slug || params.job?.id || '';
  const { isLoading, isStudent, profileComplete, session, mappedProfile, user } = useStudentAuth();
  const [job, setJob] = useState<Job>(
    () => params.job ?? buildJobPlaceholder({ jobId: params.jobId, slug: params.slug }),
  );
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(() => Boolean(lookupKey));
  const [loadError, setLoadError] = useState(() => (lookupKey ? '' : 'Job not found.'));
  const [saved, setSaved] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [channelModalVisible, setChannelModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [pendingExternalUrl, setPendingExternalUrl] = useState<string | null>(null);
  const [questions, setQuestions] = useState<JobQuestion[]>([]);
  const [askerName, setAskerName] = useState(
    () => (session && isStudent ? mappedProfile?.fullName || '' : ''),
  );
  const [askerEmail, setAskerEmail] = useState(
    () => (session && isStudent ? mappedProfile?.contactEmail || user?.email || '' : ''),
  );
  const [questionBody, setQuestionBody] = useState('');
  const [questionError, setQuestionError] = useState('');
  const [questionNotice, setQuestionNotice] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [copyNotice, setCopyNotice] = useState('');

  const similarJobs = useMemo(() => findSimilarJobs(allJobs, job), [allJobs, job]);
  const groupLink = getJobGroupLink(job);
  const share = useMemo(() => buildJobSharePayload(job), [job]);
  const isGuestAsker = !(session && isStudent);
  const resolvedAskerName = isGuestAsker
    ? askerName
    : askerName || mappedProfile?.fullName || '';
  const resolvedAskerEmail = isGuestAsker
    ? askerEmail
    : askerEmail || mappedProfile?.contactEmail || user?.email || '';

  useEffect(() => {
    isJobSaved(job.id).then(setSaved);
  }, [job.id]);

  useEffect(() => {
    let active = true;
    fetchJobs().then((result) => {
      if (active) setAllJobs(result.jobs);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const key = lookupKey;
    if (!key) {
      return () => {
        active = false;
      };
    }

    fetchJobById(key).then((full) => {
      if (!active) return;
      if (full) {
        setJob(full);
        navigation.setOptions({ title: full.title });
        setLoadError('');
      } else if (!params.job) {
        setLoadError('This job is unavailable or no longer published.');
      }
      setLoadingDetail(false);
    });
    return () => {
      active = false;
    };
  }, [lookupKey, params.job, navigation]);

  useEffect(() => {
    let active = true;
    if (!job.id || job.id === 'loading') {
      return () => {
        active = false;
      };
    }
    fetchPublishedJobQuestions(job.id)
      .then((rows) => {
        if (active) setQuestions(rows);
      })
      .catch(() => {
        if (active) setQuestions([]);
      });
    return () => {
      active = false;
    };
  }, [job.id]);

  useEffect(() => {
    let active = true;

    if (!session || !isStudent || !job.id || job.id === 'loading') {
      queueMicrotask(() => {
        if (active) setAlreadyApplied(false);
      });
      return () => {
        active = false;
      };
    }

    fetchMyApplicationForJob(job.id)
      .then((application) => {
        if (active) setAlreadyApplied(Boolean(application));
      })
      .catch(() => {
        if (active) setAlreadyApplied(false);
      });
    return () => {
      active = false;
    };
  }, [job.id, session, isStudent]);

  const onToggle = async () => {
    const nowSaved = await toggleSavedJob(job);
    setSaved(nowSaved);
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: share.fullMessage,
        url: share.url,
        title: share.title,
      });
    } catch {
      // user cancelled
    }
  };

  const onWhatsAppShare = () => {
    void openExternalUrl(share.whatsappUrl);
  };

  const onTelegramShare = () => {
    void openExternalUrl(share.telegramUrl);
  };

  const onCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(share.fullMessage);
      setCopyNotice('Link copied');
      setTimeout(() => setCopyNotice(''), 2000);
    } catch {
      setCopyNotice('Copy failed');
      setTimeout(() => setCopyNotice(''), 2000);
    }
  };

  const openExternalApply = (url: string) => {
    setPendingExternalUrl(url);
    setChannelModalVisible(true);
  };

  const confirmExternalApply = async (joinChannelFirst: boolean) => {
    setChannelModalVisible(false);
    if (joinChannelFirst) {
      await openExternalUrl(getDailyUpdatesChannelUrl());
    }
    if (pendingExternalUrl) {
      await openExternalUrl(pendingExternalUrl);
    }
    setPendingExternalUrl(null);
  };

  const onApply = () => {
    if (!jobSupportsApply(job)) {
      Alert.alert('Apply unavailable', 'This listing does not have an apply path yet.');
      return;
    }

    if (alreadyApplied) return;

    if (session && isStudent && profileComplete) {
      if (isInternalApplyJob(job)) {
        navigation.navigate('StudentApply', { jobId: job.id, job });
        return;
      }
      if (job.applyLink) {
        openExternalApply(job.applyLink);
      }
      return;
    }

    if (session && isStudent && !profileComplete) {
      navigation.navigate('StudentProfile');
      return;
    }

    if (isInternalApplyJob(job)) {
      navigation.navigate('StudentLogin', { applyJobId: job.id });
      return;
    }

    if (job.applyLink) {
      openExternalApply(job.applyLink);
    }
  };

  const onAskQuestion = async () => {
    setQuestionError('');
    setQuestionNotice('');
    const validation = validateQuestionInput({
      askerName: resolvedAskerName,
      askerEmail: resolvedAskerEmail,
      body: questionBody,
    });
    if (validation) {
      setQuestionError(validation);
      return;
    }
    setSubmittingQuestion(true);
    try {
      await submitJobQuestion({
        jobId: job.id,
        askerName: resolvedAskerName,
        askerEmail: resolvedAskerEmail,
        body: questionBody,
        askerUserId: session?.user?.id ?? null,
      });
      setQuestionBody('');
      setQuestionNotice('Question submitted. It will appear after review.');
    } catch (err) {
      setQuestionError(err instanceof Error ? err.message : 'Could not submit question.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const canApply = jobSupportsApply(job);
  const label = alreadyApplied ? 'Applied' : applyButtonLabel(job);

  if (loadError && !params.job) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{loadError}</Text>
        <Pressable style={styles.qaBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.applyText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badgeRow}>
          {job.isFeatured ? (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>FEATURED</Text>
            </View>
          ) : null}
          {job.sourceName ? (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>via {job.sourceName}</Text>
            </View>
          ) : null}
          {job.isInstagram ? (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>Instagram</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>{job.title}</Text>
          <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share job">
            <Ionicons name="share-social-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
        {job.company ? <Text style={styles.company}>{job.company}</Text> : null}
        {job.postedAt ? (
          <Text style={styles.posted}>Posted {formatRelativePostedAt(job.postedAt)}</Text>
        ) : null}

        <View style={styles.shareRow}>
          <Pressable style={styles.shareChip} onPress={onWhatsAppShare} accessibilityLabel="Share on WhatsApp">
            <Ionicons name="logo-whatsapp" size={18} color="#047857" />
            <Text style={styles.shareChipText}>WhatsApp</Text>
          </Pressable>
          <Pressable style={styles.shareChip} onPress={onTelegramShare} accessibilityLabel="Share on Telegram">
            <Ionicons name="paper-plane-outline" size={18} color="#0369a1" />
            <Text style={styles.shareChipText}>Telegram</Text>
          </Pressable>
          <Pressable style={styles.shareChip} onPress={onCopyLink} accessibilityLabel="Copy link">
            <Ionicons name="link-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.shareChipText}>{copyNotice || 'Copy'}</Text>
          </Pressable>
        </View>

        <View style={styles.metaCard}>
          <Row icon="location" label="Location" value={job.location} />
          <Row icon="pricetag" label="Category" value={job.category} />
          <Row icon="time" label="Type" value={job.jobType} />
          <Row icon="business" label="Work mode" value={job.workMode} />
          <Row icon="ribbon" label="Experience" value={job.experience} />
          <Row icon="cash" label="Salary" value={job.salary} />
          <Row icon="school" label="Fresher friendly" value={job.isFresher} />
          <Row
            icon="globe-outline"
            label="Source"
            value={job.sourceUrl ? job.sourceName || 'Open source' : null}
            onPress={job.sourceUrl ? () => openExternalUrl(job.sourceUrl!) : undefined}
          />
        </View>

        {groupLink ? (
          <Pressable style={styles.groupBtn} onPress={() => openExternalUrl(groupLink)}>
            <Ionicons name="people-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.groupBtnText}>Join job updates group</Text>
          </Pressable>
        ) : null}

        {loadingDetail ? (
          <View style={styles.detailLoading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.detailLoadingText}>Loading full job details…</Text>
          </View>
        ) : null}

        <MarkdownSection title="About this role" body={job.description || job.shortDescription} />
        <MarkdownSection title="Responsibilities" body={job.responsibilities} />
        <MarkdownSection title="Eligibility" body={job.eligibility} />
        <MarkdownSection title="Skills" body={job.skills} />
        {job.warning ? (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={18} color="#92400e" />
            <Text style={styles.warningText}>{job.warning}</Text>
          </View>
        ) : null}

        {similarJobs.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar jobs</Text>
            {similarJobs.map((item) => (
              <Pressable
                key={item.id}
                style={styles.similarRow}
                onPress={() => navigation.push('JobDetails', { job: item })}
              >
                <Text style={styles.similarTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.similarMeta} numberOfLines={1}>
                  {[item.company, item.location].filter(Boolean).join(' · ')}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions & answers</Text>
          {questions.length === 0 ? (
            <Text style={styles.sectionBody}>No published questions yet.</Text>
          ) : (
            questions.map((q) => (
              <View key={q.id} style={styles.qaCard}>
                <Text style={styles.qaAsk}>Q: {q.body}</Text>
                {q.answerBody ? <Text style={styles.qaAns}>A: {q.answerBody}</Text> : null}
              </View>
            ))
          )}
          {isGuestAsker ? (
            <>
              <TextInput
                style={styles.qaInputSingle}
                value={askerName}
                onChangeText={setAskerName}
                placeholder="Your name"
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.qaInputSingle}
                value={askerEmail}
                onChangeText={setAskerEmail}
                placeholder="Your email"
                placeholderTextColor={colors.textSubtle}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </>
          ) : null}
          <TextInput
            style={styles.qaInput}
            value={questionBody}
            onChangeText={setQuestionBody}
            placeholder="Ask a question about this job"
            placeholderTextColor={colors.textSubtle}
            multiline
          />
          {questionError ? <Text style={styles.qaError}>{questionError}</Text> : null}
          {questionNotice ? <Text style={styles.qaNotice}>{questionNotice}</Text> : null}
          <Pressable
            style={[styles.qaBtn, submittingQuestion && styles.applyBtnDone]}
            onPress={onAskQuestion}
            disabled={submittingQuestion}
          >
            <Text style={styles.applyText}>
              {submittingQuestion ? 'Submitting…' : 'Submit question'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable
          onPress={onToggle}
          style={[styles.saveBtn, saved && styles.saveBtnActive]}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved jobs' : 'Save job'}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? colors.primary : colors.textMuted}
          />
        </Pressable>
        {canApply ? (
          <Pressable
            onPress={onApply}
            style={[styles.applyBtn, alreadyApplied && styles.applyBtnDone]}
            disabled={isLoading || alreadyApplied}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <Text style={styles.applyText}>{label}</Text>
            {!alreadyApplied && !isInternalApplyJob(job) ? (
              <Ionicons name="open-outline" size={18} color={colors.white} />
            ) : null}
          </Pressable>
        ) : null}
      </View>

      <Modal visible={channelModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Before you apply</Text>
            <Text style={styles.modalBody}>
              Join the Vizag Jobs updates channel for daily openings, then continue to the external
              application.
            </Text>
            <Pressable style={styles.applyBtn} onPress={() => confirmExternalApply(true)}>
              <Text style={styles.applyText}>Join channel & apply</Text>
            </Pressable>
            <Pressable style={styles.modalSecondary} onPress={() => confirmExternalApply(false)}>
              <Text style={styles.modalSecondaryText}>Skip and apply</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Application submitted</Text>
            <Text style={styles.modalBody}>
              Stay updated — join the group linked to this job for recruiter messages.
            </Text>
            {groupLink ? (
              <Pressable
                style={styles.applyBtn}
                onPress={() => {
                  setSuccessModalVisible(false);
                  void openExternalUrl(groupLink);
                }}
              >
                <Text style={styles.applyText}>Open group link</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={styles.modalSecondary}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.navigate('StudentApplications');
              }}
            >
              <Text style={styles.modalSecondaryText}>View applied jobs</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bg,
    gap: spacing.md,
  },
  errorText: { color: '#be123c', fontWeight: '700', textAlign: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, flexWrap: 'wrap' },
  featuredBadge: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  featuredText: { color: '#155e75', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  sourceBadge: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blueSoftBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sourceText: { color: colors.primaryDark, fontSize: 10, fontWeight: '700' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  title: { flex: 1, fontSize: 22, fontWeight: '900', color: colors.text, lineHeight: 28 },
  company: { fontSize: 15, fontWeight: '700', color: colors.textMuted, marginTop: spacing.xs },
  posted: { fontSize: 12, color: colors.textSubtle, marginTop: spacing.xs },
  shareRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  shareChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  shareChipText: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  metaValue: { fontSize: 13, color: colors.textMuted, flex: 1 },
  metaLink: { color: colors.primary, fontWeight: '700' },
  groupBtn: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.blueSoft,
    borderColor: colors.blueSoftBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  groupBtnText: { color: colors.primaryDark, fontWeight: '800' },
  detailLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  detailLoadingText: { fontSize: 13, color: colors.textMuted },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  sectionBody: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
  warningBanner: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warningText: { flex: 1, color: '#92400e', fontWeight: '600', lineHeight: 20 },
  similarRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  similarTitle: { fontWeight: '800', color: colors.text },
  similarMeta: { marginTop: 4, color: colors.textMuted, fontSize: 12 },
  qaCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  qaAsk: { fontWeight: '700', color: colors.text },
  qaAns: { marginTop: spacing.sm, color: colors.textMuted },
  qaInputSingle: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  qaInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    color: colors.text,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  qaError: { color: '#be123c', marginTop: spacing.sm, fontWeight: '600' },
  qaNotice: { color: '#047857', marginTop: spacing.sm, fontWeight: '600' },
  qaBtn: {
    marginTop: spacing.md,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  saveBtn: {
    height: 48,
    width: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnActive: { backgroundColor: colors.blueSoft, borderColor: colors.blueSoftBorder },
  applyBtn: {
    flex: 1,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  applyBtnDone: { backgroundColor: colors.success },
  applyText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
  modalBody: { color: colors.textMuted, lineHeight: 20 },
  modalSecondary: { alignItems: 'center', paddingVertical: spacing.sm },
  modalSecondaryText: { color: colors.primary, fontWeight: '800' },
});
