import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MarkdownBody from '../components/MarkdownBody';
import { fetchPublishedPostBySlug, type BlogPost } from '../services/blogs';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BlogPost'>;

const formatDate = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function BlogPostScreen({ route, navigation }: Props) {
  const { slug, post: initial } = route.params;
  const hasInitialBody = Boolean(initial?.body && initial.slug === slug);
  const [post, setPost] = useState<BlogPost | null>(initial ?? null);
  const [loading, setLoading] = useState(!hasInitialBody);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hasInitialBody) return;

    let active = true;
    void fetchPublishedPostBySlug(slug)
      .then((row) => {
        if (!active) return;
        if (!row) {
          setError('Post not found.');
          setPost(null);
          return;
        }
        setPost(row);
        navigation.setOptions({ title: row.title });
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load post.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, hasInitialBody, navigation]);

  if (loading && !post) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Post not found.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{post.title}</Text>
      {post.publishedAt ? <Text style={styles.date}>{formatDate(post.publishedAt)}</Text> : null}
      {post.excerpt ? <Text style={styles.excerpt}>{post.excerpt}</Text> : null}
      <View style={styles.body}>
        <MarkdownBody>{post.body}</MarkdownBody>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, lineHeight: 30 },
  date: { marginTop: spacing.sm, color: colors.textSubtle, fontWeight: '600' },
  excerpt: { marginTop: spacing.md, color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  body: { marginTop: spacing.xl },
  error: { color: '#be123c', fontWeight: '700', padding: spacing.lg, textAlign: 'center' },
});
