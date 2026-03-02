/**
 * Theme Preview — shows how palette colors look applied to a
 * realistic UI mockup in both light and dark themes.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonitorSmartphone, Sun, Moon } from 'lucide-react';

interface LabColor {
  id: string;
  hex: string;
  name: string;
}

const getContrastText = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? '#1a1a1a' : '#ffffff';
};

const lighten = (hex: string, amount: number): string => {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(amount * 255));
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(amount * 255));
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(amount * 255));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const darken = (hex: string, amount: number): string => {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(amount * 255));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(amount * 255));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(amount * 255));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

function MiniUI({ primary, secondary, background, foreground, label, icon: Icon }: {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  label: string;
  icon: typeof Sun;
}) {
  const primaryText = getContrastText(primary);
  const mutedFg = foreground + '99';
  const cardBg = label === 'Light' ? lighten(background, 0.03) : lighten(background, 0.05);
  const borderColor = foreground + '1a';

  return (
    <div className="flex-1 min-w-[260px]">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">{label} Mode</span>
      </div>
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: background, color: foreground, borderColor }}
      >
        {/* Nav */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded" style={{ backgroundColor: primary }} />
            <span className="text-xs font-bold">Brand</span>
          </div>
          <div className="flex gap-3">
            <span className="text-[10px]" style={{ color: mutedFg }}>Home</span>
            <span className="text-[10px]" style={{ color: mutedFg }}>About</span>
            <span className="text-[10px] font-semibold" style={{ color: primary }}>Contact</span>
          </div>
        </div>

        {/* Hero */}
        <div className="px-4 py-5 space-y-2" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}15)` }}>
          <p className="text-sm font-bold">Welcome to our platform</p>
          <p className="text-[10px] leading-relaxed" style={{ color: mutedFg }}>
            A short description of what this product does and why it matters.
          </p>
          <div className="flex gap-2 pt-1">
            <div
              className="px-3 py-1 rounded-md text-[10px] font-semibold"
              style={{ backgroundColor: primary, color: primaryText }}
            >
              Get Started
            </div>
            <div
              className="px-3 py-1 rounded-md text-[10px] font-semibold"
              style={{ border: `1px solid ${primary}`, color: primary }}
            >
              Learn More
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="px-4 py-3 grid grid-cols-2 gap-2">
          {['Feature 1', 'Feature 2'].map(label => (
            <div
              key={label}
              className="rounded-lg p-2.5"
              style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
            >
              <div className="w-6 h-6 rounded-md mb-1.5 flex items-center justify-center text-[10px]" style={{ backgroundColor: secondary, color: getContrastText(secondary) }}>
                ✦
              </div>
              <p className="text-[10px] font-semibold">{label}</p>
              <p className="text-[8px] mt-0.5" style={{ color: mutedFg }}>Short description text</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 text-center" style={{ borderTop: `1px solid ${borderColor}` }}>
          <p className="text-[8px]" style={{ color: mutedFg }}>© 2026 Brand. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export function ThemePreview({ colors }: { colors: LabColor[] }) {
  if (colors.length < 2) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MonitorSmartphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Add at least 2 colors to preview themes</p>
      </div>
    );
  }

  // Pick roles: primary = first, secondary = second, rest as accents
  const primary = colors[0].hex;
  const secondary = colors.length > 1 ? colors[1].hex : primary;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MonitorSmartphone className="h-4 w-4 text-primary" />
          Theme Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 flex-wrap">
          <MiniUI
            primary={primary}
            secondary={secondary}
            background="#FFFFFF"
            foreground="#1a1a1a"
            label="Light"
            icon={Sun}
          />
          <MiniUI
            primary={primary}
            secondary={secondary}
            background="#0f1117"
            foreground="#e5e5e5"
            label="Dark"
            icon={Moon}
          />
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t">
          <span className="text-[10px] text-muted-foreground">Roles:</span>
          {colors.slice(0, 4).map((c, i) => (
            <div key={c.id} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border" style={{ backgroundColor: c.hex }} />
              <span className="text-[10px] text-muted-foreground">
                {i === 0 ? 'Primary' : i === 1 ? 'Secondary' : `Accent ${i - 1}`}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
