import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
  TextInput,
  Image,
} from 'react-native';
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
import { buildJobPublicUrl, getDailyUpdatesChannelUrl, getJobGroupLink } from '../lib/jobGroupLink';
import { findSimilarJobs } from '../lib/similarJobs';
import {
  fetchPublishedJobQuestions,
  submitJobQuestion,
  type JobQuestion,
} from '../services/jobQuestions';
import { isJobExpired } from '../lib/jobExpiry';
import { resolveJobSourceAttribution } from '../lib/jobSourceAttribution';
import JobDescriptionContent from '../components/JobDescriptionContent';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetails'>;

const Row = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) => {
  if (!value) return null;
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.metaLabel}>{label}:</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
};

export default function JobDetailsScreen({ navigation, route }: Props) {
  const { job: paramJob, jobId: paramJobId, questionId } = route.params;
  const lookupKey = paramJobId || paramJob?.slug || paramJob?.id || '';
  const { isLoading, isStudent, profileComplete, session, mappedProfile, user } = useStudentAuth();
  const [job, setJob] = useState<Job | null>(paramJob ?? null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saved, setSaved] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [channelModalVisible, setChannelModalVisible] = useState(false);
  const [pendingExternalUrl, setPendingExternalUrl] = useState<string | null>(null);
  const [questions, setQuestions] = useState<JobQuestion[]>([]);
  const [questionBody, setQuestionBody] = useState('');
  const [askerName, setAskerName] = useState('');
  const [askerEmail, setAskerEmail] = useState('');
  const [questionError, setQuestionError] = useState('');
  const [questionNotice, setQuestionNotice] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const similarJobs = useMemo(
    () => (job ? findSimilarJobs(allJobs, job) : []),
    [allJobs, job],
  );
  const groupLink = job ? getJobGroupLink(job) : null;
  const expired = isJobExpired(job);
  const sourceAttribution = job ? resolveJobSourceAttribution(job) : null;
  const skillChips = !job?.skills
    ? []
    : String(job.skills)
        .split(/[,|•]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 16);
  const resolvedAskerName = askerName || mappedProfile?.fullName || '';
  const resolvedAskerEmail = askerEmail || mappedProfile?.contactEmail || user?.email || '';

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!lookupKey && !paramJob) {
        if (active) {
          setLoadError('Job not found.');
          setLoadingDetail(false);
        }
        return;
      }

      try {
        const full = lookupKey ? await fetchJobById(lookupKey) : null;
        if (!active) return;
        if (full) {
          setJob(full);
        } else if (paramJob) {
          setJob(paramJob);
        } else {
          setLoadError('This job is no longer available.');
        }
      } catch (err) {
        if (!active) return;
        if (paramJob) setJob(paramJob);
        else setLoadError(err instanceof Error ? err.message : 'Could not load job.');
      } finally {
        if (active) setLoadingDetail(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [lookupKey, paramJob]);

  useEffect(() => {
    if (!job?.id) return;
    void isJobSaved(job.id).then(setSaved);
  }, [job?.id]);

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
    if (!job?.id) return undefined;
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
  }, [job?.id]);

  useEffect(() => {
    let active = true;
    if (!job?.id) return undefined;

    if (!session || !isStudent) {
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
  }, [job?.id, session, isStudent]);

  const onToggle = async () => {
    if (!job) return;
    const nowSaved = await toggleSavedJob(job);
    setSaved(nowSaved);
  };

  const onShare = async () => {
    if (!job) return;
    const url = buildJobPublicUrl(job);
    try {
      await Share.share({
        message: `${job.title}${job.company ? ` at ${job.company}` : ''}\n${url}`,
        url,
        title: job.title,
      });
    } catch {
      // user cancelled
    }
  };

  const openExternalApply = (url: string) => {
    setPendingExternalUrl(url);
    setChannelModalVisible(true);
  };

  const confirmExternalApply = async (joinChannelFirst: boolean) => {
    setChannelModalVisible(false);
    if (joinChannelFirst) {
      await Linking.openURL(getDailyUpdatesChannelUrl());
    }
    if (pendingExternalUrl) {
      await Linking.openURL(pendingExternalUrl);
    }
    setPendingExternalUrl(null);
  };

  const onApply = () => {
    if (!job) return;
    if (expired) {
      Alert.alert('Listing expired', 'This job is no longer accepting applications.');
      return;
    }
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
    if (!job) return;
    setQuestionError('');
    setQuestionNotice('');
    setSubmittingQuestion(true);
    try {
      await submitJobQuestion({
        jobId: job.id,
        askerName: resolvedAskerName,
        askerEmail: resolvedAskerEmail,
        body: questionBody,
        askerUserId: session?.user?.id || null,
      });
      setQuestionBody('');
      setQuestionNotice(
        session && isStudent
          ? 'Question submitted. It will appear after review.'
          : 'Question submitted. Sign in later to get reply notifications.',
      );
    } catch (err) {
      setQuestionError(err instanceof Error ? err.message : 'Could not submit question.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  if (loadingDetail && !job) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.detailLoadingText}>Loading job…</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>{loadError || 'Job not found'}</Text>
        <Pressable style={styles.qaBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Jobs' })}>
          <Text style={styles.applyText}>Browse jobs</Text>
        </Pressable>
      </View>
    );
  }

  const canApply = !expired && jobSupportsApply(job);
  const label = alreadyApplied ? 'Applied' : expired ? 'Expired' : applyButtonLabel(job);

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        {expired ? (
          <View style={styles.expiredBanner}>
            <Text style={styles.expiredText}>
              This listing has expired and is no longer accepting applications.
            </Text>
          </View>
        ) : null}

        <View style={styles.badgeRow}>
          {job.isFeatured ? (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>FEATURED</Text>
            </View>
          ) : null}
          {sourceAttribution ? (
            <Pressable
              style={styles.sourceBadge}
              onPress={() => {
                if (sourceAttribution.href) void Linking.openURL(sourceAttribution.href);
              }}
              disabled={!sourceAttribution.href}
            >
              <Text style={styles.sourceText}>via {sourceAttribution.label}</Text>
            </Pressable>
          ) : job.sourceName ? (
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
          {job.companyLogoUrl ? (
            <Image source={{ uri: job.companyLogoUrl }} style={styles.logo} />
          ) : null}
          <Text style={styles.title}>{job.title}</Text>
          <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share job">
            <Ionicons name="share-social-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
        {job.company ? <Text style={styles.company}>{job.company}</Text> : null}
        {job.postedAt ? (
          <Text style={styles.posted}>Posted {formatRelativePostedAt(job.postedAt)}</Text>
        ) : null}
        {sourceAttribution?.href ? (
          <Pressable onPress={() => Linking.openURL(sourceAttribution.href!)}>
            <Text style={styles.sourceLink}>Originally listed on {sourceAttribution.label}</Text>
          </Pressable>
        ) : null}

        <View style={styles.metaCard}>
          <Row icon="location" label="Location" value={job.location} />
          <Row icon="pricetag" label="Category" value={job.category} />
          <Row icon="time" label="Type" value={job.jobType} />
          <Row icon="business" label="Work mode" value={job.workMode} />
          <Row icon="ribbon" label="Experience" value={job.experience} />
          <Row icon="cash" label="Salary" value={job.salary} />
          <Row icon="school" label="Fresher friendly" value={job.isFresher} />
        </View>

        {groupLink ? (
          <Pressable style={styles.groupBtn} onPress={() => Linking.openURL(groupLink)}>
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

        <JobDescriptionContent
          title="About this role"
          body={job.description || job.shortDescription}
        />
        <JobDescriptionContent title="Responsibilities" body={job.responsibilities} />
        <JobDescriptionContent title="Eligibility" body={job.eligibility} />
        {skillChips.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.chipRow}>
              {skillChips.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <JobDescriptionContent title="Skills" body={job.skills} />
        )}
        <JobDescriptionContent title="Note" body={job.warning} />

        {similarJobs.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar jobs</Text>
            {similarJobs.map((item) => (
              <Pressable
                key={item.id}
                style={styles.similarRow}
                onPress={() => navigation.push('JobDetails', { job: item, jobId: item.id })}
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
              <View
                key={q.id}
                style={[styles.qaCard, questionId === q.id && styles.qaCardHighlight]}
              >
                <Text style={styles.qaAsk}>Q: {q.body}</Text>
                {q.answerBody ? <Text style={styles.qaAns}>A: {q.answerBody}</Text> : null}
              </View>
            ))
          )}

          {!session || !isStudent ? (
            <Text style={styles.guestHint}>
              Ask as a guest with your name or email. Sign in if you want reply notifications in the
              app.
            </Text>
          ) : null}

          {!(session && isStudent && mappedProfile?.fullName) ? (
            <TextInput
              style={styles.qaField}
              value={resolvedAskerName}
              onChangeText={setAskerName}
              placeholder="Your name"
              placeholderTextColor={colors.textSubtle}
            />
          ) : null}
          {!(session && isStudent && (mappedProfile?.contactEmail || user?.email)) ? (
            <TextInput
              style={styles.qaField}
              value={resolvedAskerEmail}
              onChangeText={setAskerEmail}
              placeholder="Your email"
              placeholderTextColor={colors.textSubtle}
              keyboardType="email-address"
              autoCapitalize="none"
            />
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
          {!session || !isStudent ? (
            <Pressable
              style={styles.modalSecondary}
              onPress={() => navigation.navigate('StudentLogin')}
            >
              <Text style={styles.modalSecondaryText}>Sign in for reply notifications</Text>
            </Pressable>
          ) : null}
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
        {canApply || alreadyApplied || expired ? (
          <Pressable
            onPress={onApply}
            style={[
              styles.applyBtn,
              (alreadyApplied || expired) && styles.applyBtnDone,
              expired && styles.applyBtnExpired,
            ]}
            disabled={isLoading || alreadyApplied || expired}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <Text style={styles.applyText}>{label}</Text>
            {!alreadyApplied && !expired && !isInternalApplyJob(job) ? (
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
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  expiredBanner: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  expiredText: { color: '#9f1239', fontWeight: '700', fontSize: 13 },
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
  sourceLink: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { flex: 1, fontSize: 22, fontWeight: '900', color: colors.text, lineHeight: 28 },
  company: { fontSize: 15, fontWeight: '700', color: colors.textMuted, marginTop: spacing.xs },
  posted: { fontSize: 12, color: colors.textSubtle, marginTop: spacing.xs },
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skillChip: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blueSoftBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skillChipText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
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
  qaCardHighlight: { borderColor: colors.primary, backgroundColor: colors.blueSoft },
  qaAsk: { fontWeight: '700', color: colors.text },
  qaAns: { marginTop: spacing.sm, color: colors.textMuted },
  guestHint: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  qaField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    paddingHorizontal: spacing.lg,
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
  applyBtnExpired: { backgroundColor: colors.textSubtle },
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
