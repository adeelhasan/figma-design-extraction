# 09 - Generate Previews

## Purpose
Create visual previews of extracted tokens for validation and documentation. Uses **Lucide icons** for icon rendering and **smart placeholders** for images.

## Prerequisites

Before generating previews, ensure these have been extracted:
- `assets/icon-manifest.json` from step 10 (icon extraction)
- `assets/asset-manifest.json` from step 11 (image asset extraction)
- `preview/layouts/data/*.json` from step 07b (screen content)

## Preview Types

### 1. Artifact Preview (Conversation)
Inline React components for immediate feedback during extraction.

### 2. Static HTML Preview (Shareable)
Self-contained HTML files in `preview/` directory.

### 3. Dev Server Routes (Interactive) - Optional
Preview routes in existing app for full testing.

## Icon and Placeholder Integration

### Loading Icon Manifest

Load the icon manifest to resolve icon references in previews:

```typescript
interface IconManifest {
  library: string;
  cdnUrl: string;
  icons: {
    mapped: Array<{ figmaName: string; libraryIcon: string }>;
    unmapped: Array<{ figmaName: string; nodeId: string }>;
  };
}

function loadIconManifest(): IconManifest | null {
  const path = 'design-system/assets/icon-manifest.json';
  return fileExists(path) ? loadJson(path) : null;
}
```

### Lucide CDN Integration

Include Lucide in HTML previews:

```html
<!-- Lucide Icons CDN -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<script>
  // Initialize icons after DOM loads
  document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
  });
</script>
```

### Icon Rendering

Render icons using Lucide data attributes:

```html
<!-- Icon with Lucide -->
<i data-lucide="layout-dashboard" class="icon icon-md"></i>

<!-- Icon with fallback for unmapped -->
<span class="icon-placeholder" data-icon-name="custom-icon">
  <i data-lucide="circle" class="icon icon-md"></i>
</span>
```

### Icon CSS Classes

```css
/* Icon Sizes */
.icon { display: inline-block; vertical-align: middle; }
.icon-xs { width: 12px; height: 12px; }
.icon-sm { width: 16px; height: 16px; }
.icon-md { width: 20px; height: 20px; }
.icon-lg { width: 24px; height: 24px; }
.icon-xl { width: 32px; height: 32px; }

/* Icon Colors (inherit from parent or use token) */
.icon { stroke: currentColor; fill: none; stroke-width: 2; }
.icon-primary { stroke: var(--color-primary); }
.icon-secondary { stroke: var(--color-text-secondary); }
.icon-white { stroke: var(--color-white); }

/* Icon in gradient background (sidebar active) */
.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  background: var(--gradient-primary);
}
.icon-box .icon { stroke: white; }
```

### Image Placeholder Rendering

Render image placeholders with appropriate styling:

```html
<!-- Avatar Placeholder -->
<div class="asset-placeholder asset-avatar" style="width: 74px; height: 74px;">
  <span class="avatar-initials">JD</span>
</div>

<!-- Banner/Background Placeholder -->
<div class="asset-placeholder asset-banner" style="width: 100%; height: 200px;">
  <i data-lucide="image" class="icon icon-xl" style="opacity: 0.3;"></i>
</div>

<!-- Photo Placeholder -->
<div class="asset-placeholder asset-photo" style="width: 300px; height: 200px;">
  <i data-lucide="image" class="icon icon-lg" style="opacity: 0.5;"></i>
</div>
```

### Placeholder CSS

