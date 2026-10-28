import React, { createContext, useContext, useState } from 'react';

export type LanguageCode = 'en' | 'ta' | 'hi' | 'te' | 'kn' | 'ml';

export interface LanguageOption {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada' },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Nav & Tabs
    'nav.home': 'Home',
    'nav.trips': 'Trips',
    'nav.my_trips': 'My Bookings',
    'nav.profile': 'Profile',
    'nav.packages': 'Packages',
    'nav.requests': 'Requests',
    'nav.book_driver': 'Book Driver',
    'nav.logout': 'Logout',

    // Language modal
    'lang.title': 'Select your preferred language',
    'lang.subtitle': 'Choose the language you would like to use across DriveMate',
    'lang.search': 'Search language...',
    'lang.done': 'Done',
    'lang.cancel': 'Cancel',
    'lang.current': 'Language',

    // Common Actions
    'action.edit': 'Edit',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.continue': 'Continue',
    'action.submit': 'Submit',
    'action.close': 'Close',
    'action.update': 'Update',
    'action.view': 'View',
    'action.download': 'Download',
    'action.upload': 'Upload',
    'action.crop': 'Crop',
    'action.book_now': 'Book Now',
    'action.choose_package': 'Choose Package & Pay',

    // Profile & Contact
    'profile.title': 'Profile',
    'profile.edit_title': 'Edit Profile Details',
    'profile.full_name': 'Full Name',
    'profile.phone': 'Phone Number',
    'profile.primary_phone': 'Primary Phone',
    'profile.alt_mobile': 'Alternate Mobile Number',
    'profile.alt_phone_1': 'Alternate Phone 1',
    'profile.alt_phone_2': 'Alternate Phone 2',
    'profile.alt_phone_3': 'Alternate Phone 3',
    'profile.alt_phone_4': 'Alternate Phone 4',
    'profile.whatsapp': 'WhatsApp Number',
    'profile.upi': 'Gpay / PhonePe Number',
    'profile.address': 'Address',
    'profile.current_address': 'Current Address',
    'profile.permanent_address': 'Permanent Address',
    'profile.contact_details': 'Contact Details',
    'profile.personal_info': 'Personal Information',
    'profile.settings': 'Settings & Preferences',
    'profile.app_language': 'App Language',

    // Documents & Verification
    'doc.title': 'Document Uploads',
    'doc.photo': 'Profile Photo',
    'doc.dl': 'Driving License (DL)',
    'doc.pan': 'PAN Card',
    'doc.aadhar': 'Aadhar Card',
    'doc.police_verif': 'Police Verification',
    'doc.cert_no': 'Police Verification Certificate No',
    'doc.expiry': 'Expiry Date',
    'doc.uploaded': 'Uploaded',
    'doc.not_uploaded': 'Not Uploaded',
    'doc.verified': 'Verified',
    'doc.expired': 'Expired',
    'doc.valid': 'Valid',

