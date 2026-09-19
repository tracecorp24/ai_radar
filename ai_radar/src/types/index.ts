export type ContentSource =
  | "arxiv"
  | "huggingface"
  | "ollama"
  | "alphasignal"
  | "linkedin"
  | "github"
  | "rss"
  | "other";

export type ContentType = "paper" | "model" | "article" | "post" | "release" | "newsletter";
export type TrendPhase = "hot" | "trending";

export interface ContentItem {
  id: string;
  source: ContentSource;
  type: ContentType;
  externalId: string;
  title: string;
  summary: string;
  originalContent?: string;
  url: string;
  imageUrl?: string;
  authors: string[];
  organization?: string;
  publishedAt: string;
  firstSeenAt: string;
  updatedAt?: string;
  tags: string[];
  relevanceScore: number;
  noveltyScore: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  isBookmarked: boolean;
  isRead: boolean;
  isFeatured?: boolean;
  trendScore?: number;
  trendPhase?: TrendPhase;
  trendReasons?: string[];
  matchedTopics?: string[];
  originSourceId?: string;
  arxiv?: {
    absUrl: string;
    pdfUrl: string;
    htmlUrl?: string;
    texUrl?: string;
    categories: string[];
    version?: string;
  };
  github?: {
    stars: number;
    forks: number;
    openIssues: number;
    language?: string;
    createdAt: string;
    pushedAt: string;
    starsPerDay: number;
  };
  paperDocument?: PaperDocument;
  repositoryDocument?: RepositoryDocument;
}

export interface PaperQuestionAnswer {
  question: string;
  answer: string;
}

export interface CitationTreeNode {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  abstract?: string;
  url?: string;
  citationReason: string;
  citedIn?: string;
  questions: PaperQuestionAnswer[];
  children: CitationTreeNode[];
}

export interface PaperCitationAnalysis {
  keywords: string[];
  technologies: string[];
  questions: PaperQuestionAnswer[];
  citations: CitationTreeNode[];
  bibliography?: PaperLinkedResource[];
  appendices?: PaperLinkedResource[];
  generatedAt: string;
  source: "semantic-scholar" | "local";
  answerSource?: "ai" | "fallback";
  answerModel?: string;
}

export interface SemanticSearchResult {
  item: ContentItem;
  similarity: number;
  categories: string[];
}

export interface PaperLinkedResource {
  title: string;
  url: string;
  detail?: string;
  page?: number;
}

export interface PaperCitationLocation {
  marker: string;
  line: number;
  excerpt: string;
}

export interface PaperDocument {
  status: "queued" | "processing" | "ready" | "failed";
  sourceKind?: "tex" | "pdf";
  pdfPath?: string;
  texArchivePath?: string;
  texMainPath?: string;
  markdownPath?: string;
  citationIndexPath?: string;
  parsedAt: string;
  pageCount?: number;
  characterCount?: number;
  sourceFileCount?: number;
  appendixCount?: number;
  citationLocations?: PaperCitationLocation[];
  referenceCount?: number;
  error?: string;
}

export interface RelatedRepository {
  fullName: string;
  description?: string;
  url: string;
  stars: number;
  topics: string[];
  reason: string;
}

export interface RepositoryDocument {
  status: "ready" | "failed";
  readmePath?: string;
  parsedAt: string;
  language?: string;
  stars?: number;
  license?: string;
  relatedRepositories?: RelatedRepository[];
  error?: string;
}

export interface ModelItem {
  id: string;
  source: "huggingface" | "ollama" | "other";
  modelId: string;
  name: string;
  organization: string;
  description: string;
  url: string;
  pipeline?: string;
  parameterSize?: string;
  quantization?: string;
  contextLength?: number;
  license?: string;
  downloads: number;
  likes: number;
  dailyGrowth: number;
  weeklyGrowth: number;
  trendScore: number;
  updatedAt: string;
  tags: string[];
}

export interface PersonItem {
  id: string;
  name: string;
  role: string;
  organization?: string;
  platform: "linkedin" | "x" | "github" | "other";
  profileUrl: string;
  avatarUrl?: string;
  topics: string[];
  lastCheckedAt?: string;
  lastPostAt?: string;
  newPostCount: number;
  isActive: boolean;
  sourceIds?: string[];
}

export interface SourceStatus {
  id: string;
  name: string;
  type: string;
  url?: string;
  status: "active" | "waiting" | "running" | "degraded" | "error" | "paused" | "disabled";
  lastCheckedAt?: string;
  lastSuccessfulRunAt?: string;
  totalItems: number;
  newItems: number;
  lastError?: string;
  checkIntervalMinutes: number;
  keywords?: string[];
  lookbackDays?: number;
  maxResults?: number;
  etag?: string;
  lastModified?: string;
}

export interface TrendPoint {
  date: string;
  contentCount: number;
  modelDownloads: number;
  weeklyArticles: number;
  sourceHealth: number;
}

export interface TrendTopic {
  name: string;
  growth: number;
  count: number;
  isNew?: boolean;
  previousCount?: number;
  itemIds?: string[];
  previousItemIds?: string[];
  categoryCounts?: Record<"paper" | "github" | "linkedin" | "huggingface", { count: number; previousCount: number }>;
}

export interface BookmarkCollection {
  id: string;
  name: string;
  description: string;
  itemIds: string[];
}
