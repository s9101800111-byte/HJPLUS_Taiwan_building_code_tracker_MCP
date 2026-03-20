export interface Article {
  chapter: string;
  articleNum: string;
  content: string;
}

export interface LawData {
  lawName: string;
  lastUpdated: string;
  articles: Article[];
}

export interface SearchResult extends Article {
  score: number;
}
