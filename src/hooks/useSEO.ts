import { useEffect } from 'react';

interface SEOOptions {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

const DEFAULT_TITLE = 'BrandHub - Brand Guide Creator';
const DEFAULT_DESCRIPTION = 'Create and manage comprehensive brand guides';
const DEFAULT_OG_IMAGE = 'https://lovable.dev/opengraph-image-p98pqg.png';

export const useSEO = ({
  title,
  description,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
}: SEOOptions) => {
  useEffect(() => {
    // Title
    const fullTitle = title ? `${title} | BrandHub` : DEFAULT_TITLE;
    document.title = fullTitle;

    // Helper to set/update meta tag
    const setMetaTag = (selector: string, attribute: string, value: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        const attrName = selector.includes('property=') ? 'property' : 'name';
        const attrValue = selector.match(/["']([^"']+)["']/)?.[1];
        if (attrValue) {
          element.setAttribute(attrName, attrValue);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    // Description
    setMetaTag('meta[name="description"]', 'content', description || DEFAULT_DESCRIPTION);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonicalUrl) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', canonicalUrl);
    } else if (canonical) {
      canonical.remove();
    }

    // Open Graph
    setMetaTag('meta[property="og:title"]', 'content', ogTitle || title || DEFAULT_TITLE);
    setMetaTag('meta[property="og:description"]', 'content', ogDescription || description || DEFAULT_DESCRIPTION);
    setMetaTag('meta[property="og:type"]', 'content', ogType);
    setMetaTag('meta[property="og:image"]', 'content', ogImage || DEFAULT_OG_IMAGE);
    if (canonicalUrl) {
      setMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    }

    // Twitter
    setMetaTag('meta[name="twitter:card"]', 'content', twitterCard);
    setMetaTag('meta[name="twitter:title"]', 'content', ogTitle || title || DEFAULT_TITLE);
    setMetaTag('meta[name="twitter:description"]', 'content', ogDescription || description || DEFAULT_DESCRIPTION);
    setMetaTag('meta[name="twitter:image"]', 'content', ogImage || DEFAULT_OG_IMAGE);

    // Cleanup - restore defaults when unmounting
    return () => {
      document.title = DEFAULT_TITLE;
      setMetaTag('meta[name="description"]', 'content', DEFAULT_DESCRIPTION);
      setMetaTag('meta[property="og:title"]', 'content', DEFAULT_TITLE);
      setMetaTag('meta[property="og:description"]', 'content', DEFAULT_DESCRIPTION);
      setMetaTag('meta[property="og:image"]', 'content', DEFAULT_OG_IMAGE);
      
      const canonicalEl = document.querySelector('link[rel="canonical"]');
      if (canonicalEl) canonicalEl.remove();
    };
  }, [title, description, canonicalUrl, ogTitle, ogDescription, ogImage, ogType, twitterCard]);
};