```css
/* Asset Placeholder Base */
.asset-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

/* Avatar Placeholders */
.asset-avatar {
  background: var(--gradient-secondary);
  border-radius: var(--radius-lg);
  color: var(--color-white);
  font-weight: var(--font-weight-semibold);
}
.avatar-initials {
  font-size: 1.25em;
  text-transform: uppercase;
}

/* Banner/Background Placeholders */
.asset-banner,
.asset-background {
  background: var(--gradient-primary);
}

/* Photo Placeholders */
.asset-photo,
.asset-image {
  background: var(--gradient-secondary);
}

/* Illustration Placeholders */
.asset-illustration {
  background: var(--color-gray-2);
  border: 2px dashed var(--color-gray-4);
}

/* Logo Placeholders */
.asset-logo {
  background: var(--color-gray-3);
  color: var(--color-gray-7);
  font-weight: var(--font-weight-bold);
  font-size: 0.875em;
}
```

### Helper: Render Icon Reference

```typescript
function renderIconRef(iconRef: string): string {
  // Parse icon reference: "lucide:icon-name" or "placeholder:name"
  if (iconRef.startsWith('lucide:')) {
    const iconName = iconRef.replace('lucide:', '');
    return `<i data-lucide="${iconName}" class="icon"></i>`;
  }

  if (iconRef.startsWith('placeholder:')) {
    const name = iconRef.replace('placeholder:', '');
    return `<span class="icon-placeholder" title="${name}"><i data-lucide="circle" class="icon"></i></span>`;
  }

  // Fallback
  return `<i data-lucide="circle" class="icon"></i>`;
}
```

### Helper: Render Asset Placeholder

```typescript
function renderAssetPlaceholder(
  asset: { type: string; name: string; placeholder: PlaceholderStrategy; dimensions: { width: number; height: number } }
): string {
  const { type, name, placeholder, dimensions } = asset;
  const style = `width: ${dimensions.width}px; height: ${dimensions.height}px;`;

  switch (placeholder.type) {
    case 'initials':
      const initial = name.charAt(0).toUpperCase();
      return `<div class="asset-placeholder asset-${type}" style="${style}">
        <span class="avatar-initials">${initial}</span>
      </div>`;

    case 'gradient':
      return `<div class="asset-placeholder asset-${type}" style="${style}">
        <i data-lucide="image" class="icon icon-lg" style="opacity: 0.3;"></i>
      </div>`;

    case 'solid':
      return `<div class="asset-placeholder asset-${type}" style="${style}">
        ${placeholder.config?.text || ''}
      </div>`;

    case 'svg':
      return `<div class="asset-placeholder asset-${type}" style="${style}">
        <i data-lucide="image" class="icon icon-xl" style="opacity: 0.2;"></i>
      </div>`;

    default:
      return `<div class="asset-placeholder" style="${style}"></div>`;
  }
}
```

### Helper: Render Text with Per-Element Styles

Apply extracted text styles to preserve visual hierarchy:

```typescript
interface TextStyle {
  fontWeight?: number;
  opacity?: number;
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  color?: string;
}

function renderStyledText(text: string, style?: TextStyle): string {
  if (!style) return text;

  const cssProps: string[] = [];

  if (style.fontWeight && style.fontWeight >= 600) {
    cssProps.push('font-weight: var(--font-weight-semibold)');
  }

  if (style.opacity !== undefined && style.opacity < 1) {
    cssProps.push(`opacity: ${style.opacity}`);
  }

  if (style.textCase === 'UPPER') {
    cssProps.push('text-transform: uppercase');
  }

  if (style.textDecoration === 'UNDERLINE') {
    cssProps.push('text-decoration: underline');
  }

  if (style.color) {
    cssProps.push(`color: ${style.color}`);
  }

  if (cssProps.length === 0) return text;

  return `<span style="${cssProps.join('; ')}">${text}</span>`;
}

// Render label-value pair with distinct styling
function renderLabelValue(label: string, value: string, labelStyle?: TextStyle, valueStyle?: TextStyle): string {
  return `
    <span class="label-value">
      ${renderStyledText(label, labelStyle || { opacity: 0.7 })}
      ${renderStyledText(value, valueStyle || { fontWeight: 600 })}
    </span>
  `;
}
```

### Helper: Render Action Composition

Render buttons/actions with icon + text together:

