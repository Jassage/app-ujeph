import { create } from 'zustand';
import { 
  Student, UE, Grade, Retake, Guardian, User, Faculty, Schedule, Attendance, Payment, 
  Book, BookLoan, Transcript, Message, Event, Announcement, Scholarship, ScholarshipApplication,
  Room, RoomReservation, Certificate, Analytics, Enrollment
} from '../types/academic';

interface AcademicStore {
  students: Student[];
  enrollments: Enrollment[];
  ues: UE[];
  grades: Grade[];
  retakes: Retake[];
  guardians: Guardian[];
  users: User[];
  faculties: Faculty[];
  schedules: Schedule[];
  attendances: Attendance[];
  payments: Payment[];
  books: Book[];
  bookLoans: BookLoan[];
  transcripts: Transcript[];
  
  messages: Message[];
  events: Event[];
  announcements: Announcement[];
  scholarships: Scholarship[];
  scholarshipApplications: ScholarshipApplication[];
  rooms: Room[];
  roomReservations: RoomReservation[];
  certificates: Certificate[];
  analytics: Analytics[];
  
  addStudent: (student: Student) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudent: (id: string) => Student | undefined;
  
  addEnrollment: (enrollment: Enrollment) => void;
  updateEnrollment: (id: string, enrollment: Partial<Enrollment>) => void;
  deleteEnrollment: (id: string) => void;
  getStudentEnrollments: (studentId: string) => Enrollment[];
  
  addUE: (ue: UE) => void;
  updateUE: (id: string, ue: Partial<UE>) => void;
  deleteUE: (id: string) => void;
  getUEsByLevel: (faculty: string, level: string, semester: string) => UE[];
  
  addGrade: (grade: Grade) => void;
  updateGrade: (id: string, grade: Partial<Grade>) => void;
  getStudentGrades: (studentId: string) => Grade[];
  updateGradeStatus: (gradeId: string, status: Grade['status']) => void;
  
  addRetake: (retake: Retake) => void;
  getStudentRetakes: (studentId: string) => Retake[];
  updateRetakeStatus: (retakeId: string, status: Retake['status'], retakeGrade?: number) => void;
  
  addGuardian: (guardian: Guardian) => void;
  updateGuardian: (id: string, guardian: Partial<Guardian>) => void;
  deleteGuardian: (id: string) => void;
  getStudentGuardians: (studentId: string) => Guardian[];
  
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUsers: () => User[];
  
  addFaculty: (faculty: Faculty) => void;
  updateFaculty: (id: string, faculty: Partial<Faculty>) => void;
  deleteFaculty: (id: string) => void;
  getFaculties: () => Faculty[];

  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: string, schedule: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  getSchedulesByLevel: (faculty: string, level: string) => Schedule[];

  addAttendance: (attendance: Attendance) => void;
  updateAttendance: (id: string, attendance: Partial<Attendance>) => void;
  getStudentAttendance: (studentId: string) => Attendance[];

  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  getStudentPayments: (studentId: string) => Payment[];

