import React from 'react';

const PrivacyPage: React.FC = () => {
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
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Privacy Policy</h1>
                        <div className="text-gray-600 space-y-1">
                            <p><strong>Effective Date:</strong> March 17, 2026</p>
                            <p><strong>Last Updated:</strong> March 17, 2026</p>
                        </div>
                    </div>

                    <div className="prose prose-lg max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                            <p className="text-gray-700 leading-relaxed">
                                SNPNBC CONSULTANT AND MANPOWER SERVICES ("we," "us," or "our") is committed to protecting the privacy of our candidates and clients. This Privacy Policy explains how we collect, use, and safeguard your digital personal data when you interact with us via our website, WhatsApp Cloud API, or other digital platforms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                            <p className="text-gray-700 mb-4">To provide recruitment and consultancy services, we collect:</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                <li><strong>Identity Data:</strong> Name, date of birth, gender, and government-issued IDs (Aadhaar, PAN, Passport) for verification.</li>
                                <li><strong>Contact Data:</strong> Phone number (WhatsApp), email address, and physical address.</li>
                                <li><strong>Professional Data:</strong> Resumes, employment history, educational qualifications, and skills.</li>
                                <li><strong>Technical Data:</strong> IP addresses and interaction logs via the WhatsApp API (stored for up to 30 days by Meta and indefinitely by our secure CRM for service history).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Data</h2>
                            <p className="text-gray-700 mb-4">We process your data only for "Lawful Purposes" as defined under the DPDP Act:</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                <li><strong>Recruitment:</strong> To match candidates with job opportunities and verify credentials.</li>
                                <li><strong>Communication:</strong> To send job alerts, interview schedules, and service updates via WhatsApp.</li>
                                <li><strong>Compliance:</strong> To meet legal and regulatory obligations for manpower agencies in India.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">4. Consent and Opt-Out</h2>
                            <div className="space-y-3">
                                <p className="text-gray-700"><strong>Explicit Consent:</strong> By messaging us on WhatsApp, you provide affirmative consent for us to process your data for recruitment.</p>
                                <p className="text-gray-700"><strong>Withdrawal:</strong> You have the right to withdraw consent at any time. To stop WhatsApp communications, reply with "STOP". To request total data deletion, contact our Grievance Officer.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">5. Data Security & Retention</h2>
                            <div className="space-y-3">
                                <p className="text-gray-700"><strong>Security:</strong> We implement "Reasonable Security Safeguards," including encryption and role-based access controls, to prevent data breaches.</p>
                                <p className="text-gray-700"><strong>Retention:</strong> We retain candidate data only as long as necessary for recruitment cycles or as required by Indian labor laws. Once the purpose is served, data is securely erased.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">6. Your Rights (Data Principal Rights)</h2>
                            <p className="text-gray-700 mb-4">Under the DPDP Act 2023, you have the right to:</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                <li><strong>Access:</strong> Request a summary of the personal data we hold about you.</li>
                                <li><strong>Correction:</strong> Request updates to inaccurate or incomplete information.</li>
                                <li><strong>Erasure:</strong> Request that we delete your data when it is no longer needed.</li>
                                <li><strong>Grievance Redressal:</strong> Contact our Grievance Officer for any privacy concerns.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">7. Third-Party Sharing</h2>
                            <p className="text-gray-700 leading-relaxed">
                                We share your professional profile with potential employers (Clients) only after your verbal or written interest in a specific role. We never sell your data to third-party marketing firms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">8. Grievance Officer</h2>
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <p className="text-gray-700 mb-4">In accordance with the DPDP Act, for any queries or grievances, please contact:</p>
                                <div className="space-y-2 text-gray-700">
                                    <p><strong>Officer Name:</strong> SNPNBC CONSULTANT AND MANPOWER SERVICES</p>
                                    <p><strong>Phone:</strong> +91 88845 47768</p>
                                    <p><strong>Address:</strong> No.21/A, Kengeri Main Road, Near Manthri Alpine Apartment, Channasandra, Bengaluru - 560098</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                        <p className="text-gray-600 mb-4">Questions about your privacy rights?</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a 
                                href="https://wa.me/918884555776" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                WhatsApp Support
                            </a>
                            <a 
                                href="tel:+918884547768"
                                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                                Call Grievance Officer
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPage;