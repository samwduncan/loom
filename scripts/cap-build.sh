#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Loom iOS Build Script
# Build, validate, and sync pipeline for Capacitor iOS
# ============================================================

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$REPO_DIR/src"
DIST_DIR="$SRC_DIR/dist"
MIN_ASSET_COUNT=20

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

fail() { echo -e "${RED}FAIL:${NC} $1"; exit 1; }
ok()   { echo -e "${GREEN}  OK:${NC} $1"; }
step() { echo -e "\n${YELLOW}=== $1 ===${NC}"; }

# Step 1: Platform check
step "Step 1: Platform check"
if [[ "$(uname)" != "Darwin" ]]; then
    fail "cap sync requires macOS. To build web assets only: cd src && npm run build"
fi
ok "Running on macOS"

# Step 2: Install dependencies (frontend only — backend not needed for iOS build)
step "Step 2: Install dependencies"
(cd "$SRC_DIR" && npm ci) || fail "Frontend npm ci failed (src/package.json)"
ok "Frontend dependencies installed"

# Step 3: TypeScript check
step "Step 3: TypeScript check"
(cd "$SRC_DIR" && npx tsc -b) || fail "TypeScript compilation failed — fix type errors before building"
ok "TypeScript compilation passed"

# Step 4: Vite build (outputs to src/dist/ — Capacitor's webDir)
# --base ./ produces relative asset paths required by Capacitor's file:// scheme.
# This is only set here, NOT in vite.config.ts, to avoid breaking web SPA routing
# where ./assets/foo.js would resolve wrong at deep routes like /chat/session-id.
step "Step 4: Vite build"
(cd "$SRC_DIR" && npx vite build --base ./) || fail "Vite build failed"
ok "Frontend built to src/dist/"

# Step 5: Validate build
step "Step 5: Validate build"

# 5a: index.html exists and is non-empty
[[ -s "$DIST_DIR/index.html" ]] || fail "dist/index.html missing or empty"
ok "dist/index.html exists ($(wc -c < "$DIST_DIR/index.html") bytes)"

# 5b: assets directory exists
[[ -d "$DIST_DIR/assets" ]] || fail "dist/assets/ directory missing"
ok "dist/assets/ directory exists"

# 5c: Minimum asset count (catches catastrophically broken builds)
ASSET_COUNT=$(find "$DIST_DIR/assets" -type f 2>/dev/null | wc -l)
[[ "$ASSET_COUNT" -ge "$MIN_ASSET_COUNT" ]] || fail "Only $ASSET_COUNT assets in dist/assets/ (expected >= $MIN_ASSET_COUNT)"
ok "Asset count: $ASSET_COUNT files"

# 5d: Relative paths check — Capacitor requires relative asset paths
if grep -q 'src="/assets/' "$DIST_DIR/index.html" 2>/dev/null; then
    fail "dist/index.html contains absolute asset paths (src=\"/assets/...\"). Set base: './' in vite.config.ts"
fi
ok "Asset paths are relative (no absolute /assets/ references)"

# Step 6: Capacitor sync
step "Step 6: Capacitor sync"
(cd "$SRC_DIR" && npx cap sync ios) || fail "cap sync ios failed"
ok "Capacitor iOS synced"

step "Build complete"
echo -e "${GREEN}Ready for Xcode.${NC} Run: cd src && npx cap open ios"
echo "  Assets: $ASSET_COUNT files in dist/assets/"
