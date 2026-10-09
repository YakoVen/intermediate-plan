import Presentation from '@/components/article-page/presentation';
import { notFound } from 'next/navigation';
import { getArticle, getArticles } from '@/service/firebase/database';

export default async function ArticleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await getArticle(id);

  if (!raw || raw.active === false) return notFound();

  const images = [raw.thumbnail, ...(raw.screenshots || [])].filter(Boolean);
  const stock = raw.totalStock ?? 1;
  const discount = raw.oldPrice && raw.oldPrice > raw.price
    ? Math.round(((raw.oldPrice - raw.price) / raw.oldPrice) * 100)
    : 0;

  const article = { ...raw, images, stock, discount };

  const related = (await getArticles({ active: true }))
    .filter((a) => a.id !== raw.id && a.category === raw.category)
    .slice(0, 4)
    .map((a) => ({ id: a.id, title: a.title, thumbnail: a.thumbnail, price: a.price }));

  return <Presentation article={article} relatedArticles={related} />;
}
