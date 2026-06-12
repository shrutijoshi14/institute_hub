const seedData = [
  // 10th State Board - Maths
  { title: 'Chapter 1: Linear Equations in Two Variables', description: 'Simultaneous equations, determinant method, Cramer’s rule.', subject: 'Maths', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: Quadratic Equations', description: 'Roots, factorization, formula method, nature of roots.', subject: 'Maths', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 3: Arithmetic Progression', description: 'Sequence, nth term, sum of first n terms.', subject: 'Maths', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 4: Financial Planning', description: 'GST, shares, mutual funds, brokerage.', subject: 'Maths', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 5: Probability', description: 'Sample space, random experiment, probability of an event.', subject: 'Maths', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  
  // 10th State Board - Science
  { title: 'Chapter 1: Gravitation', description: 'Kepler’s laws, Newton’s universal law, free fall.', subject: 'Science', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 2: Periodic Classification of Elements', description: 'Dobereiner, Newlands, Mendeleev, Modern Periodic Table.', subject: 'Science', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 3: Chemical Reactions and Equations', description: 'Types of reactions, balancing equations, oxidation-reduction.', subject: 'Science', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 4: Effects of Electric Current', description: 'Heating effect, magnetic effect, electric motor, generator.', subject: 'Science', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },
  { title: 'Chapter 5: Heat', description: 'Latent heat, anomalous behavior of water, specific heat capacity.', subject: 'Science', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 0 },

  // 12th State Board - Accountancy
  { title: 'Chapter 1: Introduction to Partnership', description: 'Partnership Final Accounts.', subject: 'Accountancy', class_range: 'HSC (12th)', board: 'State Board', exam_target: 'CA Foundation', fees: 0 },
  { title: 'Chapter 2: Accounts of Not for Profit Concerns', description: 'Receipts and Payments, Income and Expenditure.', subject: 'Accountancy', class_range: 'HSC (12th)', board: 'State Board', exam_target: 'CA Foundation', fees: 0 },
  { title: 'Chapter 3: Reconstitution of Partnership (Admission)', description: 'Admission of a partner, new profit sharing ratio.', subject: 'Accountancy', class_range: 'HSC (12th)', board: 'State Board', exam_target: 'CA Foundation', fees: 0 },
  { title: 'Chapter 4: Dissolution of Partnership Firm', description: 'Settlement of accounts, realization account.', subject: 'Accountancy', class_range: 'HSC (12th)', board: 'State Board', exam_target: 'CA Foundation', fees: 0 },
  { title: 'Chapter 5: Company Accounts - Issue of Shares', description: 'Pro-rata allotment, forfeiture, reissue.', subject: 'Accountancy', class_range: 'HSC (12th)', board: 'State Board', exam_target: 'CA Foundation', fees: 0 },
];

async function seedDatabase() {
  console.log('Starting seed...');
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
        console.log(`Added: ${data.title}`);
      } else {
        console.error(`Failed to add (Status ${response.status}): ${data.title}`);
      }
    } catch (err) {
      console.error(`Failed to add: ${data.title}`, err.message);
    }
  }
  console.log('✅ Seed complete!');
}

seedDatabase();
