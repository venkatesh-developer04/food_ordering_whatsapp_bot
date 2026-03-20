import React from 'react';
import { motion } from 'framer-motion';
import { Bot, LineChart, Layers, Smartphone, Settings, Building2, Utensils, Zap, CheckCircle2, MessageCircle, Info } from 'lucide-react';

export default function App() {
  const [showModal, setShowModal] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState(null);
  const [formData, setFormData] = React.useState({
    name: '', subdomain: '', email: '', phone: ''
  });
  
  const [checkoutTenant, setCheckoutTenant] = React.useState(null);
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutId = params.get('checkout');
    if (checkoutId) {
      setCheckoutLoading(true);
      fetch(`/api/admin/tenants/${checkoutId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setCheckoutTenant(data);
          setCheckoutLoading(false);
        }).catch(err => {
          console.error(err);
          setCheckoutLoading(false);
        });
    }
  }, []);

  const triggerDirectPayment = () => {
    if (!checkoutTenant) return;
    
    // Determine exact pricing based on plan string
    const price = checkoutTenant.subscription?.plan === 'pro' ? 1299 : 499;

    const options = {
      key: "rzp_test_YourTestKey", 
      amount: price * 100, 
      currency: "INR",
      name: "Waitro Software",
      description: `Payment for ${checkoutTenant.name}`,
      image: "/mockup-dashboard.png",
      handler: async function (response) {
        alert('Payment Verified (ID: ' + response.razorpay_payment_id + '). Activating your dashboard...');
        
        try {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + (checkoutTenant.subscription?.plan === 'pro' ? 3 : 1));

          // Activate tenant via our backend API
          const res = await fetch(`/api/admin/tenants/${checkoutTenant._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status: 'active',
              subscription: {
                 plan: checkoutTenant.subscription?.plan,
                 endDate: endDate.toISOString()
              }
            })
          });
          
          if(res.ok) {
            window.location.href = `http://${checkoutTenant.subdomain}.localhost:5175/`;
          } else {
            const err = await res.json();
            alert("Activation failed: " + err.error);
          }
        } catch (e) {
          console.error(e);
          alert("Server error during activation.");
        }
      },
      prefill: { name: checkoutTenant.name, email: checkoutTenant.email, contact: checkoutTenant.phone },
      theme: { color: "#7000ff" }
    };
    
    // Dynamically insert Razorpay script purely for the checkout route
    if (!window.Razorpay) {
       const script = document.createElement('script');
       script.src = 'https://checkout.razorpay.com/v1/checkout.js';
       script.onload = () => { new window.Razorpay(options).open(); };
       document.body.appendChild(script);
    } else {
       new window.Razorpay(options).open();
    }
  };

  const submitInquiry = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        status: 'inactive', // Saved as inactive until Admin approves/requests payment
        subscription: {
          plan: selectedPlan.id,
          endDate: new Date().toISOString() // Will be updated correctly when payment is manually processed
        }
      };

      // Send the lead to the backend Control Panel
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        alert("Success! Your request has been sent to our team. Please check your email shortly for your payment link to activate your dashboard.");
        setShowModal(false);
        setFormData({ name: '', subdomain: '', email: '', phone: '' });
      } else {
        const err = await res.json();
        alert("Registration Request failed: " + err.error);
      }
    } catch (e) {
      console.error(e);
      alert("Server error during registration.");
    }
  };

  const openProvisionModal = (plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  if (checkoutLoading) {
    return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading Secured Checkout...</div>;
  }

  if (checkoutTenant) {
     return (
       <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', padding: 24 }}>
          <motion.div initial={{opacity: 0, y: 30}} animate={{opacity: 1, y: 0}} style={{ background: 'var(--card-bg)', padding: '50px', borderRadius: 24, textAlign: 'center', maxWidth: 500, width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
             <Building2 size={60} color="var(--accent-2)" style={{marginBottom: 24}}/>
             <h2>Activate {checkoutTenant.name}</h2>
             <p style={{ color: 'var(--text-secondary)', marginBottom: 32, marginTop: 8 }}>Secure your environment and complete activation.</p>
             
             {checkoutTenant.status === 'active' ? (
                <div style={{ color: '#10b981', padding: '20px', background: 'rgba(16,185,129,0.1)', borderRadius: 12 }}>
                   <CheckCircle2 size={32} style={{marginBottom: 12}}/>
                   <h3>Already Active</h3>
                   <p style={{fontSize: '0.9rem', marginTop: 8}}>This environment is already fully paid and provisioned. No outstanding payments.</p>
                   <a href={`http://${checkoutTenant.subdomain}.localhost:5175/`} className="btn btn-pay" style={{marginTop: 24, textDecoration: 'none'}}>Open Dashboard</a>
                </div>
             ) : (
                <>
                   <div style={{ background: 'rgba(0,0,0,0.3)', padding: 24, borderRadius: 12, marginBottom: 32, textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                         <span>Selected Plan:</span>
                         <strong style={{textTransform: 'capitalize'}}>{checkoutTenant.subscription?.plan} Edition</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                         <span>Subdomain:</span>
                         <strong>{checkoutTenant.subdomain}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                         <span>Total Due:</span>
                         <strong style={{color: 'var(--accent)', fontSize: '1.2rem'}}>₹{checkoutTenant.subscription?.plan === 'pro' ? 1299 : 499}</strong>
                      </div>
                   </div>
                   <button className="btn btn-pay" onClick={triggerDirectPayment} style={{ width: '100%' }}>
                      <Zap size={20} /> Complete Payment Now
                   </button>
                </>
             )}
          </motion.div>
       </div>
     );
  }

  return (
    <div>
      <div className="glow"></div>
      <div className="glow-2"></div>
      
      <div className="container">
        <nav>
          <div className="logo">WAITRO</div>
        </nav>

        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-content">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1>Turn WhatsApp into <br/> <span className="highlight">Your Smart Restaurant Assistant</span></h1>
              <p className="lead">Automate orders, manage menus, and serve customers 24/7 through a single WhatsApp chat. No apps. No hardware. Just automation.</p>
              
              <div className="btn-group">
                <a href="https://wa.me/917548879400?text=Hi!%20I'm%20interested%20in%20Waitro!" target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <MessageCircle size={24} /> Get Started
                </a>
                <a href="#how-it-works" className="btn btn-outline">
                  <Info size={24} /> Book Demo
                </a>
              </div>
            </motion.div>

            <motion.div className="mockup-container" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <div className="css-mockup">
                 <div className="css-mockup-header">
                    <div className="css-mockup-dot r"/>
                    <div className="css-mockup-dot y"/>
                    <div className="css-mockup-dot g"/>
                 </div>
                 <div className="css-mockup-body">
                    <LineChart size={80} color="var(--accent)" />
                    <h3>Waitro Real-time Dashboard</h3>
                    <p style={{fontSize: '0.9rem', opacity: 0.7}}>Live Analytics & Kitchen Orders</p>
                 </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* WHAT IS WAITRO SECTION */}
      <section className="bg-alt" id="about">
        <div className="container grid-2">
          <motion.div className="mockup-container" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="css-mockup straight">
                 <div className="css-mockup-header" style={{ justifyContent: 'center', background: 'var(--accent)' }}>
                    <h4 style={{ color: 'black', fontSize: '0.9rem', fontWeight: 600 }}>WhatsApp Web</h4>
                 </div>
                 <div className="css-mockup-body">
                    <Bot size={70} color="var(--accent-2)" />
                    <h3>Waitro AI Bot</h3>
                    <p style={{fontSize: '0.9rem', opacity: 0.7}}>Intelligent conversational ordering</p>
                 </div>
              </div>
          </motion.div>
          
          <motion.div className="text-box" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h3>What is Waitro?</h3>
            <p>Waitro is a powerful SaaS platform that transforms your restaurant’s WhatsApp into a fully automated ordering system.</p>
            <p>Instead of hiring extra staff or building expensive applications, you can display your menu instantly, take orders automatically, and notify your kitchen in real time—all through a simple WhatsApp conversation.</p>
            
            <h3 style={{ marginTop: '40px' }}>Why Waitro?</h3>
            <p>Customers already use WhatsApp every day. Instead of asking them to download apps or wait in queues, Waitro brings the entire ordering experience directly into a chat interface.</p>
            <p>No friction. No confusion. Just message, order, and complete.</p>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="container">
        <div className="section-header">
          <h2>How It Works</h2>
          <p className="lead">Five simple steps to completely automate your workflow.</p>
        </div>
        <div className="grid-2 reverse">
          <motion.div className="text-box" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="step-list">
              <div className="step-item"><span className="step-number">01</span><div className="step-content"><h4>Customer Sends a Message</h4><p>A customer sends a message like "Hi" to your restaurant number.</p></div></div>
              <div className="step-item"><span className="step-number">02</span><div className="step-content"><h4>AI Assistant Responds</h4><p>The system instantly replies with Welcome message, Menu options, and Guided ordering flow.</p></div></div>
              <div className="step-item"><span className="step-number">03</span><div className="step-content"><h4>Order Placement</h4><p>The customer selects items and confirms the order.</p></div></div>
              <div className="step-item"><span className="step-number">04</span><div className="step-content"><h4>Real-Time Notification</h4><p>The order appears instantly on your dashboard with full details.</p></div></div>
              <div className="step-item"><span className="step-number">05</span><div className="step-content"><h4>Order Completion</h4><p>You mark the order as ready, and the customer receives an automatic notification.</p></div></div>
            </div>
          </motion.div>
          <motion.div className="mockup-container" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="css-mockup straight">
                 <div className="css-mockup-header">
                    <div className="css-mockup-dot r"/>
                    <div className="css-mockup-dot y"/>
                    <div className="css-mockup-dot g"/>
                 </div>
                 <div className="css-mockup-body" style={{ background: 'radial-gradient(circle at center, rgba(0,240,255,0.05) 0%, transparent 70%)' }}>
                    <Utensils size={70} color="var(--accent)" />
                    <h3>Order Flow Pipeline</h3>
                    <p style={{fontSize: '0.9rem', opacity: 0.7}}>Kitchen Dispatch & Prep tracking</p>
                 </div>
              </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-alt" id="features">
        <div className="container">
          <div className="section-header">
            <h2>Powerful Features</h2>
          </div>
          <div className="grid-3">
            <motion.div className="card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="card-icon"><Bot size={28} /></div>
              <h4>AI WhatsApp Assistant</h4>
              <p>Automated conversations that guide customers from first message to order confirmation.</p>
            </motion.div>
            <motion.div className="card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="card-icon"><Utensils size={28} /></div>
              <h4>Dynamic Menu Management</h4>
              <p>Update food items, pricing, and images anytime from your dashboard.</p>
            </motion.div>
            <motion.div className="card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="card-icon"><Zap size={28} /></div>
              <h4>Real-Time Order Alerts</h4>
              <p>Instant visual and auditory notifications for every new order arriving to the kitchen.</p>
            </motion.div>
            <motion.div className="card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <div className="card-icon"><Layers size={28} /></div>
              <h4>Multi-Tenant Architecture</h4>
              <p>Each restaurant operates on its own isolated environment with secure data handling.</p>
            </motion.div>
            <motion.div className="card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
              <div className="card-icon"><LineChart size={28} /></div>
              <h4>Secure Backend</h4>
              <p>Built with modern technologies to handle high traffic and real-time socket interactions.</p>
            </motion.div>
            <motion.div className="card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}>
              <div className="card-icon"><Smartphone size={28} /></div>
              <h4>No App Required</h4>
              <p>Customers interact directly through WhatsApp with no additional downloads necessary.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CONTROL PANEL */}
      <section id="control-panel" className="container">
        <div className="grid-2">
          <motion.div className="text-box" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h3>The Control Panel</h3>
            <p>A centralized dashboard that allows you to manage your menu, track and update ongoing kitchen orders, securely connect your WhatsApp number via QR code, and customize automated conversational bot responses.</p>
            <p>Everything is designed to be simple, fast, and highly efficient.</p>
          </motion.div>
          <motion.div className="mockup-container" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="css-mockup">
                 <div className="css-mockup-header">
                    <div className="css-mockup-dot r"/>
                    <div className="css-mockup-dot y"/>
                    <div className="css-mockup-dot g"/>
                 </div>
                 <div className="css-mockup-body">
                    <Layers size={80} color="var(--accent-2)" />
                    <h3>Master Control Panel</h3>
                    <p style={{fontSize: '0.9rem', opacity: 0.7}}>Manage Tenants & Track Revenue</p>
                 </div>
              </div>
          </motion.div>
        </div>
      </section>

      {/* PRICING / SUBSCRIPTION */}
      <section className="bg-alt" id="pricing">
        <div className="container">
          <div className="section-header">
            <h2>Subscription System</h2>
            <p className="lead" style={{ marginTop: '16px' }}>Waitro includes a built-in subscription system that secures tenant access and activates services instantly.</p>
          </div>

          <div className="grid-3" style={{ maxWidth: 900, margin: '0 auto' }}>
            <motion.div className="pricing-card" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h3>Basic Plan</h3>
              <div className="price">₹499<span>/ 1 month</span></div>
              <ul className="features">
                <li><CheckCircle2 size={18} color="var(--accent)" /> AI WhatsApp Assistant</li>
                <li><CheckCircle2 size={18} color="var(--accent)" /> Dynamic Menu Management</li>
                <li><CheckCircle2 size={18} color="var(--accent)" /> Centralized Dashboard</li>
              </ul>
              <button className="btn btn-outline" style={{width: '100%'}} onClick={() => openProvisionModal({id: 'basic', name: 'Basic Edition', price: 499})}>Select Basic</button>
            </motion.div>

            <motion.div className="pricing-card popular" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div style={{ position: 'absolute', top: 16, right: 16, background: 'var(--accent)', color: 'black', padding: '4px 12px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700 }}>PRO</div>
              <h3>Pro Plan</h3>
              <div className="price">₹1299<span>/ 3 months</span></div>
              <ul className="features">
                <li><CheckCircle2 size={18} color="var(--accent)" /> Everything in Basic</li>
                <li><CheckCircle2 size={18} color="var(--accent)" /> Multi-Tenant Isolation</li>
                <li><CheckCircle2 size={18} color="var(--accent)" /> Subdomain Provisioning</li>
                <li><CheckCircle2 size={18} color="var(--accent)" /> Custom Bot Responses</li>
              </ul>
              <button className="btn btn-pay" onClick={() => openProvisionModal({id: 'pro', name: 'Pro Edition', price: 1299})}><Zap size={18} /> Request Pro Access</button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container" style={{ textAlign: 'center', paddingBottom: '120px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: '3rem', marginBottom: 24 }}>Ready to automate?</h2>
          <p className="lead" style={{ maxWidth: 600, margin: '0 auto 40px auto' }}>Move beyond manual order handling and adopt a smarter software system specially built for modern growth.</p>
          
          <div className="btn-group" style={{ justifyContent: 'center' }}>
            <a href="https://wa.me/917548879400?text=Waitro%20Subscription!" target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
              <MessageCircle size={24} /> Contact Us on WhatsApp
            </a>
            <button className="btn btn-pay" onClick={() => window.scrollTo(0, document.getElementById('pricing').offsetTop)}>
              <Zap size={24} /> Get Started Now
            </button>
          </div>
        </motion.div>
      </section>

      {/* PROVISIONING MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--card-bg)', width: '100%', maxWidth: 500, borderRadius: 24, padding: 40, position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}
            >
              &times;
            </button>
            
            <h2 style={{ marginBottom: 8 }}>Request Restaurant Access</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>You selected the {selectedPlan?.name}. Enter your details and our team will securely provision your environment and send you a payment link via email.</p>
            
            <form onSubmit={submitInquiry} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-secondary)' }}>Restaurant Name</label>
                <input required type="text" placeholder="e.g. Venus Cafe" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="modal-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-secondary)' }}>Waitro Subdomain (No spaces)</label>
                <input required type="text" pattern="^[a-z0-9-]+$" placeholder="venus-cafe" value={formData.subdomain} onChange={e=>setFormData({...formData, subdomain: e.target.value.toLowerCase()})} className="modal-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-secondary)' }}>Admin Email</label>
                <input required type="email" placeholder="owner@venuscafe.com" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="modal-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-secondary)' }}>Phone Number (10 digits)</label>
                <input required type="tel" pattern="[0-9]{10}" placeholder="9998887777" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="modal-input" />
              </div>
              
              <button type="submit" className="btn btn-pay" style={{ marginTop: 16 }}>
                 Submit Registration Request
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
