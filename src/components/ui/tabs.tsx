import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

// Radix Tabs builds aria-controls / aria-labelledby from React's useId(),
// which emits IDs containing ":" (e.g. "radix-:r1:"). Those IDs are valid
// HTML5, but axe-core's aria-valid-attr-value rule still flags them. We
// transparently rewrite colons to dashes inside the Tabs subtree so both
// the attribute value and the referenced element id stay in sync.
const SANITIZED_ATTRS = ["id", "aria-controls", "aria-labelledby"] as const;

function sanitizeColonIds(root: HTMLElement) {
  const candidates = root.querySelectorAll<HTMLElement>(
    '[id*=":"], [aria-controls*=":"], [aria-labelledby*=":"]',
  );
  candidates.forEach((el) => {
    for (const attr of SANITIZED_ATTRS) {
      const value = el.getAttribute(attr);
      if (value && value.includes(":")) {
        el.setAttribute(attr, value.replace(/:/g, "-"));
      }
    }
  });
}

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ children, ...props }, _ref) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    sanitizeColonIds(node);
    const observer = new MutationObserver(() => sanitizeColonIds(node));
    observer.observe(node, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [...SANITIZED_ATTRS],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ display: "contents" }}>
      <TabsPrimitive.Root {...props}>{children}</TabsPrimitive.Root>
    </div>
  );
});
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-foreground/75",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
