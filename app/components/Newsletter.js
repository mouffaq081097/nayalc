import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is installed

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setEmail(''); // Clear email input on success
        formRef.current.reset(); // Reset the form
      } else {
        toast.error(data.message || 'Subscription failed.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('An unexpected error occurred.');
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-[var(--brand-rose)] via-white to-[var(--brand-cream)] relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles h-4 w-4 text-[var(--brand-pink)]" aria-hidden="true">
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                <path d="M20 2v4"></path>
                <path d="M22 4h-4"></path>
                <circle cx="4" cy="20" r="2"></circle>
              </svg>
              <span className="text-sm text-[var(--brand-pink)]">Exclusive</span>
            </div>
            <h2 className="text-3xl md:text-4xl mb-4">
              <span className="text-gray-900">Join the </span>
              <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">Lumière Club</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Get exclusive previews of our new arrivals, beauty tips and special offers delivered straight to your inbox.</p>
          </div>
          <div className="max-w-md mx-auto mb-8">
            <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true">
                  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                </svg>
                <Input 
                  type="email" 
                  placeholder="your@email.com" 
                  required 
                  className="pl-10 h-12 border-gray-200 focus:border-[var(--brand-pink)] focus:ring-[var(--brand-pink)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90 transition-opacity px-8">Subscribe</Button>
            </form>
            {message && <p className="mt-4 text-center text-sm text-green-600">{message}</p>}
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[var(--brand-pink)] rounded-full"></div>
              <span>Exclusive 20% off offers</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[var(--brand-blue)] rounded-full"></div>
              <span>New arrivals first access</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[var(--brand-pink)] rounded-full"></div>
              <span>Personalized beauty tips</span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-[var(--brand-pink)]/10 to-[var(--brand-blue)]/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-[var(--brand-blue)]/10 to-[var(--brand-pink)]/10 rounded-full blur-xl"></div>
    </section>
  );
}