```typescript
interface ActionComposition {
  type: 'button' | 'icon-button' | 'link' | 'icon-action';
  label?: string;
  icon?: { ref: string; position: 'left' | 'right' | 'only'; size: number };
  variant: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  gap?: number;
  style?: { fontWeight: number; textCase: string };
}

function renderAction(action: ActionComposition): string {
  const variantClasses = {
    'primary': 'btn-primary',
    'secondary': 'btn-secondary',
    'outline': 'btn-outline',
    'text': 'btn-text',
    'danger': 'btn-danger'
  };

  const btnClass = variantClasses[action.variant] || 'btn-secondary';

  // Icon-only button
  if (action.type === 'icon-button' && action.icon) {
    return `<button class="${btnClass} btn-icon">${renderIconRef(action.icon.ref)}</button>`;
  }

  // Button with icon + text
  if (action.icon && action.label) {
    const iconHtml = renderIconRef(action.icon.ref);
    const gap = action.gap ? `gap: ${action.gap}px;` : '';
    const textStyle = action.style?.textCase === 'UPPER' ? 'text-transform: uppercase;' : '';

    if (action.icon.position === 'left') {
      return `<button class="${btnClass}" style="display: flex; align-items: center; ${gap}">${iconHtml}<span style="${textStyle}">${action.label}</span></button>`;
    } else {
      return `<button class="${btnClass}" style="display: flex; align-items: center; ${gap}"><span style="${textStyle}">${action.label}</span>${iconHtml}</button>`;
    }
  }

  // Text-only link/button
  const textStyle = action.style?.textCase === 'UPPER' ? 'text-transform: uppercase;' : '';
  return `<button class="${btnClass}" style="${textStyle}">${action.label || ''}</button>`;
}
```

### Helper: Render Section with Auto-Layout

Apply layout direction from extracted auto-layout props:

```typescript
interface AutoLayoutProps {
  mode: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  gap: number;
  alignItems: string;
  justifyContent: string;
}

function getLayoutStyles(layout?: AutoLayoutProps): string {
  if (!layout || layout.mode === 'NONE') return '';

  const styles: string[] = ['display: flex'];

  // Direction
  if (layout.mode === 'HORIZONTAL') {
    styles.push('flex-direction: row');
  } else {
    styles.push('flex-direction: column');
  }

  // Gap
  if (layout.gap) {
    styles.push(`gap: ${layout.gap}px`);
  }

  // Alignment (map Figma values to CSS)
  const alignMap: Record<string, string> = {
    'MIN': 'flex-start',
    'CENTER': 'center',
    'MAX': 'flex-end',
    'BASELINE': 'baseline'
  };

  const justifyMap: Record<string, string> = {
    'MIN': 'flex-start',
    'CENTER': 'center',
    'MAX': 'flex-end',
    'SPACE_BETWEEN': 'space-between'
  };

  if (layout.alignItems) {
    styles.push(`align-items: ${alignMap[layout.alignItems] || 'flex-start'}`);
  }

  if (layout.justifyContent) {
    styles.push(`justify-content: ${justifyMap[layout.justifyContent] || 'flex-start'}`);
  }

  return styles.join('; ');
}

// Render a section container with layout
function renderSectionContainer(sectionId: string, layout?: AutoLayoutProps, content: string = ''): string {
  const layoutStyle = getLayoutStyles(layout);
  return `<div class="section" id="${sectionId}" style="${layoutStyle}">${content}</div>`;
}
```

## Process

### Step 1: Generate Token Preview Artifact

Create inline artifact for conversation:

