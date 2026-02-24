import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Book, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Help = () => {
  const helpTopics = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of using Axent',
      icon: Book,
    },
    {
      title: 'Budget Tracking',
      description: 'How to manage your personal finances',
      icon: Book,
    },
    {
      title: 'Business Finance',
      description: 'Tools for managing your business',
      icon: Book,
    },
    {
      title: 'AI Financial Advisor',
      description: 'Get help with AI-powered insights',
      icon: Book,
    },
  ];

  return (
    <div className="min-h-screen font-montserrat bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-8">Help & Support</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {helpTopics.map((topic, index) => (
            <div key={index} className="glass-card p-6 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-budgify-500/20">
                  <topic.icon size={24} className="text-budgify-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{topic.title}</h3>
                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold mb-6">Contact Support</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 glass rounded-lg">
              <MessageCircle size={32} className="text-budgify-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground mb-4">Chat with our support team</p>
              <Button variant="outline" size="sm">Start Chat</Button>
            </div>

            <div className="text-center p-6 glass rounded-lg">
              <Mail size={32} className="text-budgify-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-sm text-muted-foreground mb-4">support@axent.com</p>
              <Button variant="outline" size="sm">Send Email</Button>
            </div>

            <div className="text-center p-6 glass rounded-lg">
              <Phone size={32} className="text-budgify-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Phone</h3>
              <p className="text-sm text-muted-foreground mb-4">+1 (555) 123-4567</p>
              <Button variant="outline" size="sm">Call Us</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