  addBook: (book: Book) => void;
  updateBook: (id: string, book: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  getBooks: () => Book[];

  addBookLoan: (loan: BookLoan) => void;
  updateBookLoan: (id: string, loan: Partial<BookLoan>) => void;
  getStudentLoans: (studentId: string) => BookLoan[];

  generateTranscript: (studentId: string, semester: string, academicYear: string) => Transcript;
  getStudentTranscripts: (studentId: string) => Transcript[];

  addMessage: (message: Message) => void;
  markMessageAsRead: (messageId: string) => void;
  getUnreadMessages: (userId: string) => Message[];
  getUserMessages: (userId: string) => Message[];

  addEvent: (event: Event) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  getUpcomingEvents: () => Event[];

  addAnnouncement: (announcement: Announcement) => void;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  getActiveAnnouncements: () => Announcement[];

  addScholarship: (scholarship: Scholarship) => void;
  updateScholarship: (id: string, scholarship: Partial<Scholarship>) => void;
  addScholarshipApplication: (application: ScholarshipApplication) => void;
  updateScholarshipApplication: (id: string, application: Partial<ScholarshipApplication>) => void;

  addRoom: (room: Room) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;
  addRoomReservation: (reservation: RoomReservation) => void;
  getAvailableRooms: (startTime: string, endTime: string) => Room[];

  generateCertificate: (studentId: string, type: Certificate['type'], title: string) => Certificate;
  getCertificates: (studentId: string) => Certificate[];

  generateAnalytics: (type: Analytics['type'], parameters: Record<string, any>) => Analytics;
  getAnalytics: (type?: Analytics['type']) => Analytics[];
  
  getStudentCurrentEnrollment: (studentId: string) => Enrollment | undefined;
}

export const useAcademicStore = create<AcademicStore>((set, get) => ({
  students: [],
  enrollments: [],
  ues: [],
  grades: [],
  retakes: [],
  guardians: [],
  users: [],
  faculties: [],
  schedules: [],
  attendances: [],
  payments: [],
  books: [],
  bookLoans: [],
  transcripts: [],
  
  messages: [],
  events: [],
  announcements: [],
  scholarships: [],
  scholarshipApplications: [],
  rooms: [],
  roomReservations: [],
  certificates: [],
  analytics: [],
  
  addStudent: (student) => 
    set((state) => ({ students: [...state.students, student] })),
  
  updateStudent: (id, updates) =>
    set((state) => ({
      students: state.students.map(s => s.id === id ? { ...s, ...updates } : s)
    })),
    
  deleteStudent: (id) =>
    set((state) => ({
      students: state.students.filter(s => s.id !== id),
      enrollments: state.enrollments.filter(e => e.studentId !== id),
      grades: state.grades.filter(g => g.studentId !== id),
      retakes: state.retakes.filter(r => r.studentId !== id),
      guardians: state.guardians.filter(g => g.studentId !== id),
    })),
  
  getStudent: (id) => get().students.find(s => s.id === id),
  
  addEnrollment: (enrollment) =>
    set((state) => ({ enrollments: [...state.enrollments, enrollment] })),
    
  updateEnrollment: (id, updates) =>
    set((state) => ({
      enrollments: state.enrollments.map(e => e.id === id ? { ...e, ...updates } : e)
    })),
    
  deleteEnrollment: (id) =>
    set((state) => ({
      enrollments: state.enrollments.filter(e => e.id !== id)
    })),
    
  getStudentEnrollments: (studentId) =>
    get().enrollments.filter(e => e.studentId === studentId),
  
  addUE: (ue) =>
    set((state) => ({ ues: [...state.ues, ue] })),
    
  updateUE: (id, updates) =>
    set((state) => ({
      ues: state.ues.map(ue => ue.id === id ? { ...ue, ...updates } : ue)
    })),
    
  deleteUE: (id) =>
    set((state) => ({
      ues: state.ues.filter(ue => ue.id !== id),
      grades: state.grades.filter(g => g.ueId !== id),
      retakes: state.retakes.filter(r => r.ueId !== id),
    })),
  
  getUEsByLevel: (faculty, level, semester) =>
    get().ues.filter(ue => 
      ue.faculty === faculty && ue.level === level && ue.semester === semester
    ),
  
  addGrade: (grade) =>
    set((state) => ({ grades: [...state.grades, grade] })),
    
  updateGrade: (id, updates) =>
    set((state) => ({
      grades: state.grades.map(g => g.id === id ? { ...g, ...updates } : g)
    })),
  
  getStudentGrades: (studentId) =>
    get().grades.filter(g => g.studentId === studentId),
  
  updateGradeStatus: (gradeId, status) =>
    set((state) => ({
      grades: state.grades.map(g => 
        g.id === gradeId ? { ...g, status } : g
      )
    })),
  
  addRetake: (retake) =>
    set((state) => ({ retakes: [...state.retakes, retake] })),
  
  getStudentRetakes: (studentId) =>
    get().retakes.filter(r => r.studentId === studentId),
    
  updateRetakeStatus: (retakeId, status, retakeGrade) =>
    set((state) => ({
      retakes: state.retakes.map(r => 
        r.id === retakeId ? { ...r, status, retakeGrade } : r
      )
    })),
    
  addGuardian: (guardian) =>
    set((state) => ({ guardians: [...state.guardians, guardian] })),
    
  updateGuardian: (id, updates) =>
    set((state) => ({
      guardians: state.guardians.map(g => g.id === id ? { ...g, ...updates } : g)
    })),
    
  deleteGuardian: (id) =>
    set((state) => ({
      guardians: state.guardians.filter(g => g.id !== id)
    })),
    
  getStudentGuardians: (studentId) =>
    get().guardians.filter(g => g.studentId === studentId),
    
  addUser: (user) =>
    set((state) => ({ users: [...state.users, user] })),
    
  updateUser: (id, updates) =>
    set((state) => ({
      users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
    })),
    
  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter(u => u.id !== id)
    })),
    
  getUsers: () => get().users,
    
  addFaculty: (faculty) =>
    set((state) => ({ faculties: [...state.faculties, faculty] })),
    
  updateFaculty: (id, updates) =>
    set((state) => ({
      faculties: state.faculties.map(f => f.id === id ? { ...f, ...updates } : f)
    })),
    
