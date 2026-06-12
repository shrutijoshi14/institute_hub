const seedData = [];

const standards5to8 = ['5th', '6th', '7th', '8th'];
const standards9to10 = ['9th', 'SSC (10th)'];
const standards11to12 = ['11th', 'HSC (12th)'];

// 5th-8th Standards
for (const std of standards5to8) {
  const maths = ['Numbers', 'Fractions', 'Decimals', 'Geometry', 'Measurements', 'Time', 'Graphs'];
  maths.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Fundamentals of ${t}`, subject: 'Mathematics', class_range: std, board: 'CBSE', exam_target: 'None', fees: 0 }));

  const science = ['Plants', 'Animals', 'Human Body', 'Water', 'Environment', 'Natural Resources'];
  science.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Exploring ${t}`, subject: 'Science', class_range: std, board: 'CBSE', exam_target: 'None', fees: 0 }));

  const hist = ['Ancient Civilization', 'Indian Culture', 'Historical Places'];
  hist.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Learning about ${t}`, subject: 'History', class_range: std, board: 'State Board', exam_target: 'None', fees: 0 }));
  
  const civics = ['Government', 'Rights & Duties'];
  civics.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Understanding ${t}`, subject: 'Civics', class_range: std, board: 'State Board', exam_target: 'None', fees: 0 }));

  const geog = ['Maps', 'Earth', 'Rivers', 'Climate'];
  geog.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Geography of ${t}`, subject: 'Geography', class_range: std, board: 'State Board', exam_target: 'None', fees: 0 }));
}

// 9th-10th Standards
for (const std of standards9to10) {
  const maths = ['Algebra', 'Geometry', 'Trigonometry', 'Statistics', 'Probability'];
  maths.forEach((t, i) => seedData.push({ title: `Module: ${t}`, description: `Advanced concepts in ${t}`, subject: 'Mathematics', class_range: std, board: 'CBSE', exam_target: 'None', fees: 0 }));

  const sci = ['Physics Basics', 'Chemistry Basics', 'Biology Basics', 'Environmental Science'];
  sci.forEach((t, i) => seedData.push({ title: `Module: ${t}`, description: `Foundation in ${t}`, subject: 'Science', class_range: std, board: 'CBSE', exam_target: 'None', fees: 0 }));

  const soc = ['History', 'Geography', 'Political Science', 'Economics'];
  soc.forEach((t, i) => seedData.push({ title: `Module: ${t}`, description: `Key topics in ${t}`, subject: 'Social Science', class_range: std, board: 'CBSE', exam_target: 'None', fees: 0 }));
}

// 11th-12th Standards
for (const std of standards11to12) {
  // Science PCM/PCB
  const physics = ['Motion', 'Electricity', 'Magnetism', 'Optics', 'Thermodynamics'];
  physics.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Core concepts of ${t}`, subject: 'Physics', class_range: std, board: 'Science (PCM)', exam_target: 'JEE Main', fees: 0 }));
  physics.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Core concepts of ${t}`, subject: 'Physics', class_range: std, board: 'Science (PCB)', exam_target: 'NEET', fees: 0 }));

  const chemistry = ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry'];
  chemistry.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Detailed study of ${t}`, subject: 'Chemistry', class_range: std, board: 'Science (PCM)', exam_target: 'JEE Main', fees: 0 }));
  chemistry.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Detailed study of ${t}`, subject: 'Chemistry', class_range: std, board: 'Science (PCB)', exam_target: 'NEET', fees: 0 }));

  const biology = ['Genetics', 'Human Physiology', 'Ecology', 'Cell Biology'];
  biology.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Advanced biology: ${t}`, subject: 'Biology', class_range: std, board: 'Science (PCB)', exam_target: 'NEET', fees: 0 }));
  
  const pcmMaths = ['Calculus', 'Vectors', '3D Geometry', 'Probability'];
  pcmMaths.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Advanced Maths: ${t}`, subject: 'Mathematics', class_range: std, board: 'Science (PCM)', exam_target: 'JEE Main', fees: 0 }));

  // Commerce
  const commerce = ['Accountancy', 'Business Studies', 'Economics'];
  commerce.forEach((t, i) => seedData.push({ title: `Module: ${t}`, description: `Core Commerce: ${t}`, subject: t, class_range: std, board: 'Commerce', exam_target: 'CA Foundation', fees: 0 }));

  // Arts
  const arts = ['History', 'Political Science', 'Geography', 'Psychology', 'Sociology'];
  arts.forEach((t, i) => seedData.push({ title: `Module: ${t}`, description: `Humanities: ${t}`, subject: t, class_range: std, board: 'Arts / Humanities', exam_target: 'CUET', fees: 0 }));
}

// Diploma / Vocational
const diploma = ['Engineering Drawing', 'Applied Mechanics', 'Basic Electronics'];
diploma.forEach((t, i) => seedData.push({ title: `Module: ${t}`, description: `Diploma Core: ${t}`, subject: 'Computer / IT', class_range: 'Diploma / Vocational', board: 'Polytechnic', exam_target: 'Polytechnic CET', fees: 0 }));


async function seedDatabase() {
  console.log('Clearing existing data to avoid duplicates...');
  try {
    const res = await fetch('http://localhost:5000/api/courses');
    const existing = await res.json();
    for (const c of existing) {
      await fetch(`http://localhost:5000/api/courses/${c.id}`, { method: 'DELETE' });
    }
  } catch (err) {
    console.error('Error clearing:', err);
  }

  console.log(`Seeding comprehensive Indian syllabus data (${seedData.length} topics)...`);
  let successCount = 0;
  for (const data of seedData) {
    try {
      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if(response.ok) {
        successCount++;
      } else {
        console.error(`\nFailed (Status ${response.status}): ${data.title}`);
      }
    } catch (err) {
      console.error(`\nFailed: ${data.title}`, err.message);
    }
  }
  console.log(`\n✅ Seed complete! Added ${successCount} specific syllabus topics across ALL standards.`);
}

seedDatabase();
