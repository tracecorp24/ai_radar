const fs = require('fs');
const path = require('path');

console.log('🚀 Loading AI Context for Token Efficiency...');

function loadAiContext() {
  try {
    const filePath = path.join(__dirname, '../ai_context.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract key information for quick access
    const contextInfo = {
      projectName: 'AI Radar',
      framework: 'Next.js 15',
      keyDirectories: ['src/app/', 'src/components/', 'src/lib/services/', 'src/types/'],
      mainServices: ['content-service', 'trend-service', 'model-service', 'source-service'],
      performanceTips: [
        'Use existing components',
        'Keep route pages thin',
        'Preserve responsive behavior',
        'Update types when changing data'
      ]
    };
    
    console.log('✅ AI Context loaded successfully');
    console.log('📊 Key info:', contextInfo);
    
    return { fullContext: content, quickInfo: contextInfo };
  } catch (error) {
    console.warn('⚠️  AI context file not found, using default context');
    return { fullContext: getDefaultAiContext(), quickInfo: getDefaultQuickInfo() };
  }
}

function getDefaultAiContext() {
  return `
# AI Radar Context - Default

## Project Overview
- Name: AI Radar
- Type: Next.js 15 dashboard
- Purpose: Trend analysis and tracking

## Key Components
- src/app/: Main application routes
- src/components/: Reusable UI components
- src/lib/services/: Business logic and data access
- src/types/: TypeScript type definitions

## Performance Tips
- Use existing components before creating new ones
- Keep route pages thin
- Preserve responsive behavior and dark mode
- Update types when changing data shapes`;
}

function getDefaultQuickInfo() {
  return {
    projectName: 'AI Radar',
    framework: 'Next.js 15',
    keyDirectories: ['src/app/', 'src/components/', 'src/lib/services/'],
    mainServices: ['content-service', 'trend-service'],
    performanceTips: ['Use existing components', 'Keep pages thin']
  };
}

// Load and cache context
const aiContext = loadAiContext();

// Make available for other modules
module.exports = aiContext;

console.log('🎯 AI Context ready for token-efficient operations');
