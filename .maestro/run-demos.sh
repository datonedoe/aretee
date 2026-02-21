#!/bin/bash
# Run Maestro flows with video recording
# Usage: ./run-demos.sh [flow-number]

set -e

export JAVA_HOME="$HOME/.local/share/java/jdk-21.0.6+7/Contents/Home"
export PATH="$JAVA_HOME/bin:$HOME/.maestro/bin:$PATH"

DEVICE_UDID="79D7F048-E52B-4D7D-886E-D362FFA25D84"
RECORDINGS_DIR="/tmp/aretee-recordings"
FLOWS_DIR="$(dirname "$0")"

mkdir -p "$RECORDINGS_DIR"

run_flow() {
    local flow_file="$1"
    local flow_name=$(basename "$flow_file" .yaml)
    local video_file="$RECORDINGS_DIR/${flow_name}-$(date +%H%M%S).mp4"
    
    echo "=== Running: $flow_name ==="
    
    # Start video recording in background
    xcrun simctl io "$DEVICE_UDID" recordVideo --codec=h264 "$video_file" &
    local record_pid=$!
    sleep 1
    
    # Run Maestro flow
    maestro --device "$DEVICE_UDID" test "$flow_file" 2>&1 || {
        echo "⚠️  Flow $flow_name had errors (continuing anyway)"
    }
    
    # Stop video recording
    sleep 1
    kill -INT $record_pid 2>/dev/null || true
    wait $record_pid 2>/dev/null || true
    
    echo "✅ Recorded: $video_file"
    echo ""
}

if [ -n "$1" ]; then
    # Run specific flow
    flow=$(ls "$FLOWS_DIR"/$1*.yaml 2>/dev/null | head -1)
    if [ -z "$flow" ]; then
        echo "No flow matching '$1' found"
        exit 1
    fi
    run_flow "$flow"
else
    # Run all flows in order
    for flow in "$FLOWS_DIR"/[0-9]*.yaml; do
        run_flow "$flow"
    done
fi

echo "=== All recordings in $RECORDINGS_DIR ==="
ls -la "$RECORDINGS_DIR"/*.mp4 2>/dev/null
