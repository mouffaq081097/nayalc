import React from 'react';

const ComingSoonSection = () => {
    return (
        <section style={{marginTop: '4rem', backgroundColor: 'var(--brand-premium-bg)', borderRadius: '1rem', padding: '3rem', textAlign: 'center', position: 'relative', overflow: 'hidden'}}>
            <div style={{position: 'relative', zIndex: 10}}>
                <h3 style={{fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand-blue)'}}>Launching Soon</h3>
                <h2 style={{fontSize: '2.25rem', fontWeight: '700', color: 'var(--brand-text)', fontFamily: 'serif', marginTop: '1rem'}}>The Bespoke Collection</h2>
                <p style={{color: 'var(--brand-muted)', marginTop: '1rem', maxWidth: '42rem', marginLeft: 'auto', marginRight: 'auto'}}>
                    Experience skincare tailored to you. Sign up to be the first to know when our personalized collection arrives, and receive an exclusive launch offer.
                </p>
                <form style={{marginTop: '2rem', maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto', display: 'flex'}}>
                    <input 
                        type="email" 
                        placeholder="Enter your email address" 
                        style={{flexGrow: 1, border: '1px solid #d1d5db', borderTopLeftRadius: '9999px', borderBottomLeftRadius: '9999px', padding: '1rem', fontSize: '0.875rem', outline: 'none'}} /* focus:ring-brand-pink focus:border-brand-pink */
                        aria-label="Email address for notification"
                    />
                    <button 
                        type="submit" 
                        style={{backgroundColor: 'var(--brand-button-bg)', color: 'white', paddingLeft: '2rem', paddingRight: '2rem', borderTopRightRadius: '9999px', borderBottomRightRadius: '9999px', fontSize: '0.875rem', fontWeight: '700', transition: 'opacity 150ms', flexShrink: 0}} /* hover:opacity-90 */
                    >
                        Notify Me
                    </button>
                </form>
            </div>
            {/* Background decorative elements */}
            <div style={{position: 'absolute', top: '-4rem', left: '-4rem', width: '12rem', height: '12rem', borderRadius: '9999px', backgroundColor: 'rgba(var(--brand-blue-rgb), 0.05)', opacity: 0.5}}></div>
            <div style={{position: 'absolute', bottom: '-4rem', right: '-4rem', width: '12rem', height: '12rem', borderRadius: '9999px', backgroundColor: 'rgba(var(--brand-pink-rgb), 0.05)', opacity: 0.5}}></div>
        </section>
    );
};

export default ComingSoonSection;
