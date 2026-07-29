import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchPublishedPosts, type BlogPost } from '../services/blogs';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BlogList'>;

const formatDate = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function BlogListScreen({ navigation }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError('');
      void fetchPublishedPosts()
        .then((rows) => {
          if (active) setPosts(rows);
        })
        .catch((err) => {
          if (active) {
            setPosts([]);
            setError(err instanceof Error ? err.message : 'Could not load blog posts.');
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Career tips & Vizag job news</Text>
            <Text style={styles.subtitle}>Guides and updates from JobsInVizag.</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>{error || 'No published posts yet.'}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('BlogPost', { slug: item.slug, post: item })}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.publishedAt ? (
              <Text style={styles.cardDate}>{formatDate(item.publishedAt)}</Text>
            ) : null}
            {item.excerpt ? (
              <Text style={styles.cardExcerpt} numberOfLines={3}>
                {item.excerpt}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  subtitle: { marginTop: spacing.xs, color: colors.textMuted },
  center: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyTitle: { color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  cardDate: { marginTop: 4, fontSize: 12, color: colors.textSubtle, fontWeight: '600' },
  cardExcerpt: { marginTop: spacing.sm, color: colors.textMuted, lineHeight: 20 },
});