  deleteFaculty: (id) =>
    set((state) => ({
      faculties: state.faculties.filter(f => f.id !== id)
    })),
    
  getFaculties: () => get().faculties,

  addSchedule: (schedule) =>
    set((state) => ({ schedules: [...state.schedules, schedule] })),
    
  updateSchedule: (id, updates) =>
    set((state) => ({
      schedules: state.schedules.map(s => s.id === id ? { ...s, ...updates } : s)
    })),
    
  deleteSchedule: (id) =>
    set((state) => ({
      schedules: state.schedules.filter(s => s.id !== id)
    })),
    
  getSchedulesByLevel: (faculty, level) =>
    get().schedules.filter(s => s.faculty === faculty && s.level === level),

  addAttendance: (attendance) =>
    set((state) => ({ attendances: [...state.attendances, attendance] })),
    
  updateAttendance: (id, updates) =>
    set((state) => ({
      attendances: state.attendances.map(a => a.id === id ? { ...a, ...updates } : a)
    })),
    
  getStudentAttendance: (studentId) =>
    get().attendances.filter(a => a.studentId === studentId),

  addPayment: (payment) =>
    set((state) => ({ payments: [...state.payments, payment] })),
    
  updatePayment: (id, updates) =>
    set((state) => ({
      payments: state.payments.map(p => p.id === id ? { ...p, ...updates } : p)
    })),
    
  getStudentPayments: (studentId) =>
    get().payments.filter(p => p.studentId === studentId),

  addBook: (book) =>
    set((state) => ({ books: [...state.books, book] })),
    
  updateBook: (id, updates) =>
    set((state) => ({
      books: state.books.map(b => b.id === id ? { ...b, ...updates } : b)
    })),
    
  deleteBook: (id) =>
    set((state) => ({
      books: state.books.filter(b => b.id !== id)
    })),
    
  getBooks: () => get().books,

  addBookLoan: (loan) =>
    set((state) => ({ bookLoans: [...state.bookLoans, loan] })),
    
  updateBookLoan: (id, updates) =>
    set((state) => ({
      bookLoans: state.bookLoans.map(l => l.id === id ? { ...l, ...updates } : l)
    })),
    
  getStudentLoans: (studentId) =>
    get().bookLoans.filter(l => l.studentId === studentId),

  generateTranscript: (studentId, semester, academicYear) => {
    const student = get().getStudent(studentId);
    const grades = get().grades.filter(g => 
      g.studentId === studentId && 
      g.semester === semester && 
      g.academicYear === academicYear
    );
    
    const totalCredits = grades.reduce((sum, grade) => {
      const ue = get().ues.find(u => u.id === grade.ueId);
      return sum + (ue?.credits || 0);
    }, 0);
    
    const creditsEarned = grades.reduce((sum, grade) => {
      const ue = get().ues.find(u => u.id === grade.ueId);
      return sum + (grade.status === 'Validé' ? (ue?.credits || 0) : 0);
    }, 0);
    
    const gpa = grades.length > 0 
      ? grades.reduce((sum, grade) => sum + grade.grade, 0) / grades.length 
      : 0;
    
    const transcript: Transcript = {
      id: `transcript_${Date.now()}`,
      studentId,
      semester,
      academicYear,
      grades,
      gpa: Math.round(gpa * 100) / 100,
      totalCredits,
      creditsEarned,
      generatedDate: new Date().toISOString()
    };
    
    set((state) => ({ transcripts: [...state.transcripts, transcript] }));
    return transcript;
  },
  
  getStudentTranscripts: (studentId) =>
    get().transcripts.filter(t => t.studentId === studentId),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
    
  markMessageAsRead: (messageId) =>
    set((state) => ({
      messages: state.messages.map(m => 
        m.id === messageId ? { ...m, isRead: true } : m
      )
    })),
    
  getUnreadMessages: (userId) =>
    get().messages.filter(m => m.receiverId === userId && !m.isRead),
    
  getUserMessages: (userId) =>
    get().messages.filter(m => m.senderId === userId || m.receiverId === userId),
  
  addEvent: (event) =>
    set((state) => ({ events: [...state.events, event] })),
    
  updateEvent: (id, updates) =>
    set((state) => ({
      events: state.events.map(e => e.id === id ? { ...e, ...updates } : e)
    })),
    
  deleteEvent: (id) =>
    set((state) => ({
      events: state.events.filter(e => e.id !== id)
    })),
    
  getUpcomingEvents: () => {
    const now = new Date().toISOString();
    return get().events.filter(e => e.startDate > now && e.status === 'Programmé');
  },
  
