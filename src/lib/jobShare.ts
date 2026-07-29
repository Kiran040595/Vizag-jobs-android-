import { buildJobPublicUrl } from './jobGroupLink';
import type { Job } from '../types';

export type JobSharePayload = {
  url: string;
  title: string;
  text: string;
  fullMessage: string;
  whatsappUrl: string;
  telegramUrl: string;
};

/** Build share text + WhatsApp / Telegram deep links for a job listing. */
export const buildJobSharePayload = (job: Pick<Job, 'title' | 'company' | 'location' | 'slug' | 'id'>): JobSharePayload => {
  const url = buildJobPublicUrl(job);
  const company = String(job.company || '').trim() || 'a Vizag employer';
  const location = String(job.location || '').trim() || 'Visakhapatnam';
  const title = `${job.title} at ${company}`;
  const text = `Check out this job opening: ${title} in ${location}. Apply here:`;
  const fullMessage = `${text} ${url}`;

  return {
    url,
    title,
    text,
    fullMessage,
    whatsappUrl: `https://wa.me/?text=${encodeURIComponent(fullMessage)}`,
    telegramUrl: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  };
};
