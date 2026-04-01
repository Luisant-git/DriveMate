import React from 'react';

const TermsPage: React.FC = () => {
    const goBack = () => {
        window.history.back();
    };

    const goHome = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-black text-white px-6 md:px-12 py-4 border-b border-gray-900">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <button 
                        onClick={goBack}
                        className="text-lg md:text-xl font-bold tracking-tighter hover:text-gray-300 transition-colors"
                    >
                        ← SNPNBC
                    </button>
                    <button 
                        onClick={goHome}
                        className="text-xs uppercase tracking-wider font-semibold hover:text-gray-300 transition-colors"
                    >
                        Home
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 md:px-12 py-12">
                <div className="space-y-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Terms and Conditions</h1>
                        <p className="text-gray-600">Last updated: March 17, 2026</p>
                    </div>

                    <div className="prose prose-lg max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                            <p className="text-gray-700 leading-relaxed">
                                By interacting with SNPNBC CONSULTANT AND MANPOWER SERVICES ("the Company," "We," "Us") via WhatsApp or our official channels, you agree to these Terms and Conditions. These terms govern our consultancy and manpower recruitment services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">2. WhatsApp Communication & Consent (API Compliance)</h2>
                            <div className="space-y-3">
                                <p className="text-gray-700"><strong>Opt-In:</strong> By messaging us or submitting your number, you provide explicit consent to receive service updates, job alerts, and transactional messages via WhatsApp.</p>
                                <p className="text-gray-700"><strong>Opt-Out:</strong> You may stop receiving messages at any time by replying with the keyword "STOP".</p>
                                <p className="text-gray-700"><strong>Frequency:</strong> Message frequency varies based on your requirements and job availability.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">3. Scope of Services</h2>
                            <p className="text-gray-700 mb-4">We provide manpower consultancy, including but not limited to:</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                <li>Sourcing and screening candidates.</li>
                                <li>Deployment of personnel for office, domestic, and professional roles.</li>
                                <li>Consultancy regarding labor law compliance and HR management.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">4. No Recruitment Fee Policy (Ethical Hiring)</h2>
                            <p className="text-gray-700 leading-relaxed">
                                In compliance with international labor standards, SNPNBC maintains a "Free Recruitment" policy. We do not charge candidates any fees for placement, processing, or interviews. Any person claiming to represent us and asking for money should be reported immediately to our official support.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">5. Candidate & Client Obligations</h2>
                            <div className="space-y-3">
                                <p className="text-gray-700"><strong>Accuracy:</strong> Users must provide truthful information regarding qualifications, experience, and identity.</p>
                                <p className="text-gray-700"><strong>Deployment:</strong> Staff provided by the Company are subject to the specific service level agreements (SLA) signed between the Client and SNPNBC.</p>
                                <p className="text-gray-700"><strong>Conduct:</strong> We maintain a zero-tolerance policy for harassment or illegal activity during the recruitment or deployment process.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">6. Data Privacy & Security</h2>
                            <div className="space-y-3">
                                <p className="text-gray-700">We collect personal data (Name, Resume, ID proof) solely for recruitment and verification.</p>
                                <p className="text-gray-700">Your data is handled according to our Privacy Policy and is never sold to third parties.</p>
                                <p className="text-gray-700">Messages via the WhatsApp Cloud API are end-to-end encrypted; however, the Company is responsible for the storage of chat logs on our secure CRM.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
                            <p className="text-gray-700 leading-relaxed">
                                SNPNBC acts as a consultant and intermediary. While we conduct rigorous background checks, we are not liable for any incidental damages or personal disputes arising after the deployment of personnel, unless specified in the service contract.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">8. Governing Law</h2>
                            <p className="text-gray-700 leading-relaxed">
                                These terms are governed by the laws of India.
                            </p>
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                        <p className="text-gray-600 mb-4">Have questions about our terms?</p>
                        <a 
                            href="https://wa.me/918884555776" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            Contact Us on WhatsApp
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TermsPage;