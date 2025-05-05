// frontend/src/components/hero-05/Hero05.tsx
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {ArrowUpRight} from 'lucide-react';
import {Link} from 'react-router-dom';
import heroImage from '@/assets/hero_image.png';

/**
 * Hero landing component for the home page
 */
const Hero05 = () => {
  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* change here: use 40%/60% split instead of equal halves */}
      <div className="max-w-screen-xl w-full mx-auto grid lg:[grid-template-columns:40%_60%] gap-12 px-6 py-12 lg:py-0">
        {/* left side */}
        <div className="my-auto space-y-6">
          <Badge className="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 text-white rounded-full py-1 px-3 text-sm font-semibold border-none">
            Now Live – v1.0.0
          </Badge>

          <h1 className="mt-4 text-4xl md:text-5xl lg:text-[2.75rem] xl:text-5xl font-bold leading-tight tracking-tight text-gray-900">
            AI-Powered Mandarin Chat Tutor
          </h1>

          <p className="mt-4 max-w-[60ch] text-lg text-gray-700">
            Practice real-world Mandarin conversations—at your own level. Our AI
            tutor adapts in real time, giving instant feedback on pronunciation,
            grammar, and vocabulary. Speak or type, then track your progress
            from HSK 1 to fluency with confidence.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/signup">
              <Button
                size="lg"
                className="rounded-full text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                Get Started <ArrowUpRight className="!h-5 !w-5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* right image */}
        <div className="w-full aspect-video lg:aspect-auto lg:h-screen rounded-xl overflow-hidden">
          <img
            src={heroImage}
            alt="Student practicing Mandarin on a phone"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero05;