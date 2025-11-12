# Universal History Simulator - Accessibility Guide
**Implementation Date:** January 2025
**WCAG Target:** AA Compliance

---

## 🎯 **Accessibility Features Implemented**

### ✅ **Keyboard Navigation**
- **Escape key**: Close any open modal
- **Enter key**: Confirm actions in modals
- **Tab/Shift+Tab**: Navigate through interactive elements
- **Focus visible**: Clear blue outline on keyboard focus

### ✅ **Screen Reader Support**
- ARIA labels on all interactive elements
- ARIA roles for dialogs and navigation
- Screen reader announcements for modal opens/closes
- Alt text for icons (aria-hidden on decorative icons)

### ✅ **Focus Management**
- Focus trapping in modals (Tab cycles within modal)
- Auto-focus on first interactive element
- Focus returns to trigger element on modal close

### ✅ **Visual Indicators**
- High contrast focus rings
- Clear button hover states
- Disabled states visually distinct
- Loading states announced to screen readers

---

## 📚 **Components with Full Accessibility**

### 1. **ModalWrapper** (Universal Modal Component)
**File:** `components/ui/ModalWrapper.tsx`

**Features:**
- Keyboard navigation (Esc to close, Enter to confirm)
- Focus trapping with focus-trap-react
- ARIA labels and roles
- Screen reader announcements
- Backdrop click to close (optional)

**Usage:**
```tsx
<ModalWrapper
  isOpen={isOpen}
  onClose={handleClose}
  title="Character Profile"
  description="View and edit your character information"
>
  <div>Modal content here</div>
</ModalWrapper>
```

**Keyboard Shortcuts:**
- `Esc` - Close modal
- `Enter` - Confirm (if onConfirm provided)
- `Tab` - Navigate forward
- `Shift+Tab` - Navigate backward

---

### 2. **SettingsPanel**
**File:** `components/SettingsPanel.tsx`

**Accessibility Features:**
- Escape key to close
- ARIA labels on all toggles
- role="switch" on toggle buttons
- aria-checked state
- Keyboard-accessible close button

**Updates Made:**
```typescript
// Added keyboard navigation
useModalKeyboard({ onClose, disabled: !isOpen });

// Enhanced close button
<button
  onClick={onClose}
  aria-label="Close settings panel"
  title="Close settings (Esc)"
>
  <X aria-hidden="true" />
</button>
```

---

### 3. **TopNavBarPolished**
**File:** `components/TopNavBarPolished.tsx`

**Accessibility Features:**
- ARIA labels on all navigation buttons
- aria-expanded for dropdowns
- aria-haspopup for menus
- Keyboard-accessible search input
- role="searchbox" on WorldWeaver input

**Updates Made:**
```typescript
// Game Mode button
<button
  aria-label={`Current game mode: ${mode.name}. Click to change`}
  aria-expanded={showGameModePanel}
  aria-haspopup="true"
>

// Navigation buttons
{NAV_BUTTON_GROUPS.game.map(button => (
  <button
    aria-label={button.label}
    title={button.label}
  >
    <Icon aria-hidden="true" />
  </button>
))}

// WorldWeaver input
<input
  aria-label="WorldWeaver: Create a custom world"
  role="searchbox"
/>
```

---

## 🛠️ **Developer Guide**

### **Using useModalKeyboard Hook**

```typescript
import { useModalKeyboard } from '../hooks/useModalKeyboard';

const MyModal = ({ isOpen, onClose, onSubmit }) => {
  // Basic usage - Escape to close
  useModalKeyboard({ onClose });

  // With confirm action - Escape to close, Enter to confirm
  useModalKeyboard({
    onClose,
    onConfirm: onSubmit
  });

  // With disabled state
  useModalKeyboard({
    onClose,
    disabled: !isOpen  // Only active when modal is open
  });

  return <div>Modal content</div>;
};
```

---

### **Creating Accessible Buttons**

```typescript
// ✅ Good - Full accessibility
<button
  onClick={handleClick}
  aria-label="Close modal"
  title="Close (Esc)"
  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <X aria-hidden="true" />
</button>

// ❌ Bad - No accessibility
<button onClick={handleClick}>
  <X />
</button>
```

**Key Points:**
1. Always provide `aria-label` for icon-only buttons
2. Add `title` for keyboard users (shows shortcut if applicable)
3. Include focus ring styles
4. Mark decorative icons with `aria-hidden="true"`

---

### **Creating Accessible Inputs**

