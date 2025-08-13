# Test Suite and Data Cleanup Plan

**Status**: 🎯 Ready for Implementation  
**Created**: August 13, 2025  
**Priority**: High  
**Approach**: Systematic cleanup of test files, scripts, and accumulated data  
**Estimated Effort**: 2 hours

## Executive Summary

Following the frontend and backend cleanup plans, this comprehensive review covers the test suite, scripts, monitoring, and data directories. The analysis reveals significant accumulation of debug scripts, duplicate test files, and 107MB of test upload data that needs cleanup.

## Current State Analysis

### Directory Overview
```
├── tests/               (~50 test files, many duplicates)
│   ├── archive/        ❌ 20+ old test files
│   ├── e2e/           ✅ Active Playwright tests
│   ├── integration/    ✅ API integration tests
│   ├── scripts/       ⚠️  30+ debug scripts (many temporary)
│   └── test-data/     ✅ Test audio files
├── scripts/            ✅ Minimal (1 file)
├── monitoring/         ✅ Minimal (1 config)
└── data/              
    ├── uploads/       ❌ 107MB of test uploads (200+ files)
    └── *.db files     ⚠️  Multiple SQLite files
```

## Identified Issues and Solutions

### 1. Test Archive Directory (20+ Obsolete Files)

**Issue**: `tests/archive/` contains old test implementations from various debugging sessions

**Files to delete**:
```
tests/archive/
├── debug-upload.js          # Old debug script
├── e2e_playwright_test.py   # Python version (replaced by JS)
├── final-test.js            # Temporary test
├── final_test.py            # Duplicate Python version
├── frontend_e2e_test.js    # Old E2E test
├── page-objects/            # Old page object pattern (unused)
├── simple-upload.js         # Replaced by scripts version
├── test-upload.html         # HTML test file (unused)
├── test-upload.js           # Multiple versions of same test
├── test-upload.mjs          # ES module version (unused)
├── test-validation.py       # Old validation script
├── test_api_fix.py          # Debug script from API fix
├── test_upload.js           # Duplicate
├── upload-test.js           # Another duplicate
├── upload-zabka.js          # Specific debug test
├── upload_test.py           # Python duplicate
└── upload_zabka.py          # Python version
```

**Solution**: Delete entire `tests/archive/` directory

### 2. Test Scripts Directory (30+ Debug Scripts)

**Issue**: `tests/scripts/` contains mix of active tests and temporary debug scripts

**Active/Keep** (7 files):
- `run-all-tests.sh` - Main test runner
- `test-endpoints.sh` - Endpoint testing
- `test-anonymous-upload.js` - Core anonymous test
- `test-reprocess.js` - Reprocessing test
- `backend-api-test.py` - Backend API tests
- `integration-test.py` - Integration tests
- `zabka.m4a` - Test audio file

**Debug/Delete** (23 files):
```bash
# Multi-model debugging artifacts (created during bug fix)
test-multi-model.js
test-multi-model-debug.js
test-multi-model-detailed.js
test-multi-model-node.js
test-gpt4o-transcribe.js

# Database debugging
test-db-docker.js
test-db-session.js
test-prisma-direct.js
test-prisma-raw.js
check-db-schema.js

# Various debug scripts
test-403-fix.js
test-anonymous-limit.js
test-custom-prompt.js
test-custom-prompt-debug.js
test-openrouter-fix.js
test-summarization-fix.py
test-whisper-prompt.js
test-reprocess-simple.sh
verify-fix.js

# Performance/edge case tests (keep if documented)
performance-test.py      # Consider keeping
edge-cases-test.py       # Consider keeping
```

**Solution**: Move debug scripts to archive or delete, keep only active tests

### 3. Data Uploads Directory (107MB, 200+ Files)

**Issue**: Test uploads accumulated over time, consuming 107MB

**Analysis**:
- 200+ test upload files
- Timestamps from 1754865213183 to 1755082825296
- Multiple duplicates of same test files
- Pattern: `{timestamp}-{filename}.{ext}`

**Files**:
```
1754865213183-test-audio.mp3
1754902475747-zabka.m4a
... (200+ similar files)
1755082823259-test-gpt4o.m4a
1755082825296-test-gemini.m4a
```

**Solution**: 
- Delete all files older than 7 days
- Keep only latest 10 test files for reference
- Add cleanup script to prevent future accumulation

### 4. Database Files

**Issue**: Multiple SQLite database files and WAL files

**Files found**:
```
data/
├── nano-grazynka.db         # Active database
├── nano-grazynka.db-shm     # Shared memory file
├── nano-grazynka.db-wal     # Write-ahead log
├── nano-grazynka 2.db-wal   # Old WAL file
└── nano-grazynka 3.db-wal   # Old WAL file
```

**Solution**: Delete old WAL files, keep only active database files

### 5. Duplicate Test Audio Files

**Issue**: Same test audio files in multiple locations

**Duplicates found**:
- `tests/scripts/zabka.m4a`
- `tests/test-data/zabka.m4a`
- Multiple copies in archive

**Solution**: Keep only `tests/test-data/` versions

### 6. Python Test Files Organization

**Issue**: Python tests scattered across directories

**Current**:
- `tests/scripts/backend-api-test.py`
- `tests/scripts/integration-test.py`
- `tests/scripts/performance-test.py`
- `tests/scripts/edge-cases-test.py`
- `tests/scripts/test-summarization-fix.py`

**Solution**: Move active Python tests to `tests/python/` directory

## Implementation Plan

### Phase 1: Archive Cleanup (15 minutes)
```bash
# Delete entire archive directory
rm -rf tests/archive/

# Clean up old database WAL files
rm "data/nano-grazynka 2.db-wal"
rm "data/nano-grazynka 3.db-wal"
```

