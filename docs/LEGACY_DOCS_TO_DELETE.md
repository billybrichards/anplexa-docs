# Legacy Documentation Cleanup Report

Generated: January 14, 2026

## Executive Summary

This report identifies documentation that has been superseded by the Clean Architecture refactor and monorepo migration completed in Phase 2. The Anplexa platform has transitioned from three separate repositories to a unified monorepo structure with clean architecture implementation.

**Total Files Reviewed**: 27 markdown files
**Total Lines Analyzed**: ~13,856 lines
**Files Recommended for Deletion**: 1
**Files Needing Deprecation Notices**: 5
**Files Needing Link Updates**: 4

---

## Files Recommended for Deletion

### Priority: DELETE IMMEDIATELY

#### 1. `docs/improvement-plans/monorepo-migration.md`
- **Status**: COMPLETE - This entire migration has been completed
- **Current Size**: ~900 lines
- **Reason**: The monorepo migration is finished. This is a historical plan document, not current guidance
- **References To This File**:
  - `docs/intro.md` (line 67) - Reference to "Improvement Roadmap"
  - `docs/improvement-plans/roadmap.md` (line 214)
- **Impact**: Moderate - Only referenced in roadmap navigation
- **Action**: Delete file and update links in roadmap

---

## Files Requiring Deprecation Notices

Add deprecation notices to the following files. They contain outdated information about the old separate repository structure but still have some historical/reference value.

### Priority: ADD DEPRECATION NOTICES

#### 1. `docs/improvement-plans/clean-architecture-transition.md`
- **Status**: MOSTLY COMPLETE - Architecture refactor done
- **Current Size**: ~840 lines
- **Deprecation Reason**: The clean architecture transition plan describes work that is largely complete. However, keep for reference on implementation details
- **Recommended Notice**:
  ```markdown
  > **⚠️ IN PROGRESS**: This plan has been largely implemented through Phase 2.
  > For current architecture details, see [Architecture Overview](../architecture/overview.md).
  > For completed implementation details, see [Backend Architecture](../architecture/backend-api.md).
  ```
- **Keep Because**: Detailed implementation methodology is still useful for developers
- **Lines to Keep**: All - too valuable for reference

#### 2. `docs/development/getting-started.md`
- **Status**: OUTDATED - References old separate repos (2-terminal-companion, v0-ai-companion-prototype, Funnel-Forge)
- **Current Size**: ~260 lines
- **Deprecation Reason**: Documents old "three separate repos" setup, not current monorepo
- **Recommended Notice**:
  ```markdown
  > **⚠️ OUTDATED**: These instructions reference the legacy separate repository structure.
  > See the updated [Getting Started Guide](./getting-started.md) for current monorepo setup.
  ```
- **Current Issues**:
  - Lines 30-37: References old repo structure
  - Lines 41-55: Old clone and setup commands
  - Lines 121-145: References old folder structure
  - Line 183: Old repo clone URLs
- **Action**: Consider creating NEW getting-started.md or updating with both old and new info

#### 3. `docs/development/environment-setup.md`
- **Status**: PARTIALLY OUTDATED - Still useful but references old repo names
- **Current Size**: ~450 lines
- **Deprecation Reason**: Contains environment setup for old separate repos
- **Current Issues**:
  - Line 14: "Backend API (`2-terminal-companion`)" - old name
  - Line 19: "Companions App (`v0-ai-companion-prototype`)" - old name
  - Line 248: "Funnel App (`Funnel-Forge`)" - old name
  - Actual guidance is still valid, just naming is outdated
- **Action**: Update app name references to new monorepo paths (apps/api, apps/companions, apps/funnel)
- **Priority**: HIGH - This is actively used by developers

#### 4. `docs/development/testing.md`
- **Status**: OUTDATED - References old repo structure
- **Current Size**: ~300 lines
- **Deprecation Reason**: Test file structure examples use old repo names
- **Current Issues**:
  - Line 20: "Backend API (`2-terminal-companion`)" - old name
  - Line 47: "Companions App (`v0-ai-companion-prototype`)" - old name
  - Actual testing strategies are still relevant
