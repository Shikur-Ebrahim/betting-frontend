import BannerSlider from './BannerSlider';
import FixturesPage from './fixtures/page';

export default function Home() {
  return (
    <div className="home-container">
      <BannerSlider />
      <FixturesPage />
    </div>
  );
}
