import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { openExternalUrl } from '../lib/openExternalUrl';
import type { LegalPage, RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Legal'>;

const CONTACT_EMAIL = 'kkumardadi@gmail.com';

const COPY: Record<LegalPage, { title: string; body: string[]; webPath: string }> = {
  about: {
    title: 'About Vizag Jobs',
    webPath: '/about',
    body: [
      'JobsInVizag (jobsinvizag.in) is a local job portal for Visakhapatnam. We help job seekers discover openings across IT, engineering, banking, BPO, healthcare, and more — with fresher-friendly and part-time roles highlighted.',
      'Students can create a free profile, upload a resume, and apply to jobs posted directly on the platform. Employers post openings that go live after admin review.',
      `Questions? Email ${CONTACT_EMAIL}.`,
    ],
  },
  privacy: {
    title: 'Privacy policy',
    webPath: '/privacy-policy',
    body: [
      'We collect account details you provide (name, email, phone, education, skills, resume) to power job matching and applications on JobsInVizag.',
      'Job applications and profile data may be shared with employers you apply to, when you have consented to employer sharing.',
      'We use Supabase for authentication and data storage. We do not sell your personal data.',
      'For the complete, authoritative policy — including cookies and analytics on the website — open the full page on jobsinvizag.in.',
    ],
  },
  terms: {
    title: 'Terms of service',
    webPath: '/terms-of-service',
    body: [
      'By using the Vizag Jobs app you agree to use the service lawfully, provide accurate profile information, and not misuse listings or employer contact details.',
      'Job listings are provided by employers or aggregated sources; we do not guarantee employment outcomes.',
      'Accounts may be deactivated for abuse, fake profiles, or policy violations.',
      'The full terms on jobsinvizag.in govern use of the website and related services.',
    ],
  },
  disclaimer: {
    title: 'Disclaimer',
    webPath: '/disclaimer',
    body: [
      'JobsInVizag publishes openings for informational purposes. Always verify company details, salary claims, and apply links before sharing personal documents.',
      'We are not responsible for third-party websites opened via external apply links.',
      'Report suspicious listings through in-app feedback or by emailing the contact above.',
    ],
  },
};

export default function LegalScreen({ route }: Props) {
  const page = route.params?.page ?? 'about';
  const content = COPY[page] ?? COPY.about;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{content.title}</Text>
      {content.body.map((paragraph) => (
        <Text key={paragraph.slice(0, 32)} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
      <Pressable
        style={styles.linkBtn}
        onPress={() => openExternalUrl(`https://jobsinvizag.in${content.webPath}`)}
      >
        <Text style={styles.linkText}>Open full page on jobsinvizag.in</Text>
      </Pressable>
      <View style={styles.contact}>
        <Text style={styles.contactLabel}>Contact</Text>
        <Pressable onPress={() => openExternalUrl(`mailto:${CONTACT_EMAIL}`)}>
          <Text style={styles.contactEmail}>{CONTACT_EMAIL}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: spacing.lg },
  paragraph: {
    color: colors.textMuted,
    lineHeight: 22,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  linkBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.blueSoft,
    borderColor: colors.blueSoftBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  linkText: { color: colors.primaryDark, fontWeight: '800' },
  contact: { marginTop: spacing.xl },
  contactLabel: { fontWeight: '800', color: colors.text },
  contactEmail: { marginTop: spacing.xs, color: colors.primary, fontWeight: '700' },
});
