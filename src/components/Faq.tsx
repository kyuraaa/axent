import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollAnimation, useStaggerAnimation } from '@/hooks/useScrollAnimation';

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const headingRef = useScrollAnimation();
  const faqsRef = useStaggerAnimation('.faq-item');
  
  const faqs = [
    {
      question: 'How does the AI financial advisor work?',
      answer: 'Our AI financial advisor analyzes your spending habits, income, and financial goals to provide personalized recommendations. It learns from your patterns over time to offer increasingly tailored advice, helping you make better financial decisions.'
    },
    {
      question: 'Is my financial data secure?',
      answer: 'Yes, we take data security very seriously. All your financial information is encrypted using bank-level security protocols. We never share your data with third parties without your explicit consent, and you can delete your data at any time.'
    },
    {
      question: 'Can I connect multiple bank accounts?',
      answer: 'Absolutely! Axent supports connections with over 10,000 financial institutions. You can connect multiple bank accounts, credit cards, investment portfolios, and more to get a comprehensive view of your finances in one place.'
    },
    {
      question: 'What makes Axent different from other financial apps?',
      answer: 'Axent stands out through its advanced AI technology that provides truly personalized financial guidance. Unlike other apps that offer generic advice, our system adapts to your unique financial situation and goals, offering tailored recommendations and insights.'
    },
    {
      question: 'Is there a free version available?',
      answer: 'Yes, we offer a free basic plan that includes budget tracking and simple financial insights. Our premium plans unlock advanced features like AI financial advisor, investment tracking, and detailed analytics, starting at just $5.99/month.'
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="px-3 sm:px-4 md:px-8 py-10 md:py-14 relative scroll-mt-20">
      {/* Decorative background element */}
      <div className="absolute top-0 right-1/4 w-1/3 h-1/3 rounded-full bg-budgify-500/5 blur-[100px] -z-10"></div>
      
      <div className="max-w-3xl mx-auto">
        <div ref={headingRef} className="text-center mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-3 px-3">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto px-3">
            Get answers to common questions about Axent and how it can help you achieve financial freedom.
          </p>
        </div>
        
        <div ref={faqsRef} className="space-y-3">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="faq-item glass-card overflow-hidden"
            >
              <button 
                className="w-full text-left p-3 sm:p-4 flex justify-between items-center"
                onClick={() => toggleFaq(index)}
              >
                <h3 className="font-semibold text-sm sm:text-base pr-3 sm:pr-6">{faq.question}</h3>
                <ChevronDown 
                  size={16} 
                  className={cn(
                    "transition-transform duration-300 text-budgify-400 flex-shrink-0",
                    openIndex === index ? "rotate-180" : ""
                  )} 
                />
              </button>
              
              <div 
                className={cn(
                  "overflow-hidden transition-all duration-300 px-3 sm:px-4",
                  openIndex === index ? "max-h-52 pb-3 sm:pb-4" : "max-h-0"
                )}
              >
                <p className="text-xs sm:text-sm text-white/70">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;
