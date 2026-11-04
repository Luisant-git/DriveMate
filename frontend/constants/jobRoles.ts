// Employee job posting taxonomy — categories and their roles.
// Categories with no sub-roles listed use the category name as the role itself.

export const JOB_TYPES = [
  'Full Time Jobs',
  'Part Time Jobs',
  'Work From Home',
  'Internships',
  'Work Abroad',
] as const;

export const REMOTE_OPTIONS = ['Yes', 'No', 'Partially'] as const;

// Experience dropdown (years). "10+" is stored as 10.
export const EXPERIENCE_OPTIONS = [
  { value: 0, label: 'Fresher' },
  { value: 1, label: '1 Year' },
  { value: 2, label: '2 Years' },
  { value: 3, label: '3 Years' },
  { value: 4, label: '4 Years' },
  { value: 5, label: '5 Years' },
  { value: 6, label: '6 Years' },
  { value: 7, label: '7 Years' },
  { value: 8, label: '8 Years' },
  { value: 9, label: '9 Years' },
  { value: 10, label: '10+ Years' },
];

export interface RoleCategory {
  category: string;
  roles: string[];
}

export const JOB_TAXONOMY: RoleCategory[] = [
  { category: 'Accountant', roles: ['Accountant', 'Audit', 'Clerk/Book Keeper', 'Finance', 'Taxation'] },
  { category: 'Animation', roles: ['3D Maya', '3D Modeler', 'Animator', 'Art director', 'Cartoonist', 'Digital Painter', 'Effects Animator', 'Flash Animator', 'Forensic animator', 'Graphic designer', 'Lighting technician', 'Stop motion Animator', 'Video Editor', 'Video Game designer', 'Visual development artist', 'Zbrush'] },
  { category: 'Architect', roles: ['Exterior Design', 'Interior Design'] },
  { category: 'Bartender', roles: ['Airlines/Airport', 'Bars/Pubs', 'Casino', 'Clubs', 'Hotel & Restaurant', 'Pubs and Breweries'] },
  { category: 'Beautician', roles: ['Beauty Care', 'Esthetician', 'Hair', 'Make-up', 'Manicure', 'Massage', 'Mens Salon', 'Nailcare', 'Pedicure', 'Pet Grooming', 'Shampoo', 'Skin Care', 'Slimming', 'Unisex Salon', "Woman's Salon"] },
  { category: 'Bouncer', roles: ['Bars/Pubs', 'Casino', 'Concerts/Events', 'Nightclubs', 'Ranches'] },
  { category: 'BPO/ Telecaller', roles: ['AR Telecaller/ Medical Billing', 'Domestic', 'Incoming', 'International', 'Non Voice', 'Non-Technical', 'Outgoing', 'Quality Analyst', 'Recovery Collection', 'Sales', 'Support', 'Technical', 'Voice'] },
  { category: 'Business Analyst', roles: ['Anova', 'Business Analysis', 'Data Analysis', 'Excel', 'OBIEE Analytics', 'SAS', 'SPSS', 'SQL', 'Statistical Simulation/Regression Modelling', 'Statistics'] },
  { category: 'Cameraman', roles: ['Events', 'News', 'Travel', 'Wildlife & Nature'] },
  { category: 'Caretaker/Nanny', roles: [] },
  { category: 'Carpenter', roles: ['Commercial', 'Furniture', 'Industrial', 'Maintenance', 'Other', 'Residential'] },
  { category: 'Cashier', roles: ['Banking & Finance', 'Construction', 'Hotel & Resturant', 'Manufacturing', 'Retail'] },
  { category: 'Cleaner/Washer', roles: ['Airport', 'Auto detailing/ Auto Upholstery', 'Automobiles', 'Chemical', 'Corporate', 'Educational Institutions', 'Hospitals', 'Hotel & Resturants', 'Industrial', 'Lab', 'Machine', 'Public Places', 'Railway Station', 'Residential'] },
  { category: 'Construction/Laborer', roles: [] },
  { category: 'Content Writer', roles: ['Banking & Financial Services', 'Entertainment', 'Fashion', 'Medical', 'News', 'Review', 'Social', 'Technology', 'Travel'] },
  { category: 'Control Room Operator', roles: [] },
  { category: 'Cook/Chef', roles: ['Baking and Confectionary', 'Butcher', 'Chinese', 'Commis', 'Continental', 'French', 'Indian Cuisine', 'Italian', 'Mexican', 'Mughlai', 'Multi Cuisine', 'Non Veg', 'North Indian', 'South Indian', 'Thai', 'Veg'] },
  { category: 'Counsellor', roles: ['Banking and Finance', 'Career', 'Education', 'Legal', 'Marriage', 'Mental Health', 'Rehabilitation'] },
  { category: 'Data Collection/Survey', roles: ['Field', 'Internet / Online'] },
  { category: 'Data Entry /Back Office', roles: [] },
  { category: 'Data Scientist', roles: [] },
  { category: 'Database/System/Linux Administrator', roles: ['Networking', 'Patch Management(WSUS)', 'Perl', 'Python', 'Ruby', 'SQL', 'Scripting-Powershell', 'Troubleshooting', 'Windows/Linux Admin'] },
  { category: 'Delivery/Collections', roles: ['Cash Collection', 'Courier Delivery', 'Courier/Packet Collection', 'Documents Collection', 'Food Delivery', 'Grocery Delivery', 'Other Delivery/Collection', 'Recovery Collection', 'Van Delivery'] },
  { category: 'Designer', roles: ['Animation', 'Design CAD', 'Designer', 'Fashion Design', 'Furniture / Home Supplies', 'Graphic Design', 'Jewelry Design', 'Multimedia', 'Packaging', 'Pattern Division', 'Product', 'Textile Designer'] },
  { category: 'Doctor', roles: ['Aged Care', 'Anaesthetist', 'Ayurvedic', 'Cardiologist', 'Dentist', 'Dermatologist', 'General Physician', 'Gynaecologists', 'Hair Transplant Surgeon', 'Homeopathic', 'Neurologists', 'Nutritionist', 'Oncologist', 'Opthalmologist', 'Orthodontist', 'Pathology', 'Pediatrics', 'Pet Care/ Veterinary', 'Physiotherapy', 'Plastic Surgeon', 'Psychiatrists', 'Radiologist', 'Therapist', 'Unani Medicine'] },
  { category: 'Draftsman', roles: ['Architectural', 'Automobile', 'Civil', 'Design', 'Electrical', 'Fabrication', 'Fire and Gas', 'Mechanical', 'Structural'] },
  { category: 'Driver', roles: ['Ambulance Driver', 'Auto Driver', 'Commercial Transport Driver', 'Company driver', 'E-Rickshaw Driver', 'Freight Transport Driver', 'Heavy Vehicle Driver', 'Interstate Driver', 'Private Driver', 'School Bus Driver', 'Taxi driver', 'Taxi/Cab', 'Truck driver', 'Two Wheeler Driver'] },
  { category: 'DTP Operator/Print Consultant', roles: ['CAD', 'Corel draw', 'MS Powerpoint', 'MS publisher', 'Photoshop'] },
  { category: 'Dubbing Artist', roles: ['Cartoon', 'English', 'Hindi', 'Movie', 'Tamil', 'Telugu'] },
  { category: 'Dye Maker', roles: [] },
  { category: 'Editor', roles: [] },
  { category: 'Electrician', roles: ['Commercial', 'High Voltage', 'Industrial', 'Low Voltage', 'Residential'] },
  { category: 'Electroplater', roles: ['Automobile', 'Chemical', 'Maintenance', 'Manufacturing'] },
  { category: 'Engineer', roles: ['Maintenance Engineer', 'Production Engineer', 'Quality Engineer', 'Site Engineer', 'Testing Engineer'] },
  { category: 'Event Planner', roles: ['Birthday', 'Concerts', 'Corporate Events', 'Cultural Events', 'Exhibition & Conference', 'Family Events', 'Fashion Show', 'Film & Musical Events', 'Parties & DJ Nights', 'Road Shows', 'Sports', 'Wedding'] },
  { category: 'Financial Advisor', roles: [] },
  { category: 'Fire Fighter', roles: [] },
  { category: 'Fitter', roles: ['Assemble machines', 'Electronic Assembler', 'Maintenance', 'Mechanical Assembler', 'Plastic Work Assembler', 'Production Assembler', 'Repair', 'Welding', 'Cutting', 'Installing machines', 'Instrument', 'Turning'] },
  { category: 'Floor Manager', roles: ['Hotel & Restaurant', 'Mall', 'Manufacturing', 'Retail Store', 'Salon'] },
  { category: 'Foundryman', roles: [] },
  { category: 'Gardener', roles: ['Building Gardens', 'Commercial', 'Domestic', 'Industrial', 'Plant Nursery', 'Private Home Garden', 'Public Parks', 'Street Plants'] },
  { category: 'Handyman', roles: [] },
  { category: 'Help Desk Executive', roles: ['Corporate', 'Mall'] },
  { category: 'Hospitality Executive', roles: ['Aviation', 'Hospital', 'Hotel & Restaurant'] },
  { category: 'Host/Hostess', roles: ['Airport Ground Staff', 'Entertainment', 'Events', 'Hospital', 'Hotel & Restaurant', 'In-flight/ Cabin Crew', 'Retail Store Sales Host'] },
  { category: 'Housekeeping', roles: [] },
  { category: 'HR/Admin', roles: ['Compliance', 'Field Recruiter', 'HRMS', 'Learning & Development', 'Payrolls', 'Personnel Management', 'Recruitment', 'Training'] },
  { category: 'Insurance Consultant', roles: [] },
  { category: 'IT Hardware & Network Engineer', roles: ['Hardware Installation', 'Network Engineering', 'Software Installation & Troubleshooting'] },
  { category: 'IT Software - Developer', roles: ['Android Development', 'Axiom', 'Biztalk', 'C / C++', 'C#', 'Dot Net', 'Drupal', 'Java', 'Joomla', 'Laravel', 'Magneto', 'PHP', 'Pega', 'Python', 'React Js', 'Salesforce', 'Service Now', 'Sharepoint', 'Siebel', 'Tibco', 'Visual Basic', 'Web Development', 'Windows Development', 'Wordpress', 'iOS Development'] },
  { category: 'IT Software - QA/Test Engineer', roles: ['Automated Testing', 'Java', 'Manual Testing', 'Mobile Testing', 'Other Scripting Languages', 'Perl', 'Python', 'SQL', 'Selenium', 'Shell Scripting'] },
  { category: 'IT Software - Web Designer', roles: ['Adobe Creative Suit', 'Adobe Dream weaver', 'Adobe Illustrator Software', 'Adobe In-Design Software', 'CSS', 'Corel Draw', 'Dot Net Frameworks', 'Fire works', 'Flash', 'HTML', 'Media Designs', 'Photoshop', 'Poster Design', 'Sketch', 'Typography', 'Visual Communication', 'XHTML'] },
  { category: 'Lab Assistant', roles: ['Cardiology', 'Chemical', 'Clinical', 'Haemotology', 'Metallurgy', 'Micro Biology', 'Microbiology', 'Pathology', 'Phlebotomist', 'Radio', 'Radiographer', 'X-Ray Technician'] },
  { category: 'Labour', roles: ['Construction', 'Steel'] },
  { category: 'Language Translator', roles: ['Chinese', 'French', 'German', 'Italian', 'Japanese', 'Korean', 'Portugal', 'Russian', 'Spanish'] },
  { category: 'Legal', roles: ['Commercial Agreement', 'Contract Management', 'Corporate', 'Intellectual Property', 'Bankruptcy', 'Constitutional', 'Criminal', 'Employment', 'Environmental', 'Family & Divorce', 'Government', 'Immigration', 'Labour', 'Medical', 'Property', 'Real Estate', 'Tax'] },
  { category: 'Librarian', roles: [] },
  { category: 'Life Guard', roles: [] },
  { category: 'Lighting Technician', roles: [] },
  { category: 'Maid', roles: ['Livein maid'] },
  { category: 'Market Research Analyst', roles: [] },
  { category: 'Marketing', roles: ['Apparel', 'Banking & Financial Services', 'Beauty Care', 'Brand Marketing', 'Club Memberships', 'Digital Marketing', 'Exhibition Planning', 'Healthcare', 'Inventory Management', 'Logistics Marketing', 'Media'] },
  { category: 'Mechanic', roles: ['AC repair', 'ATM Operator', 'Automobile', 'CCTV Technician', 'DTH', 'Fitter', 'Four-wheeler', 'Fridge', 'General Electric Mechanic', 'HVAC', 'IP Technician', 'Mobile-Repair', 'Optical Fiber Technician', 'Other Machine Repair', 'Printer Repair Technician', 'Radio/TV repair', 'SDH DWDM Technician', 'Solar PV Installer', 'Three-Wheeler', 'Two-wheeler', 'Washing Machine Repair', 'WaterPurifier/RO Technician', 'Welder'] },
  { category: 'Medical Assistant', roles: ['Dermatology', 'ENT', 'Gynaecology', 'Pediatric', 'Urology', 'Audiologist', 'Cardiology', 'Clinical', 'Dental', 'Micro Biology', 'Pathology', 'Radio'] },
  { category: 'Medical Representative', roles: [] },
  { category: 'Microbiologist', roles: ['Alcohol', 'Bio Technology', 'Dairy', 'Environment', 'Hospital', 'Pharma Manufacturing', 'Research', 'Restaurant'] },
  { category: 'MIS Executive', roles: [] },
  { category: 'Moulder', roles: ['Confection Injection Moulding', 'Elastomer Injection Moulding', 'Glass Injection Moulding', 'Plastic Injection Moulding'] },
  { category: 'Nurse', roles: ['Ambulance', 'Clinic', 'Dialysis', 'First aid kit', 'General duty assistant', 'Hospital', 'IVF Nurse', 'Private House'] },
  { category: 'Nutritionist/Dietician', roles: [] },
  { category: 'Office Assistant/Helper', roles: ['Front desk', 'Inventory Incharge', 'Pantry Boy', 'Clerk', 'Service Stations'] },
  { category: 'Operator/Machinist', roles: ['Annealing', 'Boiler', 'CNC Drill', 'Carpet machine operator', 'Control Room Operator', 'Crane', 'Cylinderical Grinder', 'DRO', 'Digital printing machine', 'Edge Bender Operator', 'Elevator', 'Excavator', 'Finishing', 'Fire Alarm', 'Flex machine', 'Food Production Machine Operator', 'Forklift', 'Hobbing machine', 'Hot Press Machine Operator', 'Hydra', 'Lathe Machine', 'Laundry', 'Milling Machine', 'Molding', 'Multi Boring Machine Operator', 'Packer operator', 'Panel Saw Operator', 'Press Machine', 'Pump', 'Punch Machine', 'Stacker', 'Thermoforming', 'Tow Truck', 'Tubewell', 'Turning Machine', 'VMC Machine'] },
  { category: 'Optometrist', roles: [] },
  { category: 'Packager', roles: ['food packaging'] },
  { category: 'Painter', roles: ['Car Painter', 'Exterior wall painting', 'Glass Painting', 'Industrial Steel Painter', 'Interior wall painting', 'Metal Painter', 'Portrait painter', 'Spray Painter', 'Wood Painter'] },
  { category: 'Pest Control Executive', roles: [] },
  { category: 'Petrol Pump Attendant', roles: [] },
  { category: 'Pharmacist', roles: ['Formulation', 'Manufacturing', 'Packaging', 'QC', 'Research & Development'] },
  { category: 'Photographer', roles: [] },
  { category: 'Plumber', roles: ['Clogged Drain Pipe', 'Drain Water System', 'Faucet Repair/ Replacement', 'Industrial Drainage Coursework', 'Pipe Cutting', 'Pipes Securing', 'Repairing Plumbing Systems', 'Residential Drainage Coursework', 'Sewage Treatment', 'Tap Repair/ Replacement', 'Valves Installation', 'Water Supply Expert'] },
  { category: 'Porter', roles: ['Airport Porter', 'Commercial Porter', 'Corporate Porter', 'Hospital Porter', 'Hotel Porter', 'Industrial Porter', 'Railway Porter', 'Residential Porter'] },
  { category: 'Product Manager', roles: ['Banking & Finance', 'IT', 'Manufacturing', 'Marketing'] },
  { category: 'Program/Project Manager', roles: [] },
  { category: 'Projectionist', roles: [] },
  { category: 'Public Relations', roles: [] },
  { category: 'Purchase Executive', roles: ['FMCG Purchase'] },
  { category: 'Quality and Inspection', roles: ['2 wheeler evaluator', '4 wheeler evaluator', 'Construction', 'Manufacturing', 'Pharmaceutical', 'Reporting', 'Steel'] },
  { category: 'Receptionist/Front Office', roles: ['Bank', 'Company', 'Educational Institute', 'Hospital', 'Hotel', 'Industry', 'Offices', 'Service Stations', 'Showroom'] },
  { category: 'Reporter', roles: ['Anchor', 'Business', 'Crime', 'Entertainment', 'Fashion', 'Field', 'General', 'News Editor', 'Press', 'Reporter/Sub Editor', 'Sports', 'Travel', 'Weather'] },
  { category: 'Rigger', roles: [] },
  { category: 'Safety Officer', roles: [] },
  { category: 'Sales', roles: ['Apparel', 'Automobile', 'B2B sales', 'Banking & Financial Services', 'Cement/ Concrete Sales', 'Construction equipments', 'Consumer Durables', 'E-Commerce', 'ED - Tech Sales', 'Electronics sales', 'Entertainment/Event', 'FMCG', 'Food and Beverage Sales', 'Health', 'IT', 'Industrial Sales', 'Institutional Sales', 'Insurance', 'Jewellery', 'Laptop/Mobile', 'Manufacturing', 'Mutual Funds Sales', 'Paint Sales', 'Pharma', 'Plywood Sales', 'Real estate', 'Retail', 'Sewage Treatment', 'Shares Derivatives / Financial Trading', 'Solar System Sales', 'Telecom', 'Tours & Travels'] },
  { category: 'SAP Consultant', roles: [] },
  { category: 'Scientist/Research', roles: [] },
  { category: 'Security/Guard', roles: ['Alarm Systems', 'Armed Forces', 'Fire Safety', 'Gun Man', 'Intelligence', 'Mobile/Patrol', 'Pistol Man', 'Police', 'Private Security', 'Retired Military Personnel', 'Security Services/Custodian', 'Vigilance'] },
  { category: 'Sheet Metal Worker', roles: [] },
  { category: 'Software Architect', roles: [] },
  { category: 'Soldering Operator', roles: ['Brazing Soldering', 'Breadboard Soldering', 'Connector Soldering', 'Electronic Soldering', 'IC Soldering', 'PCB Soldering', 'Pipe Soldering', 'SMD Soldering', 'Splice Soldering', 'Wave Soldering'] },
  { category: 'Sound Engineer', roles: ['Commercials', 'Computer Games', 'Corporate Videos', 'Events', 'Film', 'Interviews', 'Podcast', 'Radio', 'Seminars', 'Short Films / Documentry', 'Studio', 'TV', 'Web Series'] },
  { category: 'Sports Trainer', roles: ['Adults', 'Athletes', 'Differently Abled', 'Kids', 'Teenagers', 'Women'] },
  { category: 'Tailor', roles: ['Boutique Tailor', 'Designer Tailor', 'Gents Tailor', 'Industrial Tailor', 'Ladies Tailor', 'Leather Tailor'] },
  { category: 'Teacher', roles: ['Computer', 'Hindi', 'Math', 'Sanskrit', 'Science', 'Social Science', 'Abacus', 'Accounts', 'Arabic', 'Arts and Crafts', 'Biology', 'Botany', 'Chemistry', 'Commerce', 'Economics', 'English', 'Finance', 'French', 'HR', 'Kannada', 'Marketing', 'Physics', 'Spanish', 'Tamil', 'Telugu', 'Urdu', 'Zoology'] },
  { category: 'Ticketing Executive', roles: ['Airlines', 'Events', 'Hotel & Restaurant', 'Multiplex', 'Railway'] },
  { category: 'Trainer', roles: ['Aerobics', 'Dance', 'Gym', 'Language', 'Martial Arts', 'Musical Instruments', 'Soft Skills', 'Sport', 'Yoga'] },
  { category: 'Transport Supervisor', roles: [] },
  { category: 'Videographer', roles: ['Event', 'Fashion', 'Films', 'Media', 'Nature', 'Sports', 'Travel', 'Wedding', 'Wildlife'] },
  { category: 'Waiter/Steward', roles: ['Airlines', 'Healthcare', 'Hotel & Restaurant', 'Quick Service Restaurants'] },
  { category: 'Ward Boy', roles: [] },
  { category: 'Warehouse Executive', roles: ['Pickers/Helpers'] },
  { category: 'Welder', roles: ['Butt Welder', 'Mig and Tig Welder', 'Spot Welder', 'Arc Welder', 'Automotive Welders', 'Pipe Welders'] },
  { category: 'Wireman', roles: ['Commercial', 'Residential', 'Industrial'] },
];

export const JOB_CATEGORIES: string[] = JOB_TAXONOMY.map(c => c.category);

/** Roles under a category. Categories without sub-roles resolve to the category itself. */
export const getRolesForCategory = (category: string): string[] => {
  const found = JOB_TAXONOMY.find(c => c.category === category);
  if (!found) return [];
  return found.roles.length > 0 ? found.roles : [found.category];
};

/** Flat searchable option list: one entry per selectable role. */
export const ROLE_OPTIONS: { category: string; role: string }[] = JOB_TAXONOMY.flatMap(cat =>
  getRolesForCategory(cat.category).map(role => ({ category: cat.category, role }))
);

export const findRoleOption = (category?: string | null, role?: string | null) =>
  ROLE_OPTIONS.find(o => o.category === category && o.role === role);