```tsx
// Color Preview Artifact
const ColorPreview = () => {
  const colors = {
    primitives: {
      primary: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
      neutral: ['#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827'],
    },
    semantic: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981',
    },
    surface: {
      background: '#ffffff',
      elevated: '#f9fafb',
      overlay: 'rgba(0,0,0,0.5)',
    },
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      muted: '#9ca3af',
      inverse: '#ffffff',
    }
  };
  
  return (
    <div className="p-6 space-y-8">
      <h2 className="text-xl font-bold">Color Tokens</h2>
      
      {/* Primitives */}
      <section>
        <h3 className="font-semibold mb-3">Primitives</h3>
        {Object.entries(colors.primitives).map(([name, scale]) => (
          <div key={name} className="flex gap-1 mb-2">
            <span className="w-20 text-sm">{name}</span>
            {scale.map((color, i) => (
              <div key={i} className="w-10 h-10 rounded" style={{backgroundColor: color}} title={color} />
            ))}
          </div>
        ))}
      </section>
      
      {/* Semantic */}
      <section>
        <h3 className="font-semibold mb-3">Semantic</h3>
        <div className="flex gap-4">
          {Object.entries(colors.semantic).map(([name, color]) => (
            <div key={name} className="text-center">
              <div className="w-16 h-16 rounded-lg shadow" style={{backgroundColor: color}} />
              <span className="text-xs mt-1">{name}</span>
            </div>
          ))}
        </div>
      </section>
      
      {/* Text on Surface */}
      <section>
        <h3 className="font-semibold mb-3">Text / Surface</h3>
        <div className="p-4 rounded-lg" style={{backgroundColor: colors.surface.background}}>
          <p style={{color: colors.text.primary}}>Primary text</p>
          <p style={{color: colors.text.secondary}}>Secondary text</p>
          <p style={{color: colors.text.muted}}>Muted text</p>
        </div>
      </section>
    </div>
  );
};
```

### Step 2: Generate Static HTML Preview

