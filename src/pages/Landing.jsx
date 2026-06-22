import { useState, useEffect } from 'react';
import { Button, Card } from '../components/UI';
import { 
  FileText, Users, Package, Briefcase, 
  CheckCircle, Smartphone, Shield, Zap,
  TrendingUp, Clock, DollarSign, BarChart3
} from 'lucide-react';

export default function Landing({ navigate }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: FileText, title: 'Professional Quotes', desc: 'Create professional quotations in minutes' },
    { icon: Users, title: 'Client Management', desc: 'Manage all your clients in one place' },
    { icon: Package, title: 'Material Price DB', desc: 'Store and reuse material prices' },
    { icon: Briefcase, title: 'Project Tracking', desc: 'Track projects from start to finish' },
    { icon: DollarSign, title: 'Expense Tracking', desc: 'Track costs and calculate profits' },
    { icon: TrendingUp, title: 'Profit Analytics', desc: 'See your profit margins in real-time' },
  ];

  return (
    <div className="min-h-screen bg-[#0a1810] text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0a1810]/95 backdrop-blur-md border-b border-[#1e3a2a]' : ''
      }`}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏗️</span>
            <span className="font-bold text-lg text-green-400">QuotePro</span>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => navigate('login')}
            >
              Sign In
            </Button>
            <Button 
              size="sm" 
              onClick={() => navigate('login')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 text-center">
        <div className="max-w-lg mx-auto">
          <div className="inline-block bg-green-900/30 border border-green-700 rounded-full px-4 py-1 text-sm text-green-400 mb-4">
            🔥 Construction Management Made Simple
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Win More Jobs.
            <br />
            <span className="text-green-400">Quote in Minutes.</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-sm mx-auto">
            The all-in-one platform for contractors to create professional quotes, 
            manage projects, and track profits.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('login')}
            className="px-8 py-4 text-lg"
          >
            Start Free Trial
            <Zap size={20} className="ml-2" />
          </Button>
          <p className="text-xs text-gray-500 mt-3">No credit card required · 30-day free trial</p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 px-4">
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-4">
          <Card>
            <div className="text-center py-2">
              <div className="text-2xl font-bold text-green-400">30+</div>
              <div className="text-xs text-gray-500">Construction Materials</div>
            </div>
          </Card>
          <Card>
            <div className="text-center py-2">
              <div className="text-2xl font-bold text-green-400">100%</div>
              <div className="text-xs text-gray-500">Offline Capable</div>
            </div>
          </Card>
          <Card>
            <div className="text-center py-2">
              <div className="text-2xl font-bold text-green-400">M200</div>
              <div className="text-xs text-gray-500">Monthly Subscription</div>
            </div>
          </Card>
          <Card>
            <div className="text-center py-2">
              <div className="text-2xl font-bold text-green-400">📱</div>
              <div className="text-xs text-gray-500">Works on Any Phone</div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Everything You Need</h2>
          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="hover:border-green-700 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="bg-green-900/30 p-2 rounded-lg mt-1">
                    <feature.icon size={20} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 bg-gradient-to-b from-[#0a1810] to-[#1a2e1a]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Grow Your Business?</h2>
          <p className="text-gray-400 mb-6">
            Join thousands of contractors who are winning more jobs with QuotePro.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('login')}
            className="px-8 py-4 text-lg"
          >
            
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-[#1e3a2a] text-center">
        <div className="max-w-lg mx-auto">
          <p className="text-sm text-gray-500">© 2026 QuotePro. Built for Lesotho contractors.</p>
          <p className="text-xs text-gray-600 mt-1">M-Pesa & EcoCash payments accepted</p>
        </div>
      </footer>
    </div>
  );
}