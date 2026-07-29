import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../theme';
import type { Job, Filters } from '../types';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { fetchJobs } from '../services/jobs';
import {
  DEFAULT_FILTERS,
  FRESHNESS_OPTIONS,
  JOB_TYPE_OPTIONS,
  PAGE_SIZE,
  applyJobFilters,
  isAnyFilterActive,
  paginate,
} from '../lib/jobFilters';
import { FILTER_CATEGORY_OPTIONS, normalizeJobCategory } from '../data/categories';
import { getSavedJobIds, toggleSavedJob } from '../lib/savedJobs';
import { rankJobsForStudent } from '../lib/studentJobMatch';
import { useStudentAuth } from '../context/StudentAuthContext';
import HeroSection from '../components/HeroSection';
import CategoryChips from '../components/CategoryChips';
import StatsSection, { type SiteStats } from '../components/StatsSection';
import EmployerCTA from '../components/EmployerCTA';
import JobCard from '../components/JobCard';
import JobsForYouSection from '../components/JobsForYouSection';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Jobs'>,
  NativeStackScreenProps<RootStackParamList>
>;

const QUICK_PRESETS = [
  { id: 'it', label: 'IT' },
  { id: 'fresher', label: 'Fresher' },
  { id: 'part-time', label: 'Part-time', jobType: 'part-time' },
  { id: 'civil', label: 'Civil' },
  { id: 'mechanical', label: 'Mechanical' },
  { id: 'walk-in', label: 'Walk-in' },
];

const computeStats = (jobs: Job[]): SiteStats => {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const companies = new Set(jobs.map((j) => (j.company ?? '').trim().toLowerCase()).filter(Boolean));
  const categories = new Set(jobs.map((j) => normalizeJobCategory(j.category)).filter(Boolean));
  const newThisWeek = jobs.filter((j) => {
    const t = j.postedAt ? new Date(j.postedAt).getTime() : NaN;
    return !Number.isNaN(t) && t >= weekAgo;
  }).length;
  return {
    activeJobs: jobs.length,
    companies: companies.size,
    newThisWeek,
    categories: categories.size,
  };
};