Template: `templates/preview/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design System Preview - {projectName}</title>
  <!-- Lucide Icons CDN -->
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <style>
    /* Embed extracted tokens */
    {tokensCSS}

    /* Icon Styles */
    .icon { display: inline-block; vertical-align: middle; stroke: currentColor; fill: none; stroke-width: 2; }
    .icon-xs { width: 12px; height: 12px; }
    .icon-sm { width: 16px; height: 16px; }
    .icon-md { width: 20px; height: 20px; }
    .icon-lg { width: 24px; height: 24px; }
    .icon-xl { width: 32px; height: 32px; }
    .icon-primary { stroke: var(--color-primary, #3b82f6); }
    .icon-box { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: var(--gradient-primary, linear-gradient(135deg, #7c3aed, #3b82f6)); }
    .icon-box .icon { stroke: white; }

    /* Asset Placeholder Styles */
    .asset-placeholder { display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .asset-avatar { background: var(--gradient-secondary, linear-gradient(135deg, #8b5cf6, #6366f1)); border-radius: 12px; color: white; font-weight: 600; }
    .asset-banner, .asset-background { background: var(--gradient-primary, linear-gradient(135deg, #7c3aed, #3b82f6)); }
    .asset-photo, .asset-image { background: var(--gradient-secondary, linear-gradient(135deg, #8b5cf6, #6366f1)); }
    .asset-logo { background: #e5e7eb; color: #6b7280; font-weight: 700; }
    .avatar-initials { font-size: 1.25em; text-transform: uppercase; }

    /* Preview styles */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: var(--font-family-sans, system-ui, sans-serif);
      background: var(--color-surface, #f9fafb);
      color: var(--color-text-primary, #111827);
      line-height: 1.5;
    }
    .preview-container { max-width: 1200px; margin: 0 auto; padding: 32px; }
    .preview-section { background: white; border-radius: 8px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .preview-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    .color-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px; }
    .color-swatch { text-align: center; }
    .color-box { width: 100%; height: 64px; border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(0,0,0,0.1); }
    .color-name { font-size: 12px; font-weight: 500; }
    .color-value { font-size: 11px; color: #6b7280; font-family: monospace; }
    .scale-row { display: flex; gap: 4px; margin-bottom: 12px; align-items: center; }
    .scale-label { width: 80px; font-size: 14px; font-weight: 500; }
    .scale-swatch { width: 48px; height: 48px; border-radius: 4px; }
    .type-sample { margin-bottom: 16px; padding: 12px; background: #f9fafb; border-radius: 4px; }
    .type-meta { font-size: 11px; color: #6b7280; font-family: monospace; margin-top: 4px; }
    .spacing-bar { background: var(--color-primary, #3b82f6); height: 24px; border-radius: 4px; margin-bottom: 4px; }
    .effect-demo { padding: 24px; background: white; border-radius: var(--radius-md, 8px); margin-bottom: 16px; }
    nav { background: white; border-bottom: 1px solid #e5e7eb; padding: 16px 32px; position: sticky; top: 0; z-index: 10; }
    nav a { margin-right: 24px; text-decoration: none; color: #4b5563; font-weight: 500; }
    nav a:hover { color: var(--color-primary, #3b82f6); }
    .copy-btn { font-size: 11px; padding: 2px 6px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer; margin-left: 8px; }
    .copy-btn:hover { background: #d1d5db; }
  </style>
</head>
<body>
  <nav>
    <a href="#colors">Colors</a>
    <a href="#typography">Typography</a>
    <a href="#spacing">Spacing</a>
    <a href="#effects">Effects</a>
  </nav>
  
  <div class="preview-container">
    <h1 class="preview-title">{projectName} Design System</h1>
    <p style="color: #6b7280; margin-bottom: 32px;">
      Extracted: {extractionDate}<br>
      Source: <a href="{figmaUrl}" target="_blank">{fileName}</a>
    </p>
    
    <!-- Colors Section -->
    <section id="colors" class="preview-section">
      <h2 class="section-title">Colors</h2>
      
      <h3 style="font-size: 14px; font-weight: 600; margin: 16px 0 12px;">Primitives</h3>
      {#each colorScales as scale}
      <div class="scale-row">
        <span class="scale-label">{scale.name}</span>
        {#each scale.colors as color}
        <div class="scale-swatch" style="background-color: {color.value};" title="{color.token}: {color.value}"></div>
        {/each}
      </div>
      {/each}
      
      <h3 style="font-size: 14px; font-weight: 600; margin: 24px 0 12px;">Semantic</h3>
      <div class="color-grid">
        {#each semanticColors as color}
        <div class="color-swatch">
          <div class="color-box" style="background-color: {color.value};"></div>
          <div class="color-name">{color.name}</div>
          <div class="color-value">{color.token} <button class="copy-btn" onclick="copyToClipboard('{color.token}')">copy</button></div>
        </div>
        {/each}
      </div>
    </section>
    
    <!-- Typography Section -->
    <section id="typography" class="preview-section">
      <h2 class="section-title">Typography</h2>
      
      {#each typographyStyles as style}
      <div class="type-sample">
        <div style="font-family: {style.fontFamily}; font-size: {style.fontSize}; font-weight: {style.fontWeight}; line-height: {style.lineHeight};">
          {style.name}
        </div>
        <div class="type-meta">
          {style.fontSize} / {style.lineHeight} / {style.fontWeight}
          <button class="copy-btn" onclick="copyToClipboard('font-size: var(--font-size-{style.token})')">copy</button>
        </div>
      </div>
      {/each}
    </section>
    
    <!-- Spacing Section -->
    <section id="spacing" class="preview-section">
      <h2 class="section-title">Spacing</h2>
      
      {#each spacingScale as space}
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="width: 100px; font-size: 14px;">{space.name}</span>
        <div class="spacing-bar" style="width: {space.value}px;"></div>
        <span style="margin-left: 12px; font-size: 12px; color: #6b7280;">{space.value}px</span>
        <button class="copy-btn" onclick="copyToClipboard('var(--spacing-{space.token})')">copy</button>
      </div>
      {/each}
    </section>
    
    <!-- Effects Section -->
    <section id="effects" class="preview-section">
      <h2 class="section-title">Effects</h2>
      
      <h3 style="font-size: 14px; font-weight: 600; margin: 16px 0 12px;">Shadows</h3>
      <div style="display: flex; gap: 24px; flex-wrap: wrap;">
        {#each shadows as shadow}
        <div style="text-align: center;">
          <div class="effect-demo" style="width: 120px; height: 80px; box-shadow: {shadow.value};"></div>
          <div style="font-size: 12px; font-weight: 500;">{shadow.name}</div>
        </div>
        {/each}
      </div>
      
      <h3 style="font-size: 14px; font-weight: 600; margin: 24px 0 12px;">Border Radius</h3>
      <div style="display: flex; gap: 24px; flex-wrap: wrap;">
        {#each radii as radius}
        <div style="text-align: center;">
          <div style="width: 80px; height: 80px; background: var(--color-primary, #3b82f6); border-radius: {radius.value};"></div>
          <div style="font-size: 12px; font-weight: 500; margin-top: 8px;">{radius.name}</div>
          <div style="font-size: 11px; color: #6b7280;">{radius.value}</div>
        </div>
        {/each}
      </div>
    </section>
  </div>
  
  <script>
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        // Could show toast notification
      });
    }

    // Initialize Lucide icons
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });
  </script>
</body>
</html>
```

