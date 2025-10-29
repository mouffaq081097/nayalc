import React from 'react';

const ComingSoonSection = () => {
    return (
        <section className="mt-16 bg-[var(--brand-premium-bg)] rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-blue)]">Launching Soon</h3>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--brand-text)] font-serif mt-4">The Bespoke Collection</h2>
                <p className="text-[var(--brand-muted)] mt-4 max-w-xl mx-auto">
                    Experience skincare tailored to you. Sign up to be the first to know when our personalized collection arrives, and receive an exclusive launch offer.
                </p>
                <form className="mt-8 max-w-xl mx-auto flex flex-col sm:flex-row gap-4 sm:gap-0">
                    <input 
                        type="email" 
                        placeholder="Enter your email address" 
                        className="flex-grow border border-gray-300 rounded-full sm:rounded-l-full sm:rounded-r-none p-4 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-[var(--brand-pink)]" 
                        aria-label="Email address for notification"
                    />
                    <button 
                        type="submit" 
                        className="bg-[var(--brand-button-bg)] text-white px-8 py-4 rounded-full sm:rounded-r-full sm:rounded-l-none font-bold hover:opacity-90 transition-opacity text-sm flex-shrink-0 mt-2 sm:mt-0"
                    >
                        Notify Me
                    </button>
                </form>
            </div>
            {/* Background decorative elements */}
            <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-[rgba(var(--brand-blue-rgb),0.05)] opacity-50"></div>
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-[rgba(var(--brand-pink-rgb),0.05)] opacity-50"></div>
        </section>
    );
};

export default ComingSoonSection;
