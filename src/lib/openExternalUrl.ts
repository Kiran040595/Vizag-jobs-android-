import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/**
 * Open an http(s) URL in Chrome Custom Tabs / SFSafariViewController when
 * available; fall back to the system browser / Linking otherwise.
 */
export const openExternalUrl = async (url: string): Promise<void> => {
  const trimmed = String(url || '').trim();
  if (!trimmed) return;

  if (/^https?:\/\//i.test(trimmed) && Platform.OS !== 'web') {
    try {
      await WebBrowser.openBrowserAsync(trimmed, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        showTitle: true,
        enableBarCollapsing: true,
      });
      return;
    } catch {
      // fall through to Linking
    }
  }

  await Linking.openURL(trimmed);
};
