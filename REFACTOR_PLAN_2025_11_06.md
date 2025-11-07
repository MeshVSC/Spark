# Spark Code Cleanup & Refactoring Plan

**Date Created**: 2025-11-06
**Codebase Size**: 11,475 lines of TypeScript/TSX
**Status**: Planning Phase

---

## Executive Summary

Spark is a well-structured React task management application with a solid foundation, but has accumulated technical debt through organic growth. The codebase is **not bloated** (11.5k lines is reasonable for this feature set), but suffers from:

- **Code duplication** (icon functions, subtask forms)
- **Large, monolithic components** (6 files over 550 lines each)
- **Critical drag-and-drop bugs** (10+ identified issues)
- **No testing infrastructure** (Playwright installed but unused)
- **Dead code** (old component files, console.logs)

**Recommended Approach**: Incremental cleanup (Option B) - safer, allows continuous use, validates each phase.

---

## Current State Analysis

### Technology Stack
- **Frontend**: React 19.0.0, TypeScript 5.7.2 (strict mode), Vite 6.2.0
- **Backend**: Supabase (PostgreSQL + real-time subscriptions)
- **Styling**: Tailwind CSS 3.x, PostCSS
- **Tooling**: ESLint, Prettier, Playwright (unused)

### Code Distribution

| Directory | Lines | % | Purpose |
|-----------|-------|---|---------|
| **components/** | 9,076 | 79% | React UI components |
| **lib/** | 1,686 | 15% | Database queries, utilities, drag-drop |
| **stores/** | 251 | 2% | State management (Context-based) |
| **contexts/** | 180 | 2% | React context providers |
| **Root files** | 252 | 2% | App.tsx, main.tsx |
| **TOTAL** | **11,475** | 100% | All TypeScript/TSX |

### Largest Files (Refactoring Candidates)

| File | Lines | Status | Issue |
|------|-------|--------|-------|
| Sidebar.tsx | 1,093 | ⚠️ CRITICAL | Too large, should be 4-5 components |
| SparkApp.tsx | 712 | ⚠️ HIGH | Should extract modal manager |
| Settings.tsx | 618 | ⚠️ HIGH | Complex single-purpose component |
| TaskForm.tsx | 596 | ⚠️ HIGH | Could consolidate with TaskEditForm |
| TaskEditForm.tsx | 593 | ⚠️ HIGH | ~90% overlap with TaskForm |
| ProjectForm.tsx | 556 | ⚠️ MEDIUM | Large but single-purpose |
| TaskList.tsx | 430 | ✅ OK | Acceptable size |
| DragDropComponents.tsx | 395 | ⚠️ MEDIUM | Overly complex handle detection |

---

## Critical Issues Identified

### 1. Code Duplication

#### A. Icon Function Duplication
- **Locations**:
  - `Sidebar.tsx` - `getAreaIcon()` (75 lines)
  - `SparkApp.tsx` - Identical `getAreaIcon()` (75 lines)
- **Impact**: 150 lines of duplicate code, maintenance burden
- **Fix**: Extract to `src/lib/icons.ts`
- **Effort**: 15 minutes

#### B. Subtask Form Duplication
- **Files**:
  - `SubtaskForm.tsx` (95 lines) - Used in TaskItem
  - `SubtaskFormUnified.tsx` (361 lines) - Used in SparkApp
- **Impact**: Two implementations of similar functionality
- **Fix**: Consolidate into single unified component
- **Effort**: 1-2 hours

#### C. Dead Code
- **Files**:
  - `TaskItem_old.tsx` (239 lines) - Appears unused
- **Impact**: Confusing codebase, maintenance overhead
- **Fix**: Safe deletion after verification
- **Effort**: 30 minutes

---

### 2. Drag-and-Drop System Issues (CRITICAL)

The drag-and-drop system has **10 critical bugs** causing unreliable behavior:

#### Issue #1: Task Filtering Bug (HIGHEST PRIORITY)
**Location**: `Sidebar.tsx:155`

```typescript
allTasks: Object.values(projectTasks).flat().map(t => ({ id: t.id, sort_order: t.sort_order }))
```

**Problem**: When dropping a task into Project A, it considers tasks from ALL projects (B, C, D, etc.) when calculating position. This causes incorrect sort_order values.

**Impact**: Tasks appear in wrong positions after drag-drop.

**Fix**: Filter tasks to only include those in the target project/area.

---

#### Issue #2: Fractional Ordering Time Bomb
**Location**: `lib/dragDrop.ts:68-71`

```typescript
if (gap < 0.000001) {
  console.warn('⚠️ Items too close, using fallback ordering');
  newOrder = prevOrder + 0.5; // Doesn't actually rebalance!
}
```

**Problem**: After ~20-30 reorderings between same items, gap becomes microscopic. "Fallback" doesn't rebalance—just adds 0.5 to broken number.

**Impact**: Eventually causes floating-point precision errors, duplicate sort orders, items that won't move.

**Fix**: Implement proper rebalancing algorithm (regenerate all sort orders as 1000, 2000, 3000, etc.).

---

#### Issue #3: Inconsistent Data Sources
- **Sidebar** (line 155): Uses `Object.values(projectTasks).flat()` - WRONG
- **TaskList** (lines 302-327): Carefully filters by project/area - CORRECT

**Problem**: Same drag operation behaves differently depending on drop location.

**Fix**: Centralize data filtering logic.

---

#### Issue #4: Race Conditions with UI Updates
After a drop:
1. Database update (async)
2. Sidebar manually calls `getProjects()`, `getAreas()`, `getTaskStats()`
3. Real-time subscriptions fire
4. UI updates multiple times

**Problem**: UI jumps around, shows items in wrong positions temporarily.

**Fix**: Implement optimistic updates with rollback on error.

---

#### Issue #5: Complex Drag Handle Detection
**Location**: `DragDropComponents.tsx:14-93`

Three different detection methods:
1. Marking elements with `__isDragHandle` DOM property
2. Traversing parent tree looking for marks
3. Fallback `.closest('.drag-handle')` search

**Problem**: Overly complex, fragile. Fallback allows drags that didn't start from handle.

**Fix**: Use single, reliable detection method.

---

#### Issue #6: Excessive Debug Logging
**Count**: 30+ console.log statements across drag-drop files

**Problem**:
- Makes debugging harder (noise)
- Performance impact
- Indicates code has been problematic

**Fix**: Remove all debug logs, add proper error handling.

---

#### Issue #7: Insertion Index Calculation Fragility
**Location**: `DragDropComponents.tsx:196-234`

```typescript
const mouseY = e.clientY;
const elementMiddle = rect.top + rect.height / 2;
```

**Problem**:
- Doesn't account for scrolling
- Breaks with CSS transforms
- Wrong index if elements have variable heights

**Fix**: Use more robust position calculation.

---

#### Issue #8: No Optimistic Updates

Current flow:
1. User drops item
2. Database update (network round-trip: 100-500ms)
3. Subscription fires
4. UI updates

**Problem**: Feels sluggish. User sees item in old position for 100-500ms.

**Fix**: Update UI immediately, rollback if database update fails.

---

#### Issue #9: Missing Error Recovery

If drop fails (network error, validation error):
- ❌ No rollback
- ❌ No user feedback
- ❌ UI might show item in wrong place permanently

**Fix**: Add try/catch with rollback and toast notifications.

---

#### Issue #10: Self-Drop Prevention Broken
**Location**: `DragDropContext.tsx:73`

```typescript
if (dragItem.sourceContainer === zone.id) return false;
```

**Problem**: `sourceContainer` is optional and may not be set. Can drop items on themselves.

**Fix**: Ensure sourceContainer is always set, or add additional validation.

---

### Root Causes of Drag-Drop Issues

1. **System evolved organically** - Each fix addressed symptoms, not root causes
2. **No clear data flow** - Multiple sources of truth (props, stores, manual fetches)
3. **Missing abstraction** - Each component implements drops slightly differently
4. **No tests** - Changes break without detection
5. **Recent git history shows struggle**: "CRITICAL FIX", "Fix drag and drop system", multiple attempts

---

### 3. ESLint Configuration Issues

**Current state**: Many strict rules disabled:
```javascript
'@typescript-eslint/no-explicit-any': 'off',
'@typescript-eslint/no-unsafe-*': 'off' // All 5 rules
```

**Problem**: Allows loose type-checking, reducing type safety benefits.

**Fix**: Gradually enable stricter rules as codebase matures.

---

### 4. Missing Testing Infrastructure

- **Playwright installed** but completely unused
- **Zero test files** - no unit, integration, or e2e tests
- **High risk** when making changes

**Impact**: Can't refactor confidently, bugs slip through.

---

## Refactoring Plan

### Phase 1: Quick Wins (1-2 days)
*Low risk, immediate impact*

**Tasks:**
1. ✅ Remove dead code
   - Delete `TaskItem_old.tsx` (239 lines)
   - Remove unused imports
   - **Effort**: 30 min

2. ✅ Extract duplicated icon logic
   - Create `src/lib/icons.ts`
   - Export `getAreaIcon()` function
   - Update Sidebar.tsx and SparkApp.tsx imports
   - **Effort**: 15 min

3. ✅ Consolidate subtask forms
   - Keep `SubtaskFormUnified.tsx`
   - Delete `SubtaskForm.tsx`
   - Update imports in TaskItem
   - **Effort**: 1-2 hours

4. ✅ Clean up migration artifacts
   - Remove Convex references in eslint.config.js
   - Verify no unused Convex code
   - **Effort**: 30 min

5. ✅ Remove debug logging
   - Clean up 30+ console.log statements in drag-drop code
   - **Effort**: 30 min

**Total Phase 1**: 2.5-4 hours

---

### Phase 2: Component Refactoring (3-5 days)
*Higher impact, requires careful testing*

#### Priority 1: Split Large Components

**A. Sidebar.tsx (1093 lines) → 5 components**

Split into:
- `SidebarViews.tsx` - Views list section (~150 lines)
- `SidebarAreas.tsx` - Areas section with icon logic (~400 lines)
- `SidebarProjects.tsx` - Projects section (~350 lines)
- `SidebarStats.tsx` - Statistics display (~100 lines)
- `Sidebar.tsx` - Main orchestrator (<200 lines)

**Effort**: 4-6 hours

---

**B. SparkApp.tsx (712 lines) → 3 components**

Extract:
- `ModalManager.tsx` - All modal state and rendering (~300 lines)
- `ViewContainer.tsx` - View switching logic (~200 lines)
- Keep `SparkApp.tsx` as thin orchestrator (~200 lines)

**Effort**: 3-4 hours

---

**C. Form Components (596 + 593 = 1189 lines)**

Options:
1. Merge `TaskForm.tsx` and `TaskEditForm.tsx` into single component with edit mode
2. Extract shared form logic into custom hooks
3. Create reusable form field components

**Effort**: 4-6 hours

---

#### Priority 2: Extract Custom Hooks

From large components, extract:
- `useTaskFormState()` - Form state management
- `useProjectOperations()` - Project CRUD logic
- `useKeyboardShortcuts()` - Keyboard navigation
- `useSidebarState()` - Sidebar expand/collapse logic

**Effort**: 3-4 hours

**Total Phase 2**: 14-20 hours (spread over 3-5 days)

---

### Phase 3: Testing Infrastructure (2-3 days)
*Critical for long-term stability*

**1. Setup Test Framework**
- Configure Vitest (integrates better with Vite than Jest)
- Add React Testing Library
- Set up test utilities and mocks
- **Effort**: 2-3 hours

**2. Write Critical Tests** (priority order)
- Query functions (`lib/queries/*.ts`) - Pure functions, easy to test
  - **Effort**: 3-4 hours
- Drag-drop logic (`lib/dragDrop.ts`) - Complex business logic
  - **Effort**: 4-5 hours
- Store operations - State management correctness
  - **Effort**: 2-3 hours
- Component integration tests - User workflows
  - **Effort**: 4-5 hours

**3. Playwright E2E Tests**
Add smoke tests for critical paths:
- Login flow
- Create/edit/delete task
- Drag-and-drop operations
- **Effort**: 3-4 hours

**Total Phase 3**: 18-24 hours (2-3 days)

---

### Phase 4: Code Quality Improvements (Ongoing)
*Incremental improvements*

**1. Tighten TypeScript Rules**
```javascript
// Enable gradually in eslint.config.js:
'@typescript-eslint/no-explicit-any': 'warn',
'@typescript-eslint/no-unsafe-assignment': 'warn',
'@typescript-eslint/no-unsafe-call': 'warn',
'@typescript-eslint/no-unsafe-member-access': 'warn',
'@typescript-eslint/no-unsafe-return': 'warn'
```
**Effort**: 2-3 hours to fix warnings

**2. Add Error Boundaries**
- Wrap major sections in React error boundaries
- Add error logging/reporting
- **Effort**: 2-3 hours

**3. Performance Optimization**
- Add React.memo to expensive list components
- Optimize re-renders in TaskList
- Consider virtualization for large task lists (react-window)
- **Effort**: 3-4 hours

**4. Documentation**
- Add JSDoc comments to complex functions
- Create architecture documentation
- Document drag-drop system
- **Effort**: 3-4 hours

**Total Phase 4**: 10-14 hours (ongoing)

---

### Phase 5: Drag-and-Drop System Rebuild (2-3 days)
*Complete rewrite for stability*

**Design Principles:**
1. Single source of truth for sort order calculation
2. Optimistic updates with rollback on error
3. Simplified handle detection (one method only)
4. Integer-based ordering with automatic rebalancing
5. Centralized drop handler that all components use
6. Proper error handling (no console.logs)
7. Write tests before implementing

**Implementation Plan:**

**Step 1: Design & Architecture** (3-4 hours)
- Design new sort order system (integer-based with rebalancing)
- Design centralized drop handler API
- Design optimistic update pattern
- Document new data flow

**Step 2: Core Implementation** (6-8 hours)
- New `lib/sortOrder.ts` - Rebalancing algorithm, CRUD operations (2-3 hrs)
- Refactor `lib/dragDrop.ts` - Simplified, single drop handler (2-3 hrs)
- Simplify `DragDropComponents.tsx` - One handle detection method (1-2 hrs)
- Update `DragDropContext.tsx` - Add optimistic update state (1 hr)

**Step 3: Component Integration** (5-7 hours)
- `Sidebar.tsx` - Fix task filtering, use new handler (2-3 hrs)
- `TaskList.tsx` - Use new centralized handler (1-2 hrs)
- `CalendarView.tsx` - Update drop logic (1 hr)
- `TimeBlockingView.tsx` - Update drop logic (1 hr)

**Step 4: Testing & Debugging** (4-6 hours)
- Test all drag scenarios manually (2-3 hrs)
- Fix bugs discovered (2-3 hrs)

**Total Phase 5**: 18-25 hours (2-3 days)

---

### Alternative: Drag-and-Drop Band-Aid Fixes (3-4 hours)

If full rebuild is too much, fix the **top 3 critical issues**:

1. **Fix Sidebar task filtering bug** (30 min)
   - Update `Sidebar.tsx:155` to filter tasks correctly

2. **Add basic optimistic updates** (1-2 hours)
   - Update UI immediately on drop
   - Rollback if database fails

3. **Clean up and simplify handle detection** (1 hour)
   - Remove complex marker system
   - Use single `.closest()` check

**Total**: 2.5-3.5 hours
**Improvement**: 60-70% better immediately
**Trade-off**: Not perfect, but acceptable

---

## Execution Strategy Comparison

### Option A: "Big Bang" Approach (1-2 weeks)
- Take codebase offline for refactoring
- Complete Phases 1-3 in one push
- Thorough testing before re-deployment

**Pros**:
- Clean slate
- No incremental merge conflicts
- All issues fixed at once

**Cons**:
- High risk
- Blocks new features for 1-2 weeks
- All-or-nothing deployment

---

### Option B: "Incremental" Approach (3-4 weeks) ⭐ RECOMMENDED
- One phase at a time
- Deploy after each phase
- Test in production with real users

**Pros**:
- Lower risk
- Continuous feedback
- Can validate each phase before proceeding
- Can add features between phases

**Cons**:
- More coordination
- Possible merge conflicts
- Takes longer calendar time

---

## Recommended Execution Order

**Week 1**: Phase 1 - Quick Wins
- **Day 1**: Remove dead code, extract icon logic (1 hour)
- **Day 2**: Consolidate subtask forms (2 hours)
- **Day 3**: Clean up debug logs and migration artifacts (1 hour)
- **Deploy and test**

**Week 2**: Phase 2 - Start Component Refactoring
- **Day 1-2**: Split Sidebar.tsx (5 hours)
- **Day 3**: Extract SparkApp.tsx modals (3 hours)
- **Day 4-5**: Refactor forms (5 hours)
- **Deploy and test**

**Week 3**: Phase 3 - Testing Infrastructure
- **Day 1**: Set up Vitest + React Testing Library (3 hours)
- **Day 2-3**: Write query and drag-drop tests (7 hours)
- **Day 4**: E2E tests with Playwright (4 hours)
- **Day 5**: Buffer for debugging

**Week 4**: Phase 5 - Drag-and-Drop Rebuild
- **Day 1**: Design and architecture (4 hours)
- **Day 2-3**: Core implementation (7 hours)
- **Day 4**: Component integration (5 hours)
- **Day 5**: Testing and bug fixes (4 hours)
- **Deploy and test**

**Ongoing**: Phase 4 - Code Quality (as time permits)

---

## Immediate Next Steps

1. **Choose approach**: Option A (Big Bang) vs Option B (Incremental)
2. **Set timeline**: When to start? How much time available per week?
3. **Decide on drag-and-drop**: Full rebuild (Phase 5) or band-aid fixes?
4. **Create feature freeze period** (if Option A) or **prioritize phases** (if Option B)

---

## Success Metrics

**After Phase 1:**
- ✅ 500-1,000 lines removed
- ✅ Zero duplication of icon/subtask logic
- ✅ No dead code in repo

**After Phase 2:**
- ✅ No files over 400 lines
- ✅ Components follow single-responsibility principle
- ✅ Easier to navigate codebase

**After Phase 3:**
- ✅ >70% code coverage on critical paths
- ✅ Can refactor with confidence
- ✅ E2E tests catch regressions

**After Phase 5:**
- ✅ Drag-and-drop works reliably 100% of time
- ✅ No console errors
- ✅ Feels responsive (optimistic updates)
- ✅ User confidence restored

**After Phase 4:**
- ✅ Zero ESLint warnings
- ✅ Performance metrics within targets
- ✅ Error boundaries catch crashes
- ✅ Good documentation coverage

---

## Cost Estimates

**Total effort**: 50-70 hours of development work
**Calendar time (Option B)**: 4-5 weeks with incremental deployment
**Calendar time (Option A)**: 2-3 weeks with big bang deployment

**AI Assistant Usage** (if using Claude):
- Phase 1-3: ~$15-$30
- Phase 5: ~$20-$40
- Total: ~$35-$70

**Human Developer Cost**:
- Senior: 2-3 weeks
- Mid-level: 3-4 weeks
- Junior: 5-7 weeks

---

## Risk Assessment

**Low Risk** (Can do anytime):
- ✅ Phase 1 (Quick wins)
- ✅ Phase 4 (Code quality - incremental)

**Medium Risk** (Need testing):
- ⚠️ Phase 2 (Component refactoring)

**High Risk** (Need comprehensive testing):
- 🔴 Phase 5 (Drag-and-drop rebuild)
- 🔴 Phase 3 if not done before Phase 5

**Mitigation**:
- Do Phase 3 (Testing) before or in parallel with Phase 2
- Deploy each phase to staging environment first
- Have rollback plan for each deployment
- Monitor error logs closely after each phase

---

## Notes & Observations

### Strengths of Current Codebase
- ✅ Clean component hierarchy with proper TypeScript typing
- ✅ Real-time data synchronization via Supabase subscriptions working well
- ✅ Comprehensive feature set (tasks, projects, areas, recurring, calendar, time blocking)
- ✅ Proper RLS policies for security
- ✅ Good use of React hooks and Context API
- ✅ Not over-engineered - 11.5k lines is reasonable

### Recent Migration
- Successfully migrated from Convex to Supabase
- Migration appears complete and stable
- Some artifacts remain (ESLint comments, etc.)

### Git History Insights
Recent commits show active work on drag-and-drop issues:
```
4ba363a Quick fixes and updates.
bbb8280 Fix sidebar drop handler: add missing targetIndex parameter
fbdf4e2 CRITICAL FIX: Restore task filtering in drop handler
0fdf0bc Fix drag and drop system: unify conflicting implementations
f7b756a Fix drag and drop issues: persistence, visual feedback, and sort ordering
```

This confirms drag-and-drop is the most problematic area needing attention.

---

## Conclusion

Spark is a **fundamentally sound codebase** that needs **strategic cleanup**, not a rewrite. The issues are organizational, not architectural. With systematic refactoring over 4-5 weeks, the codebase can become:

- **Maintainable**: Easy to navigate, modify, extend
- **Reliable**: Comprehensive tests catch regressions
- **Performant**: Optimistic updates, efficient re-renders
- **Stable**: Critical drag-and-drop issues resolved

**Recommended path**: Start with Phase 1 quick wins, establish testing infrastructure (Phase 3), then tackle component refactoring (Phase 2) and drag-and-drop rebuild (Phase 5).

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Next Review**: After Phase 1 completion