- **Action**: Update to reference new paths: apps/api, apps/companions, apps/funnel
- **Priority**: MEDIUM-HIGH

#### 5. `docs/architecture/marketing-funnel.md`
- **Status**: OUTDATED - References old Funnel-Forge repo structure
- **Current Size**: ~350 lines (partial read)
- **Deprecation Reason**: Document describes old `Funnel-Forge/` structure, not current `apps/funnel/`
- **Current Issues**:
  - Line 14: "`Funnel-Forge/`" - old repo name
  - Line 15: "Vite frontend" structure from old separate repo
  - Line 28: "Express backend" from old structure
  - Directory paths all wrong for monorepo
- **Action**: Update file paths and structure to reflect `apps/funnel/` organization
- **Priority**: MEDIUM - Funnel documentation not as actively used

---

## Files Needing Link Updates

When the above files are deleted or modified, the following files have links that will break:

### 1. `docs/intro.md`
- **Current References**:
  - Line 67: `[Improvement Roadmap](/docs/improvement-plans/roadmap)` - OK, roadmap still exists
  - Lines 60-67: Links all point to valid destinations
- **Action Needed**:
  - If deleting `monorepo-migration.md`, update `docs/improvement-plans/roadmap.md` line 214
  - Update line 67 reference if changing roadmap path
- **Severity**: Low (main page, not breaking)

### 2. `docs/improvement-plans/roadmap.md`
- **Current References**:
  - Line 214: References monorepo-migration.md (DELETE)
  - Lines 211-215: All links to improvement plans
- **Action Needed**: Remove line 214 reference to monorepo-migration
- **Severity**: Medium (roadmap is main navigation point)

### 3. `docs/architecture/overview.md`
- **Current References**:
  - No direct links to deleted files
  - References old deployment architecture (Replit, Vercel)
  - Consider updating deployment info to current setup (Railway?)
- **Action Needed**: Update deployment architecture section if moving to Railway
- **Severity**: Low

### 4. `docs/improvement-plans/backend-improvements.md`
- **Current References**:
  - Line 23: References old structure (probably not breaking link-wise)
  - No links to deleted files
- **Action Needed**: Update file path examples to new monorepo structure
- **Severity**: Low

---

## Files Recommended for ARCHIVING (Keep but move to archive)

No files are recommended for archiving at this time. All documented files serve either as:
1. Current reference material (API docs, architecture)
2. Implementation guidance (improvement plans)
3. Development guides (setup, testing)

The `monorepo-migration.md` is the only file that is purely historical and can be deleted.

---

## Files That Are Current and Valuable

These files should be KEPT as-is (minimal updates needed):

### Keep - Core Documentation
- `docs/intro.md` - Entry point, still accurate
- `docs/architecture/overview.md` - Current architecture
- `docs/architecture/backend-api.md` - Current implementation
- `docs/architecture/companions-app.md` - Current implementation
- `docs/architecture/data-flow.md` - Still relevant
- `docs/user-flows/*.md` - All user flows still current
- `docs/api/*.md` - API documentation still accurate
- `docs/security/*.md` - Security architecture still relevant

### Keep with Minor Updates Needed
- `docs/improvement-plans/clean-architecture-transition.md` - Add deprecation notice
- `docs/improvement-plans/roadmap.md` - Remove monorepo-migration reference
- `docs/improvement-plans/backend-improvements.md` - Update paths
- `docs/improvement-plans/frontend-improvements.md` - Update paths
- `docs/improvement-plans/funnel-improvements.md` - Update paths
- `docs/development/environment-setup.md` - Update app names
- `docs/development/testing.md` - Update paths
- `docs/development/getting-started.md` - UPDATE OR REPLACE
- `docs/architecture/marketing-funnel.md` - Update structure paths

---

## Implementation Plan

### Phase 1: Quick Deletions (1-2 hours)
1. Delete `/home/billyrichards/bbrdev1/anplexa/docs/docs/improvement-plans/monorepo-migration.md`
2. Update `docs/improvement-plans/roadmap.md` line 214 to remove the reference
3. Commit: "docs: Remove completed monorepo migration plan"

