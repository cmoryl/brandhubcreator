import { useMemo } from "react";
import { StudioGradient, toCssGradient, toSvg } from "@/lib/gradientStudio";

interface Props {
  gradient: StudioGradient;
  className?: string;
  style?: React.CSSProperties;
  /** Force SVG rendering for mesh / noise so what-you-see matches export. */
  renderSvg?: boolean;
}

/**
 * Renders a StudioGradient. For simple linear/radial/conic without noise we
 * use a CSS background (cheap + animatable). For mesh or noise we render an
 * inline SVG so the preview matches the SVG/PNG export 1:1.
 */
export const GradientPreview = ({ gradient, className, style, renderSvg }: Props) => {
  const needsSvg = renderSvg ?? (gradient.type === "mesh" || gradient.noise.enabled);
  const css = useMemo(() => toCssGradient(gradient), [gradient]);
  const svg = useMemo(
    () => (needsSvg ? toSvg(gradient, { width: 800, height: 500 }) : ""),
    [gradient, needsSvg],
  );

  if (needsSvg) {
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    return (
      <div
        className={className}
        style={{
          backgroundImage: `url("${dataUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          ...style,
        }}
      />
    );
  }

  const anim = gradient.animation.enabled
    ? {
        backgroundSize: "200% 200%",
        animation: `gs-${gradient.animation.mode} ${gradient.animation.durationMs}ms ease-in-out infinite alternate`,
      }
    : {};

  return (
    <div
      className={className}
      style={{ background: css, ...anim, ...style }}
    />
  );
};
