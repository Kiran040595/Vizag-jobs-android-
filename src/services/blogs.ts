/**
 * Public blog posts from the same `blog_posts` table as jobsinvizag.in.
 */
import { normalizeBlogBodyMarkdown } from '../lib/blogBodyMarkdown';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const blogTable = process.env.EXPO_PUBLIC_SUPABASE_BLOG_TABLE || 'blog_posts';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status: string;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type Row = Record<string, unknown>;

const mapRowToPost = (row: Row): BlogPost => ({
  id: String(row.id),
  slug: String(row.slug || ''),
  title: String(row.title || ''),
  excerpt: String(row.excerpt || ''),
  body: normalizeBlogBodyMarkdown(String(row.body || '')),
  status: String(row.status || ''),
  publishedAt: row.published_at ? String(row.published_at) : null,
  createdAt: row.created_at ? String(row.created_at) : null,
  updatedAt: row.updated_at ? String(row.updated_at) : null,
});

export const fetchPublishedPosts = async (options: { limit?: number } = {}): Promise<BlogPost[]> => {
  if (!isSupabaseConfigured || !supabase) return [];

  let query = supabase
    .from(blogTable)
    .select('id, slug, title, excerpt, body, status, published_at, created_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (options.limit !== undefined && options.limit !== null) {
    query = query.limit(Number(options.limit));
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) return [];
  return data.map((row) => mapRowToPost(row as Row));
};

export const fetchPublishedPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  const normalizedSlug = String(slug || '').trim();
  if (!normalizedSlug) return null;

  const { data, error } = await supabase
    .from(blogTable)
    .select('id, slug, title, excerpt, body, status, published_at, created_at, updated_at')
    .eq('status', 'published')
    .eq('slug', normalizedSlug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRowToPost(data as Row) : null;
};
