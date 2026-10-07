export interface Review {
  id: string;
  articleId: string;
  authorName: string;
  rating: number;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  userId?: string;
}
