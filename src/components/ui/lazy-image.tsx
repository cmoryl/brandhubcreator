import { forwardRef, useState, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Optional tiny placeholder data URL or low-res image shown blurred until the full image loads. */
  placeholderSrc?: string;
  /** Wrapper className applied to the absolutely-positioned container. */
  wrapperClassName?: string;
  /** Disable the skeleton shimmer (useful for tiny icons / logos). */
  noSkeleton?: boolean;
}

/**
 * Image with a skeleton + blur-up placeholder that fades out once the full
 * image finishes loading. Uses native loading="lazy" and decoding="async"
 * so off-screen images defer until they approach the viewport.
 *
 * Must be rendered inside a positioned (relative/absolute) container — the
 * image fills it via the supplied className (e.g. "w-full h-full object-cover").
 */
export const LazyImage = forwardRef<HTMLImageElement, LazyImageProps>(
  (
    {
      src,
      alt = "",
      className,
      wrapperClassName,
      placeholderSrc,
      noSkeleton,
      onLoad,
      onError,
      loading = "lazy",
      decoding = "async",
      ...rest
    },
    ref,
  ) => {
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);
    const isReady = loaded || errored;

    return (
      <>
        {!isReady && !noSkeleton && (
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 bg-muted/40 animate-pulse",
              wrapperClassName,
            )}
          />
        )}
        {!isReady && placeholderSrc && (
          <img
            aria-hidden="true"
            src={placeholderSrc}
            alt=""
            className={cn(className, "absolute inset-0 blur-lg scale-110")}
          />
        )}
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding}
          onLoad={(e) => {
            setLoaded(true);
            onLoad?.(e);
          }}
          onError={(e) => {
            setErrored(true);
            onError?.(e);
          }}
          className={cn(
            className,
            "transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
          )}
          {...rest}
        />
      </>
    );
  },
);
LazyImage.displayName = "LazyImage";
