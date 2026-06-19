# Morita Design Language System & Styling Guidelines

Welcome to the **Morita Design System**. This documentation compiles the aesthetic principles, color palettes, typographic combinations, and ready-to-use Tailwind class formulas developed for Morita. Keep this file locally to build new pages, interfaces, and custom widgets with perfect visual consistency.

---

## 1. Aesthetic Narrative: "Swiss Neo-Brutalist"

Morita combines the typographic integrity of Swiss International style with high-contrast, flat Neo-Brutalist layouts. It trades off soft, default gradients for sharp lines, solid block shadows, warm cream backgrounds, and technical monospaced details.

### Core Visual Principles
1. **Architectural Honesty**: High contrast, thick dark borders (`border-border-dark`), and offset container blocks instead of blurred drop shadows.
2. **Dynamic Asymmetry**: Hover events trigger translation animations (e.g., `-translate-x-0.5 -translate-y-0.5`) corresponding to shadow compression, creating tactile physics.
3. **Warm Functional Contrast**: Clean, readable sans-serif text resting on a warm, organic background, highlighted by electric blueberry elements.

---

## 2. Color Palette & Utility Tokens

Tailwind CSS v4 handles configuration directly inside standard native theme imports within `globals.css`:

```css
@theme {
  --color-brand-bg: #FCFBF2;
  --color-blueberry: #5A60D3;
  --color-blueberry-dark: #2E3166;
  --color-blueberry-light: #D2D7FC;
  --color-blueberry-cream: #F1F3FF;
  --color-border-dark: #1E2044;
}
```

### Palettes Breakdown

| Token Name | Hex Code | Best Use Scenario |
| :--- | :--- | :--- |
| `brand-bg` | `#FCFBF2` | Primary page & container background. A warm cream color that avoids eye fatigue. |
| `border-dark` | `#1E2044` | High-contrast outlines, thick borders, dark texts, buttons, and titles. |
| `blueberry` | `#5A60D3` | Main call-to-actions, primary state icons, badges, and focus frames. |
| `blueberry-dark` | `#2E3166` | Deep navy heading accents, secure system layers, states, and dark backgrounds. |
| `blueberry-light`| `#D2D7FC` | Cool light-blue hover transitions, passive states, and badge highlights. |
| `blueberry-cream`| `#F1F3FF` | Subdued backdrop for code components, alerts, blocks, or card backgrounds. |

---

## 3. Typography & Pairings

Morita specifies three distinct font families loaded gracefully over next/font/google:

* **Display (Headings)**: `Space Grotesk` (Tailwind Class: `font-display`)
  * Characterised by geometric apertures and brutalist details. Used strictly in uppercase with high weights (`font-black`) and tight line spacing (`tracking-tight` or `tracking-tighter`).
* **Body Text**: `Inter` (Tailwind Class: `font-sans`)
  * Renowned for state-of-the-art legibility in body copy. Used for descriptions, inputs, lists, and metadata.
* **Metadata & Technical Logs**: `JetBrains Mono` (Tailwind Class: `font-mono`)
  * Provides high-end precision. Used for code fragments, numbers, categories, status trackers, and pill warnings.

---

## 4. Reusable Blueprint Recipes

Copy-paste these exact code constructs into your local JSX/TSX elements to preserve structural consistency:

### A. Solid Neo-Brutalist Card
Cards feature a thick `border-2 md:border-3` of `#1E2044` accompanied by a flat block shadow that compresses on hover.

```tsx
<div className="bg-white border-2 border-border-dark rounded-xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all">
  <span className="font-mono text-[10px] font-black text-blueberry block uppercase tracking-wider">
    ITEM_ID: 0x92f...
  </span>
  <h3 className="font-display font-black text-xl text-border-dark mt-2 uppercase tracking-tight">
    VOID KATANA
  </h3>
  <p className="font-sans text-xs text-border-dark/70 mt-2 leading-relaxed">
    Natively authenticated and stored securely in the player Kiosk.
  </p>
</div>
```

### B. High-Contrast Interactive Buttons

#### Primary Big Button
```tsx
<button className="px-8 py-4 bg-blueberry text-white border-3 border-border-dark text-base font-display font-black rounded-xl shadow-[5px_5px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_var(--color-blueberry-light)] transition-all active:translate-y-0 cursor-pointer">
  Connect Wallet Pass
</button>
```

#### Secondary Minimalist Button
```tsx
<button className="px-5 py-2.5 bg-white text-border-dark border-2 border-border-dark text-xs font-mono font-black rounded-lg shadow-[2.5px_2.5px_0px_0px_var(--color-border-dark)] hover:bg-blueberry-cream transition-all">
  Read Documentation
</button>
```

### C. Technical Meta-Badge / Pill
```tsx
<div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-border-dark rounded-full shadow-[2px_2px_0px_0px_var(--color-border-dark)]">
  <span className="w-2 h-2 bg-blueberry rounded-full animate-pulse" />
  <span className="text-[10px] font-mono font-black text-blueberry-dark uppercase tracking-tight">
    V1.2 RECOVERY ONLINE
  </span>
</div>
```

### D. Custom Form Inputs
```tsx
<div className="relative">
  <input 
    type="text" 
    placeholder="Search assets..." 
    className="w-full bg-blueberry-cream/10 text-xs font-sans text-border-dark pl-10 pr-4 py-3 border-2 border-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 placeholder-border-dark/40"
  />
</div>
```

---

## 5. UI Layout Structures

* **Page Background Grid Pattern**: Apply this absolute layer behind your main elements:
  ```tsx
  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(30,32,68,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,32,68,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
  ```
* **Dividers**: Prefer thin dashed margins for structure separation over solid horizontal lines:
  ```tsx
  <div className="w-full border-t border-dashed border-border-dark/15 my-8" />
  ```

---

## 6. CSS Global Transitions Setup
Apply a default ease transition in your components for smoother experiences:
```tsx
// Using motion animations (from motion/react)
import { motion } from 'motion/react';

<motion.div 
  initial={{ opacity: 0, y: 15 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
  ...
</motion.div>
```

Prepared with care for the **Morita Developer Ecosystem**. Build beautifully on Sui!
