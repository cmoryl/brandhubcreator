/**
 * useEventCohesivenessInsights — Analyzes an EventGuide's data to produce
 * design & marketing cohesiveness insight cards for the Insights & Updates section.
 * Only active when entityType === 'event'.
 */

import { useMemo } from 'react';
import type { InsightItem } from '@/types/brand';
import type { EventGuide } from '@/types/event';

interface UseEventCohesivenessInsightsOptions {
  event: EventGuide | null | undefined;
  enabled?: boolean;
}

/** Section completeness descriptor */
interface SectionScore {
  label: string;
  filled: number;
  total: number;
  category: 'Collateral' | 'Visual Identity' | 'Communication' | 'Event Ops';
}

export function useEventCohesivenessInsights({ event, enabled = true }: UseEventCohesivenessInsightsOptions) {
  const cohesivenessInsights = useMemo<InsightItem[]>(() => {
    if (!enabled || !event) return [];

    const insights: InsightItem[] = [];
    const now = new Date().toISOString();

    // ── 1. Collateral Readiness ──────────────────────────────────
    const signageCount = event.eventSignage?.length ?? 0;
    const signageWithPreview = event.eventSignage?.filter(s => s.previewUrl)?.length ?? 0;
    const printCount = event.eventPrintMaterials?.length ?? 0;
    const printWithPreview = event.eventPrintMaterials?.filter(p => p.previewUrl || p.fileUrl)?.length ?? 0;
    const bannerCount = event.eventBanners?.length ?? 0;
    const digitalCount = event.eventDigitalMaterials?.length ?? 0;
    const totalCollateral = signageCount + printCount + bannerCount + digitalCount;

    if (totalCollateral > 0) {
      const totalWithAssets = signageWithPreview + printWithPreview +
        (event.eventBanners?.filter(b => b.previewUrl)?.length ?? 0) +
        (event.eventDigitalMaterials?.filter(d => d.previewUrl)?.length ?? 0);
      const assetReadiness = Math.round((totalWithAssets / totalCollateral) * 100);

      insights.push({
        id: `event-collateral-readiness-${event.id}`,
        type: 'analytics',
        title: 'Collateral Asset Readiness',
        summary: `${totalWithAssets} of ${totalCollateral} collateral items have design assets uploaded. ${signageCount} signage, ${printCount} print, ${bannerCount} banners, ${digitalCount} digital.`,
        value: `${assetReadiness}%`,
        valueLabel: 'Assets Uploaded',
        trend: assetReadiness >= 80 ? 'up' : assetReadiness >= 50 ? 'neutral' : 'down',
        trendValue: assetReadiness >= 80 ? 'Production ready' : assetReadiness >= 50 ? 'In progress' : 'Needs attention',
        date: now,
        priority: assetReadiness >= 80 ? 'low' : assetReadiness >= 50 ? 'medium' : 'high',
        category: 'Event Readiness',
        icon: 'FileText',
      });
    }

    // ── 2. Visual Identity Completeness ─────────────────────────
    const sections: SectionScore[] = [
      { label: 'Event Logos', filled: event.eventLogos?.length ?? 0, total: 2, category: 'Visual Identity' },
      { label: 'Color Palette', filled: event.colors?.length ?? 0, total: 3, category: 'Visual Identity' },
      { label: 'Typography', filled: event.typography?.length ?? 0, total: 1, category: 'Visual Identity' },
      { label: 'Gradients', filled: event.gradients?.length ?? 0, total: 1, category: 'Visual Identity' },
      { label: 'Patterns', filled: event.patterns?.length ?? 0, total: 1, category: 'Visual Identity' },
      { label: 'Imagery Direction', filled: event.imagery?.length ?? 0, total: 1, category: 'Visual Identity' },
    ];

    const completeSections = sections.filter(s => s.filled >= s.total).length;
    const visualScore = Math.round((completeSections / sections.length) * 100);
    const missingSections = sections.filter(s => s.filled < s.total).map(s => s.label);

    insights.push({
      id: `event-visual-identity-${event.id}`,
      type: 'analytics',
      title: 'Visual Identity Coverage',
      summary: missingSections.length > 0
        ? `Missing or incomplete: ${missingSections.slice(0, 3).join(', ')}${missingSections.length > 3 ? ` +${missingSections.length - 3} more` : ''}`
        : 'All core visual identity sections are populated — brand consistency is strong.',
      value: `${visualScore}%`,
      valueLabel: `${completeSections}/${sections.length} Sections`,
      trend: visualScore >= 80 ? 'up' : visualScore >= 50 ? 'neutral' : 'down',
      trendValue: visualScore === 100 ? 'Complete' : `${missingSections.length} gaps`,
      date: now,
      priority: visualScore >= 80 ? 'low' : visualScore >= 50 ? 'medium' : 'high',
      category: 'Design Cohesion',
      icon: 'Palette',
    });

    // ── 3. Sponsor & Partner Presence ───────────────────────────
    const sponsorCount = event.eventSponsors?.length ?? 0;
    const sponsorsWithLogos = event.eventSponsors?.filter(s => s.logoUrl)?.length ?? 0;
    const boothCount = event.partnerBooths?.length ?? 0;

    if (sponsorCount > 0) {
      const logoReadiness = Math.round((sponsorsWithLogos / sponsorCount) * 100);
      insights.push({
        id: `event-sponsor-readiness-${event.id}`,
        type: 'analytics',
        title: 'Sponsor Branding Readiness',
        summary: `${sponsorsWithLogos} of ${sponsorCount} sponsors have logos uploaded.${boothCount > 0 ? ` ${boothCount} partner booth${boothCount !== 1 ? 's' : ''} configured.` : ''}`,
        value: `${logoReadiness}%`,
        valueLabel: 'Logo Coverage',
        trend: logoReadiness >= 90 ? 'up' : logoReadiness >= 60 ? 'neutral' : 'down',
        trendValue: `${sponsorsWithLogos}/${sponsorCount} logos`,
        date: now,
        priority: logoReadiness >= 90 ? 'low' : logoReadiness >= 60 ? 'medium' : 'high',
        category: 'Event Readiness',
        icon: 'Building2',
      });
    }

    // ── 4. Event Operations Readiness ───────────────────────────
    const hasSchedule = (event.eventSchedule?.length ?? 0) > 0;
    const hasSpeakers = (event.eventSpeakers?.length ?? 0) > 0;
    const hasVenue = Boolean(event.eventLocation?.venueName);
    const hasDetails = Boolean(event.eventDetails?.eventDates && event.eventDetails?.location);
    const hasRegistration = Boolean(event.eventDetails?.registrationUrl);

    const opsChecklist = [
      { label: 'Event details', done: hasDetails },
      { label: 'Schedule/agenda', done: hasSchedule },
      { label: 'Speakers', done: hasSpeakers },
      { label: 'Venue info', done: hasVenue },
      { label: 'Registration link', done: hasRegistration },
    ];

    const opsDone = opsChecklist.filter(c => c.done).length;
    const opsScore = Math.round((opsDone / opsChecklist.length) * 100);
    const opsMissing = opsChecklist.filter(c => !c.done).map(c => c.label);

    insights.push({
      id: `event-ops-readiness-${event.id}`,
      type: 'update',
      title: 'Event Operations Checklist',
      summary: opsMissing.length > 0
        ? `Still needed: ${opsMissing.join(', ')}`
        : 'All core event operations items are in place.',
      value: `${opsDone}/${opsChecklist.length}`,
      valueLabel: 'Complete',
      trend: opsScore >= 80 ? 'up' : opsScore >= 60 ? 'neutral' : 'down',
      trendValue: opsScore === 100 ? 'All set' : `${opsMissing.length} remaining`,
      date: now,
      priority: opsScore >= 80 ? 'low' : opsScore >= 60 ? 'medium' : 'high',
      category: 'Event Readiness',
      icon: 'CheckCircle',
    });

    // ── 5. Marketing Channel Coverage ───────────────────────────
    const hasSocial = (event.social?.length ?? 0) > 0;
    const hasSocialAssets = (event.socialAssets?.length ?? 0) > 0;
    const hasWebsites = (event.websites?.length ?? 0) > 0;
    const hasEmailBanners = (event.emailBanners?.length ?? 0) > 0;
    const hasVideos = (event.eventVideos?.length ?? 0) > 0 || (event.videos?.length ?? 0) > 0;
    const hasPresentations = (event.presentations?.length ?? 0) > 0;

    const channels = [
      { label: 'Social profiles', done: hasSocial },
      { label: 'Social assets', done: hasSocialAssets },
      { label: 'Website links', done: hasWebsites },
      { label: 'Email banners', done: hasEmailBanners },
      { label: 'Video content', done: hasVideos },
      { label: 'Presentations', done: hasPresentations },
    ];

    const channelsDone = channels.filter(c => c.done).length;
    const channelScore = Math.round((channelsDone / channels.length) * 100);
    const missingChannels = channels.filter(c => !c.done).map(c => c.label);

    insights.push({
      id: `event-marketing-channels-${event.id}`,
      type: 'analytics',
      title: 'Marketing Channel Coverage',
      summary: missingChannels.length > 0
        ? `Uncovered channels: ${missingChannels.slice(0, 3).join(', ')}${missingChannels.length > 3 ? ` +${missingChannels.length - 3}` : ''}`
        : 'Full marketing channel coverage across social, web, email, video & presentations.',
      value: `${channelsDone}/${channels.length}`,
      valueLabel: 'Channels Active',
      trend: channelScore >= 80 ? 'up' : channelScore >= 50 ? 'neutral' : 'down',
      trendValue: channelScore === 100 ? 'Full coverage' : `${missingChannels.length} gaps`,
      date: now,
      priority: channelScore >= 80 ? 'low' : channelScore >= 50 ? 'medium' : 'high',
      category: 'Marketing Cohesion',
      icon: 'Megaphone',
    });

    // ── 6. Sub-Event Cohesion (master events only) ──────────────
    const subEvents = event.linkedGuides?.filter(g => g.type === 'event') ?? [];
    if (subEvents.length > 0) {
      const withCovers = subEvents.filter(e => (e as any).coverImage).length;
      const cohesionScore = Math.round((withCovers / subEvents.length) * 100);

      insights.push({
        id: `event-subevent-cohesion-${event.id}`,
        type: 'analytics',
        title: 'Regional Event Cohesion',
        summary: `${subEvents.length} regional sub-event${subEvents.length !== 1 ? 's' : ''} linked. ${withCovers} have branded cover imagery.`,
        value: `${subEvents.length}`,
        valueLabel: 'Sub-Events',
        trend: cohesionScore >= 80 ? 'up' : cohesionScore >= 50 ? 'neutral' : 'down',
        trendValue: cohesionScore === 100 ? 'All branded' : `${withCovers}/${subEvents.length} with covers`,
        date: now,
        priority: cohesionScore >= 80 ? 'low' : 'medium',
        category: 'Design Cohesion',
        icon: 'Globe',
      });
    }

    // ── 7. Overall Cohesiveness Score ────────────────────────────
    const allScores = [visualScore, opsScore, channelScore];
    if (totalCollateral > 0) {
      const assetReadiness = Math.round(
        ((signageWithPreview + printWithPreview +
          (event.eventBanners?.filter(b => b.previewUrl)?.length ?? 0) +
          (event.eventDigitalMaterials?.filter(d => d.previewUrl)?.length ?? 0))
          / totalCollateral) * 100
      );
      allScores.push(assetReadiness);
    }
    if (sponsorCount > 0) {
      allScores.push(Math.round((sponsorsWithLogos / sponsorCount) * 100));
    }

    const overallScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

    insights.unshift({
      id: `event-overall-cohesion-${event.id}`,
      type: 'analytics',
      title: 'Event Design & Marketing Cohesion',
      summary: overallScore >= 80
        ? 'Strong design and marketing alignment across all event touchpoints.'
        : overallScore >= 50
          ? 'Moderate cohesion — some sections need additional assets or content to achieve full alignment.'
          : 'Low cohesion — significant gaps in design assets, content, or marketing channels need attention.',
      value: `${overallScore}%`,
      valueLabel: 'Cohesion Score',
      trend: overallScore >= 80 ? 'up' : overallScore >= 50 ? 'neutral' : 'down',
      trendValue: overallScore >= 80 ? 'Strong' : overallScore >= 50 ? 'Moderate' : 'Needs work',
      date: now,
      priority: overallScore >= 80 ? 'low' : overallScore >= 50 ? 'medium' : 'high',
      category: 'Design Cohesion',
      icon: 'Sparkles',
    });

    return insights;
  }, [event, enabled]);

  return { cohesivenessInsights };
}
