export interface PortfolioItem {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  cover: string;
  featured: boolean;
  deliverables: string[];
}
