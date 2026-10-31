import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, Command, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Page = 'home' | 'signin' | 'signup' | 'reset' | 'privacy' | 'terms' | 'refunds';

export default function PublicPortal() {
  const [page, setPage] = useState<Page>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setMessage('');
    try {
      if (page === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
        if (error) throw error;
        setMessage('Account created. Check your inbox for the confirmation email, then return here to sign in.');
      } else if (page === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
        if (error) throw error;
        setMessage('If an account exists for that email, a password-reset link has been sent.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage('Signed in. Loading your workspace…');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not complete that request. Please try again.');
    } finally { setBusy(false); }
  }

  const authPage = page === 'signin' || page === 'signup' || page === 'reset';
  const legal = page === 'privacy' || page === 'terms' || page === 'refunds';
  return <div className="public-shell">
    <header className="public-nav">
      <button className="public-brand" onClick={() => setPage('home')}><span><Command size={19}/></span>business<span>OS</span><sup>™</sup></button>
      <nav><button onClick={() => setPage('home')}>Overview</button><button onClick={() => setPage('privacy')}>Privacy</button><button onClick={() => setPage('terms')}>Terms</button></nav>
      <button className="button secondary" onClick={() => setPage('signin')}>Sign in <ArrowRight size={15}/></button>
    </header>
    {page === 'home' && <main className="public-main">
      <section className="public-hero">
        <div className="eyebrow"><i/> A CLEARER WAY TO RUN YOUR BUSINESS</div>
        <h1>Less juggling.<br/><em>More meaningful</em> momentum.</h1>
        <p className="public-lead">A beautifully focused workspace for independent business owners. Keep client relationships, daily priorities, and service offers organized in one place.</p>
        <div className="public-cta"><button className="button primary" onClick={() => setPage('signup')}>Create your account <ArrowRight size={16}/></button><button className="button secondary" onClick={() => setPage('signin')}>Already have an account</button></div>
        <div className="public-trust"><span><Check size={14}/> One-time purchase</span><span><Check size={14}/> No recurring subscription</span><span><Check size={14}/> No AI features</span></div>
        <div className="public-orbit orbit-one"/><div className="public-orbit orbit-two"/>
      </section>
      <section className="public-feature-grid">
        <article><span><Mail size={19}/></span><h3>Relationships, remembered</h3><p>Organize contacts, track lead stages, and keep potential client value visible.</p></article>
        <article><span><Check size={19}/></span><h3>Priorities, simplified</h3><p>Capture tasks, set due windows and priorities, and mark progress as you go.</p></article>
        <article><span><Sparkles size={19}/></span><h3>Offers, made clear</h3><p>Keep your services and packages in one place with pricing and readiness status.</p></article>
        <article><span><ShieldCheck size={19}/></span><h3>Your workspace</h3><p>Sign in to sync your records with your own account when cloud services are configured.</p></article>
      </section>
      <section className="public-pricing">
        <div><div className="eyebrow"><i/> SIMPLE, ONE-TIME PRICING</div><h2>Invest once. Get organized.</h2><p>No monthly software subscription. No AI add-ons. Just a practical business workspace.</p></div>
        <div className="price-card"><span>INTRODUCTORY LIFETIME ACCESS</span><div className="price">$59 <small>USD / once</small></div><p>Planned standard price: $79 USD</p><button className="button primary" onClick={() => setPage('signup')}>Get started <ArrowRight size={15}/></button><small>Checkout availability depends on the product owner's payment configuration. No payment is taken by creating an account.</small></div>
      </section>
      <section className="public-faq"><h2>Good to know</h2><details><summary>Is this a subscription?</summary><p>No. The planned offer is a one-time lifetime purchase, not a recurring subscription.</p></details><details><summary>Does it use AI?</summary><p>No. Business OS is intentionally designed without AI features.</p></details><details><summary>Can I export my records?</summary><p>Yes. The workspace includes a JSON export for contacts, tasks, and offers.</p></details><details><summary>Is checkout live?</summary><p>Not until the owner configures and tests the payment provider. Creating an account does not charge you.</p></details></section>
    </main>}
    {authPage && <main className="auth-layout"><section className="auth-card"><span className="auth-lock"><LockKeyhole size={21}/></span><div className="eyebrow"><i/> BUSINESS OS / YOUR ACCOUNT</div><h1>{page === 'signup' ? 'Create your workspace.' : page === 'reset' ? 'Reset your password.' : 'Welcome back.'}</h1><p>{page === 'signup' ? 'Create an account to keep your business workspace connected.' : page === 'reset' ? 'We’ll send a secure password-reset link if the account exists.' : 'Sign in to pick up where you left off.'}</p><form onSubmit={submit}><label>Email address<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label>{page !== 'reset' && <label>Password<input type="password" autoComplete={page === 'signup' ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"/></label>}<button className="button primary" disabled={busy}>{busy ? 'Please wait…' : page === 'signup' ? 'Create account' : page === 'reset' ? 'Send reset link' : 'Sign in'} <ArrowRight size={15}/></button></form>{message && <p className="auth-feedback" role="status">{message}</p>}<div className="auth-links">{page !== 'signin' && <button onClick={() => {setPage('signin');setMessage('')}}>Sign in</button>}{page !== 'signup' && <button onClick={() => {setPage('signup');setMessage('')}}>Create account</button>}{page !== 'reset' && <button onClick={() => {setPage('reset');setMessage('')}}>Forgot password?</button>}</div><small className="auth-disclosure">Account creation is free. A separate one-time purchase is required for paid workspace access. Payment is never inferred from account creation or a browser redirect.</small></section></main>}
    {legal && <main className="legal-layout"><button className="back-link" onClick={() => setPage('home')}>← Back to Business OS</button><div className="eyebrow"><i/> BUSINESS OS / CUSTOMER INFORMATION</div><h1>{page === 'privacy' ? 'Privacy overview' : page === 'terms' ? 'Terms of use' : 'Refund information'}</h1><p className="legal-warning">Important: These are product information drafts, not finalized legal policies. The business operator must add verified legal identity, contact details, governing jurisdiction, and policy decisions and obtain appropriate review before accepting customers.</p>
      {page === 'privacy' ? <><h2>Information handled by the workspace</h2><p>Business OS is designed to store contact, task, and offer information that a customer chooses to enter. When hosted authentication and cloud storage are configured, account and workspace data are processed by the configured Supabase project. Payment processing, if enabled, is handled by Stripe Checkout; full card details should not be collected or stored by this application.</p><h2>Purpose and access</h2><p>Workspace data is used to provide the account and product functions. The application is designed to restrict cloud records to the authenticated account through database row-level security. The operator must document actual retention periods, processors, data location, support access, analytics, and any other tracking before launch.</p><h2>Your choices</h2><p>The app provides a workspace JSON export. A complete account deletion and privacy-request process must be established by the operator before launch. Contact: operator contact details must be supplied before publication.</p></> : page === 'terms' ? <><h2>Product and account</h2><p>Business OS is a business-organization tool for contacts, tasks, and service offers. Customers are responsible for the accuracy and lawfulness of information they enter, protecting account credentials, and maintaining their own backups.</p><h2>Payment and access</h2><p>The planned commercial model is a one-time lifetime purchase, with an introductory price of USD $59 and a planned standard price of USD $79. These amounts are not a binding offer until a matching checkout price is configured and displayed by the operator. Access is granted only after payment is verified by the payment provider.</p><h2>Availability and limitations</h2><p>Service availability, support scope, acceptable use, intellectual property ownership, liability limits, dispute process, and governing law must be defined by the operator and reviewed before publication. Contact: operator contact details must be supplied before publication.</p></> : <><h2>One-time purchase model</h2><p>The planned Business OS offer is a one-time payment, not a recurring subscription. A purchase does not create a monthly renewal.</p><h2>Refund terms must be confirmed before sale</h2><p>The operator must publish a clear refund window, eligibility rules, request process, and applicable legal rights before accepting payment. Do not rely on this draft as a refund policy. For assistance, customers need a verified support email or contact route supplied by the operator.</p><h2>Payment disputes</h2><p>Payment reversals, refunds, and disputes may affect access as described in the final published terms and applicable law. The actual process must be disclosed before checkout is enabled.</p></>}
    </main>}
    <footer className="public-footer"><span>© 2026 Business OS™</span><span>One workspace. A little more clarity.</span><span><button onClick={() => setPage('privacy')}>Privacy</button><button onClick={() => setPage('terms')}>Terms</button><button onClick={() => setPage('refunds')}>Refunds</button></span></footer>
  </div>;
}