    // Customer Booking
    'booking.pickup': 'Pickup Location',
    'booking.drop': 'Drop Location',
    'booking.date': 'Start Date',
    'booking.time': 'Start Time',
    'booking.duration': 'Duration',
    'booking.estimate': 'Estimated Fare',
    'booking.local': 'Local Trip',
    'booking.outstation': 'Outstation Trip',
  },

  ta: {
    // Nav & Tabs
    'nav.home': 'முகப்பு',
    'nav.trips': 'பயணங்கள்',
    'nav.my_trips': 'எனது முன்பதிவுகள்',
    'nav.profile': 'சுயவிவரம்',
    'nav.packages': 'திட்டங்கள்',
    'nav.requests': 'கோரிக்கைகள்',
    'nav.book_driver': 'டிரைவர் முன்பதிவு',
    'nav.logout': 'வெளியேறு',

    // Language modal
    'lang.title': 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    'lang.subtitle': 'DriveMate பயன்பாட்டில் நீங்கள் பயன்படுத்த விரும்பும் மொழியைத் தேர்வுசெய்யவும்',
    'lang.search': 'மொழியைத் தேடுங்கள்...',
    'lang.done': 'முடிந்தது',
    'lang.cancel': 'ரத்து செய்',
    'lang.current': 'மொழி',

    // Common Actions
    'action.edit': 'திருத்து',
    'action.save': 'சேமி',
    'action.cancel': 'ரத்து செய்',
    'action.confirm': 'உறுதி செய்',
    'action.continue': 'தொடரவும்',
    'action.submit': 'சமர்ப்பி',
    'action.close': 'மூடு',
    'action.update': 'புதுப்பி',
    'action.view': 'பார்வையிடு',
    'action.download': 'பதிவிறக்கு',
    'action.upload': 'பதிவேற்று',
    'action.crop': 'பயிர் செய்',
    'action.book_now': 'இப்போதே பதிவு செய்',
    'action.choose_package': 'திட்டத்தைத் தேர்வுசெய்து பணம் செலுத்துங்கள்',

    // Profile & Contact
    'profile.title': 'சுயவிவரம்',
    'profile.edit_title': 'சுயவிவர விவரங்களைத் திருத்து',
    'profile.full_name': 'முழுப் பெயர்',
    'profile.phone': 'தொலைபேசி எண்',
    'profile.primary_phone': 'முதன்மை தொலைபேசி',
    'profile.alt_mobile': 'மாற்று மொபைல் எண்',
    'profile.alt_phone_1': 'மாற்று தொலைபேசி 1',
    'profile.alt_phone_2': 'மாற்று தொலைபேசி 2',
    'profile.alt_phone_3': 'மாற்று தொலைபேசி 3',
    'profile.alt_phone_4': 'மாற்று தொலைபேசி 4',
    'profile.whatsapp': 'வாட்ஸ்அப் எண்',
    'profile.upi': 'கூகிள் பே / போன்பே எண்',
    'profile.address': 'முகவரி',
    'profile.current_address': 'தற்போதைய முகவரி',
    'profile.permanent_address': 'நிரந்தர முகவரி',
    'profile.contact_details': 'தொடர்பு விவரங்கள்',
    'profile.personal_info': 'தனிப்பட்ட தகவல்',
    'profile.settings': 'அமைப்புகள் & விருப்பங்கள்',
    'profile.app_language': 'பயன்பாட்டு மொழி',

    // Documents & Verification
    'doc.title': 'ஆவணப் பதிவேற்றங்கள்',
    'doc.photo': 'சுயவிவர புகைப்படம்',
    'doc.dl': 'ஓட்டுநர் உரிமம் (DL)',
    'doc.pan': 'பான் கார்டு (PAN)',
    'doc.aadhar': 'ஆதார் கார்டு',
    'doc.police_verif': 'காவல்துறை சரிபார்ப்பு',
    'doc.cert_no': 'காவல்துறை சரிபார்ப்பு சான்றிதழ் எண்',
    'doc.expiry': 'காலாவதி தேதி',
    'doc.uploaded': 'பதிவேற்றப்பட்டது',
    'doc.not_uploaded': 'பதிவேற்றப்படவில்லை',
    'doc.verified': 'சரிபார்க்கப்பட்டது',
    'doc.expired': 'காலாவதியானது',
    'doc.valid': 'செல்லுபடியாகும்',

    // Customer Booking
    'booking.pickup': 'புறப்படும் இடம்',
    'booking.drop': 'சென்றடையும் இடம்',
    'booking.date': 'தொடக்க தேதி',
    'booking.time': 'தொடக்க நேரம்',
    'booking.duration': 'கால அளவு',
    'booking.estimate': 'மதிப்பிடப்பட்ட கட்டணம்',
    'booking.local': 'உள்ளூர் பயணம்',
    'booking.outstation': 'வெளியூர் பயணம்',
  },

  hi: {
    // Nav & Tabs
    'nav.home': 'होम',
    'nav.trips': 'ट्रिप्स',
    'nav.my_trips': 'मेरी बुकिंग',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.packages': 'पैकेज',
    'nav.requests': 'अनुरोध',
    'nav.book_driver': 'ड्राइवर बुक करें',
    'nav.logout': 'लॉग आउट',

    // Language modal
    'lang.title': 'अपनी पसंदीदा भाषा चुनें',
    'lang.subtitle': 'DriveMate में उपयोग करने के लिए अपनी भाषा चुनें',
    'lang.search': 'भाषा खोजें...',
    'lang.done': 'संपन्न',
    'lang.cancel': 'रद्द करें',
    'lang.current': 'भाषा',

    // Common Actions
    'action.edit': 'संपादित करें',
    'action.save': 'सहेजें',
    'action.cancel': 'रद्द करें',
    'action.confirm': 'पुष्टि करें',
    'action.continue': 'जारी रखें',
    'action.submit': 'सबमिट करें',
    'action.close': 'बंद करें',
    'action.update': 'अपडेट करें',
    'action.view': 'देखें',
    'action.download': 'डाउनलोड करें',
    'action.upload': 'अपलोड करें',
    'action.crop': 'क्रॉप करें',
    'action.book_now': 'अभी बुक करें',
    'action.choose_package': 'पैकेज चुनें और भुगतान करें',

    // Profile & Contact
    'profile.title': 'प्रोफ़ाइल',
    'profile.edit_title': 'प्रोफ़ाइल विवरण संपादित करें',
    'profile.full_name': 'पूरा नाम',
    'profile.phone': 'फ़ोन नंबर',
    'profile.primary_phone': 'प्राथमिक फ़ोन',
    'profile.alt_mobile': 'वैकल्पिक मोबाइल नंबर',
    'profile.alt_phone_1': 'वैकल्पिक फ़ोन 1',
    'profile.alt_phone_2': 'वैकल्पिक फ़ोन 2',
    'profile.alt_phone_3': 'वैकल्पिक फ़ोन 3',
    'profile.alt_phone_4': 'वैकल्पिक फ़ोन 4',
    'profile.whatsapp': 'व्हाट्सएप नंबर',
    'profile.upi': 'Google Pay / PhonePe नंबर',
    'profile.address': 'पता',
    'profile.current_address': 'वर्तमान पता',
    'profile.permanent_address': 'स्थायी पता',
    'profile.contact_details': 'संपर्क विवरण',
    'profile.personal_info': 'व्यक्तिगत जानकारी',
    'profile.settings': 'सेटिंग्स और प्राथमिकताएं',
    'profile.app_language': 'ऐप की भाषा',

    // Documents & Verification
    'doc.title': 'दस्तावेज़ अपलोड',
    'doc.photo': 'प्रोफ़ाइल फ़ोटो',
    'doc.dl': 'ड्राइविंग लाइसेंस (DL)',
    'doc.pan': 'पैन कार्ड (PAN)',
    'doc.aadhar': 'आधार कार्ड',
    'doc.police_verif': 'पुलिस सत्यापन',
    'doc.cert_no': 'पुलिस सत्यापन प्रमाणपत्र संख्या',
    'doc.expiry': 'समाप्ति तिथि',
    'doc.uploaded': 'अपलोड किया गया',
    'doc.not_uploaded': 'अपलोड नहीं किया गया',
    'doc.verified': 'सत्यापित',
    'doc.expired': 'समाप्त',
    'doc.valid': 'मान्य',

    // Customer Booking
    'booking.pickup': 'पिकअप स्थान',
    'booking.drop': 'ड्रॉप स्थान',
    'booking.date': 'प्रारंभ तिथि',
    'booking.time': 'प्रारंभ समय',
    'booking.duration': 'अवधि',
    'booking.estimate': 'अनुमानित किराया',
    'booking.local': 'स्थानीय यात्रा',
    'booking.outstation': 'बाहरी यात्रा',
  },

  te: {
    'nav.home': 'హోమ్',
    'nav.trips': 'ట్రిప్పులు',
    'nav.my_trips': 'నా బుకింగ్స్',
    'nav.profile': 'ప్రొఫైల్',
    'nav.packages': 'ప్యాకేజీలు',
    'nav.requests': 'అభ్యర్థనలు',
    'nav.book_driver': 'డ్రైవర్‌ను బుక్ చేయండి',
    'nav.logout': 'లాగౌట్',
    'lang.title': 'మీ ప్రాధాన్య భాషను ఎంచుకోండి',
    'lang.subtitle': 'DriveMate లో మీరు ఉపయోగించాలనుకుంటున్న భాషను ఎంచుకోండి',
    'lang.search': 'భాషను శోధించండి...',
    'lang.done': 'పూర్తయింది',
    'lang.cancel': 'రద్దు చేయి',
    'lang.current': 'భాష',
    'action.edit': 'సవరించు',
    'action.save': 'సేవ్ చేయి',
    'action.cancel': 'రద్దు చేయి',
    'action.confirm': 'నిర్ధారించు',
    'action.continue': 'కొనసాగించు',
    'action.submit': 'సమర్పించు',
    'action.close': 'మూసివేయి',
    'action.update': 'నవీకరించు',
    'action.view': 'చూడండి',
    'action.download': 'డౌన్‌లోడ్',
    'action.upload': 'అప్‌లోడ్',
    'action.crop': 'క్రాప్ చేయండి',
    'action.book_now': 'ఇప్పుడే బుక్ చేయండి',
    'action.choose_package': 'ప్యాకేజీని ఎంచుకోండి & చెల్లించండి',
    'profile.title': 'ప్రొఫైల్',
    'profile.edit_title': 'ప్రొఫైల్ వివరాలను సవరించండి',
    'profile.full_name': 'పూర్తి పేరు',
    'profile.phone': 'ఫోన్ నంబర్',
    'profile.primary_phone': 'ప్రధాన ఫోన్',
    'profile.alt_mobile': 'ప్రత్యామ్నాయ మొబైల్ నంబర్',
    'profile.alt_phone_1': 'ప్రత్యామ్నాయ ఫోన్ 1',
    'profile.alt_phone_2': 'ప్రత్యామ్నాయ ఫోన్ 2',
    'profile.alt_phone_3': 'ప్రత్యామ్నాయ ఫోన్ 3',
    'profile.alt_phone_4': 'ప్రత్యామ్నాయ ఫోన్ 4',
    'profile.whatsapp': 'వాట్సాప్ నంబర్',
    'profile.upi': 'GPay / PhonePe నంబర్',
    'profile.address': 'చిరునామా',
    'profile.current_address': 'ప్రస్తుత చిరునామా',
    'profile.permanent_address': 'శాశ్వత చిరునామా',
    'profile.contact_details': 'సంప్రదింపు వివరాలు',
    'profile.personal_info': 'వ్యక్తిగత సమాచారం',
    'profile.settings': 'సెట్టింగ్‌లు',
    'profile.app_language': 'యాప్ భాష',
    'doc.title': 'పత్రాల అప్‌లోడ్',
    'doc.photo': 'ప్రొఫైల్ ఫోటో',
    'doc.dl': 'డ్రైవింగ్ లైసెన్స్ (DL)',
    'doc.pan': 'పాన్ కార్డ్',
    'doc.aadhar': 'ఆధార్ కార్డ్',
    'doc.police_verif': 'పోలీస్ వెరిఫికేషన్',
    'doc.cert_no': 'పోలీస్ వెరిఫికేషన్ సర్టిఫికేట్ నంబర్',
    'doc.expiry': 'గడువు తేదీ',
    'doc.uploaded': 'అప్‌లోడ్ చేయబడింది',
    'doc.not_uploaded': 'అప్‌లోడ్ చేయలేదు',
    'doc.verified': 'ధృవీకరించబడింది',
    'doc.expired': 'గడువు ముగిసింది',
    'doc.valid': 'చెల్లుబాటు అయ్యేది',
    'booking.pickup': 'పికప్ లొకేషన్',
    'booking.drop': 'డ్రాప్ లొకేషన్',
    'booking.date': 'ప్రారంభ తేదీ',
    'booking.time': 'ప్రారంభ సమయం',
    'booking.duration': 'వ్యవధి',
    'booking.estimate': 'అంచనా ఛార్జీ',
    'booking.local': 'స్థానిక ట్రిప్',
    'booking.outstation': 'ఔట్‌స్టేషన్ ట్రిప్',
  },

  kn: {
    'nav.home': 'ಮುಖಪುಟ',
    'nav.trips': 'ಟ್ರಿಪ್‌ಗಳು',
    'nav.my_trips': 'ನನ್ನ ಬುಕಿಂಗ್‌ಗಳು',
    'nav.profile': 'ಪ್ರೊಫೈಲ್',
    'nav.packages': 'ಪ್ಯಾಕೇಜುಗಳು',
    'nav.requests': 'ವಿನಂತಿಗಳು',
    'nav.book_driver': 'ಡ್ರೈವರ್ ಬುಕ್ ಮಾಡಿ',
    'nav.logout': 'ಲಾಗ್ ಔಟ್',
    'lang.title': 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    'lang.subtitle': 'DriveMate ನಲ್ಲಿ ನೀವು ಬಳಸಲು ಬಯಸುವ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    'lang.search': 'ಭಾಷೆ ಹುಡುಕಿ...',
    'lang.done': 'ಮುಗಿದಿದೆ',
    'lang.cancel': 'ರದ್ದುಮಾಡಿ',
    'lang.current': 'ಭಾಷೆ',
    'action.edit': 'ತಿದ್ದಿ',
    'action.save': 'ಉಳಿಸಿ',
    'action.cancel': 'ರದ್ದುಮಾಡಿ',
    'action.confirm': 'ದೃಢೀಕರಿಸಿ',
    'action.continue': 'ಮುಂದುವರಿಯಿರಿ',
    'action.submit': 'ಸಲ್ಲಿಸಿ',
    'action.close': 'ಮುಚ್ಚಿ',
    'action.update': 'ನವೀಕರಿಸಿ',
    'action.view': 'ವೀಕ್ಷಿಸಿ',
    'action.download': 'ಡೌನ್‌ಲೋಡ್',
    'action.upload': 'ಅಪ್‌ಲೋಡ್',
    'action.crop': 'ಕ್ರಾಪ್ ಮಾಡಿ',
    'action.book_now': 'ಈಗಲೇ ಬುಕ್ ಮಾಡಿ',
    'action.choose_package': 'ಪ್ಯಾಕೇಜ್ ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಪಾವತಿಸಿ',
    'profile.title': 'ಪ್ರೊಫೈಲ್',
    'profile.edit_title': 'ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ',
    'profile.full_name': 'ಪೂರ್ಣ ಹೆಸರು',
    'profile.phone': 'ಫೋನ್ ಸಂಖ್ಯೆ',
    'profile.primary_phone': 'ಪ್ರಾಥಮಿಕ ಫೋನ್',
    'profile.alt_mobile': 'ಪರ್ಯಾಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
    'profile.alt_phone_1': 'ಪರ್ಯಾಯ ಫೋನ್ 1',
    'profile.alt_phone_2': 'ಪರ್ಯಾಯ ಫೋನ್ 2',
    'profile.alt_phone_3': 'ಪರ್ಯಾಯ ಫೋನ್ 3',
    'profile.alt_phone_4': 'ಪರ್ಯಾಯ ಫೋನ್ 4',
    'profile.whatsapp': 'ವಾಟ್ಸಾಪ್ ಸಂಖ್ಯೆ',
    'profile.upi': 'GPay / PhonePe ಸಂಖ್ಯೆ',
    'profile.address': 'ವಿಳಾಸ',
    'profile.current_address': 'ಪ್ರಸ್ತುತ ವಿಳಾಸ',
    'profile.permanent_address': 'ಖಾಯಂ ವಿಳಾಸ',
    'profile.contact_details': 'ಸಂಪರ್ಕ ವಿವರಗಳು',
    'profile.personal_info': 'ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ',
    'profile.settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'profile.app_language': 'ಆ್ಯಪ್ ಭಾಷೆ',
    'doc.title': 'ದಾಖಲೆಗಳ ಅಪ್‌ಲೋಡ್',
    'doc.photo': 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ',
    'doc.dl': 'ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್',
    'doc.pan': 'ಪ್ಯಾನ್ ಕಾರ್ಡ್',
    'doc.aadhar': 'ಆಧಾರ್ ಕಾರ್ಡ್',
    'doc.police_verif': 'ಪೊಲೀಸ್ ಪರಿಶೀಲನೆ',
    'doc.cert_no': 'ಪೊಲೀಸ್ ಪರಿಶೀಲನಾ ಪ್ರಮಾಣಪತ್ರ ಸಂಖ್ಯೆ',
    'doc.expiry': 'ಮುಕ್ತಾಯ ದಿನಾಂಕ',
    'doc.uploaded': 'ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ',
    'doc.not_uploaded': 'ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿಲ್ಲ',
    'doc.verified': 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    'doc.expired': 'ಅವಧಿ ಮೀರಿದೆ',
    'doc.valid': 'ಮಾನ್ಯವಾಗಿದೆ',
    'booking.pickup': 'ಪಿಕಪ್ ಸ್ಥಳ',
    'booking.drop': 'ಡ್ರಾಪ್ ಸ್ಥಳ',
    'booking.date': 'ಪ್ರಾರಂಭ ದಿನಾಂಕ',
    'booking.time': 'ಪ್ರಾರಂಭ ಸಮಯ',
    'booking.duration': 'ಅವಧಿ',
    'booking.estimate': 'ಅಂದಾಜು ದರ',
    'booking.local': 'ಸ್ಥಳೀಯ ಪ್ರವಾಸ',
    'booking.outstation': 'ಹೊರಗಿನ ಪ್ರವಾಸ',
  },

  ml: {
    'nav.home': 'ഹോം',
    'nav.trips': 'യാത്രകൾ',
    'nav.my_trips': 'എന്റെ ബുക്കിംഗുകൾ',
    'nav.profile': 'പ്രൊഫൈൽ',
    'nav.packages': 'പാക്കേജുകൾ',
    'nav.requests': 'അഭ്യർത്ഥനകൾ',
    'nav.book_driver': 'ഡ്രൈവറെ ബുക്ക് ചെയ്യുക',
    'nav.logout': 'ലോഗ്ഔട്ട്',
    'lang.title': 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക',
    'lang.subtitle': 'DriveMate-ൽ നിങ്ങൾ ഉപയോഗിക്കാൻ ആഗ്രഹിക്കുന്ന ഭാഷ തിരഞ്ഞെടുക്കുക',
    'lang.search': 'ഭാഷ തിരയുക...',
    'lang.done': 'പൂർത്തിയായി',
    'lang.cancel': 'റദ്ദാക്കുക',
    'lang.current': 'ഭാഷ',
    'action.edit': 'എഡിറ്റ് ചെയ്യുക',
    'action.save': 'സേവ് ചെയ്യുക',
    'action.cancel': 'റദ്ദാക്കുക',
    'action.confirm': 'സ്ഥിരീകരിക്കുക',
    'action.continue': 'തുടരുക',
    'action.submit': 'സമർപ്പിക്കുക',
    'action.close': 'അടയ്ക്കുക',
    'action.update': 'അപ്ഡേറ്റ് ചെയ്യുക',
    'action.view': 'കാണുക',
    'action.download': 'ഡൗൺലോഡ്',
    'action.upload': 'അപ്‌ലോഡ്',
    'action.crop': 'ക്രോപ്പ് ചെയ്യുക',
    'action.book_now': 'ഇപ്പോൾ ബുക്ക് ചെയ്യുക',
    'action.choose_package': 'പാക്കേജ് തിരഞ്ഞെടുത്ത് പണമടയ്ക്കുക',
    'profile.title': 'പ്രൊഫൈൽ',
    'profile.edit_title': 'പ്രൊഫൈൽ വിവരങ്ങൾ എഡിറ്റ് ചെയ്യുക',
    'profile.full_name': 'മുഴുവൻ പേര്',
    'profile.phone': 'ഫോൺ നമ്പർ',
    'profile.primary_phone': 'പ്രാഥമിക ഫോൺ',
    'profile.alt_mobile': 'മറ്റൊരു മൊബൈൽ നമ്പർ',
    'profile.alt_phone_1': 'മറ്റൊരു ഫോൺ 1',
    'profile.alt_phone_2': 'മറ്റൊരു ഫോൺ 2',
    'profile.alt_phone_3': 'മറ്റൊരു ഫോൺ 3',
    'profile.alt_phone_4': 'മറ്റൊരു ഫോൺ 4',
    'profile.whatsapp': 'വാട്ട്‌സ്ആപ്പ് നമ്പർ',
    'profile.upi': 'GPay / PhonePe നമ്പർ',
    'profile.address': 'വിലാസം',
    'profile.current_address': 'നിലവിലെ വിലാസം',
    'profile.permanent_address': 'സ്ഥിരമായ വിലാസം',
    'profile.contact_details': 'ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ',
    'profile.personal_info': 'വ്യക്തിഗത വിവരങ്ങൾ',
    'profile.settings': 'ക്രമീകരണങ്ങൾ',
    'profile.app_language': 'ആപ്പ് ഭാഷ',
    'doc.title': 'രേഖകൾ അപ്‌ലോഡ് ചെയ്യുക',
    'doc.photo': 'പ്രൊഫൈൽ ഫോട്ടോ',
    'doc.dl': 'ഡ്രൈവിംഗ് ലൈസൻസ്',
    'doc.pan': 'പാൻ കാർഡ്',
    'doc.aadhar': 'ആധാർ കാർഡ്',
    'doc.police_verif': 'പോലീസ് വെരിഫിക്കേഷൻ',
    'doc.cert_no': 'പോലീസ് വെരിഫിക്കേഷൻ സർട്ടിഫിക്കറ്റ് നമ്പർ',
    'doc.expiry': 'കാലാവധി തീയതി',
    'doc.uploaded': 'അപ്‌ലോഡ് ചെയ്തു',
    'doc.not_uploaded': 'അപ്‌ലോഡ് ചെയ്തിട്ടില്ല',
    'doc.verified': 'പരിശോധിച്ചു',
    'doc.expired': 'കാലഹരണപ്പെട്ടു',
    'doc.valid': 'സാധുതയുള്ളത്',
    'booking.pickup': 'പിക്കപ്പ് സ്ഥലം',
    'booking.drop': 'ഡ്രോപ്പ് സ്ഥലം',
    'booking.date': 'ആരംഭ തീയതി',
    'booking.time': 'ആരംഭ സമയം',
    'booking.duration': 'ദൈർഘ്യം',
    'booking.estimate': 'ഏകദേശ നിരക്ക്',
    'booking.local': 'ലോക്കൽ ട്രിപ്പ്',
    'booking.outstation': 'ഔട്ട്സ്റ്റേഷൻ ട്രിപ്പ്',
  }
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentLanguage: LanguageOption;
  t: (key: string, defaultText?: string) => string;
  isLanguageModalOpen: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'drivemate_user_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode;
      if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        return saved;
      }
    } catch (_) {}
    return 'en';
  });

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {}
  };

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguage,
        t,
        isLanguageModalOpen,
        openLanguageModal: () => setIsLanguageModalOpen(true),
        closeLanguageModal: () => setIsLanguageModalOpen(false)
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
