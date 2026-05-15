import { ChapterVideoStory } from "@/components/ChapterVideoStory";
import { chapterVideoConfig, chapterVideoStages, productOffer } from "@/lib/baerskin-content";

export default function Home() {
  return (
    <main className="video-only-page">
      <ChapterVideoStory config={chapterVideoConfig} offer={productOffer} stages={chapterVideoStages} />
    </main>
  );
}