export default function HomeScreen({ navigation }: Props) {
  const { isStudent, profile, profileComplete } = useStudentAuth();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingSample, setUsingSample] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    fetchJobs().then((result) => {
      if (!active) return;
      setAllJobs(result.jobs);
      setUsingSample(result.usingSampleData);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSavedJobIds().then((ids) => {
        if (active) setSavedIds(ids);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const filtered = useMemo(() => applyJobFilters(allJobs, filters), [allJobs, filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageJobs = useMemo(() => paginate(filtered, safePage), [filtered, safePage]);
  const stats = useMemo(() => computeStats(allJobs), [allJobs]);
  const jobsForYou = useMemo(() => {
    if (!isStudent || !profileComplete || !profile) return [];
    return rankJobsForStudent(allJobs, profile).map((entry) => entry.job);
  }, [allJobs, isStudent, profile, profileComplete]);

  const onToggleSave = useCallback(async (job: Job) => {
    const nowSaved = await toggleSavedJob(job);
    setSavedIds((prev) => (nowSaved ? [job.id, ...prev] : prev.filter((id) => id !== job.id)));
  }, []);

  const submitSearch = useCallback(() => {
    setPage(1);
    setFilters((f) => ({ ...f, q: searchInput }));
  }, [searchInput]);

  const resetFilters = useCallback(() => {
    setSearchInput('');
    setFilters({ ...DEFAULT_FILTERS });
    setPage(1);
  }, []);

  const applyPreset = useCallback((preset: (typeof QUICK_PRESETS)[number]) => {
    setPage(1);
    if (preset.jobType) {
      setFilters((f) => ({ ...f, jobType: preset.jobType!, category: 'all' }));
      return;
    }
    setFilters((f) => ({ ...f, category: preset.id, jobType: 'all' }));
  }, []);

  const header = (
    <View>
      <HeroSection
        searchTerm={searchInput}
        onChangeSearch={setSearchInput}
        onSubmit={submitSearch}
        savedCount={savedIds.length}
        onOpenSaved={() => navigation.navigate('Saved')}
      />
      {usingSample ? (
        <View style={styles.sampleBanner}>
          <Text style={styles.sampleText}>
            Showing sample Vizag jobs — live Supabase listings unavailable right now.
          </Text>
        </View>
      ) : null}
      {jobsForYou.length ? (
        <JobsForYouSection
          jobs={jobsForYou}
          onOpenJob={(job) => navigation.navigate('JobDetails', { job })}
        />
      ) : null}
      <Text style={styles.sectionTitle}>Quick browse</Text>
      <CategoryChips
        options={QUICK_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
        selected={filters.jobType === 'part-time' ? 'part-time' : filters.category}
        onSelect={(id) => {
          const preset = QUICK_PRESETS.find((p) => p.id === id);
          if (preset) applyPreset(preset);
        }}
      />
      <Text style={styles.sectionTitle}>Browse by Category</Text>
      <CategoryChips
        options={FILTER_CATEGORY_OPTIONS}
        selected={filters.category}
        onSelect={(id) => {
          setPage(1);
          setFilters((f) => ({ ...f, category: id }));
        }}
      />
      <CategoryChips
        options={JOB_TYPE_OPTIONS}
        selected={filters.jobType}
        onSelect={(id) => {
          setPage(1);
          setFilters((f) => ({ ...f, jobType: id }));
        }}
      />
      <CategoryChips
        options={FRESHNESS_OPTIONS}
        selected={filters.freshness}
        onSelect={(id) => {
          setPage(1);
          setFilters((f) => ({ ...f, freshness: id }));
        }}
      />
      <View style={styles.resultRow}>
        <Text style={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} found
          {filtered.length > PAGE_SIZE ? ` · page ${safePage}/${totalPages}` : ''}
        </Text>
        {isAnyFilterActive(filters) ? (
          <Pressable onPress={resetFilters} accessibilityRole="button">
            <Text style={styles.reset}>Reset all filters</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const footer = (
    <View style={styles.footerWrap}>
      {filtered.length > PAGE_SIZE ? (
        <View style={styles.pager}>
          <Pressable
            style={[styles.pagerBtn, safePage <= 1 && styles.pagerDisabled]}
            disabled={safePage <= 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          >
            <Text style={styles.pagerText}>Previous</Text>
          </Pressable>
          <Text style={styles.pagerLabel}>
            {safePage} / {totalPages}
          </Text>
          <Pressable
            style={[styles.pagerBtn, safePage >= totalPages && styles.pagerDisabled]}
            disabled={safePage >= totalPages}
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <Text style={styles.pagerText}>Next</Text>
          </Pressable>
        </View>
      ) : null}
      <StatsSection stats={stats} />
      <EmployerCTA />
      <Text style={styles.footerNote}>Jobs in Vizag · Visakhapatnam · jobsinvizag.in</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : pageJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            saved={savedIds.includes(item.id)}
            onPress={() => navigation.navigate('JobDetails', { job: item })}
            onToggleSave={() => onToggleSave(item)}
          />
        )}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingText}>Jobs are loading, please wait…</Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No jobs match your filters</Text>
              <Text style={styles.emptyBody}>
                Try a different keyword, broaden your category, or remove a filter.
              </Text>
              <Pressable onPress={resetFilters} style={styles.emptyBtn} accessibilityRole="button">
                <Text style={styles.emptyBtnText}>Reset all filters</Text>
              </Pressable>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listContent: { paddingBottom: spacing.xxl },
  sampleBanner: {
    backgroundColor: '#fef9c3',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sampleText: { color: '#854d0e', fontSize: 12, fontWeight: '600' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  resultCount: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  reset: { fontSize: 13, fontWeight: '700', color: colors.primary },
  center: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  loadingText: { marginTop: spacing.md, color: colors.textMuted },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  emptyBody: { marginTop: spacing.sm, textAlign: 'center', color: colors.textMuted, lineHeight: 20 },
  emptyBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyBtnText: { color: colors.white, fontWeight: '800' },
  footerWrap: { paddingBottom: spacing.xl },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pagerBtn: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blueSoftBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pagerDisabled: { opacity: 0.4 },
  pagerText: { color: colors.primaryDark, fontWeight: '800' },
  pagerLabel: { color: colors.textMuted, fontWeight: '700' },
  footerNote: {
    textAlign: 'center',
    color: colors.textSubtle,
    fontSize: 12,
    marginTop: spacing.xl,
  },
});
