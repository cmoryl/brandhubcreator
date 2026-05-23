/**
 * AbTestedIcon — drop-in wrapper around IconSvgRender that resolves the
 * active A/B test for a given slot key, serves a weighted variant (or the
 * promoted winner once the test is completed), logs impression on mount,
 * and calls `logClick` when the host invokes `onClick`.
 *
 * Falls back to the provided `fallbackIcon` whenever no active test exists.
 */

import { useMemo } from 'react';
import { IconSvgRender } from './IconSvgRender';
import type { BrandIconography } from '@/types/brand';
import {
  useActiveIconAbTestForSlot,
  useIconAbTest,
} from '@/hooks/useIconAbTest';

interface AbTestedIconProps {
  slotKey: string;
  fallbackIcon: BrandIconography;
  size: number;
  color?: string;
  className?: string;
  organizationId?: string | null;
  libraryId?: string | null;
  onClick?: () => void;
}

export const AbTestedIcon = ({
  slotKey,
  fallbackIcon,
  size,
  color,
  className,
  organizationId,
  libraryId,
  onClick,
}: AbTestedIconProps) => {
  const { data: active } = useActiveIconAbTestForSlot(slotKey, {
    organizationId,
    libraryId,
  });

  const { variant, variants, logClick } = useIconAbTest(active?.testId);

  // If the test is completed and has a promoted winner, always serve that.
  const served = useMemo(() => {
    if (!active) return null;
    if (active.status === 'completed' && active.winnerVariantId) {
      return variants.find((v) => v.id === active.winnerVariantId) ?? variant;
    }
    return variant;
  }, [active, variant, variants]);

  const icon: BrandIconography = served
    ? {
        ...fallbackIcon,
        id: served.icon_id || fallbackIcon.id,
        name: served.label || fallbackIcon.name,
        svgPath: served.svg_path || fallbackIcon.svgPath,
        viewBox: served.view_box || fallbackIcon.viewBox || '0 0 24 24',
      }
    : fallbackIcon;

  const handleClick = onClick
    ? () => {
        if (served) logClick();
        onClick();
      }
    : undefined;

  const content = (
    <IconSvgRender icon={icon} size={size} color={color} className={className} />
  );

  if (!handleClick) return content;
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center bg-transparent border-0 p-0 cursor-pointer"
    >
      {content}
    </button>
  );
};

export default AbTestedIcon;
