import Hero from '../scenes/Hero';
import Expertise from '../scenes/Expertise';
import PricingScene from '../scenes/PricingScene';
import ManuscriptProof from '../scenes/ManuscriptProof';
import Person from '../scenes/Person';
import Method from '../scenes/Method';
import Reviews from '../scenes/Reviews';
import CtaBand from '../components/CtaBand';
import TrustBand from '../components/TrustBand';
import Faq from '../components/Faq';

export default function Home() {
  return (
    <div className="home">
      <Hero />
      <Expertise />
      <TrustBand />
      <PricingScene />
      <ManuscriptProof />
      <CtaBand variant="proof" />
      <Reviews />
      <Person />
      <Method />
      <Faq />
      <CtaBand variant="method" />
    </div>
  );
}
