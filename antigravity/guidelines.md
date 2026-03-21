# 🎨 UI Guidelines - SISVENT (Inventory SaaS)

## 🌙 General Theme
- Dark mode only
- Modern SaaS dashboard style
- Clean, minimal and professional
- Use soft shadows and subtle contrasts
- Rounded corners (lg, xl)

---

## 🎨 Color System

### Primary
- Blue: #4D7CFE
- Used for: buttons, highlights, active states

### Secondary
- Purple: #A855F7
- Used for: accents, tags, secondary actions

### Tertiary
- Teal: #2DD4BF
- Used for: success states, indicators

### Backgrounds
- Main background: #0F172A
- Card background: #1E293B
- Hover: slightly lighter than card

### Text Colors
- Primary text: #FFFFFF
- Secondary text: #94A3B8
- Disabled: #64748B

---

## 🔤 Typography

### Headings
- Bold
- Large size (text-xl, text-2xl)
- Used for titles and main sections

### Body
- Regular weight
- text-sm or text-base
- Used for descriptions and general content

### Labels
- Medium weight
- text-xs or text-sm
- Used for buttons, inputs, tags

---

## 🧱 Layout Rules

- Sidebar fixed on the left
- Top navbar with:
  - Search input
  - User profile
  - Actions (notifications, settings)
  
- Main content:
  - Padding: p-4 or p-6
  - Use grid for dashboards

- Use spacing consistently (gap-4, gap-6)

---

## 🧩 Components

### Cards
- Background: card color
- Rounded-xl
- Padding: p-4 or p-5
- Shadow-sm
- Used for metrics and grouped data

---

### Buttons

#### Primary
- Background: Primary color
- Text: white
- Rounded-lg

#### Secondary
- Outline or darker background
- Subtle hover effect

---

### Inputs
- Dark background
- Rounded-lg
- Subtle border
- Placeholder in secondary text color

---

### Tables
- Full width
- Dark style
- Hover row effect
- Soft separators (no harsh borders)

Columns:
- Left aligned
- Clear spacing
- Consistent padding

---

### Badges / Status

Use colors:

- 🟢 Green → Success / Active / In Stock
- 🟡 Yellow → Warning / Low stock
- 🔴 Red → Critical / Out of stock

---

### Progress Bars
- Rounded
- Smooth colors
- Used for stock levels

---

## 📊 Data Visualization

- Use cards for KPIs
- Use charts (line, bar) for trends
- Use progress bars for percentages

---

## ⚠️ Business UI Rules

- Stock status must always be visual (color + label)
- Important metrics must be visible at top (cards)
- Actions must be clearly visible (edit, delete)

---

## 🚫 Restrictions

- Do NOT use light theme
- Do NOT change color palette
- Do NOT mix different UI styles
- Do NOT use inconsistent spacing
- Always reuse components

---

## ✅ Consistency Rule

All modules must follow:
- Same colors
- Same spacing
- Same typography
- Same component style

This ensures a professional SaaS look.