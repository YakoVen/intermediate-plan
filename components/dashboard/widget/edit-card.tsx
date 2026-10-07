'use client';

import { Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface EditCardProps {
  title: string;
  subtitle?: string;
  editHref?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function EditCard({ title, subtitle, editHref, onEdit, onDelete }: EditCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <h3 className="font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {editHref ? (
          <Link href={editHref} className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors">
            <Edit size={16} />
          </Link>
        ) : (
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors">
            <Edit size={16} />
          </button>
        )}
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
