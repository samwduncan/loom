#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Loom Deploy Script
# Single-command build, validate, and reload pipeline
# ============================================================

REPO_DIR="/home/swd/loom"
MAX_DIST_SIZE_MB=15
MIN_ASSET_COUNT=50
HEALTH_URL="http://127.0.0.1:5555/health"
HEALTH_RETRIES=5
HEALTH_INTERVAL=1

# Flags
NO_PULL=false

# Parse arguments
for arg in "$@"; do
    case "$arg" in
        --no-pull) NO_PULL=true ;;
        *) echo "Unknown argument: $arg"; exit 1 ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

fail() { echo -e "${RED}FAIL:${NC} $1"; exit 1; }
ok()   { echo -e "${GREEN}  OK:${NC} $1"; }
step() { echo -e "\n${YELLOW}=== $1 ===${NC}"; }

cd "$REPO_DIR"

# Step 1: Pre-flight checks (AR fix #7: dirty-tree guard)
step "Step 1: Pre-flight checks"
if [[ "$NO_PULL" == false ]]; then
    git diff --quiet HEAD || fail "Working tree dirty — commit or stash first (or use --no-pull for local deploys)"
    ok "Working tree clean"
else
    ok "Skipping git checks (--no-pull mode)"
fi

# Step 2: Pull latest (skip with --no-pull)
if [[ "$NO_PULL" == false ]]; then
    step "Step 2: Pull latest"
    git pull --ff-only || fail "git pull failed (non-fast-forward merge required?)"
    ok "Pulled latest changes"
else
    step "Step 2: Pull latest (SKIPPED — --no-pull)"
fi

# Step 3: Install dependencies (AR fix #5: both backend AND frontend)
step "Step 3: Install dependencies"
npm ci || fail "Backend npm ci failed (root package.json)"
ok "Backend dependencies installed"
(cd src && npm ci) || fail "Frontend npm ci failed (src/package.json)"
ok "Frontend dependencies installed"

# Step 4: TypeScript check
step "Step 4: TypeScript check"
(cd src && npx tsc -b) || fail "TypeScript compilation failed — fix type errors before deploying"
ok "TypeScript compilation passed"

# Step 5: Build frontend
step "Step 5: Build frontend"
# Build to repo root dist/ (not src/dist/) — nginx root points here
# --emptyOutDir required because outDir is outside project root (Vite won't auto-clean)
(cd src && npx vite build --outDir ../dist --emptyOutDir) || fail "Vite build failed"
ok "Frontend built to dist/"

# Step 6: Copy public/ contents into dist/ (AR fix #1: PWA manifest, favicons, icons)
step "Step 6: Copy public assets"
cp -r "$REPO_DIR/public/"* "$REPO_DIR/dist/" || fail "Failed to copy public/ contents into dist/"
ok "public/ contents copied to dist/ (manifest.json, favicons, icons)"

# Step 7: Validate build
step "Step 7: Validate build"

# 7a: index.html exists and is non-empty
[[ -s "$REPO_DIR/dist/index.html" ]] || fail "dist/index.html missing or empty"
ok "dist/index.html exists ($(wc -c < "$REPO_DIR/dist/index.html") bytes)"

# 7b: Expected vendor chunks present
MISSING_CHUNKS=()
for chunk in vendor-react vendor-shiki vendor-radix vendor-zustand vendor-markdown; do
    if ! ls "$REPO_DIR/dist/assets/${chunk}-"*.js >/dev/null 2>&1; then
        MISSING_CHUNKS+=("$chunk")
    fi
done
if [[ ${#MISSING_CHUNKS[@]} -gt 0 ]]; then
    fail "Missing vendor chunks: ${MISSING_CHUNKS[*]}"
fi
ok "All vendor chunks present (react, shiki, radix, zustand, markdown)"

# 7c: Font files present
FONT_COUNT=$(find "$REPO_DIR/dist/fonts" -name "*.woff2" 2>/dev/null | wc -l)
[[ "$FONT_COUNT" -ge 4 ]] || fail "Expected at least 4 font files, found $FONT_COUNT"
ok "Font files present ($FONT_COUNT woff2 files)"

# 7d: Minimum asset count (catches catastrophically broken builds)
ASSET_COUNT=$(find "$REPO_DIR/dist/assets" -type f 2>/dev/null | wc -l)
[[ "$ASSET_COUNT" -ge "$MIN_ASSET_COUNT" ]] || fail "Only $ASSET_COUNT assets in dist/ (expected >= $MIN_ASSET_COUNT)"
ok "Asset count: $ASSET_COUNT files"

# 7e: Total size check
DIST_SIZE=$(du -sm "$REPO_DIR/dist" | cut -f1)
if (( DIST_SIZE > MAX_DIST_SIZE_MB )); then
    fail "dist/ is ${DIST_SIZE}MB, exceeds ${MAX_DIST_SIZE_MB}MB limit"
fi
ok "dist/ size: ${DIST_SIZE}MB (limit: ${MAX_DIST_SIZE_MB}MB)"

# 7f: CSS file exists
CSS_COUNT=$(find "$REPO_DIR/dist/assets" -name "*.css" -type f 2>/dev/null | wc -l)
[[ "$CSS_COUNT" -ge 1 ]] || fail "No CSS files found in dist/assets/"
ok "CSS files present ($CSS_COUNT files)"

# 7g: PWA manifest present (AR fix #1 validation)
[[ -f "$REPO_DIR/dist/manifest.json" ]] || fail "manifest.json missing from dist/ (public/ copy failed?)"
ok "manifest.json present in dist/"

# Step 8: Reload services (AR fix: Express FIRST, then nginx)
step "Step 8: Reload services"

# Restart Express first — it needs to be healthy before nginx routes to it
sudo systemctl restart loom-backend || fail "loom-backend restart failed"
ok "loom-backend restarted"

# Wait for backend to come up with retry loop (AR fix: replaces sleep 2 + single curl)
HEALTH_OK=false
for i in $(seq 1 $HEALTH_RETRIES); do
    if curl -sf "$HEALTH_URL" 2>/dev/null | grep -q '"status":"ok"'; then
        HEALTH_OK=true
        break
    fi
    echo "  Health check attempt $i/$HEALTH_RETRIES — waiting ${HEALTH_INTERVAL}s..."
    sleep "$HEALTH_INTERVAL"
done
if [[ "$HEALTH_OK" == false ]]; then
    fail "Backend health check failed after $HEALTH_RETRIES attempts"
fi
ok "Backend health check passed"

# NOW reload nginx (after Express is confirmed healthy — no 502 window)
sudo systemctl reload nginx || fail "nginx reload failed"
ok "nginx reloaded"

step "Deploy complete"
echo -e "${GREEN}Loom deployed successfully.${NC}"
echo "  Frontend: $(find "$REPO_DIR/dist/assets" -type f | wc -l) assets, ${DIST_SIZE}MB"
echo "  URL: https://samsara.tailad2401.ts.net:5443"
