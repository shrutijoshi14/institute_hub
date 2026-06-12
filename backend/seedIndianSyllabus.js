const seedData = [];

// 5th Standard (CBSE)
const fifthMaths = ['Numbers', 'Addition/Subtraction', 'Multiplication', 'Division', 'Fractions', 'Decimals', 'Geometry', 'Measurements', 'Time', 'Money', 'Graphs'];
fifthMaths.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Fundamentals of ${t}`, subject: 'Mathematics', class_range: '5th', board: 'CBSE', exam_target: 'None', fees: 0 }));

const fifthScience = ['Plants', 'Animals', 'Human Body', 'Water', 'Food', 'Environment', 'Natural Resources', 'Weather', 'Pollution'];
fifthScience.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Exploring ${t}`, subject: 'Science', class_range: '5th', board: 'CBSE', exam_target: 'None', fees: 0 }));

const fifthHistory = ['Ancient Civilization', 'Freedom Fighters', 'Indian Culture', 'Historical Places'];
fifthHistory.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Learning about ${t}`, subject: 'History', class_range: '5th', board: 'State Board', exam_target: 'None', fees: 0 }));

const fifthCivics = ['Government', 'Rights & Duties', 'Community', 'Citizenship'];
fifthCivics.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Understanding ${t}`, subject: 'Civics', class_range: '5th', board: 'State Board', exam_target: 'None', fees: 0 }));

const fifthGeography = ['Maps', 'Earth', 'Rivers', 'Climate'];
fifthGeography.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Geography of ${t}`, subject: 'Geography', class_range: '5th', board: 'State Board', exam_target: 'None', fees: 0 }));

// 9th-10th Standard
const tenthMaths = ['Algebra', 'Geometry', 'Trigonometry', 'Statistics'];
tenthMaths.forEach((t, i) => seedData.push({ title: `Module: ${t}`, description: `Advanced concepts in ${t}`, subject: 'Mathematics', class_range: 'SSC (10th)', board: 'CBSE', exam_target: 'None', fees: 0 }));

const tenthScience = ['Physics Basics', 'Chemistry Basics', 'Biology Basics'];
tenthScience.forEach((t, i) => seedData.push({ title: `Module: ${t}`, description: `Foundation in ${t}`, subject: 'Science', class_range: 'SSC (10th)', board: 'CBSE', exam_target: 'None', fees: 0 }));

const tenthSocial = ['History', 'Geography', 'Political Science', 'Economics'];
tenthSocial.forEach((t, i) => seedData.push({ title: `Module: ${t}`, description: `Key topics in ${t}`, subject: 'Social Science', class_range: 'SSC (10th)', board: 'CBSE', exam_target: 'None', fees: 0 }));

// 11th-12th Standard Science (PCM / PCB)
const twelfthPhysics = ['Motion', 'Electricity', 'Magnetism', 'Optics'];
twelfthPhysics.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Core concepts of ${t}`, subject: 'Physics', class_range: 'HSC (12th)', board: 'Science (PCM)', exam_target: 'JEE Main', fees: 0 }));
twelfthPhysics.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Core concepts of ${t}`, subject: 'Physics', class_range: 'HSC (12th)', board: 'Science (PCB)', exam_target: 'NEET', fees: 0 }));

const twelfthChemistry = ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry'];
twelfthChemistry.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Detailed study of ${t}`, subject: 'Chemistry', class_range: 'HSC (12th)', board: 'Science (PCM)', exam_target: 'JEE Main', fees: 0 }));
twelfthChemistry.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Detailed study of ${t}`, subject: 'Chemistry', class_range: 'HSC (12th)', board: 'Science (PCB)', exam_target: 'NEET', fees: 0 }));

const twelfthBiology = ['Genetics', 'Human Physiology', 'Ecology'];
twelfthBiology.forEach((t, i) => seedData.push({ title: `Chapter ${i+1}: ${t}`, description: `Advanced biology: ${t}`, subject: 'Biology', class_range: 'HSC (12th)', board: 'Science (PCB)', exam_target: 'NEET', fees: 0 }));


async function seedDatabase() {
  console.log('Seeding specific Indian syllabus data...');
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
        process.stdout.write('.');
      } else {
        console.error(`\nFailed (Status ${response.status}): ${data.title}`);
      }
    } catch (err) {
      console.error(`\nFailed: ${data.title}`, err.message);
    }
  }
  console.log(`\n✅ Seed complete! Added ${successCount} specific syllabus topics.`);
}

seedDatabase();
