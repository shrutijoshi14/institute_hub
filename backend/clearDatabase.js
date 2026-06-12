async function clearAll() {
  try {
    const res = await fetch('http://localhost:5000/api/courses');
    const courses = await res.json();
    console.log(`Found ${courses.length} courses to delete...`);
    
    let count = 0;
    for (const c of courses) {
      const delRes = await fetch(`http://localhost:5000/api/courses/${c.id}`, { method: 'DELETE' });
      if (delRes.ok) count++;
    }
    console.log(`Successfully deleted ${count} courses.`);
  } catch (err) {
    console.error('Error clearing database:', err);
  }
}
clearAll();
