const User = require('./User');
const Enrollment = require('./Enrollment');
const Course = require('./Course');
const Enquiry = require('./Enquiry');
const Registration = require('./Registration');
const FeePayment = require('./FeePayment');
const Faculty = require('./Faculty');
const Batch = require('./Batch');
const BatchFaculty = require('./BatchFaculty');
const BatchProgress = require('./BatchProgress');
const Attendance = require('./Attendance');

// Import new models
const Branch = require('./Branch');
const Role = require('./Role');
const Permission = require('./Permission');
const LibraryBook = require('./LibraryBook');
const IssuedBook = require('./IssuedBook');
const Bus = require('./Bus');
const Route = require('./Route');
const Hostel = require('./Hostel');
const Room = require('./Room');
const Certificate = require('./Certificate');
const Salary = require('./Salary');
const Leave = require('./Leave');
const Complaint = require('./Complaint');
const Chat = require('./Chat');
const Announcement = require('./Announcement');
const Event = require('./Event');
const Expense = require('./Expense');
const TransportAssignment = require('./TransportAssignment');
const AuditLog = require('./AuditLog');
const ActivityLog = require('./ActivityLog');

// User & Enrollment
User.hasMany(Enrollment, { foreignKey: 'student_id' });
Enrollment.belongsTo(User, { foreignKey: 'student_id' });

// Course & Enrollment
Course.hasMany(Enrollment, { foreignKey: 'course_id' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id' });

// Batch & Enrollment
Batch.hasMany(Enrollment, { foreignKey: 'batch_id' });
Enrollment.belongsTo(Batch, { foreignKey: 'batch_id' });

// User & FeePayment
User.hasMany(FeePayment, { foreignKey: 'student_id' });
FeePayment.belongsTo(User, { foreignKey: 'student_id' });

// Batch & Faculty (Many-to-Many)
Batch.belongsToMany(Faculty, { through: BatchFaculty, foreignKey: 'batch_id', otherKey: 'faculty_id' });
Faculty.belongsToMany(Batch, { through: BatchFaculty, foreignKey: 'faculty_id', otherKey: 'batch_id' });

// BatchProgress & Batch & Course
Batch.hasMany(BatchProgress, { foreignKey: 'batch_id' });
BatchProgress.belongsTo(Batch, { foreignKey: 'batch_id' });

Course.hasMany(BatchProgress, { foreignKey: 'course_id' });
BatchProgress.belongsTo(Course, { foreignKey: 'course_id' });

// BatchProgress & Attendance
BatchProgress.hasMany(Attendance, { foreignKey: 'batch_progress_id', onDelete: 'CASCADE' });
Attendance.belongsTo(BatchProgress, { foreignKey: 'batch_progress_id' });


// New Associations
// Branch & User
Branch.hasMany(User, { foreignKey: 'branch_id' });
User.belongsTo(Branch, { foreignKey: 'branch_id' });

// User & Salary
User.hasMany(Salary, { foreignKey: 'user_id' });
Salary.belongsTo(User, { foreignKey: 'user_id' });

// User & Leave
User.hasMany(Leave, { foreignKey: 'user_id' });
Leave.belongsTo(User, { foreignKey: 'user_id' });

// User & Complaint
User.hasMany(Complaint, { foreignKey: 'user_id' });
Complaint.belongsTo(User, { foreignKey: 'user_id' });

// User & Certificate
User.hasMany(Certificate, { foreignKey: 'student_id' });
Certificate.belongsTo(User, { foreignKey: 'student_id' });

// Chat relations
User.hasMany(Chat, { foreignKey: 'sender_id', as: 'SentMessages' });
User.hasMany(Chat, { foreignKey: 'receiver_id', as: 'ReceivedMessages' });
Chat.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });
Chat.belongsTo(User, { foreignKey: 'receiver_id', as: 'Receiver' });

// LibraryBook & IssuedBook
LibraryBook.hasMany(IssuedBook, { foreignKey: 'book_id' });
IssuedBook.belongsTo(LibraryBook, { foreignKey: 'book_id' });

// Student & IssuedBook
User.hasMany(IssuedBook, { foreignKey: 'student_id' });
IssuedBook.belongsTo(User, { foreignKey: 'student_id' });

// Route & TransportAssignment
Route.hasMany(TransportAssignment, { foreignKey: 'route_id' });
TransportAssignment.belongsTo(Route, { foreignKey: 'route_id' });

// Bus & TransportAssignment
Bus.hasMany(TransportAssignment, { foreignKey: 'bus_id' });
TransportAssignment.belongsTo(Bus, { foreignKey: 'bus_id' });

// Student & TransportAssignment
User.hasMany(TransportAssignment, { foreignKey: 'student_id' });
TransportAssignment.belongsTo(User, { foreignKey: 'student_id' });

// Hostel & Room
Hostel.hasMany(Room, { foreignKey: 'hostel_id' });
Room.belongsTo(Hostel, { foreignKey: 'hostel_id' });

const Visitor = require('./Visitor');
const Appointment = require('./Appointment');
const Setting = require('./Setting');

module.exports = { 
    User, Enrollment, Course, Enquiry, Registration, FeePayment, Faculty, Batch, BatchFaculty, BatchProgress, Attendance,
    Branch, Role, Permission, LibraryBook, IssuedBook, Bus, Route, Hostel, Room, Certificate, Salary, Leave, Complaint, Chat, 
    Announcement, Event, Expense, TransportAssignment, AuditLog, ActivityLog, Visitor, Appointment, Setting
};

