import { themeQuartz, colorSchemeDark } from 'ag-grid-community';

/**
 * Premium WayRivo AI Dark Theme for AG Grid (v33+ Theming API)
 * Eliminates Error #239 (CSS collision) and matches WayRivo Midnight Navy & Electric Cyan styling
 */
export const wayrivoAgGridTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: '#090d16',
  foregroundColor: '#f1f5f9',
  headerBackgroundColor: '#0f172a',
  headerTextColor: '#94a3b8',
  oddRowBackgroundColor: '#0c1322',
  borderColor: '#1e293b',
  accentColor: '#06b6d4',
  rowHoverColor: '#1e293b80',
  selectedRowBackgroundColor: '#06b6d420',
  borderRadius: 8,
  fontSize: 12,
  rowHeight: 48,
  headerHeight: 44,
});

