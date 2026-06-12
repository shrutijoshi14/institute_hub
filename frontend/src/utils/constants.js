export const STANDARDS = [
    '5th', 
    '6th', 
    '7th', 
    '8th', 
    '9th', 
    'SSC (10th)', 
    '11th', 
    'HSC (12th)',
    'Diploma / Vocational'
];

export const BOARDS = [
    'CBSE', 
    'ICSE', 
    'CISCE', 
    'State Board', 
    'NIOS',
    'IB',
    'IGCSE',
    'Science (PCM)',
    'Science (PCB)',
    'Science (PCMB)',
    'Commerce',
    'Arts / Humanities',
    'Polytechnic',
    'ITI',
    'Diploma Engineering'
];

export const EXAMS = [
    'None', 
    // 5-8
    'SOF Olympiads', 'NSO (Science)', 'IMO (Maths)', 'IEO (English)', 'NSTSE', 'Spell Bee', 'NTSE Foundation',
    // 9-10
    'NTSE', 'Olympiads', 'JEE Foundation', 'NEET Foundation', 'NMMS', 'NSEJS',
    // 11-12 Science
    'JEE Main', 'JEE Advanced', 'MHT CET', 'BITSAT', 'VITEEE', 'SRMJEEE', 'NEET', 'AIIMS', 'JIPMER', 'IISER Aptitude Test', 'NEST', 'KVPY', 'NDA',
    // 11-12 Commerce
    'CA Foundation', 'CS Foundation', 'CMA', 'CUET', 'SET', 'NPAT', 'BBA Entrance', 'B.Com Entrance', 'Banking Exams',
    // 11-12 Arts
    'UPSC Foundation', 'MPSC', 'SSC', 'CLAT', 'AILET', 'NID', 'NIFT', 'UCEED', 'BA Entrance Exams',
    // Diploma
    'Polytechnic CET', 'ITI Entrance'
];

export const BOARDS_BY_STANDARD = {
    '5th': ['CBSE', 'ICSE', 'CISCE', 'State Board', 'NIOS', 'IB', 'IGCSE'],
    '6th': ['CBSE', 'ICSE', 'CISCE', 'State Board', 'NIOS', 'IB', 'IGCSE'],
    '7th': ['CBSE', 'ICSE', 'CISCE', 'State Board', 'NIOS', 'IB', 'IGCSE'],
    '8th': ['CBSE', 'ICSE', 'CISCE', 'State Board', 'NIOS', 'IB', 'IGCSE'],
    '9th': ['CBSE', 'ICSE', 'CISCE', 'State Board', 'NIOS', 'IB', 'IGCSE'],
    'SSC (10th)': ['CBSE', 'ICSE', 'CISCE', 'State Board', 'NIOS', 'IB', 'IGCSE'],
    '11th': ['Science (PCM)', 'Science (PCB)', 'Science (PCMB)', 'Commerce', 'Arts / Humanities'],
    'HSC (12th)': ['Science (PCM)', 'Science (PCB)', 'Science (PCMB)', 'Commerce', 'Arts / Humanities'],
    'Diploma / Vocational': ['Polytechnic', 'ITI', 'Diploma Engineering']
};

export const EXAMS_BY_STANDARD = {
    '5th': ['None', 'SOF Olympiads', 'NSO (Science)', 'IMO (Maths)', 'IEO (English)', 'NSTSE', 'Spell Bee', 'NTSE Foundation'],
    '6th': ['None', 'SOF Olympiads', 'NSO (Science)', 'IMO (Maths)', 'IEO (English)', 'NSTSE', 'Spell Bee', 'NTSE Foundation'],
    '7th': ['None', 'SOF Olympiads', 'NSO (Science)', 'IMO (Maths)', 'IEO (English)', 'NSTSE', 'Spell Bee', 'NTSE Foundation'],
    '8th': ['None', 'SOF Olympiads', 'NSO (Science)', 'IMO (Maths)', 'IEO (English)', 'NSTSE', 'Spell Bee', 'NTSE Foundation'],
    '9th': ['None', 'NTSE', 'Olympiads', 'JEE Foundation', 'NEET Foundation', 'NMMS', 'NSEJS'],
    'SSC (10th)': ['None', 'NTSE', 'Olympiads', 'JEE Foundation', 'NEET Foundation', 'NMMS', 'NSEJS'],
    '11th': ['None', 'JEE Main', 'JEE Advanced', 'MHT CET', 'BITSAT', 'VITEEE', 'SRMJEEE', 'NEET', 'AIIMS', 'JIPMER', 'IISER Aptitude Test', 'NEST', 'KVPY', 'NDA', 'CA Foundation', 'CS Foundation', 'CMA', 'CUET', 'SET', 'NPAT', 'BBA Entrance', 'B.Com Entrance', 'Banking Exams', 'UPSC Foundation', 'MPSC', 'SSC', 'CLAT', 'AILET', 'NID', 'NIFT', 'UCEED', 'BA Entrance Exams'],
    'HSC (12th)': ['None', 'JEE Main', 'JEE Advanced', 'MHT CET', 'BITSAT', 'VITEEE', 'SRMJEEE', 'NEET', 'AIIMS', 'JIPMER', 'IISER Aptitude Test', 'NEST', 'KVPY', 'NDA', 'CA Foundation', 'CS Foundation', 'CMA', 'CUET', 'SET', 'NPAT', 'BBA Entrance', 'B.Com Entrance', 'Banking Exams', 'UPSC Foundation', 'MPSC', 'SSC', 'CLAT', 'AILET', 'NID', 'NIFT', 'UCEED', 'BA Entrance Exams'],
    'Diploma / Vocational': ['None', 'Polytechnic CET', 'ITI Entrance']
};

export const STATUSES = ['New', 'Contacted', 'Converted', 'Lost'];

export const SUBJECTS = [
    // Languages
    'English', 'Hindi', 'Marathi', 'Sanskrit',
    // 5-8 Main
    'Mathematics', 'Science', 'Social Studies', 'Computer', 'General Knowledge',
    // 5-8 Extra
    'Drawing', 'Moral Science', 'Physical Education',
    // 9-10 & 11-12
    'Physics', 'Chemistry', 'Biology',
    'Social Science', 'History', 'Geography', 'Civics', 'Economics',
    'Computer / IT', 'Computer Science', 'Electronics',
    // Commerce
    'Accountancy', 'Business Studies', 'Mathematics / SP', 'Secretarial Practice',
    // Arts
    'Political Science', 'Psychology', 'Sociology', 'Philosophy'
];
