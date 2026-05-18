import { ChapterVideoStory } from "@/components/ChapterVideoStory";
import { chapterVideoConfig, chapterVideoStages, productFaqs, productOffer, productReviews } from "@/lib/baerskin-content";

export default function Home() {
  return (
    <main className="video-only-page">
      <ChapterVideoStory
        config={chapterVideoConfig}
        faqs={productFaqs}
        offer={productOffer}
        reviews={productReviews}
        stages={chapterVideoStages}
      />
    </main>
  );
}