### Step 3: Generate Component Preview (Optional)

If components were extracted, create component preview:

```html
<!-- preview/components.html -->
<section id="components" class="preview-section">
  <h2 class="section-title">Components</h2>
  
  {#each components as component}
  <div class="component-preview">
    <h3>{component.name}</h3>
    <p class="component-desc">{component.description}</p>
    
    <div class="variant-grid">
      {#each component.variants as variant}
      <div class="variant-item">
        <div class="variant-render">
          <!-- Rendered variant preview -->
        </div>
        <div class="variant-label">{variant.label}</div>
      </div>
      {/each}
    </div>
  </div>
  {/each}
</section>
```

### Step 4: Generate Layout Preview

Create HTML mockups showing layout structure using extracted tokens:

```html
<!-- preview/layouts.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Layout Previews - {projectName}</title>
  <style>
    /* Import extracted tokens */
    {tokensCSS}

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-family-primary, system-ui, sans-serif);
      background: var(--color-background, #0a0a0a);
      color: var(--color-text-primary, #ffffff);
      line-height: 1.5;
      padding: 32px;
    }

    .layout-preview {
      margin-bottom: 48px;
      border: 1px dashed var(--color-border, #262626);
      border-radius: var(--radius-xl, 12px);
      padding: 24px;
    }

    .layout-title {
      font-size: var(--font-size-2xl, 24px);
      font-weight: var(--font-weight-bold, 700);
      margin-bottom: 8px;
    }

    .layout-description {
      color: var(--color-text-secondary, #a1a1a1);
      margin-bottom: 24px;
    }

    .layout-grid {
      display: grid;
      min-height: 400px;
      border: 1px solid var(--color-border, #262626);
      border-radius: var(--radius-md, 8px);
      overflow: hidden;
    }

    .layout-grid.sidebar-content {
      grid-template-columns: 258px 1fr;
      gap: 10px;
    }

    .layout-grid.centered {
      place-items: center;
    }

    .grid-area {
      background: var(--color-surface, #111);
      border: 1px dashed var(--color-border, #262626);
      padding: var(--spacing-md, 12px);
      display: flex;
      flex-direction: column;
    }

    .area-label {
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-muted, #666);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--spacing-sm, 8px);
    }

    .area-dimensions {
      font-size: var(--font-size-xs, 12px);
      color: var(--color-primary, #7dd3fc);
      font-family: monospace;
    }

    .sidebar-area {
      background: var(--color-dark-500, #0a0a0a);
      border-right: 1px solid var(--color-border, #262626);
    }

    .content-area {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg, 16px);
      padding: var(--spacing-lg, 16px);
    }

    .section-placeholder {
      background: var(--color-surface-elevated, #1a1a1a);
      border-radius: var(--radius-md, 8px);
      padding: var(--spacing-md, 12px);
      border: 1px dashed var(--color-border, #333);
    }

    .header-section { height: 64px; }
    .kpi-section { height: 120px; display: flex; gap: var(--spacing-md, 12px); }
    .kpi-placeholder { flex: 1; background: var(--color-surface, #111); border-radius: var(--radius-xl, 12px); }
    .tabs-section { height: 40px; }
    .chart-section { flex: 1; min-height: 200px; }
    .data-section { height: 200px; }
  </style>
</head>
<body>
  <h1 style="font-size: 32px; font-weight: 700; margin-bottom: 32px;">Layout Previews</h1>

  <!-- Dashboard Layout -->
  <div class="layout-preview">
    <h2 class="layout-title">Dashboard Layout</h2>
    <p class="layout-description">Sidebar + Content with KPIs, charts, and data table</p>

    <div class="layout-grid sidebar-content">
      <div class="grid-area sidebar-area">
        <span class="area-label">Sidebar</span>
        <span class="area-dimensions">258px width</span>
        <div style="margin-top: auto; font-size: 11px; color: #666;">
          Nav items, user profile
        </div>
      </div>

      <div class="grid-area content-area">
        <div class="section-placeholder header-section">
          <span class="area-label">Header</span>
          <span class="area-dimensions">64px height</span>
        </div>

        <div class="section-placeholder kpi-section">
          <div class="kpi-placeholder"></div>
          <div class="kpi-placeholder"></div>
          <div class="kpi-placeholder"></div>
          <div class="kpi-placeholder"></div>
        </div>

        <div class="section-placeholder tabs-section">
          <span class="area-label">Tab Navigation</span>
        </div>

        <div class="section-placeholder chart-section">
          <span class="area-label">Charts Section</span>
        </div>

        <div class="section-placeholder data-section">
          <span class="area-label">Data Table</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Generate additional layouts from layouts.md -->
  {#each layouts as layout}
  <div class="layout-preview">
    <h2 class="layout-title">{layout.name}</h2>
    <p class="layout-description">{layout.description}</p>
    <div class="layout-grid {layout.gridClass}">
      {layout.structure}
    </div>
  </div>
  {/each}

  <footer style="padding: 24px 0; text-align: center; color: #666; font-size: 12px;">
    Layout mockups using extracted design tokens
  </footer>
</body>
</html>
```

