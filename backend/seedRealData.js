const seedData = [
  // 5th Standard CBSE
  { title: 'Chapter 1: The Fish Tale', description: 'Shapes and Angles, Large Numbers.', subject: 'Maths', class_range: '5th', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: Shapes and Angles', description: 'Understanding basic geometry and angles.', subject: 'Maths', class_range: '5th', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 1: Super Senses', description: 'Senses in animals, sleeping and waking.', subject: 'Science', class_range: '5th', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: A Snake Charmer’s Story', description: 'Livelihood of snake charmers, types of snakes.', subject: 'Science', class_range: '5th', board: 'CBSE', exam_target: 'None', fees: 0 },
  
  // 8th Standard State Board
  { title: 'Chapter 1: Rational and Irrational Numbers', description: 'Introduction to numbers and properties.', subject: 'Maths', class_range: '8th', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: Parallel Lines and Transversals', description: 'Geometry of parallel lines.', subject: 'Maths', class_range: '8th', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 3: Indices and Cube Root', description: 'Rules of indices, finding cube roots.', subject: 'Maths', class_range: '8th', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 1: Living World and Classification', description: 'Microbes, Five Kingdom system.', subject: 'Science', class_range: '8th', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: Health and Diseases', description: 'Infectious and non-infectious diseases.', subject: 'Science', class_range: '8th', board: 'State Board', exam_target: 'None', fees: 0 },
  
  // 9th Standard CBSE
  { title: 'Chapter 1: Number Systems', description: 'Irrational numbers, real numbers and their expansions.', subject: 'Maths', class_range: '9th', board: 'CBSE', exam_target: 'Olympiads', fees: 0 },
  { title: 'Chapter 2: Polynomials', description: 'Polynomials in one variable, zeroes of a polynomial.', subject: 'Maths', class_range: '9th', board: 'CBSE', exam_target: 'Olympiads', fees: 0 },
  { title: 'Chapter 1: Matter in Our Surroundings', description: 'Physical nature of matter, characteristics of particles.', subject: 'Science', class_range: '9th', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: Is Matter Around Us Pure', description: 'Mixtures, solutions, separating components of a mixture.', subject: 'Science', class_range: '9th', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 3: Atoms and Molecules', description: 'Laws of chemical combination, atomic mass.', subject: 'Science', class_range: '9th', board: 'CBSE', exam_target: 'None', fees: 0 },

  // 10th Standard SSC (State Board)
  { title: 'Chapter 1: Linear Equations in Two Variables', description: 'Simultaneous equations, determinant method, Cramer’s rule.', subject: 'Maths', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: Quadratic Equations', description: 'Roots, factorization, formula method, nature of roots.', subject: 'Maths', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 3: Arithmetic Progression', description: 'Sequence, nth term, sum of first n terms.', subject: 'Maths', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 1: Gravitation', description: 'Kepler’s laws, Newton’s universal law, free fall.', subject: 'Science', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: Periodic Classification of Elements', description: 'Dobereiner, Newlands, Mendeleev, Modern Periodic Table.', subject: 'Science', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 1: Historiography Development', description: 'Tradition of Indian Historiography.', subject: 'History', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },

  // 11th Standard CBSE - Science Stream
  { title: 'Chapter 1: Sets', description: 'Sets and their representations, subsets, operations on sets.', subject: 'Maths', class_range: '11th', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: Relations and Functions', description: 'Cartesian product, domain and range.', subject: 'Maths', class_range: '11th', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 1: Physical World', description: 'Scope and excitement of physics, laws of nature.', subject: 'Physics', class_range: '11th', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: Units and Measurements', description: 'SI units, significant figures, dimensions.', subject: 'Physics', class_range: '11th', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 3: Motion in a Straight Line', description: 'Frame of reference, uniform and non-uniform motion.', subject: 'Physics', class_range: '11th', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 1: Some Basic Concepts of Chemistry', description: 'Nature of matter, mole concept.', subject: 'Chemistry', class_range: '11th', board: 'CBSE', exam_target: 'None', fees: 0 },

  // 12th Standard HSC (State Board) - Commerce Stream
  { title: 'Chapter 1: Introduction to Partnership', description: 'Partnership Final Accounts.', subject: 'Accounts', class_range: 'HSC (12th)', board: 'State Board', exam_target: 'CA Foundation', fees: 0 },
  { title: 'Chapter 2: Accounts of Not for Profit Concerns', description: 'Receipts and Payments, Income and Expenditure.', subject: 'Accounts', class_range: 'HSC (12th)', board: 'State Board', exam_target: 'CA Foundation', fees: 0 },
  { title: 'Chapter 3: Reconstitution of Partnership (Admission)', description: 'Admission of a partner, new profit sharing ratio.', subject: 'Accounts', class_range: 'HSC (12th)', board: 'State Board', exam_target: 'CA Foundation', fees: 0 },
  { title: 'Chapter 1: Introduction to Micro and Macro Economics', description: 'Features and scope of micro economics.', subject: 'Economics', class_range: 'HSC (12th)', board: 'State Board', exam_target: 'CA Foundation', fees: 0 },
  { title: 'Chapter 2: Utility Analysis', description: 'Features of utility, types, law of diminishing marginal utility.', subject: 'Economics', class_range: 'HSC (12th)', board: 'State Board', exam_target: 'CA Foundation', fees: 0 },
  { title: 'Chapter 3A: Demand Analysis', description: 'Concept of demand, determinants, law of demand.', subject: 'Economics', class_range: 'HSC (12th)', board: 'State Board', exam_target: 'CA Foundation', fees: 0 },
  
  // 12th Standard CBSE - Science Stream
  { title: 'Chapter 1: Electric Charges and Fields', description: 'Coulomb’s law, electric field, Gauss’s law.', subject: 'Physics', class_range: 'HSC (12th)', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: Electrostatic Potential and Capacitance', description: 'Electric potential, capacitors.', subject: 'Physics', class_range: 'HSC (12th)', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 3: Current Electricity', description: 'Ohm’s law, Kirchhoff’s laws.', subject: 'Physics', class_range: 'HSC (12th)', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 1: Solutions', description: 'Types of solutions, Raoult’s law, colligative properties.', subject: 'Chemistry', class_range: 'HSC (12th)', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: Electrochemistry', description: 'Nernst equation, conductance, Kohlrausch’s law.', subject: 'Chemistry', class_range: 'HSC (12th)', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 1: Reproduction in Organisms', description: 'Asexual and sexual reproduction.', subject: 'Biology', class_range: 'HSC (12th)', board: 'CBSE', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: Sexual Reproduction in Flowering Plants', description: 'Flower structure, development of gametophytes.', subject: 'Biology', class_range: 'HSC (12th)', board: 'CBSE', exam_target: 'None', fees: 0 }
];

async function seedDatabase() {
  console.log('Starting massive seed of realistic syllabus data...');
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
        console.error(`\nFailed to add (Status ${response.status}): ${data.title}`);
      }
    } catch (err) {
      console.error(`\nFailed to add: ${data.title}`, err.message);
    }
  }
  console.log(`\n✅ Seed complete! Added ${successCount} topics.`);
}

seedDatabase();
