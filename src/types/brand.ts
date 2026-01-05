export interface BrandColor {
  id: string;
  name: string;
  hex: string;
  usage?: string;
}

export interface BrandTypography {
  id: string;
  name: string;
  fontFamily: string;
  weight: string;
  usage: string;
}

export interface BrandLogo {
  id: string;
  name: string;
  url: string;
  variant: 'primary' | 'secondary' | 'icon' | 'wordmark';
}

export interface BrandGuide {
  id: string;
  name: string;
  description: string;
  colors: BrandColor[];
  typography: BrandTypography[];
  logos: BrandLogo[];
  createdAt: Date;
  updatedAt: Date;
}
