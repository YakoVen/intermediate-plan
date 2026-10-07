import { Star } from 'lucide-react';

interface OrderCardProps {
  author: string;
  date: string;
  rating: number;
  content: string;
}

export default function OrderCard({ author, date, rating, content }: OrderCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900">{author}</span>
        <span className="text-sm text-gray-500">{date}</span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
          />
        ))}
      </div>
      <p className="text-gray-600">{content}</p>
    </div>
  );
}
