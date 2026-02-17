import '../App.css';
import Header from '../page/Navigation';
import Hero from '../page/HeroSection';
import FeaturesSection from '../page/FeaturesSection';
import HowItWorksSection from '../page/HowItWorks';
import GallerySection from '../page/GallerySection';
import CTASection from '../page/CTASection';
import Footer from '../page/Footer';

import { Navigate } from 'react-router-dom';

function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeaturesSection />
        <HowItWorksSection />
        <GallerySection />
        <CTASection />
      </main>
      <Footer />
      </>
  );
}

export default LandingPage;