### Phase 2: Update Deprecation Notices (2-3 hours)
1. Add deprecation notice to `clean-architecture-transition.md`
2. Add deprecation notice to `getting-started.md`
3. Add deprecation notice to `environment-setup.md`
4. Add deprecation notice to `testing.md`
5. Add deprecation notice to `marketing-funnel.md`
6. Commit: "docs: Add deprecation notices to outdated setup guides"

### Phase 3: Path & Name Updates (4-5 hours)
1. Update `environment-setup.md`:
   - Line 14: `api` (from `2-terminal-companion`)
   - Line 19: `apps/companions` (from `v0-ai-companion-prototype`)
   - Line 248: `apps/funnel` (from `Funnel-Forge`)
   - Update all path references throughout

2. Update `testing.md`:
   - Line 20: Update to `apps/api`
   - Line 47: Update to `apps/companions`
   - Update test structure paths

3. Update `marketing-funnel.md`:
   - Line 14: Update `Funnel-Forge/` to `apps/funnel/`
   - Update directory structure
   - Line 28: Express backend path
   - Update all relative paths

4. Update `backend-improvements.md` examples if any

5. Commit: "docs: Update paths and app names to reflect monorepo structure"

### Phase 4: Getting Started Redesign (3-4 hours)
**DECISION NEEDED**:
- Keep both old and new getting-started with toggle/note?
- Or completely replace with monorepo version?
- Or create separate `LEGACY_SETUP.md`?

Recommendation: Replace entirely and create a LEGACY_SETUP.md for reference

1. Rewrite `getting-started.md` for monorepo structure
2. Create `docs/LEGACY_SETUP.md` with old instructions (optional archive)
3. Commit: "docs: Update getting-started for monorepo setup"

---

## Checklist for Manual Review

Before deletion, verify each item:

### Monorepo Migration Doc
- [ ] Check git history for all references to `monorepo-migration.md`
- [ ] Verify no external links point to it
- [ ] Search all files for backlinks
- [ ] Update roadmap.md reference
- [ ] Delete file

### Environment Setup Doc
- [ ] Test updated instructions locally
- [ ] Verify all app paths are correct
- [ ] Update docusaurus if links change
- [ ] Verify environment variable guidance still accurate

### Getting Started Doc
- [ ] Decide: replace vs archive old version?
- [ ] Test new monorepo instructions
- [ ] Update docusaurus sidebar if needed
- [ ] Verify all commands work

### Testing Doc
- [ ] Update test paths
- [ ] Verify test examples run
- [ ] Check if test setup changed

### Marketing Funnel Doc
- [ ] Verify current funnel structure matches doc
- [ ] Update any outdated implementation details
- [ ] Check if persona system still current

---

## Statistics

### Files Summary
- Total documentation files: 27
- Files analyzed for legacy status: 27
- Files recommended for deletion: 1 (3.7%)
- Files with deprecation notices needed: 5 (18.5%)
- Files needing path updates: 4 (14.8%)
- Files currently accurate: 17 (63%)

### Content Summary
- Total lines of documentation: ~13,856
- Lines in files to delete: ~900 (6.5%)
- Lines in files to deprecate: ~2,360 (17%)
- Lines requiring updates: ~1,900 (13.7%)

---

## Next Steps

1. **This Week**:
   - Review this report
   - Make decision on getting-started.md approach
   - Delete monorepo-migration.md

2. **Next Week**:
   - Add deprecation notices
   - Update app name/path references
   - Test updated getting-started locally

3. **Validation**:
   - Build docusaurus site
   - Test all links
   - Verify no broken references
   - Spot-check documentation accuracy

---

## Notes

- All referenced file paths use absolute paths from repository root
- Documentation is in `/home/billyrichards/bbrdev1/anplexa/docs/docs/`
- Main docusaurus site is in `/home/billyrichards/bbrdev1/anplexa/docs/`
- Sidebar configuration: `/home/billyrichards/bbrdev1/anplexa/docs/sidebars.js`
- The monorepo structure is complete and stable
- No documentation should reference old "three repos" architecture
