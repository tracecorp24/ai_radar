import { promises as fs } from 'fs';
import path from 'path';

export async function loadAiContext(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), 'ai_context.md');
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.warn('AI context file not found, using default context');
    return getDefaultAiContext();
  }
}

function getDefaultAiContext(): string {
  return `
# AI Radar Context - Default

This is the default context for AI operations.

## Project Overview
- Name: AI Radar
- Type: Next.js dashboard for trend analysis
- Purpose: Track GitHub projects, arXiv papers, and topic trends

## Key Features
- Real-time trend detection
- Multi-source aggregation
- AI-powered analysis
- Customizable tracking
`;
}

// Cache the context to avoid repeated file reads
export let aiContextCache: string | null = null;

export async function getAiContext(): Promise<string> {
  if (!aiContextCache) {
    aiContextCache = await loadAiContext();
  }
  return aiContextCache;
}