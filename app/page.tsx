import React from 'react';
import LayoutWrapper from '@/components/general/layout-wrapper';
import WelcomeSection from '@/components/landingpage/welcom-section';
import CategoriesPreviews from '@/components/landingpage/categories-previews';
import FeaturedProducts from '@/components/landingpage/featured-products';
import RatingsPreview from '@/components/landingpage/ratings-preview';
import StoreSection from '@/components/landingpage/store-section';
import SuggestionsPreview from '@/components/landingpage/suggestions-preview';
import { getArticles } from '@/service/firebase/database';
import { Article } from '@/interfaces/article';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let activeArticles: Article[] = [];

  try {
    activeArticles = await getArticles({ active: true });
  } catch {
    // Firebase not configured yet — use empty array
  }

  const featured = activeArticles.slice(0, 10);
  const suggested = activeArticles.slice(10, 14);

  return (
    <LayoutWrapper>
      <WelcomeSection />
      <StoreSection />
      <CategoriesPreviews />
      <FeaturedProducts products={featured} />
      <RatingsPreview />
      {suggested.length > 0 && <SuggestionsPreview products={suggested} />}
    </LayoutWrapper>
  );
}
