#!/bin/bash
# Record all Aretee demo videos using simctl deep links + Maestro for interactions
set -e

export JAVA_HOME="$HOME/.local/share/java/jdk-21.0.6+7/Contents/Home"
export PATH="$JAVA_HOME/bin:$HOME/.maestro/bin:$PATH"

DEVICE="79D7F048-E52B-4D7D-886E-D362FFA25D84"
OUT="/tmp/aretee-recordings"
FLOWS="$(dirname "$0")"
mkdir -p "$OUT"

nav() { xcrun simctl openurl "$DEVICE" "$1" 2>/dev/null; sleep "$2"; }
shot() { xcrun simctl io "$DEVICE" screenshot "$OUT/$1" 2>/dev/null; }
start_rec() { xcrun simctl io "$DEVICE" recordVideo --codec=h264 "$OUT/$1" & REC_PID=$!; sleep 1; }
stop_rec() { sleep 1; kill -INT $REC_PID 2>/dev/null; wait $REC_PID 2>/dev/null; echo "✅ Saved $1"; }

echo "========================================"
echo "  ARETEE DEMO RECORDINGS"
echo "  $(date)"
echo "========================================"

# ============================================
# DEMO 1: Full Tab Tour (deep link navigation)
# ============================================
echo ""
echo "📹 Recording 1: Full App Tour"
start_rec "demo1-full-app-tour.mp4"

nav "exp://localhost:8081" 4          # Flash Mode home
shot "tour-01-flash.png"
nav "exp://localhost:8081/--/listen" 3   # Audio Mode
shot "tour-02-listen.png"
nav "exp://localhost:8081/--/immerse" 3  # Immerse
shot "tour-03-immerse.png"
nav "exp://localhost:8081/--/converse" 3 # Converse
shot "tour-04-converse.png"
nav "exp://localhost:8081/--/skinup" 3   # SkinUP
shot "tour-05-skinup.png"
nav "exp://localhost:8081/--/analytics" 3 # Analytics
shot "tour-06-analytics.png"
nav "exp://localhost:8081/--/profile" 3  # Profile
shot "tour-07-profile.png"
nav "exp://localhost:8081" 3             # Back to Flash

stop_rec "demo1-full-app-tour.mp4"

# ============================================
# DEMO 2: Flash Card Review (Maestro interaction)
# ============================================
echo ""
echo "📹 Recording 2: Flash Card Review"
nav "exp://localhost:8081" 4  # Ensure we're on Flash home

start_rec "demo2-flash-card-review.mp4"
sleep 1

maestro --device "$DEVICE" test "$FLOWS/02-flash-card-review.yaml" 2>&1 || echo "⚠️ Flow had issues"

stop_rec "demo2-flash-card-review.mp4"

# ============================================
# DEMO 3: Socratic Mode
# ============================================
echo ""
echo "📹 Recording 3: Socratic Mode"
start_rec "demo3-socratic-mode.mp4"

maestro --device "$DEVICE" test "$FLOWS/03-socratic-mode.yaml" 2>&1 || echo "⚠️ Flow had issues"

stop_rec "demo3-socratic-mode.mp4"

# ============================================
# DEMO 4: Feynman Mode
# ============================================
echo ""
echo "📹 Recording 4: Feynman (Teach) Mode"
start_rec "demo4-feynman-mode.mp4"

maestro --device "$DEVICE" test "$FLOWS/04-feynman-mode.yaml" 2>&1 || echo "⚠️ Flow had issues"

stop_rec "demo4-feynman-mode.mp4"

# ============================================
# DEMO 5: Review All + Blended
# ============================================
echo ""
echo "📹 Recording 5: Review All + Blended Session"
start_rec "demo5-review-all-blended.mp4"

maestro --device "$DEVICE" test "$FLOWS/05-review-all-blended.yaml" 2>&1 || echo "⚠️ Flow had issues"

stop_rec "demo5-review-all-blended.mp4"

echo ""
echo "========================================"
echo "  ALL RECORDINGS COMPLETE"
echo "========================================"
ls -lh "$OUT"/demo*.mp4 2>/dev/null
echo ""
echo "Screenshots:"
ls "$OUT"/tour-*.png 2>/dev/null
