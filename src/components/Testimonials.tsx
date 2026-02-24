import React from 'react';
import { TestimonialsColumn } from '@/components/ui/testimonials-columns';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const testimonials = [
  {
    text: "Budgify has completely transformed how I manage both my personal and business finances. The AI recommendations have helped me save over $5,000 in the past year alone.",
    image: "https://randomuser.me/api/portraits/women/12.jpg",
    name: "Sarah Johnson",
    role: "Small Business Owner",
  },
  {
    text: "As someone who loves data, I appreciate how Budgify visualizes my spending patterns. It's helped me optimize my budget and increase my monthly investments.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Michael Chen",
    role: "Software Engineer",
  },
  {
    text: "The intuitive interface makes financial planning actually enjoyable! I've recommended Budgify to all my colleagues who struggle with financial management.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Aisha Patel",
    role: "Healthcare Professional",
  },
  {
    text: "This platform revolutionized our operations, streamlining finance and inventory. The cloud-based system keeps us productive, even remotely.",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Briana Patton",
    role: "Operations Manager",
  },
  {
    text: "Implementing Budgify was smooth and quick. The customizable, user-friendly interface made team training effortless.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Bilal Ahmed",
    role: "IT Manager",
  },
  {
    text: "The support team is exceptional, guiding us through setup and providing ongoing assistance, ensuring our satisfaction.",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Saman Malik",
    role: "Customer Support Lead",
  },
  {
    text: "Budgify's seamless integration enhanced our business operations and efficiency. Highly recommend for its intuitive interface.",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "Omar Raza",
    role: "CEO",
  },
  {
    text: "Its robust features and quick support have transformed our workflow, making us significantly more efficient.",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Zainab Hussain",
    role: "Project Manager",
  },
  {
    text: "The smooth implementation exceeded expectations. It streamlined processes, improving overall business performance.",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    name: "Aliza Khan",
    role: "Business Analyst",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const Testimonials = () => {
  const headingRef = useScrollAnimation();

  return (
    <section id="testimonials" className="px-3 sm:px-4 md:px-8 py-10 md:py-14 relative scroll-mt-20 overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 rounded-full bg-emerald-600/5 blur-[100px] -z-10"></div>
      
      <div className="max-w-5xl mx-auto">
        <div ref={headingRef} className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center justify-center mb-3">
            <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-budgify-500/10 text-budgify-400 border border-budgify-500/20">
              Testimonials
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-white">
            What our users say
          </h2>
          <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto px-3">
            See what our customers have to say about us.
          </p>
        </div>
        
        <div className="flex justify-center gap-4 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[450px]">
          <TestimonialsColumn
            testimonials={firstColumn}
            duration={15}
            className="hidden md:block"
          />
          <TestimonialsColumn
            testimonials={secondColumn}
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            duration={17}
            className="hidden lg:block"
          />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