### Step 5: Generate Individual Screen HTML Files

**CRITICAL:** For EACH screen discovered during extraction, create a corresponding HTML preview file.

#### 5.1 Discover Screens

List all screens from `specs/layouts/`:
```bash
ls design-system/specs/layouts/*.md | xargs -n1 basename | sed 's/.md$//'
```

#### 5.2 Generate HTML for Each Screen

For EACH screen name returned, create:
```
preview/layouts/{ScreenName}.html
```

Each file should:
1. Load all token CSS files (`../../tokens/colors.css`, etc.)
2. Include Lucide CDN: `<script src="https://unpkg.com/lucide@latest"></script>`
3. Load content from `preview/layouts/data/{ScreenName}.json`
4. Implement the layout structure from `specs/layouts/{ScreenName}.md`
5. Include "Back to Layouts" navigation link
6. Call `lucide.createIcons()` after DOM loads

#### 5.3 Generate Layout Index

Create `preview/layouts/index.html` with:
- Links to each `{ScreenName}.html`
- Preview cards showing screen dimensions and pattern
- "Back to Overview" link to `../index.html`

#### 5.4 Verification

**MUST VERIFY before proceeding:**
```bash
SCREEN_COUNT=$(ls design-system/specs/layouts/*.md 2>/dev/null | wc -l)
PREVIEW_COUNT=$(ls design-system/preview/layouts/*.html 2>/dev/null | grep -v index.html | wc -l)

if [ "$SCREEN_COUNT" != "$PREVIEW_COUNT" ]; then
  echo "ERROR: Missing preview files. Expected $SCREEN_COUNT, found $PREVIEW_COUNT"
  # Go back and create missing files
fi
```

