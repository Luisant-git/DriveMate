import React, { useState } from 'react';

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    const [activeTab, setActiveTab] = useState<'local' | 'outstation'>('local');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    return (
        <div className="flex flex-col min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
            {/* Fixed Social Media Sidebar */}
            <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-4">
                <a href="https://www.facebook.com/share/18P8cPUbxU/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-full hover:bg-gray-800 transition-all shadow-lg hover:scale-110">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.instagram.com/deer.42990838?igsh=MWtqenh5NjY2cG91NQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-full hover:bg-gray-800 transition-all shadow-lg hover:scale-110">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://wa.me/918884555776" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-full hover:bg-gray-800 transition-all shadow-lg hover:scale-110">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                </a>
                <a href="https://www.youtube.com/@SNPNBCJOBSANDTRAVELSSERVICES" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-full hover:bg-gray-800 transition-all shadow-lg hover:scale-110">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <a href="https://x.com/snpnbc?s=21" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-full hover:bg-gray-800 transition-all shadow-lg hover:scale-110">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="https://www.linkedin.com/in/snpnbc-consultant-and-manpower-services-god-8591883b4?utm_source=share_via&utm_content=profile&utm_medium=member_ios" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-full hover:bg-gray-800 transition-all shadow-lg hover:scale-110">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
            </div>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black text-white w-full border-b border-gray-900 relative">
                <div className="flex justify-between items-center px-3 md:px-12 py-3">
                    <div className="text-lg md:text-xl font-bold tracking-tighter">SNPNBC</div>
                    <nav className="hidden md:flex gap-6">
                        <button className="text-xs uppercase tracking-wider font-semibold hover:text-gray-300 transition-colors" onClick={onGetStarted}>Hire a Driver</button>
                        <button className="text-xs uppercase tracking-wider font-semibold hover:text-gray-300 transition-colors" onClick={onGetStarted}>Outstation Cabs</button>
                        <button className="text-xs uppercase tracking-wider font-semibold hover:text-gray-300 transition-colors" onClick={onGetStarted}>Partner Program</button>
                        <button className="text-xs uppercase tracking-wider font-semibold hover:text-gray-300 transition-colors">Support</button>
                    </nav>
                    <div className="flex items-center gap-2 md:gap-4">
                        <button className="text-sm uppercase tracking-wider font-semibold hover:text-gray-300 transition-colors hidden md:block" onClick={onGetStarted}>Log in</button>
                        <button className="md:hidden text-xs uppercase tracking-wider font-semibold hover:text-gray-300 transition-colors" onClick={onGetStarted}>Log in</button>
                        <button className="text-xs md:text-sm uppercase tracking-wider bg-white text-black px-3 md:px-5 py-2 rounded-sm font-bold hover:bg-gray-200 transition-all shadow-sm" onClick={onGetStarted}>Sign up</button>
                        <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                {mobileMenuOpen ? (
                                    <>
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </>
                                ) : (
                                    <>
                                        <line x1="3" y1="12" x2="21" y2="12" />
                                        <line x1="3" y1="18" x2="21" y2="18" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white px-6 py-6 shadow-lg transition-all duration-300 ease-in-out z-40">
                        <nav className="flex flex-col gap-4">
                            <button className="text-left py-3 text-gray-800 hover:text-black font-semibold transition-colors border-b border-gray-100" onClick={onGetStarted}>
                                Hire a Driver
                            </button>
                            <button className="text-left py-3 text-gray-800 hover:text-black font-semibold transition-colors border-b border-gray-100" onClick={onGetStarted}>
                                Outstation Cabs
                            </button>
                            <button className="text-left py-3 text-gray-800 hover:text-black font-semibold transition-colors border-b border-gray-100" onClick={onGetStarted}>
                                Partner Program
                            </button>
                            <button className="text-left py-3 text-gray-800 hover:text-black font-semibold transition-colors">
                                Support
                            </button>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                {/* Hero Section */}
                <section className="bg-white px-6 md:px-12 py-16 md:py-24">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16 text-center md:text-left">
                        <div className="flex-1 space-y-6">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tighter">
                                Professional Drivers,<br className="hidden lg:block" /> At Your Service.
                            </h1>
                            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-md mx-auto md:mx-0">
                                Book verified acting drivers for your personal vehicle or premium outstation returns. Transparent upfront pricing, zero hidden fees.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button className="bg-black text-white px-6 py-3 rounded-sm text-[12px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg" onClick={onGetStarted}>
                                    Book Driver
                                </button>
                                <button className="bg-gray-100 text-black px-6 py-3 rounded-sm text-[12px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-all" onClick={onGetStarted}>
                                    Outstation
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 w-full max-w-sm md:max-w-none">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <img
                                    src="/assets/images/hero-main.png"
                                    alt="SNP Service Illustration"
                                    className="relative w-full rounded-xl object-contain drop-shadow-xl transition-all duration-500 h-[280px] md:h-[420px]"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="bg-gray-50 px-6 md:px-12 py-16 md:py-20 border-y border-gray-100">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-semibold mb-12 tracking-tighter text-center md:text-left">Why SNP?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="group">
                                <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-lg mb-4 group-hover:scale-110 transition-transform">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-bold mb-2">Verified Experts</h3>
                                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">Every driver is background-checked and professionally trained for your safety.</p>
                            </div>
                            <div className="group">
                                <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-lg mb-4 group-hover:scale-110 transition-transform">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                                        <polyline points="17 2 12 7 7 2" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-bold mb-2">Flat Pricing</h3>
                                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">No surges, no surprises. Pay exactly what you see at the time of booking.</p>
                            </div>
                            <div className="group">
                                <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-lg mb-4 group-hover:scale-110 transition-transform">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-bold mb-2">Anywhere, Anytime</h3>
                                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">Round-the-clock availability for both local and interstate journeys.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Interactive Booking Hub */}
                <section className="bg-[#FAFAFA] px-6 md:px-12 py-20 md:py-32 border-t border-gray-100">
                    <div className="max-w-6xl mx-auto">

                        {/* Search & Category Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-10">
                            <div className="max-w-xl">
                                <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter mb-6">Where are you going?</h2>
                                <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 items-center gap-2 group hover:border-black transition-all">
                                    <div className="flex-1 flex items-center px-4 gap-3 text-gray-400 group-hover:text-black">
                                        <div className="w-2 h-2 rounded-full bg-current"></div>
                                        <input
                                            type="text"
                                            placeholder="Enter destination..."
                                            className="bg-transparent border-none outline-none text-sm w-full font-medium h-10 text-black placeholder:text-gray-400"
                                        />
                                    </div>
                                    <button className="bg-black text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all" onClick={onGetStarted}>
                                        Search
                                    </button>
                                </div>
                            </div>

                            {/* Experience Switcher */}
                            <div className="flex bg-gray-200/50 p-1 rounded-2xl">
                                <button
                                    onClick={() => setActiveTab('local')}
                                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'local' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-black'}`}
                                >
                                    Local
                                </button>
                                <button
                                    onClick={() => setActiveTab('outstation')}
                                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'outstation' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-black'}`}
                                >
                                    Outstation
                                </button>
                            </div>
                        </div>

                        {/* Content Displays */}
                        <div className="transition-all duration-500 min-h-[400px]">
                            {activeTab === 'local' ? (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex justify-between items-end mb-10">
                                        <div>
                                            <h3 className="text-2xl font-semibold tracking-tight">Local Acting Drivers</h3>
                                            <p className="text-sm text-gray-500 mt-2">Professional drivers for your city needs</p>
                                        </div>
                                        <button className="text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-black pb-1">View All Local</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="group cursor-pointer" onClick={onGetStarted}>
                                            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                                                <img src="https://img.freepik.com/free-vector/taxi-app-concept-illustration_52683-36028.jpg" alt="Hourly" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest">FROM ₹299</div>
                                            </div>
                                            <h4 className="text-xl font-bold mb-2">Hourly Rentals</h4>
                                            <p className="text-sm text-gray-500 leading-relaxed mb-6">Perfect for running errands, shopping, or daily office commutes in your own car.</p>
                                            <button className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-3 flex items-center gap-1 transition-all">Book Hourly <span>→</span></button>
                                        </div>
                                        <div className="group cursor-pointer" onClick={onGetStarted}>
                                            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                                                <img src="https://img.freepik.com/premium-vector/meeting-airport_118813-13525.jpg?semt=ais_hybrid&w=740&q=80" alt="Airport" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest">FIXED PRICE</div>
                                            </div>
                                            <h4 className="text-xl font-bold mb-2">Airport Transfers</h4>
                                            <p className="text-sm text-gray-500 leading-relaxed mb-6">Professional drivers to ensure your timely reach and pickup from the airport terminals.</p>
                                            <button className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-3 flex items-center gap-1 transition-all">Book Transfer <span>→</span></button>
                                        </div>
                                        <div className="group cursor-pointer" onClick={onGetStarted}>
                                            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                                                <img src="https://img.freepik.com/premium-vector/taxi-service-concept-yellow-car-night-city_313242-453.jpg" alt="Night Out" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest">TRUSTED</div>
                                            </div>
                                            <h4 className="text-xl font-bold mb-2">Safe Night-Out</h4>
                                            <p className="text-sm text-gray-500 leading-relaxed mb-6">Enjoy your evening without worrying about the drive back home. We handle the traffic.</p>
                                            <button className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-3 flex items-center gap-1 transition-all">Book Night-Out <span>→</span></button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex justify-between items-end mb-10">
                                        <div>
                                            <h3 className="text-2xl font-semibold tracking-tight">Outstation Trips</h3>
                                            <p className="text-sm text-gray-500 mt-2">Explore beyond the city limits</p>
                                        </div>
                                        <button className="text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-black pb-1">Explore More</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="group cursor-pointer" onClick={onGetStarted}>
                                            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                                                <img src="https://sikkolucabs.com/img/cab_search.jpg" alt="Round Trip" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest">BEST VALUE</div>
                                            </div>
                                            <h4 className="text-xl font-bold mb-2">Round-Trips</h4>
                                            <p className="text-sm text-gray-500 leading-relaxed mb-6">Book expert drivers for long-distance family vacations or road trips with ease.</p>
                                            <button className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-3 flex items-center gap-1 transition-all">Plan Trip <span>→</span></button>
                                        </div>
                                        <div className="group cursor-pointer" onClick={onGetStarted}>
                                            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                                                <img src="https://img.freepik.com/free-vector/taxi-app-concept-illustration_52683-36028.jpg" alt="One Way" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest">HIGH SPEED</div>
                                            </div>
                                            <h4 className="text-xl font-bold mb-2">One-Way Drops</h4>
                                            <p className="text-sm text-gray-500 leading-relaxed mb-6">Affordable one-way intercity returns for focused point-to-point travel.</p>
                                            <button className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-3 flex items-center gap-1 transition-all">Book Drop <span>→</span></button>
                                        </div>
                                        <div className="group cursor-pointer" onClick={onGetStarted}>
                                            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                                                <img src="https://img.freepik.com/free-vector/young-guy-travelling-by-taxi-around-city-marker-destination-baggage-flat-vector-illustration-transportation-urban-lifestyle_74855-8724.jpg" alt="Weekend" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest">CURATED</div>
                                            </div>
                                            <h4 className="text-xl font-bold mb-2">Weekend Getaways</h4>
                                            <p className="text-sm text-gray-500 leading-relaxed mb-8">Escape the city with dedicated outstation drivers for a stress-free weekend.</p>
                                            <button className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-3 flex items-center gap-1 transition-all">Go Now <span>→</span></button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Driver CTA Section */}
                <section className="bg-white px-6 md:px-12 py-20 md:py-24 overflow-hidden relative">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 relative z-10 text-center md:text-left">
                            <h2 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tighter">Become a Partner</h2>
                            <p className="text-base md:text-lg text-gray-600 mb-10 max-w-md mx-auto md:mx-0">
                                Join the network of 5,000+ drivers and earn on your own terms. Flexible hours and weekly payouts.
                            </p>
                            <button className="bg-black text-white px-8 py-3.5 rounded-sm text-[12px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl" onClick={onGetStarted}>
                                Join As Partner
                            </button>
                        </div>
                        <div className="flex-1 w-full max-w-sm md:max-w-none px-4 md:px-0">
                            <img
                                src="/assets/images/partner-hero.png"
                                alt="Driver Partner View"
                                className="w-full rounded-2xl object-cover h-[250px] md:h-[350px] shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </section>

                {/* App Promo */}
                <section className="bg-gray-50 px-6 md:px-12 py-16 md:py-20">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
                            <div className="p-8 md:p-10 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between group hover:border-black transition-colors cursor-pointer">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Mobile First</div>
                                    <h3 className="text-xl md:text-2xl font-semibold mb-4 text-black">Partner App</h3>
                                    <p className="text-sm md:text-base text-gray-500 mb-8">Manage your fleet and bookings on the go with real-time analytics.</p>
                                </div>
                                <div className="text-sm font-bold uppercase tracking-widest text-black flex items-center gap-3 group-hover:gap-5 transition-all">
                                    Download Now <span className="text-2xl">→</span>
                                </div>
                            </div>
                            <div className="p-8 md:p-10 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between group hover:border-black transition-colors cursor-pointer">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">User First</div>
                                    <h3 className="text-xl md:text-2xl font-semibold mb-4 text-black">Customer App</h3>
                                    <p className="text-sm md:text-base text-gray-500 mb-8">Book, track and pay seamlessly. Get your driver in minutes.</p>
                                </div>
                                <div className="text-sm font-bold uppercase tracking-widest text-black flex items-center gap-3 group-hover:gap-5 transition-all">
                                    Download Now <span className="text-2xl">→</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-black text-white px-6 md:px-12 pt-20 pb-10 border-t border-gray-900">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 md:gap-16 mb-20">
                        <div className="col-span-1">
                            <div className="text-xl font-bold tracking-tighter mb-6">SNPNBC Consultant and Manpower Services</div>
                            <p className="text-[11px] text-gray-300 leading-relaxed uppercase tracking-wider">
                                No.21/A, Kengeri Main Road, <br /> Near Manthri Alpine Apartment, <br /> Channasandra, Bengaluru - 560098
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Services</h4>
                            <ul className="space-y-3 text-[12px]">
                                <li><a href="#" className="hover:text-gray-400 transition-colors">Acting Drivers</a></li>
                                <li><a href="#" className="hover:text-gray-400 transition-colors">Local Returns</a></li>
                                <li><a href="#" className="hover:text-gray-400 transition-colors">Outstation Returns</a></li>
                                <li><a href="#" className="hover:text-gray-400 transition-colors">Corporate Fleet</a></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Resources</h4>
                            <ul className="space-y-3 text-[12px]">
                                <li><a href="#" className="hover:text-gray-400 transition-colors">Safety Guidelines</a></li>
                                <li><a href="#" className="hover:text-gray-400 transition-colors">Partner Portal</a></li>
                                <li><a href="#" className="hover:text-gray-400 transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-gray-400 transition-colors">Emergency</a></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Legal</h4>
                            <ul className="space-y-3 text-[12px]">
                                <li><a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-gray-400 transition-colors">Terms of Use</a></li>
                                <li><a href="#" className="hover:text-gray-400 transition-colors">Refund Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-gray-900 text-[10px] text-gray-300 font-bold uppercase tracking-widest flex flex-col md:flex-row justify-between items-center gap-4">
                        <p> This is an official platform of SNPNBC Consultant and Manpower Services, <br />
© owned by Kathariguppe Gangadharappa Chandrappa.</p>
                        <div className="flex gap-4">
                            <a href="https://www.facebook.com/share/18P8cPUbxU/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            </a>
                            <a href="https://www.instagram.com/deer.42990838?igsh=MWtqenh5NjY2cG91NQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </a>
                            <a href="https://wa.me/918884555776" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            </a>
                            <a href="https://www.youtube.com/@SNPNBCJOBSANDTRAVELSSERVICES" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                            </a>
                            <a href="https://x.com/snpnbc?s=21" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                            </a>
                            <a href="https://www.linkedin.com/in/snpnbc-consultant-and-manpower-services-god-8591883b4?utm_source=share_via&utm_content=profile&utm_medium=member_ios" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
