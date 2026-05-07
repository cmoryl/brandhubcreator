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
    {
      id: 'tp-human-woman-06',
      url: '/photography/transperfect/tp-human-woman-06.png',
      title: 'Tech workspace — turquoise to magenta brand wash',
      presets: ['humanRealistic', 'softTransition'],
      tags: ['woman', 'office', 'brand-gradient', 'tech'],
    },
    {
      id: 'tp-human-man-06',
      url: '/photography/transperfect/tp-human-man-06.png',
      title: 'Analyst at monitors — magenta to teal transition',
      presets: ['humanRealistic', 'softTransition'],
      tags: ['man', 'office', 'brand-gradient', 'tech'],
    },
    {
      id: 'tp-human-woman-07',
      url: '/photography/transperfect/tp-human-woman-07.png',
      title: 'Conference room — cinematic teal & magenta motion blur',
      presets: ['humanRealistic', 'softTransition'],
      tags: ['woman', 'meeting-room', 'brand-gradient', 'cinematic'],
    },
    {
      id: 'tp-human-woman-08',
      url: '/photography/transperfect/tp-human-woman-08.png',
      title: 'Audience close-up — thoughtful, natural daylight',
      presets: ['humanRealistic', 'documentaryPortrait'],
      tags: ['woman', 'portrait', 'event', 'daylight'],
    },
    {
      id: 'tp-human-woman-09',
      url: '/photography/transperfect/tp-human-woman-09.png',
      title: 'Conference attendee — warm bokeh portrait',
      presets: ['humanRealistic', 'documentaryPortrait'],
      tags: ['woman', 'portrait', 'event', 'warm'],
    },
    {
      id: 'tp-human-woman-10',
      url: '/photography/transperfect/tp-human-woman-10.png',
      title: 'Lab scientist — turquoise soft transition split',
      presets: ['humanRealistic', 'softTransition'],
      tags: ['woman', 'lab', 'science', 'brand-gradient'],
    },
    {
      id: 'tp-human-man-07',
      url: '/photography/transperfect/tp-human-man-07.png',
      title: 'Gamer profile — natural light, headset focus',
      presets: ['humanRealistic', 'documentaryPortrait'],
      tags: ['man', 'gaming', 'lifestyle', 'daylight'],
    },
    {
      id: 'tp-human-man-08',
      url: '/photography/transperfect/tp-human-man-08.png',
      title: 'Gamer at screen — warm bokeh, evening glow',
      presets: ['humanRealistic', 'documentaryPortrait'],
      tags: ['man', 'gaming', 'lifestyle', 'warm-bokeh'],
    },
  ],
};

export function getStartersForBrand(brandSlug: string | undefined): PhotographyStarter[] {
  if (!brandSlug) return [];
  return BRAND_PHOTOGRAPHY_STARTERS[brandSlug.toLowerCase()] ?? [];
}
