/**
 * Brand Photography Starter Library
 *
 * Canonical, brand-approved human photography reference set, keyed by brand
 * slug. Surfaced inside the BrandPhotographyGenerator dialog as a one-click
 * "Add from Starter Library" action so teams can populate the imagery hub
 * (or seed future AI generation) with on-brand humans without re-uploading.
 *
 * Files live in /public/photography/<slug>/ so they ship with the app.
 */
import type { StylePreset } from '@/types/creativeStudio';

export interface PhotographyStarter {
  id: string;
  url: string;
  title: string;
  /** Style preset(s) this starter exemplifies — also used as filter tags. */
  presets: StylePreset[];
  /** Free-form tags merged onto the saved ApprovedImage. */
  tags?: string[];
}

export const BRAND_PHOTOGRAPHY_STARTERS: Record<string, PhotographyStarter[]> = {
  transperfect: [
    {
      id: 'tp-human-man-01',
      url: '/photography/transperfect/tp-human-man-01.png',
      title: 'Focused at desk — soft window light',
      presets: ['humanRealistic', 'softTransition'],
      tags: ['man', 'office', 'natural-light'],
    },
    {
      id: 'tp-human-man-02',
      url: '/photography/transperfect/tp-human-man-02.png',
      title: 'Reading at workstation — high-key library',
      presets: ['humanRealistic', 'softTransition'],
      tags: ['man', 'office', 'high-key'],
    },
    {
      id: 'tp-human-man-03',
      url: '/photography/transperfect/tp-human-man-03.png',
      title: 'Studio worktable — magenta-warm bokeh foreground',
      presets: ['humanRealistic', 'softTransition'],
      tags: ['man', 'studio', 'gradient-bokeh'],
    },
    {
      id: 'tp-human-man-04',
      url: '/photography/transperfect/tp-human-man-04.png',
      title: 'Drafting at desk — warm amber light leak',
      presets: ['humanRealistic', 'softTransition', 'goldenHourIntimate'],
      tags: ['man', 'office', 'amber-leak'],
    },
    {
      id: 'tp-human-man-05',
      url: '/photography/transperfect/tp-human-man-05.png',
      title: 'Library — golden + cool blue soft transition',
      presets: ['humanRealistic', 'softTransition'],
      tags: ['man', 'library', 'cool-warm-mix'],
    },
    {
      id: 'tp-human-woman-01',
      url: '/photography/transperfect/tp-human-woman-01.png',
      title: 'Window contemplation — golden hour rim',
      presets: ['humanRealistic', 'goldenHourIntimate'],
      tags: ['woman', 'office', 'sunset'],
    },
    {
      id: 'tp-human-woman-02',
      url: '/photography/transperfect/tp-human-woman-02.png',
      title: 'Documentary close-up — freckles, soft daylight',
      presets: ['humanRealistic', 'documentaryPortrait'],
      tags: ['woman', 'portrait', 'daylight'],
    },
    {
      id: 'tp-human-woman-03',
      url: '/photography/transperfect/tp-human-woman-03.png',
      title: 'Boardroom — magenta-to-teal gradient transition',
      presets: ['humanRealistic', 'softTransition'],
      tags: ['woman', 'office', 'brand-gradient'],
    },
    {
      id: 'tp-human-woman-04',
      url: '/photography/transperfect/tp-human-woman-04.png',
      title: 'Lounge silhouette — turquoise + lavender brand wash',
      presets: ['humanRealistic', 'softTransition'],
      tags: ['woman', 'lounge', 'brand-gradient'],
    },
    {
      id: 'tp-human-woman-05',
      url: '/photography/transperfect/tp-human-woman-05.png',
      title: 'Glass meeting room — purple to turquoise sweep',
      presets: ['humanRealistic', 'softTransition'],
      tags: ['woman', 'meeting-room', 'brand-gradient'],
    },
  ],
};

export function getStartersForBrand(brandSlug: string | undefined): PhotographyStarter[] {
  if (!brandSlug) return [];
  return BRAND_PHOTOGRAPHY_STARTERS[brandSlug.toLowerCase()] ?? [];
}