### Phase 2: Test Scripts Cleanup (20 minutes)
```bash
# Create organized structure
mkdir -p tests/python
mkdir -p tests/debug-archive

# Move Python tests to dedicated directory
mv tests/scripts/backend-api-test.py tests/python/
mv tests/scripts/integration-test.py tests/python/
mv tests/scripts/performance-test.py tests/python/
mv tests/scripts/edge-cases-test.py tests/python/

# Move debug scripts to archive (or delete)
mv tests/scripts/test-multi-model*.js tests/debug-archive/
mv tests/scripts/test-db-*.js tests/debug-archive/
mv tests/scripts/test-prisma-*.js tests/debug-archive/
mv tests/scripts/check-db-schema.js tests/debug-archive/
mv tests/scripts/test-*-fix.js tests/debug-archive/
mv tests/scripts/test-custom-prompt*.js tests/debug-archive/
mv tests/scripts/verify-fix.js tests/debug-archive/

# Remove duplicate audio file
rm tests/scripts/zabka.m4a
```

### Phase 3: Data Cleanup (30 minutes)
```bash
# Clean up old uploads (keep only last 10 files)
cd data/uploads/

# Get list of files sorted by timestamp (newest first)
ls -1t | tail -n +11 | xargs rm -f

# Or more aggressive: delete all uploads
# rm -f data/uploads/*

# Alternative: Keep only files from last 7 days
find data/uploads/ -type f -mtime +7 -delete
```

### Phase 4: Create Cleanup Script (10 minutes)

Create `scripts/cleanup-test-data.sh`:
```bash
#!/bin/bash

echo "🧹 Cleaning up test data..."

# Clean uploads older than 7 days
find data/uploads/ -type f -mtime +7 -delete

# Clean old database WAL files
find data/ -name "*.db-wal" -mtime +1 -delete

# Remove test results older than 30 days
find tests/test-results/ -type f -mtime +30 -delete

echo "✅ Cleanup complete"
```

### Phase 5: Update Test Documentation (15 minutes)

Update `tests/README.md`:
- Remove references to archived tests
- Document new Python test location
- Add cleanup instructions
- Update test running commands

## Impact Analysis

### Storage Savings
- Archive directory: ~500KB (20+ files)
- Debug scripts: ~200KB (23 files)
- Upload data: ~100MB (190+ files to remove)
- **Total**: ~101MB freed

### Files Removed
- Archive: 20+ obsolete test files
- Scripts: 23 debug scripts
- Uploads: 190+ old upload files
- Database: 2 old WAL files
- **Total**: ~235 files removed

### Functionality Impact
- **No functionality lost** - keeping all active tests
- **Better organization** - Python tests in dedicated directory
- **Cleaner structure** - debug scripts archived
- **Storage optimized** - 100MB+ freed

### Risk Assessment
- **Low risk** - only removing debug/test artifacts
- **Test data** - Can regenerate if needed
- **Rollback plan** - Git history for scripts, uploads are temporary

## Success Metrics

### Immediate (Post-Implementation)
- [ ] All active tests still run successfully
- [ ] Python tests accessible in new location
- [ ] Upload directory under 10MB
- [ ] No duplicate test files
- [ ] Clean directory structure

### Long-term
- [ ] Automated cleanup prevents accumulation
- [ ] Clear separation of active vs debug tests
- [ ] Documented test organization
- [ ] Regular cleanup schedule established

## Maintenance Plan

### Daily
- No action needed (automated cleanup handles it)

### Weekly
```bash
# Run cleanup script
./scripts/cleanup-test-data.sh
```

### Monthly
- Review and archive any new debug scripts
- Check upload directory size
- Clean test results

### Quarterly
- Full test suite review
- Remove obsolete tests
- Update documentation

## Related Documents

- [BACKEND_CLEANUP_PLAN.md](./BACKEND_CLEANUP_PLAN.md) - Backend cleanup
- [FRONTEND_CLEANUP_PLAN.md](./FRONTEND_CLEANUP_PLAN.md) - Frontend cleanup
- [Test README](../../tests/README.md) - Test documentation
- [Test Results](../testing/TEST_RESULTS.md) - Latest test results

## Checklist

### Pre-cleanup
- [ ] Review active tests list
- [ ] Ensure Docker containers stopped
- [ ] Backup database if needed

### Cleanup Tasks
- [ ] Delete `tests/archive/` directory
- [ ] Clean old database WAL files
- [ ] Create `tests/python/` directory
- [ ] Move Python tests to new location
- [ ] Archive/delete debug scripts (23 files)
- [ ] Delete duplicate zabka.m4a in scripts
- [ ] Clean uploads directory (keep last 10)
- [ ] Create cleanup-test-data.sh script
- [ ] Add cleanup script to cron/scheduler
- [ ] Update tests/README.md
- [ ] Update .gitignore for test artifacts

### Post-cleanup
- [ ] Run test suite to verify
- [ ] Check all Python tests work
- [ ] Verify upload functionality
- [ ] Document cleanup in memory
- [ ] Commit changes

## Special Considerations

### Test Data Retention Policy
- **Uploads**: Keep for 7 days maximum
- **Test results**: Keep for 30 days
- **Debug scripts**: Archive after use
- **Database**: Keep only active + current WAL

### Git Considerations
Add to `.gitignore`:
```
# Test artifacts
tests/debug-archive/
tests/test-results/
data/uploads/*
!data/uploads/.gitkeep
*.db-wal
*.db-shm
```

## Conclusion

This cleanup will remove ~235 files and free ~101MB of storage, primarily from accumulated test uploads. The reorganization creates clear separation between active tests, debug scripts, and test data. Implementation of the cleanup script ensures this accumulation won't recur.

---
*This plan completes the trilogy of cleanup plans for the nano-Grazynka project.*