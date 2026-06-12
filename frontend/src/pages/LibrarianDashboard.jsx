import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Bookmark, User, Plus, Check, ArrowUpRight, ShieldAlert, Library } from 'lucide-react';

const LibrarianDashboard = () => {
  const [books, setBooks] = useState([]);
  const [borrows, setBorrows] = useState([]);
  
  // Forms
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: 'General', total_copies: 1 });
  const [rentForm, setRentForm] = useState({ book_id: '', student_id: '', due_days: 7 });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      const bookRes = await axios.get('http://localhost:5000/api/library/books');
      const borrowRes = await axios.get('http://localhost:5000/api/library/borrows');
      
      setBooks(bookRes.data);
      setBorrows(borrowRes.data);

      if (bookRes.data.length > 0 && !rentForm.book_id) {
        setRentForm(prev => ({ ...prev, book_id: bookRes.data[0].id }));
      }
    } catch (err) {
      console.error('Library Fetch Error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBook = async (e) => {
    e.preventDefault();
    if (!bookForm.title || !bookForm.author) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/library/books', bookForm);
      setBookForm({ title: '', author: '', isbn: '', category: 'General', total_copies: 1 });
      setMsg({ text: 'Book cataloged successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to catalog book.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Are you sure you want to remove this book from the catalog?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/library/books/${id}`);
      setMsg({ text: 'Book catalog entry deleted!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to delete book catalog entry.', type: 'danger' });
    }
  };

  const handleRentBook = async (e) => {
    e.preventDefault();
    if (!rentForm.book_id || !rentForm.student_id) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/library/issue', rentForm);
      setRentForm(prev => ({ ...prev, student_id: '' }));
      setMsg({ text: 'Book rented / issued successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: err.response?.data?.msg || 'Failed to issue book.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async (id) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/library/return/${id}`);
      setMsg({ text: res.data.msg || 'Book marked returned successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to return book.', type: 'danger' });
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <h1 className="page-title">Library Management Desk</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Catalog new titles, issue/rent books to students, and manage return fines.</p>

      {msg.text && (
        <div style={{
          padding: '1rem',
          backgroundColor: msg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: msg.type === 'success' ? '#047857' : '#B91C1C',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: `1px solid ${msg.type === 'success' ? '#A7F3D0' : '#FCA5A5'}`,
          fontSize: '0.9rem'
        }}>
          {msg.text}
        </div>
      )}

      <div className="grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
        {/* Catalog New Book */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Library size={22} color="var(--primary)" /> Catalog New Book</h2>
          <form onSubmit={handleCreateBook} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Book Title</label>
              <input
                type="text"
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="e.g. Introduction to Algorithms"
                required
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Author(s)</label>
              <input
                type="text"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="e.g. Cormen, Leiserson"
                required
              />
            </div>
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>ISBN Number</label>
                <input
                  type="text"
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. 978-0262033848"
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Total Copies</label>
                <input
                  type="number"
                  value={bookForm.total_copies}
                  onChange={(e) => setBookForm({ ...bookForm, total_copies: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  min="1"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Category / Genre</label>
              <select
                value={bookForm.category}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'white' }}
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Commerce">Commerce</option>
                <option value="Literature">Literature</option>
                <option value="General">General Reference</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '3rem', borderRadius: '12px', justifyContent: 'center' }} disabled={loading}>
              <Plus size={18} /> Add Book to Catalog
            </button>
          </form>
        </div>

        {/* Rent out Book */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bookmark size={22} color="var(--secondary)" /> Rent / Issue Book</h2>
          <form onSubmit={handleRentBook} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Select Book</label>
              <select
                value={rentForm.book_id}
                onChange={(e) => setRentForm({ ...rentForm, book_id: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'white' }}
                required
              >
                {books.map(b => (
                  <option key={b.id} value={b.id} disabled={b.available_copies <= 0}>
                    {b.title} by {b.author} ({b.available_copies} of {b.total_copies} available)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Student DB ID (e.g. 4)</label>
              <input
                type="number"
                value={rentForm.student_id}
                onChange={(e) => setRentForm({ ...rentForm, student_id: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="Enter Student Numeric ID (e.g. 4 for Nathaniel)"
                required
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Due Period (Days)</label>
              <input
                type="number"
                value={rentForm.due_days}
                onChange={(e) => setRentForm({ ...rentForm, due_days: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                min="1"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '3rem', borderRadius: '12px', justifyContent: 'center', backgroundColor: 'var(--secondary)', borderColor: 'var(--secondary)' }} disabled={loading}>
              <ArrowUpRight size={18} /> Rent Book out
            </button>
          </form>
        </div>
      </div>

      {/* Book Catalog Directory */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>Book Directory Catalog</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Searchable list of all titles in library archives.</p>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>ISBN</th>
                <th>Category</th>
                <th>Total Copies</th>
                <th>Available Copies</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map(b => (
                <tr key={b.id}>
                  <td><strong>{b.title}</strong></td>
                  <td>{b.author}</td>
                  <td><code>{b.isbn || 'N/A'}</code></td>
                  <td><span style={{ fontSize: '0.75rem', backgroundColor: '#F3F4F6', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{b.category}</span></td>
                  <td>{b.total_copies}</td>
                  <td style={{ color: b.available_copies > 0 ? 'var(--secondary)' : '#DC2626', fontWeight: 600 }}>{b.available_copies}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn" style={{ padding: '0.4rem', minWidth: 'auto', backgroundColor: '#FEF2F2', color: '#DC2626' }} onClick={() => handleDeleteBook(b.id)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Borrowing Registry Logs */}
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookOpen size={20} color="var(--primary)" /> Active Borrow & Renting Registry</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Listing currently rented books and overdue status logs.</p>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Student</th>
                <th>Rented Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Fine Balance</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {borrows.map(log => (
                <tr key={log.id}>
                  <td><strong>{log.book_title}</strong><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.book_author}</div></td>
                  <td><strong>{log.student_name}</strong> ({log.student_username})</td>
                  <td>{new Date(log.issue_date).toLocaleDateString('en-GB')}</td>
                  <td>{log.return_date ? new Date(log.return_date).toLocaleDateString('en-GB') : 'Not Returned Yet'}</td>
                  <td>
                    <span style={{
                      color: log.status === 'returned' ? 'var(--secondary)' : log.status === 'overdue' ? '#DC2626' : '#F59E0B',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ color: log.fine_amount > 0 ? '#DC2626' : 'inherit', fontWeight: 600 }}>₹{parseFloat(log.fine_amount).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {log.status === 'issued' && (
                      <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleReturnBook(log.id)}>
                        Mark Returned
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {borrows.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>No active borrowings currently on record.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LibrarianDashboard;