```typescript
// ✅ Good - Full accessibility
<label htmlFor="search" className="sr-only">
  Search items
</label>
<input
  id="search"
  type="text"
  aria-label="Search items"
  placeholder="Search..."
  role="searchbox"
/>

// ❌ Bad - No accessibility
<input
  type="text"
  placeholder="Search..."
/>
```

**Key Points:**
1. Provide visual or screen-reader-only label
2. Use `aria-label` if no visual label
3. Add appropriate `role` (searchbox, combobox, etc.)
4. Ensure keyboard accessible

---

### **Creating Accessible Modals**

```typescript
// ✅ Good - Using ModalWrapper
<ModalWrapper
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  description="Are you sure you want to proceed?"
>
  <p>This action cannot be undone.</p>
</ModalWrapper>

// ❌ Bad - Manual modal without accessibility
<div className="fixed inset-0">
  <div>
    <h2>Confirm Action</h2>
    <button onClick={handleClose}>X</button>
  </div>
</div>
```

**Key Points:**
1. Use ModalWrapper for automatic accessibility
2. Always provide title (for ARIA label)
3. Optionally provide description (for context)
4. Keyboard navigation handled automatically

---

## 🎨 **CSS Accessibility Utilities**

### **Screen Reader Only**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**Usage:**
```tsx
<label htmlFor="search" className="sr-only">
  Search items
</label>
```

### **Focus Visible**
```css
.focus-visible:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

**Usage:**
```tsx
<button className="focus-visible">
  Click me
</button>
```

### **Skip to Main Content**
```css
.skip-link {
  position: absolute;
  left: -9999px;
  /* Appears on Tab */
}

.skip-link:focus {
  left: 0;
  top: 0;
}
```

**Usage:**
```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

---

## 📋 **Accessibility Checklist for New Components**

### **Interactive Elements**
- [ ] All buttons have aria-label or visible text
- [ ] Icon-only buttons marked with aria-hidden on icon
- [ ] Focus styles visible (outline or ring)
- [ ] Disabled state visually distinct
- [ ] Hover state distinct from focus

### **Modals/Dialogs**
- [ ] role="dialog" and aria-modal="true"
- [ ] aria-labelledby points to title
- [ ] aria-describedby for description (if needed)
- [ ] Focus trapped within modal
- [ ] Escape key closes modal
- [ ] Focus returns on close

### **Forms**
- [ ] All inputs have associated labels
- [ ] Error messages linked with aria-describedby
- [ ] Required fields marked with aria-required
- [ ] Invalid fields marked with aria-invalid
- [ ] Form submission keyboard accessible

### **Navigation**
- [ ] Keyboard accessible (Tab, Enter)
- [ ] Current page indicated (aria-current)
- [ ] Dropdown menus use aria-expanded
- [ ] Submenus use aria-haspopup

### **Dynamic Content**
- [ ] Loading states announced (aria-live)
- [ ] Error messages announced
- [ ] Success messages announced
- [ ] Progress indicators labeled

---

## 🧪 **Testing Accessibility**

### **Manual Testing**

1. **Keyboard Navigation Test**
   - Navigate entire app using only keyboard
   - Ensure all interactive elements reachable
   - Verify focus visible at all times
   - Test modals trap focus correctly

2. **Screen Reader Test**
   - Use NVDA (Windows) or VoiceOver (Mac)
   - Verify all content announced correctly
   - Check button labels make sense
   - Ensure modal announcements work

3. **Focus Management Test**
   - Open modal → focus should be trapped
   - Close modal → focus should return
   - Navigate through form → logical order

### **Automated Testing**

```bash
# Install accessibility linter
npm install eslint-plugin-jsx-a11y --save-dev

# Run lighthouse accessibility audit
npx lighthouse http://localhost:5173 --only-categories=accessibility
```

**Target Scores:**
- Lighthouse Accessibility: **90+**
- WCAG Level: **AA**
- Keyboard Navigation: **100% functional**

---

## 🎹 **Global Keyboard Shortcuts**

### **Currently Implemented:**
- `Esc` - Close any open modal
- `F5` - Quick save (from ModalHub.tsx:214)
- `D` - Toggle dev tooltip (from ModalHub.tsx:207)
- **`Arrow Left/Right`** - Navigate between tabs (in modals with tabs)
- **`Home/End`** - Jump to first/last tab (in modals with tabs)

### **Recommended Future Shortcuts:**
- `I` - Toggle inventory
- `C` - Open character sheet
- `Q` - Open quests
- `M` - Open world map
- `/` - Focus search
- `?` - Show keyboard shortcuts help

