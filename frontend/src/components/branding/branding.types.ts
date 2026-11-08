/**
 * WayRivo AI 2.0 — Official Aero W Brand Identity System Types
 * Defines properties, themes, variants, and dimensions for the custom Aero W symbol and logo components.
 */

export type BrandTheme =
  | 'primary'      // Ocean Blue (#1677D2) to Electric Cyan (#35D6E8) gradient
  | 'dark'         // Optimized for dark backgrounds (Cloud White + Electric Cyan)
  | 'light'        // Optimized for light backgrounds (Midnight Navy + Ocean Blue)
  | 'auto'         // Context-adaptive
  | 'monochrome'   // Single-color using currentColor
  | 'white'        // Solid pure white (#FFFFFF)
  | 'black';       // Solid pure black (#071B33 / #000000)

export type BrandVariant =
  | 'horizontal'   // [Aero W Symbol] + WAYRIVO AI (Standard landscape)
  | 'vertical'     // Stacked: [Aero W Symbol] over WAYRIVO AI
  | 'icon';        // Standalone Aero W Symbol

export type BrandSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

export interface AeroWMarkProps {
  /** Size preset or numeric pixel value */
  size?: BrandSize;
  /** Explicit width override (e.g., '100%', 48) */
  width?: number | string;
  /** Explicit height override (e.g., 'auto', 48) */
  height?: number | string;
  /** Color theme variant */
  theme?: BrandTheme;
  /** Custom solid color when theme is 'monochrome' */
  color?: string;
  /** Optional outer drop shadow / glow aura */
  glow?: boolean;
  /** Optional hover / micro-interaction animation */
  animated?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Accessible label / title for SVG */
  title?: string;
}

export interface WayRivoLogoProps {
  /** Logo layout variant: horizontal (default), vertical, or icon */
  variant?: BrandVariant;
  /** Theme palette: 'dark' (default on dark ui), 'light', 'primary', 'auto', 'monochrome' */
  theme?: BrandTheme;
  /** Pre-configured size preset or numeric pixel height for the mark */
  size?: BrandSize;
  /** Whether to render the official tagline: "TRAVEL SMARTER. EXPLORE FURTHER." */
  showTagline?: boolean;
  /** Whether to show the product version badge ("2.0") */
  withVersion?: boolean;
  /** Custom tagline text override */
  taglineText?: string;
  /** Optional link destination if the logo acts as a navigation anchor */
  href?: string;
  /** Extra CSS classes */
  className?: string;
  /** Glow aura on symbol */
  glow?: boolean;
}

export interface WayRivoIconProps extends AeroWMarkProps {
  /** Whether to wrap the mark in a rounded container badge */
  rounded?: boolean;
  /** Border style on container */
  border?: boolean;
  /** Background fill on container (e.g. gradient or surface-dark) */
  background?: boolean;
}