  addAnnouncement: (announcement) =>
    set((state) => ({ announcements: [...state.announcements, announcement] })),
    
  updateAnnouncement: (id, updates) =>
    set((state) => ({
      announcements: state.announcements.map(a => a.id === id ? { ...a, ...updates } : a)
    })),
    
  deleteAnnouncement: (id) =>
    set((state) => ({
      announcements: state.announcements.filter(a => a.id !== id)
    })),
    
  getActiveAnnouncements: () => {
    const now = new Date().toISOString();
    return get().announcements.filter(a => 
      a.isActive && (!a.expiryDate || a.expiryDate > now)
    );
  },
  
  addScholarship: (scholarship) =>
    set((state) => ({ scholarships: [...state.scholarships, scholarship] })),
    
  updateScholarship: (id, updates) =>
    set((state) => ({
      scholarships: state.scholarships.map(s => s.id === id ? { ...s, ...updates } : s)
    })),
    
  addScholarshipApplication: (application) =>
    set((state) => ({ scholarshipApplications: [...state.scholarshipApplications, application] })),
    
  updateScholarshipApplication: (id, updates) =>
    set((state) => ({
      scholarshipApplications: state.scholarshipApplications.map(a => 
        a.id === id ? { ...a, ...updates } : a
      )
    })),
  
  addRoom: (room) =>
    set((state) => ({ rooms: [...state.rooms, room] })),
    
  updateRoom: (id, updates) =>
    set((state) => ({
      rooms: state.rooms.map(r => r.id === id ? { ...r, ...updates } : r)
    })),
    
  addRoomReservation: (reservation) =>
    set((state) => ({ roomReservations: [...state.roomReservations, reservation] })),
    
  getAvailableRooms: (startTime, endTime) => {
    const reservations = get().roomReservations.filter(r =>
      r.status === 'Confirmée' &&
      ((r.startTime <= startTime && r.endTime > startTime) ||
       (r.startTime < endTime && r.endTime >= endTime) ||
       (r.startTime >= startTime && r.endTime <= endTime))
    );
    
    const reservedRoomIds = reservations.map(r => r.roomId);
    return get().rooms.filter(r => 
      r.status === 'Disponible' && !reservedRoomIds.includes(r.id)
    );
  },
  
  generateCertificate: (studentId, type, title) => {
    const certificate: Certificate = {
      id: `cert_${Date.now()}`,
      studentId,
      type,
      title,
      issueDate: new Date().toISOString(),
      signedBy: 'Direction Académique',
      verificationCode: `UJEPH-${Date.now().toString(36).toUpperCase()}`,
      status: 'Émis'
    };
    
    set((state) => ({ certificates: [...state.certificates, certificate] }));
    return certificate;
  },
  
  getCertificates: (studentId) =>
    get().certificates.filter(c => c.studentId === studentId),
  
  generateAnalytics: (type, parameters) => {
    const analytics: Analytics = {
      id: `analytics_${Date.now()}`,
      type,
      data: {},
      generatedDate: new Date().toISOString(),
      parameters
    };
    
    switch (type) {
      case 'Performance':
        const grades = get().grades;
        analytics.data = {
          averageGrade: grades.reduce((sum, g) => sum + g.grade, 0) / grades.length,
          totalStudents: get().students.length,
          passRate: (grades.filter(g => g.status === 'Validé').length / grades.length) * 100
        };
        break;
      case 'Présence':
        const attendances = get().attendances;
        const presentCount = attendances.filter(a => a.status === 'Présent').length;
        analytics.data = {
          attendanceRate: (presentCount / attendances.length) * 100,
          totalSessions: attendances.length,
          absenteeism: ((attendances.length - presentCount) / attendances.length) * 100
        };
        break;
      case 'Paiements':
        const payments = get().payments;
        const paidAmount = payments.filter(p => p.status === 'Payé').reduce((sum, p) => sum + p.amount, 0);
        analytics.data = {
          totalRevenue: paidAmount,
          pendingAmount: payments.filter(p => p.status === 'En attente').reduce((sum, p) => sum + p.amount, 0),
          collectionRate: (payments.filter(p => p.status === 'Payé').length / payments.length) * 100
        };
        break;
    }
    
    set((state) => ({ analytics: [...state.analytics, analytics] }));
    return analytics;
  },
  
  getAnalytics: (type) => {
    if (type) {
      return get().analytics.filter(a => a.type === type);
    }
    return get().analytics;
  },
  
  getStudentCurrentEnrollment: (studentId) => {
    const enrollments = get().enrollments.filter(e => 
      e.studentId === studentId && e.status === 'Active'
    );
    return enrollments.sort((a, b) => 
      new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime()
    )[0];
  },
}));