**Implementation:**
```typescript
import { useKeyboardShortcut } from '../hooks/useModalKeyboard';

// In your component:
useKeyboardShortcut('i', () => toggleInventory());
useKeyboardShortcut('c', () => toggleCharacter());
useKeyboardShortcut('?', () => showKeyboardHelp());
```

---

## 📊 **Accessibility Metrics**

### **Current Status:**
- ✅ Keyboard navigation: **Implemented in modals**
- ✅ ARIA labels: **Added to nav buttons, modals**
- ✅ Focus management: **Implemented with focus-trap-react**
- ✅ Screen reader support: **Basic announcements**
- ⚠️ Color contrast: **Review needed** (target 4.5:1)
- ⚠️ Mobile accessibility: **Limited** (needs touch improvements)

### **Next Steps:**
1. Add keyboard shortcuts for major actions (I, C, Q, M)
2. Audit color contrast ratios across all themes
3. Add skip-to-main-content link
4. Implement keyboard shortcut help modal
5. Test with real screen reader users

---

## 🔗 **Resources**

- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Practices**: https://www.w3.org/WAI/ARIA/apg/
- **Focus Trap React**: https://github.com/focus-trap/focus-trap-react
- **Testing Tools**:
  - **axe DevTools**: Browser extension for accessibility testing
  - **NVDA**: Free screen reader (Windows)
  - **VoiceOver**: Built-in screen reader (Mac)
  - **Lighthouse**: Built into Chrome DevTools

---

## 🎨 **Tab Navigation Pattern** (NEW!)

### **Using useSimpleTabNavigation**

For modals or components with tabs, use `useSimpleTabNavigation` to enable arrow key navigation:

```typescript
import { useSimpleTabNavigation } from '../hooks/useTabNavigation';

const MyTabComponent = () => {
  const tabs = ['overview', 'details', 'history'];
  const [activeTab, setActiveTab] = useState('overview');

  // Enable arrow key navigation
  useSimpleTabNavigation({
    tabs,
    activeTab,
    onChange: setActiveTab,
    enabled: true,  // disable when modal closed
    loop: true      // wrap around at ends
  });

  return (
    <div role="tablist" aria-label="Section tabs">
      {tabs.map(tab => (
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          aria-label={`${tab} tab`}
          tabIndex={activeTab === tab ? 0 : -1}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
```

**Keyboard Support:**
- **Arrow Left** - Previous tab
- **Arrow Right** - Next tab
- **Home** - First tab
- **End** - Last tab
- **Tab** - Navigate to/from tabs

**ARIA Requirements:**
- Container: `role="tablist"` + `aria-label`
- Buttons: `role="tab"` + `aria-selected`
- Active tab: `tabIndex={0}`
- Inactive tabs: `tabIndex={-1}`

---

## 💡 **Common Accessibility Patterns**

### **Accessible Toggle**
```tsx
<button
  role="switch"
  aria-checked={isEnabled}
  onClick={toggle}
  className="toggle-button"
>
  <span className="sr-only">
    {isEnabled ? 'Enabled' : 'Disabled'}
  </span>
</button>
```

### **Accessible Dropdown**
```tsx
<button
  aria-expanded={isOpen}
  aria-haspopup="true"
  onClick={toggleDropdown}
>
  Options
  <ChevronDown aria-hidden="true" />
</button>
{isOpen && (
  <ul role="menu">
    <li role="menuitem">Option 1</li>
    <li role="menuitem">Option 2</li>
  </ul>
)}
```

### **Accessible Tab Panel**
```tsx
<div role="tablist">
  <button
    role="tab"
    aria-selected={activeTab === 'overview'}
    aria-controls="overview-panel"
  >
    Overview
  </button>
</div>
<div
  role="tabpanel"
  id="overview-panel"
  aria-labelledby="overview-tab"
>
  {/* Tab content */}
</div>
```

---

## 🎯 **Success Criteria**

A component is considered **fully accessible** when:

1. ✅ **Keyboard accessible** - All functionality available via keyboard
2. ✅ **Screen reader friendly** - All content announced correctly
3. ✅ **Focus managed** - Focus order logical, visible at all times
4. ✅ **ARIA compliant** - Proper roles, states, and labels
5. ✅ **Color contrast** - Meets WCAG AA (4.5:1 for text)
6. ✅ **Tested** - Manual keyboard & screen reader testing passed

---

## 📞 **Getting Help**

If you encounter accessibility issues or need guidance:

1. Check this guide first
2. Review WCAG guidelines
3. Test with keyboard and screen reader
4. File an issue with [accessibility] tag

**Remember:** Accessibility is not optional - it's essential for all users.
