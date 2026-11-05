/**
 * Areas / localities per city, used by the job posting form.
 *
 * The locality picker only shows the list for the city chosen above it. Cities
 * that are not listed here (and free-text cities typed into the city picker)
 * fall back to a free-text locality input, so nothing is blocked.
 */
export const CITY_LOCALITIES: Record<string, string[]> = {
  // ── Tamil Nadu ────────────────────────────────────────────────
  'Chennai': [
    'T. Nagar', 'Adyar', 'Anna Nagar', 'Velachery', 'Tambaram', 'Porur',
    'Thoraipakkam (OMR)', 'Guindy', 'Mylapore', 'Nungambakkam', 'Kilpauk',
    'Chromepet', 'Ambattur', 'Vadapalani', 'Besant Nagar', 'Sholinganallur',
  ],
  'Coimbatore': [
    'R.S. Puram', 'Gandhipuram', 'Ramnagar', 'Saibaba Colony', 'Town Hall',
    'Vadavalli', 'Singanallur', 'Peelamedu', 'Saravanampatti', 'Thudiyalur',
    'Kuniamuthur', 'Ukkadam', 'Podanur', 'Ganapathy', 'Ramanathapuram', 'Kovaipudur',
  ],
  'Erode': [
    'Surampatti', 'Thindal', 'Veerappanchatram', 'Villarasampatti',
    'Karungalpalayam', 'Solar', 'Rangampalayam', 'Kasipalayam', 'Nasiyanur',
    'Chithode', 'Perundurai Road', 'Sathy Road', 'Mettur Road', 'Brough Road',
  ],
  'Salem': [
    'Hasthampatti', 'Fairlands', 'Five Roads', 'Suramangalam', 'Ammapet',
    'Kondalampatti', 'Seelanaickenpatti', 'Alagapuram', 'Peramanur', 'Shevapet',
    'Yercaud Road', 'Jagir Ammapalayam',
  ],
  'Tiruppur': [
    'Avinashi Road', 'Nallur', 'Veerapandi', 'Anupparpalayam', 'Kumaran Nagar',
    'Rakkiyapalayam', 'Samundipuram', 'Pandiyan Nagar', 'Mangalam Road', 'Dharapuram Road',
  ],
  'Madurai': [
    'Anna Nagar', 'K.K. Nagar', 'Goripalayam', 'Tallakulam', 'Bypass Road',
    'Villapuram', 'Simmakkal', 'Arappalayam', 'Kochadai', 'Thirunagar', 'Othakadai',
  ],
  'Tiruchirappalli': [
    'Thillai Nagar', 'Srirangam', 'Cantonment', 'K.K. Nagar', 'Thuvakudi',
    'Puthur', 'Woraiyur', 'Ariyamangalam', 'Anna Nagar', 'BHEL Township',
  ],
  'Tirunelveli': [
    'Palayamkottai', 'Town', 'Vannarpettai', 'Nanguneri Road', 'Perumalpuram',
    'Kokkirakulam', 'Pettai', 'Melapalayam',
  ],
  'Vellore': [
    'Katpadi', 'Sathuvachari', 'Gandhi Nagar', 'Bagayam', 'Katpadi Road',
    'Thorapadi', 'Shenbakkam', 'Officer Colony',
  ],
  'Hosur': [
    'Bagalur Road', 'Mathigiri', 'SIPCOT', 'Hosur Town', 'Bommidi Road',
    'Zuzuvadi', 'Mookandapalli', 'Anumepalli',
  ],
  'Dindigul': [
    'Nagal Nagar', 'RM Colony', 'Vedasandur Road', 'Palani Road', 'Bharathipuram',
    'Seelapadi Road', 'Begambur', 'Mettupatti',
  ],
  'Thanjavur': [
    'Medical College Road', 'South Street', 'Trichy Road', 'Old Bus Stand',
    'New Bus Stand', 'Nanjikottai', 'Raja Serfoji Nagar', 'Pillayarpatti',
  ],
  'Nagercoil': [
    'Vadasery', 'Kottar', 'Asaripallam', 'Cape Road', 'Tower Junction',
    'Punnai Nagar', 'Kanyakumari Road',
  ],
  'Puducherry': [
    'White Town', 'MG Road', 'Lawspet', 'Reddiarpalayam', 'Muthialpet',
    'Villianur', 'Ariyankuppam', 'Gorimedu',
  ],
  'Pondicherry': [
    'White Town', 'MG Road', 'Lawspet', 'Reddiarpalayam', 'Muthialpet',
    'Villianur', 'Ariyankuppam', 'Gorimedu',
  ],

  // ── Karnataka / Telangana / Andhra ────────────────────────────
  'Bengaluru': [
    'Koramangala', 'Indiranagar', 'Whitefield', 'Jayanagar', 'HSR Layout',
    'BTM Layout', 'Marathahalli', 'Hebbal', 'Rajajinagar', 'Malleshwaram',
    'Electronic City', 'Bellandur', 'Yelahanka', 'Banashankari', 'JP Nagar',
  ],
  'Mysuru': [
    'Vijayanagar', 'Kuvempunagar', 'Saraswathipuram', 'Jayalakshmipuram',
    'Gokulam', 'Hebbal', 'Bannimantap', 'Nazarbad',
  ],
  'Mangaluru': [
    'Kadri', 'Hampankatta', 'Balmatta', 'Kankanady', 'Surathkal', 'Kavoor',
    'Attavar', 'Urwa',
  ],
  'Hubli': [
    'Gokul Road', 'Vidyanagar', 'Keshwapur', 'Navanagar', 'Unkal', 'Gandhinagar',
  ],
  'Hyderabad': [
    'Gachibowli', 'Madhapur', 'Hitech City', 'Kukatpally', 'Banjara Hills',
    'Jubilee Hills', 'Secunderabad', 'Ameerpet', 'Kondapur', 'Miyapur', 'Begumpet',
  ],
  'Secunderabad': [
    'Marredpally', 'Trimulgherry', 'Sainikpuri', 'Alwal', 'Malkajgiri',
    'Begumpet', 'Bowenpally',
  ],
  'Visakhapatnam': [
    'MVP Colony', 'Dwaraka Nagar', 'Gajuwaka', 'Madhurawada', 'Seethammadhara',
    'Akkipalem', 'Kancharapalem', 'Beach Road',
  ],
  'Vijayawada': [
    'Benz Circle', 'Governorpet', 'Labbipet', 'Gunadala', 'Patamata',
    'Bhavanipuram', 'Ajit Singh Nagar',
  ],
  'Tirupati': [
    'Tiruchanoor', 'Gandhi Road', 'Balaji Colony', 'Korlagunta', 'Air Bypass Road',
    'Alipiri', 'SV University Area',
  ],

  // ── Maharashtra / Gujarat / Goa ───────────────────────────────
  'Mumbai': [
    'Andheri', 'Bandra', 'Borivali', 'Dadar', 'Malad', 'Goregaon', 'Powai',
    'Chembur', 'Worli', 'Kandivali', 'Kurla', 'Vashi',
  ],
  'Navi Mumbai': [
    'Vashi', 'Nerul', 'Belapur', 'Airoli', 'Kharghar', 'Panvel', 'Ulwe',
  ],
  'Thane': [
    'Thane West', 'Ghodbunder Road', 'Naupada', 'Wagle Estate', 'Kolshet',
    'Majiwada', 'Hiranandani Estate',
  ],
  'Pune': [
    'Kothrud', 'Hinjewadi', 'Kharadi', 'Viman Nagar', 'Baner', 'Wakad',
    'Hadapsar', 'Aundh', 'Shivaji Nagar', 'Magarpatta', 'Pimpri',
  ],
  'Nagpur': [
    'Dharampeth', 'Sadar', 'Sitabuldi', 'Manish Nagar', 'Wardha Road',
    'Hingna Road', 'Kamptee Road', 'Civil Lines',
  ],
  'Nashik': [
    'College Road', 'Gangapur Road', 'Panchavati', 'Indira Nagar', 'Cidco',
    'Satpur', 'Nashik Road',
  ],
  'Ahmedabad': [
    'Navrangpura', 'Satellite', 'Bopal', 'Maninagar', 'Vastrapur', 'Prahlad Nagar',
    'Gota', 'Chandkheda', 'SG Highway',
  ],
  'Surat': [
    'Adajan', 'Vesu', 'Piplod', 'Athwa', 'Katargam', 'Rander', 'Pal', 'Udhna',
  ],
  'Vadodara': [
    'Alkapuri', 'Sayajigunj', 'Gotri', 'Manjalpur', 'Karelibaug', 'Sama',
    'Waghodia Road',
  ],
  'Rajkot': [
    'Kalawad Road', 'University Road', '150 Feet Ring Road', 'Mavdi', 'Gondal Road',
    'Nana Mava',
  ],

  // ── North / East / Central ────────────────────────────────────
  'Delhi': [
    'Connaught Place', 'Karol Bagh', 'Saket', 'Dwarka', 'Rohini', 'Lajpat Nagar',
    'Rajouri Garden', 'Janakpuri', 'Pitampura', 'Vasant Kunj',
  ],
  'New Delhi': [
    'Connaught Place', 'Karol Bagh', 'Saket', 'Dwarka', 'Rohini', 'Lajpat Nagar',
    'Rajouri Garden', 'Janakpuri', 'Pitampura', 'Vasant Kunj',
  ],
  'Noida': [
    'Sector 18', 'Sector 62', 'Sector 63', 'Sector 137', 'Greater Noida West',
    'Indirapuram', 'Sector 76', 'Sector 50',
  ],
  'Gurugram': [
    'Cyber City', 'DLF Phase 1-5', 'Sohna Road', 'Golf Course Road', 'Sector 14',
    'Sector 29', 'Manesar', 'New Gurgaon',
  ],
  'Faridabad': [
    'Sector 15', 'Sector 21', 'NIT', 'Ballabgarh', 'Old Faridabad', 'Neharpar',
  ],
  'Ghaziabad': [
    'Indirapuram', 'Vaishali', 'Kaushambi', 'Raj Nagar Extension', 'Crossings Republik',
    'Mohan Nagar',
  ],
  'Jaipur': [
    'Malviya Nagar', 'Vaishali Nagar', 'C-Scheme', 'Mansarovar', 'Jagatpura',
    'Tonk Road', 'Raja Park', 'Civil Lines',
  ],
  'Lucknow': [
    'Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Alambagh', 'Chinhat',
    'Jankipuram', 'Vikas Nagar',
  ],
  'Kanpur': [
    'Swaroop Nagar', 'Civil Lines', 'Kakadeo', 'Govind Nagar', 'Kalyanpur',
    'Kidwai Nagar',
  ],
  'Chandigarh': [
    'Sector 17', 'Sector 22', 'Sector 34', 'Sector 35', 'Sector 43', 'Sector 8',
    'Manimajra', 'IT Park',
  ],
  'Kolkata': [
    'Salt Lake', 'New Town', 'Park Street', 'Ballygunge', 'Howrah', 'Gariahat',
    'Behala', 'Dum Dum', 'Rajarhat', 'Esplanade',
  ],
  'Bhubaneswar': [
    'Patia', 'Chandrasekharpur', 'Saheed Nagar', 'Jaydev Vihar', 'Khandagiri',
    'Old Town', 'Nayapalli',
  ],
  'Patna': [
    'Kankarbagh', 'Boring Road', 'Bailey Road', 'Patliputra', 'Rajendra Nagar',
    'Danapur', 'Gandhi Maidan',
  ],
  'Indore': [
    'Vijay Nagar', 'Palasia', 'Sapna Sangeeta', 'Bhawarkua', 'Sudama Nagar',
    'Rau', 'MG Road',
  ],
  'Bhopal': [
    'Arera Colony', 'MP Nagar', 'Kolar Road', 'Ayodhya Bypass', 'Bairagarh',
    'Shahpura', 'Habibganj',
  ],

  // ── Uttar Pradesh ────────────────────────────────────────────
  'Prayagraj': [
    'Civil Lines', 'George Town', 'Katra', 'Naini', 'Jhunsi', 'Alopibagh',
    'Salori', 'Teliyarganj', 'Mumfordganj', 'Kydganj', 'Allahpur', 'Daraganj',
    'Dhoomanganj', 'Bamrauli', 'Jhalwa', 'Shivkuti',
  ],
  'Varanasi': [
    'Lanka', 'Bhelupur', 'Sigra', 'Godowlia', 'Assi Ghat', 'Sarnath',
    'Mahmoorganj', 'Teliabagh', 'Orderly Bazar', 'Ravindrapuri',
  ],
  'Agra': [
    'Taj Ganj', 'Sadar Bazar', 'Kamla Nagar', 'Dayalbagh', 'Sikandra',
    'Khandari', 'Shahganj', 'Lohamandi', 'Krishna Nagar',
  ],
  'Gorakhpur': [
    'Golghar', 'Civil Lines', 'Shahpur', 'Raptinagar', 'Basharatpur',
    'Taramandal', 'Arya Nagar', 'Mohaddipur',
  ],
  'Meerut': [
    'Sadhan Road', 'Abu Lane', 'Shastri Nagar', 'Ganga Nagar', 'Pallavpuram',
    'Modipuram', 'Begum Bridge', 'Saket',
  ],
  'Moradabad': [
    'Civil Lines', 'Ram Ganga Vihar', 'Majhola', 'Budh Bazar', 'Kanth Road',
    'Mughalpura', 'Line Par',
  ],
  'Bareilly': [
    'Civil Lines', 'Rajendra Nagar', 'Izzatnagar', 'Subhash Nagar',
    'Rampur Garden', 'Bareilly Cantt', 'Karampur',
  ],
  'Aligarh': [
    'Civil Lines', 'Ramghat Road', 'Dodhpur', 'Quarsi', 'Jamalpur',
    'Sasni Gate', 'Upper Kot',
  ],
  'Jhansi': [
    'Sipri Bazar', 'Civil Lines', 'Elite Crossing', 'Nagra', 'Prem Nagar',
    'Gwalior Road',
  ],
  'Mathura': [
    'Holi Gate', 'Krishna Nagar', 'Dampier Nagar', 'Bhuteshwar Road',
    'Govardhan Road', 'Arya Samaj Road',
  ],
  'Muzaffarnagar': [
    'Civil Lines', 'New Mandi', 'Shiv Chowk', 'Gandhi Colony', 'Bhopa Road',
  ],
  'Saharanpur': [
    'Civil Lines', 'Court Road', 'Mission Compound', 'Behat Road',
    'Delhi Road', 'Khalapar',
  ],
  'Shahjahanpur': [
    'Civil Lines', 'Sadar Bazar', 'Bahadurganj', 'Rosa Road',
  ],

  // ── Uttarakhand / Himachal / J&K / North East ─────────────────
  'Dehradun': [
    'Rajpur Road', 'Clement Town', 'Dehradun Cantt', 'Chakrata Road',
    'Vasant Vihar', 'Patel Nagar', 'Ballupur', 'Dalanwala',
  ],
  'Haridwar': [
    'Har Ki Pauri', 'Jwalapur', 'Kankhal', 'BHEL', 'Bhupatwala', 'SIDCUL',
    'Ranipur',
  ],
  'Shimla': [
    'Mall Road', 'Ridge', 'Sanjauli', 'Kasumpti', 'New Shimla',
    'Chhota Shimla', 'Summer Hill',
  ],
  'Jammu': [
    'Gandhi Nagar', 'Channi Himmat', 'Trikuta Nagar', 'Talab Tillo',
    'Janipur', 'Bakshi Nagar',
  ],
  'Srinagar': [
    'Lal Chowk', 'Rajbagh', 'Hyderpora', 'Bemina', 'Sonwar', 'Dalgate',
    'Parimpora',
  ],
  'Guwahati': [
    'Zoo Road', 'Beltola', 'Six Mile', 'GS Road', 'Paltan Bazar', 'Ganeshguri',
    'Dispur', 'Hatigaon',
  ],
  'Agartala': [
    'Kaman Chowmuhani', 'Banamalipur', 'Ramnagar', 'Kunjaban', 'Money Bagan',
  ],
  'Aizawl': [
    'Zarkawt', 'Dawrpui', 'Chanmari', 'Kulikawn', 'Bawngkawn', 'Sikulpuikawn',
  ],
  'Imphal': [
    'Thangal Bazar', 'Paona Bazar', 'Sagolband', 'Uripok', 'Khurai',
    'Lamphelpat',
  ],

  // ── Haryana / Punjab ─────────────────────────────────────────
  'Karnal': [
    'Sector 6', 'Sector 12', 'Kunjpura Road', 'Model Town', 'Indira Colony',
    'Namaste Chowk',
  ],
  'Panipat': [
    'Model Town', 'Sector 11', 'GT Road', 'Assandh Road', 'Sanoli Road',
    'Tehsil Camp',
  ],
  'Ambala': [
    'Ambala Cantt', 'Ambala City', 'Mahesh Nagar', 'Sector 9', 'Prem Nagar',
    'Babyal',
  ],
  'Yamunanagar': [
    'Jagadhri', 'Model Town', 'Sector 17', 'Radaur Road', 'Workshop Road',
  ],
  'Rohtak': [
    'Model Town', 'Sector 14', 'Delhi Road', 'Jhajjar Road', 'Sunaria',
    'Civil Road',
  ],
  'Hisar': [
    'Model Town', 'Sector 14', 'Red Square Market', 'Hisar Cantt',
    'Azad Nagar', 'Delhi Road',
  ],
  'Sonipat': [
    'Model Town', 'Sector 14', 'Atlas Road', 'Subhash Chowk', 'Murthal Road',
  ],
  'Panchkula': [
    'Sector 8', 'Sector 11', 'Sector 20', 'Pinjore', 'Kalka',
  ],
  'Patiala': [
    'Leela Bhawan', 'Model Town', 'Urban Estate', 'Sirhind Road',
    'Sangrur Road', 'Tripuri',
  ],
  'Ludhiana': [
    'Model Town', 'Sarabha Nagar', 'Gurdev Nagar', 'Dugri', 'Civil Lines',
    'Jagraon Bridge', 'Ferozepur Road', 'Ludhiana Cantt',
  ],
  'Jalandhar': [
    'Model Town', 'Civil Lines', 'Urban Estate', 'Basti Bawa Khel',
    'Nakodar Road', 'Kapurthala Road',
  ],
  'Amritsar': [
    'Ranjit Avenue', 'Lawrence Road', 'Mall Road', 'Golden Temple Area',
    'Majitha Road', 'Putligarh', 'Chheharta',
  ],

  // ── Maharashtra (rest) ────────────────────────────────────────
  'Ahmednagar': [
    'Savedi', 'Kedgaon', 'Pipeline Road', 'Maliwada', 'Nalegaon', 'Vilad Ghat',
  ],
  'Akola': [
    'Civil Lines', 'Ramdaspeth', 'Gorakshan Road', 'Tapadia Nagar', 'Jatharpeth',
  ],
  'Amravati': [
    'Camp', 'Rajapeth', 'Badnera Road', 'Sai Nagar', 'Gadge Nagar', 'VMV Road',
  ],
  'Aurangabad': [
    'CIDCO', 'Kranti Chowk', 'Jalna Road', 'Garkheda', 'Pundlik Nagar',
    'Satara Parisar', 'Waluj MIDC',
  ],
  'Chandrapur': [
    'Ram Nagar', 'Civil Lines', 'Bangali Camp', 'Jatpura Gate', 'Tukum',
  ],
  'Jalgaon': [
    'Ring Road', 'Mehrun Road', 'Shivaji Nagar', 'Pimprala', 'Akashwani Chowk',
  ],
  'Kolhapur': [
    'Rajarampuri', 'Shivaji University Road', 'Kasba Bawada', 'Ravivar Peth',
    'Nagala Park',
  ],
  'Latur': [
    'Chandra Nagar', 'Gandhi Chowk', 'Barshi Road', 'Shivaji Nagar', 'Mitra Nagar',
  ],
  'Malegaon': [
    'Mominpura', 'Camp', 'Soygaon Road', 'Navi Peth',
  ],
  'Nanded': [
    'Vazirabad', 'Shivaji Nagar', 'CIDCO', 'Taroda', 'Anand Nagar',
  ],
  'Parbhani': [
    'Vasant Nagar', 'Shivaji Nagar', 'Karegaon Road', 'Station Road',
  ],
  'Sangli': [
    'Vishrambag', 'Ganpati Peth', 'Rajwada', 'Madhavnagar Road', 'Kupwad Road',
  ],
  'Satara': [
    'Powai Naka', 'Sadar Bazar', 'Karanje', 'Godoli', 'Shivaji Nagar',
  ],
  'Solapur': [
    'Sadar Bazar', 'Hotgi Road', 'Murarji Peth', 'Vijapur Road', 'Ashok Chowk',
    'Jule Solapur',
  ],
  'Kalyan': [
    'Kalyan West', 'Kalyan East', 'Dombivli East', 'Shahad', 'Murbad Road',
  ],
  'Ulhasnagar': [
    'Ulhasnagar 1-5', 'Netaji Chowk', 'Gol Maidan', 'Sapna Garden', 'Vithalwadi',
  ],
  'Vasai-Virar': [
    'Vasai West', 'Vasai East', 'Virar West', 'Nalasopara East',
    'Nalasopara West', 'Bolinj',
  ],
  'Pimpri-Chinchwad': [
    'Pimpri', 'Chinchwad', 'Nigdi', 'Akurdi', 'Bhosari', 'Wakad', 'Ravet',
    'Thergaon',
  ],

  // ── Gujarat (rest) ───────────────────────────────────────────
  'Bhavnagar': [
    'Waghawadi Road', 'Krishna Nagar', 'Nilambag', 'Amba Chowk', 'Nari Road',
  ],
  'Jamnagar': [
    'Park Colony', 'Khodiyar Colony', 'Joggers Park', 'Ranjit Road',
    'Digjam Circle',
  ],
  'Junagadh': [
    'Joshipura', 'Patel Chowk', 'Talav Gate', 'Vanthali Road', 'Zanzarda Road',
  ],
  'Gandhinagar': [
    'Sector 11', 'Sector 16', 'Sector 21', 'Kudasan', 'Sargasan', 'Infocity',
  ],
  'Gandhidham': [
    'Sector 8', 'Sector 12', 'Lilashah Nagar', 'Oslo Road', 'Galpadar Road',
  ],
  'Anand': [
    'Vallabh Vidyanagar', 'Gamdi', 'Jitodia Road', 'Bhalej Road', 'Station Road',
  ],
  'Nadiad': [
    'Dairy Road', 'Pij Road', 'College Road', 'Bhalej Road', 'Station Road',
  ],

  // ── Karnataka (rest) / Kerala ────────────────────────────────
  'Belagavi': [
    'Tilakwadi', 'Camp', 'Shivaji Nagar', 'Vadgaon Road', 'Nehru Nagar',
    'Udyambag',
  ],
  'Bellary': [
    'Cowl Bazar', 'Gandhi Nagar', 'Kappagal Road', 'Cantonment', 'Bruce Pet',
  ],
  'Bidar': [
    'Gandhi Gunj', 'Chidri Road', 'Station Road', 'Udgir Road', 'Naubad',
  ],
  'Davanagere': [
    'PB Road', 'Vidyanagar', 'MCC B Block', 'Karur Industrial Area',
    'Vinobha Nagar',
  ],
  'Dharwad': [
    'Vidyagiri', 'Jubilee Circle', 'Saptapur', 'Keshwapur', 'Navanagar',
  ],
  'Shivamogga': [
    'Vinobha Nagar', 'Gandhi Bazar', 'Bhadravati Road', 'Savalanga Road',
  ],
  'Tumakuru': [
    'MG Road', 'Sira Gate', 'Batawadi', 'Kyathsandra', 'Shettihalli',
  ],
  'Kochi': [
    'Kakkanad', 'Fort Kochi', 'Edappally', 'Vyttila', 'Marine Drive',
    'Palarivattom', 'Kaloor', 'Aluva',
  ],
  'Kollam': [
    'Chinnakada', 'Asramam', 'Kilikolloor', 'Kadappakada', 'Sakthikulangara',
  ],
  'Kozhikode': [
    'Mavoor Road', 'Nadakkavu', 'Kallai', 'Palazhi', 'Chevayur', 'Feroke',
  ],
  'Thiruvananthapuram': [
    'Technopark', 'Kowdiar', 'Vazhuthacaud', 'Pattom', 'Kazhakkoottam',
    'Sasthamangalam', 'Vattiyoorkavu',
  ],
  'Thrissur': [
    'MG Road', 'Punkunnam', 'Kokkalai', 'Ayyanthole', 'Thrissur Round',
  ],

  // ── Andhra Pradesh / Telangana (rest) ────────────────────────
  'Guntur': [
    'Brodipet', 'Lakshmipuram', 'Arundelpet', 'Nallapadu', 'Kothapet',
  ],
  'Nellore': [
    'Trunk Road', 'Gandhi Nagar', 'Vedayapalem', 'Balaji Nagar',
    'Magunta Layout',
  ],
  'Kurnool': [
    'Raj Vihar Center', 'Budhwarpet', 'Ashok Nagar', 'Joharapuram', 'B Camp',
  ],
  'Kakinada': [
    'Main Road', 'Bhanugudi Junction', 'Suryaraopeta', 'Ramanayyapeta',
    'Kakinada Port',
  ],
  'Rajahmundry': [
    'Danavaipeta', 'T Nagar', 'Aryapuram', 'Morampudi', 'Katheru',
  ],
  'Eluru': [
    'RR Peta', 'Sanivarapupeta', 'Powerpet', 'Tangellamudi',
  ],
  'Ongole': [
    'Trunk Road', 'Bhagya Nagar', 'Kurnool Road', 'Mangamuru Road',
  ],
  'Chittoor': [
    'Greamspet', 'Gandhi Nagar', 'Reddigunta', 'Kattamanchi',
  ],
  'Kadapa': [
    'Gandhi Nagar', 'Akkayapalle', 'Ramanjaneyapuram', 'Seven Roads',
  ],
  'Anantapur': [
    'MG Road', 'Ramnagar', 'Sai Nagar', 'Kamalanagar',
  ],
  'Proddatur': [
    'Mydukur Road', 'Gandhi Nagar', 'Saidapuram', 'YMR Colony',
  ],
  'Nizamabad': [
    'Khaleelwadi', 'Gandhi Nagar', 'Vinayak Nagar', 'Kanteshwar',
  ],
  'Karimnagar': [
    'Mankammathota', 'Bhagath Nagar', 'Kothirampur', 'Mukarampura',
  ],
  'Warangal': [
    'Hanamkonda', 'Kazipet', 'Subedari', 'Nakkalagutta', 'Warangal Fort',
  ],

  // ── Rajasthan ────────────────────────────────────────────────
  'Jodhpur': [
    'Shastri Nagar', 'Sardarpura', 'Ratanada', 'Banar Road', 'Mandore', 'Basni',
  ],
  'Kota': [
    'Talwandi', 'Vigyan Nagar', 'Rajeev Gandhi Nagar', 'Anantpura', 'Kunhari',
  ],
  'Udaipur': [
    'Hiran Magri', 'Fatehpura', 'Sukher', 'Bhuwana', 'Pratap Nagar',
  ],
  'Ajmer': [
    'Vaishali Nagar', 'Civil Lines', 'Adarsh Nagar', 'Kotra',
    'Panchsheel Nagar',
  ],
  'Bikaner': [
    'Jai Narayan Vyas Colony', 'Rani Bazar', 'Sadul Ganj', 'Pawanpuri',
  ],
  'Alwar': [
    'Scheme 2', 'Manu Marg', 'Arya Nagar', 'Hope Circus',
  ],
  'Bharatpur': [
    'Krishna Nagar', 'Civil Lines', 'Sewar', 'Mathura Road',
  ],
  'Sikar': [
    'Jat Colony', 'Station Road', 'Piprali Road', 'Civil Lines',
  ],
  'Sri Ganganagar': [
    'Jawahar Nagar', 'Meera Marg', 'First Circle', 'Sukharia Circle',
  ],
  'Bhilwara': [
    'Bhopal Ganj', 'Sanganeri Gate', 'Shastri Nagar', 'Azad Nagar',
    'Subhash Nagar', 'RC Vyas Colony',
  ],

  // ── Madhya Pradesh (rest) ───────────────────────────────────
  'Jabalpur': [
    'Vijay Nagar', 'Napier Town', 'Wright Town', 'Adhartal', 'Gorakhpur Road',
    'Rampur',
  ],
  'Gwalior': [
    'City Centre', 'Thatipur', 'Morar', 'Lashkar', 'Padav', 'Phool Bagh',
  ],
  'Ujjain': [
    'Freeganj', 'Dewas Gate', 'Nanakheda', 'Rishi Nagar', 'Mahakal Area',
  ],
  'Sagar': [
    'Civil Lines', 'Tilli Road', 'Makronia', 'Katara',
  ],
  'Satna': [
    'Civil Lines', 'Rewa Road', 'Semaria Chowk', 'Kripalu',
  ],
  'Rewa': [
    'Civil Lines', 'University Road', 'Padra', 'Gangev',
  ],
  'Dewas': [
    'Bank Colony', 'Kotwali Road', 'Tonk Khurd Road', 'Tower Chowk',
  ],
  'Ratlam': [
    'Do Batti', 'Chandni Chowk', 'Kasturba Nagar', 'Jaora Road',
  ],
  'Morena': [
    'Bada Bazar', 'Civil Lines', 'Jaipur Road', 'Ganj',
  ],

  // ── Chhattisgarh / Odisha / Jharkhand / Bengal ───────────────
  'Raipur': [
    'Pandri', 'Shankar Nagar', 'Kabir Nagar', 'Telibandha', 'Avanti Vihar',
    'Devendra Nagar',
  ],
  'Bhilai': [
    'Sector 6', 'Supela', 'Nehru Nagar', 'Kohka',
  ],
  'Durg': [
    'Station Road', 'Padmanabhpur', 'Borsi Road', 'Shivaji Nagar',
  ],
  'Bilaspur': [
    'Vyapar Vihar', 'Mangla Chowk', 'Chakarbhatha', 'Sarkanda', 'Nehru Nagar',
  ],
  'Haldia': [
    'City Centre', 'Durgachak', 'Sutahata', 'Khanjanachak', 'Basudevpur',
  ],
  'Rourkela': [
    'Civil Township', 'Basanti Colony', 'Uditnagar', 'Chhend', 'Sector 2',
  ],
  'Cuttack': [
    'Buxi Bazar', 'Badambadi', 'College Square', 'Link Road',
    'Choudhury Bazar',
  ],
  'Sambalpur': [
    'Ainthapali', 'Farm Road', 'Dhanupali', 'Budharaja', 'Golebazar',
  ],
  'Ranchi': [
    'Lalpur', 'Harmu', 'Kanke Road', 'Doranda', 'Hatia', 'Ratu Road',
    'Ashok Nagar',
  ],
  'Jamshedpur': [
    'Bistupur', 'Sakchi', 'Kadma', 'Sonari', 'Telco Colony', 'Adityapur',
  ],
  'Dhanbad': [
    'Hirapur', 'Bank More', 'Saraidhela', 'Jharia', 'Dhaiya',
  ],
  'Bokaro': [
    'Sector 4', 'Sector 9', 'Chas', 'Bokaro Steel City', 'City Park',
  ],
  'Deoghar': [
    'Baidyanathdham', 'Tower Chowk', 'Jasidih Road', 'Kunda',
  ],
  'Siliguri': [
    'Sevoke Road', 'Hakimpara', 'Pradhan Nagar', 'Uttorayon', 'Ashrampara',
  ],
  'Durgapur': [
    'City Centre', 'Bidhannagar', 'Benachity', 'Muchipara', 'ABL Township',
  ],
  'Asansol': [
    'Ushagram', 'Hutton Road', 'Burnpur', 'Chelidanga',
  ],
  'Howrah': [
    'Shibpur', 'Bally', 'Salkia', 'Kadamtala', 'Belur',
  ],
  'Malda': [
    'English Bazar', 'Station Road', 'Netaji More', 'Rabindra Nagar',
  ],

  // ── Bihar ────────────────────────────────────────────────────
  'Bihar Sharif': [
    'Nalanda Road', 'Station Road', 'Civil Lines', 'Ramchandrapur',
  ],
  'Muzaffarpur': [
    'Motijheel', 'Kalambagh Chowk', 'Aghoria Bazar', 'Mithanpura',
    'Bhagwanpur',
  ],
  'Darbhanga': [
    'Tower Chowk', 'Donar', 'Allalpatti', 'Laheriasarai',
  ],
  'Bhagalpur': [
    'Tilkamanjhi', 'Adampur', 'Sabour', 'Nathnagar', 'Barari',
  ],
  'Gaya': [
    'Civil Lines', 'Delha', 'Manpur', 'Bodh Gaya Road',
  ],
  'Purnia': [
    'Line Bazar', 'Bhatta Bazar', 'Khalifabagh', 'Gulabbagh',
  ],
};

/**
 * Localities for a city. Matching is case-insensitive, and an empty result
 * means the city has no built-in list (callers should allow free text).
 */
export const getLocalitiesForCity = (city: string): string[] => {
  const key = (city || '').trim().toLowerCase();
  if (!key) return [];
  const match = Object.keys(CITY_LOCALITIES).find(name => name.toLowerCase() === key);
  return match ? CITY_LOCALITIES[match] : [];
};