### Step 6: Report

```
✓ Previews generated

Files created:
├── preview/index.html              — Full preview dashboard
├── preview/tokens.html             — Token reference only
├── preview/layouts/index.html      — Layout gallery
└── preview/layouts/{Screen}.html   — ONE per discovered screen

[Inline artifact: token color preview]

Open preview:
  file://{absolutePath}/preview/index.html

Or serve locally:
  npx serve design-system/preview
```

## Artifact Templates

### Color Preview Artifact

When showing inline preview, generate React:

```tsx
const ColorTokenPreview = () => (
  <div className="p-4 bg-white rounded-lg">
    <h3 className="font-bold mb-4">Extracted Colors</h3>
    <div className="grid grid-cols-5 gap-2">
      {/* Generate from extracted colors */}
    </div>
  </div>
);
```

### Typography Preview Artifact

```tsx
const TypographyPreview = () => (
  <div className="p-4 bg-white rounded-lg space-y-4">
    <h3 className="font-bold mb-4">Typography Scale</h3>
    {/* Render each text style */}
  </div>
);
```

### Full Token Preview Artifact

```tsx
const TokenPreview = () => {
  const [tab, setTab] = useState('colors');
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex gap-4 mb-4 border-b">
        <button onClick={() => setTab('colors')}>Colors</button>
        <button onClick={() => setTab('typography')}>Typography</button>
        <button onClick={() => setTab('spacing')}>Spacing</button>
        <button onClick={() => setTab('effects')}>Effects</button>
      </div>
      
      {tab === 'colors' && <ColorSection />}
      {tab === 'typography' && <TypographySection />}
      {tab === 'spacing' && <SpacingSection />}
      {tab === 'effects' && <EffectsSection />}
    </div>
  );
};
```

## Preview Command Support

For `/preview-tokens [category]` command:

```
/preview-tokens          → Show all tokens (artifact)
/preview-tokens colors   → Show color tokens only
/preview-tokens typography → Show typography only
/preview-tokens spacing  → Show spacing scale
/preview-tokens effects  → Show shadows/radii
```

Generate appropriate artifact based on category filter.

## Output Files

```
design-system/
├── preview/
│   ├── index.html              — Main preview dashboard
│   ├── tokens.html             — Token reference
│   └── layouts/
│       ├── index.html          — Layout gallery/navigation
│       ├── {Screen}.html       — ONE per discovered screen (dynamic)
│       └── data/
│           └── {Screen}.json   — Content data per screen
```

**Important:** The number of `{Screen}.html` files MUST match the number of screens discovered in `specs/layouts/*.md`.

## Completion

After preview generation:

```
✓ Extraction complete!

Generated design system at:
design-system/

Contents:
├── SKILL.md              — Usage instructions
├── tokens/
│   ├── colors.css        — {n} color tokens
│   ├── typography.css    — {n} typography tokens
│   ├── spacing.css       — {n} spacing tokens
│   └── effects.css       — {n} effect tokens
├── specs/
│   ├── components.md     — {n} component specs
│   ├── layouts.md        — Layout overview
│   └── layouts/*.md      — {n} screen specs
├── extraction-meta.json  — Sync metadata
├── extraction-report.md  — Validation report
└── preview/
    ├── index.html        — Main preview dashboard
    ├── tokens.html       — Token reference
    └── layouts/
        ├── index.html    — Layout gallery
        └── {Screen}.html — {n} screen previews (one per discovered screen)

Next steps:
1. Review preview: open design-system/preview/index.html
2. Import tokens: @import 'design-system/tokens/colors.css';
3. Generate components: /gen-component Button
4. Keep in sync: /sync --check
```
