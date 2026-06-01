#!/bin/bash

# ⚡ INSTALLATION SCRIPT - Realtime Socket Optimization
# This script helps you set up the optimized realtime system

set -e  # Exit on error

echo "🚀 Starting Realtime Optimization Installation..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js and npm first."
    exit 1
fi
echo -e "${GREEN}✅ npm found${NC}"

# Step 2: Install react-window
echo ""
echo -e "${BLUE}Step 2: Installing react-window dependency...${NC}"
cd tournament_system_v2/client
npm install react-window --save

echo -e "${GREEN}✅ react-window installed${NC}"

# Step 3: Install TypeScript types (if using TypeScript)
echo ""
echo -e "${BLUE}Step 3: Installing TypeScript types...${NC}"
npm install --save-dev @types/react-window

echo -e "${GREEN}✅ TypeScript types installed${NC}"

# Step 4: Verify files are in place
echo ""
echo -e "${BLUE}Step 4: Verifying optimized files...${NC}"

FILES_TO_CHECK=(
  "src/LiveStandingsTable/dataTransformer.ts"
  "src/LiveStandingsTable/realtimeSocketWrapper.ts"
  "src/LiveStandingsTable/realtimeIntegration.example.tsx"
  "src/LiveStandingsTable/View/LiveStandings2-optimized.tsx"
)

for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ Found $file${NC}"
  else
    echo -e "${YELLOW}⚠️  Missing $file - Please copy it manually${NC}"
  fi
done

# Step 5: Test build
echo ""
echo -e "${BLUE}Step 5: Testing build...${NC}"
npm run build 2>&1 | tail -20

echo ""
echo -e "${GREEN}✅ Build successful${NC}"

# Step 6: Display next steps
echo ""
echo -e "${BLUE}Installation Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Update your WebSocket handler (see realtimeIntegration.example.tsx)"
echo "2. Replace LiveStandings2.tsx with the optimized version"
echo "3. Test in development: npm start"
echo "4. Check metrics in DevTools console: socketWrapper.logMetrics()"
echo "5. Deploy to production with feature flag"
echo ""
echo -e "${YELLOW}📖 Documentation:${NC}"
echo "• Read: OPTIMIZATION_GUIDE.md (implementation guide)"
echo "• Read: OPTIMIZATION_SUMMARY.md (full details)"
echo "• Read: QUICK_REFERENCE.md (quick start)"
echo ""
echo -e "${GREEN}🎉 Setup complete! Your realtime system is optimized.${NC}"
echo ""
