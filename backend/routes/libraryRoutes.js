const express = require('express');
const router = express.Router();
const LibraryBook = require('../models/LibraryBook');
const IssuedBook = require('../models/IssuedBook');
const User = require('../models/User');
const { sequelize } = require('../config/db');

// @route   GET /api/library/books
// @desc    List all books
router.get('/books', async (req, res) => {
    try {
        const books = await LibraryBook.findAll();
        res.json(books);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/library/books
// @desc    Add book to inventory
router.post('/books', async (req, res) => {
    try {
        const { title, author, isbn, category, total_copies } = req.body;
        const newBook = await LibraryBook.create({
            title,
            author,
            isbn,
            category,
            total_copies,
            available_copies: total_copies
        });
        res.status(201).json(newBook);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/library/books/:id
// @desc    Update book details
router.put('/books/:id', async (req, res) => {
    try {
        const book = await LibraryBook.findByPk(req.params.id);
        if (!book) return res.status(404).json({ msg: 'Book not found' });
        
        const currentTotal = book.total_copies;
        const newTotal = parseInt(req.body.total_copies);
        let updatedAvailable = book.available_copies;
        
        if (!isNaN(newTotal)) {
            const difference = newTotal - currentTotal;
            updatedAvailable = Math.max(0, book.available_copies + difference);
        }

        await book.update({
            ...req.body,
            available_copies: updatedAvailable
        });
        res.json(book);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/library/books/:id
// @desc    Remove book from inventory
router.delete('/books/:id', async (req, res) => {
    try {
        const book = await LibraryBook.findByPk(req.params.id);
        if (!book) return res.status(404).json({ msg: 'Book not found' });
        await book.destroy();
        res.json({ msg: 'Book removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/library/borrows
// @desc    Get book renting logs
router.get('/borrows', async (req, res) => {
    try {
        const records = await sequelize.query(`
            SELECT ib.*, b.title as book_title, b.author as book_author, u.name as student_name, u.username as student_username
            FROM issued_books ib
            LEFT JOIN library_books b ON ib.book_id = b.id
            LEFT JOIN users u ON ib.student_id = u.id
            ORDER BY ib.issue_date DESC
        `, { type: sequelize.QueryTypes.SELECT });
        res.json(records);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/library/issue
// @desc    Issue a book to student
router.post('/issue', async (req, res) => {
    try {
        const { book_id, student_id, due_days } = req.body;
        
        const book = await LibraryBook.findByPk(book_id);
        if (!book) return res.status(404).json({ msg: 'Book not found' });
        if (book.available_copies <= 0) return res.status(400).json({ msg: 'No copies available' });

        const student = await User.findOne({ where: { id: student_id, role: 'student' } });
        if (!student) return res.status(404).json({ msg: 'Student not found with this ID' });

        // Calculate return date
        const issueDate = new Date();
        const days = parseInt(due_days) || 7;
        const returnDeadline = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        const newRecord = await IssuedBook.create({
            book_id,
            student_id,
            issue_date: issueDate.toISOString().split('T')[0],
            status: 'issued',
            fine_amount: 0.00
        });

        // Decrement available copies
        await book.update({ available_copies: book.available_copies - 1 });

        res.status(201).json(newRecord);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/library/return/:issueId
// @desc    Return an issued book & pay fines
router.put('/return/:issueId', async (req, res) => {
    try {
        const record = await IssuedBook.findByPk(req.params.issueId);
        if (!record) return res.status(404).json({ msg: 'Renting record not found' });
        if (record.status === 'returned') return res.status(400).json({ msg: 'Book already returned' });

        const book = await LibraryBook.findByPk(record.book_id);
        
        // Calculate late fine (e.g. ₹5 per day past 7 days from issue date)
        const issueTime = new Date(record.issue_date).getTime();
        const returnTime = new Date().getTime();
        const diffDays = Math.ceil((returnTime - issueTime) / (1000 * 60 * 60 * 24));
        
        let fine = 0.00;
        if (diffDays > 7) {
            fine = (diffDays - 7) * 5.00;
        }

        await record.update({
            status: 'returned',
            return_date: new Date().toISOString().split('T')[0],
            fine_amount: fine
        });

        if (book) {
            await book.update({ available_copies: book.available_copies + 1 });
        }

        res.json({ msg: 'Book returned successfully!', record });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
