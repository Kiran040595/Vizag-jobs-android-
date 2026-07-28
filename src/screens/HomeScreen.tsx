import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../theme';
import type { Job, Filters } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { fetchJobs } from '../services/jobs';
import {
  DEFAULT_FILTERS,
  JOB_TYPE_OPTIONS,
  applyJobFilters,
  isAnyFilterActive,
} from '../lib/jobFilters';
import { FILTER_CATEGORY_OPTIONS, normalizeJobCategory } from '../data/categories';
import { getSavedJobIds, toggleSavedJob } from '../lib/savedJobs';
import HeroSection from '../components/HeroSection';
import CategoryChips from '../components/CategoryChips';
import StatsSection, { type SiteStats } from '../components/StatsSection';
import EmployerCTA from '../components/EmployerCTA';
import JobCard from '../components/JobCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

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
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingSample, setUsingSample] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    // Treat the fetch as an external subscription: state is updated from the
    // promise callback (never synchronously in the effect body).
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
  const stats = useMemo(() => computeStats(allJobs), [allJobs]);

  const onToggleSave = useCallback(async (job: Job) => {
    const nowSaved = await toggleSavedJob(job);
    setSavedIds((prev) => (nowSaved ? [job.id, ...prev] : prev.filter((id) => id !== job.id)));
  }, []);

  const submitSearch = useCallback(() => {
    setFilters((f) => ({ ...f, q: searchInput }));
  }, [searchInput]);

  const resetFilters = useCallback(() => {
    setSearchInput('');
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  const header = (
    <View>
      <HeroSection
        searchTerm={searchInput}
        onChangeSearch={setSearchInput}
        onSubmit={submitSearch}
        savedCount={savedIds.length}
        onOpenSaved={() => navigation.navigate('SavedJobs')}
      />
      {usingSample ? (
        <View style={styles.sampleBanner}>
          <Text style={styles.sampleText}>
            Showing sample Vizag jobs — live Supabase listings unavailable right now.
          </Text>
        </View>
      ) : null}
      <Text style={styles.sectionTitle}>Browse by Category</Text>
      <CategoryChips
        options={FILTER_CATEGORY_OPTIONS}
        selected={filters.category}
        onSelect={(id) => setFilters((f) => ({ ...f, category: id }))}
      />
      <CategoryChips
        options={JOB_TYPE_OPTIONS}
        selected={filters.jobType}
        onSelect={(id) => setFilters((f) => ({ ...f, jobType: id }))}
      />
      <View style={styles.resultRow}>
        <Text style={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} found
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
      <StatsSection stats={stats} />
      <EmployerCTA />
      <Text style={styles.footerNote}>Jobs in Vizag · Visakhapatnam · jobsinvizag.in</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : filtered}
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
        columnWrapperStyle={undefined}
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
  listContentInner: {},
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
  footerNote: {
    textAlign: 'center',
    color: colors.textSubtle,
    fontSize: 12,
    marginTop: spacing.xl,
  },
});
