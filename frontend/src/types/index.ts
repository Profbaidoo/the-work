export type RoleName = 'super_admin' | 'headteacher' | 'teacher' | 'accountant' | 'parent' | 'student';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  role_name: RoleName;
  role_display_name?: string;
  permissions: string[];
  student_id?: number;
  teacher_id?: number;
  guardian_id?: number;
  children?: Student[];
}

export interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  other_names?: string;
  full_name: string;
  gender: 'Male' | 'Female';
  date_of_birth: string;
  admission_date: string;
  residential_address: string;
  previous_school?: string;
  medical_info?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'GRADUATED' | 'WITHDRAWN';
  current_class_id: number;
  current_stream_id?: number;
  class_name?: string;
  stream_name?: string;
  guardians?: GuardianLink[];
  enrollment_history?: Enrollment[];
}

export interface GuardianLink {
  id: number;
  guardian_id: number;
  full_name: string;
  phone: string;
  alt_phone?: string;
  email?: string;
  relationship_type: string;
  is_primary: boolean;
}

export interface Guardian {
  id: number;
  full_name: string;
  phone: string;
  alt_phone?: string;
  email?: string;
  occupation?: string;
  residential_address?: string;
}

export interface ClassLevel {
  id: number;
  name: string;
  code: string;
  level_group: 'NURSERY' | 'KG' | 'PRIMARY' | 'JHS';
  order_index: number;
  capacity: number;
  streams?: Stream[];
  subjects_count?: number;
}

export interface Stream {
  id: number;
  class_level_id: number;
  name: string;
  class_name?: string;
  class_teacher_id?: number;
  class_teacher_name?: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  category: 'CORE' | 'ELECTIVE';
  level_group: string;
  description?: string;
}

export interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  terms_count?: number;
}

export interface Term {
  id: number;
  academic_year_id: number;
  name: string;
  term_number: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  academic_year_name?: string;
}

export interface Enrollment {
  id: number;
  student_id: number;
  student_name?: string;
  admission_number?: string;
  academic_year_id: number;
  academic_year_name?: string;
  class_level_id: number;
  class_name?: string;
  stream_name?: string;
  status: string;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  class_name: string;
  stream_name?: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  reason?: string;
  parent_notified: boolean;
}

export interface RegisterEntry {
  student_id: number;
  admission_number: string;
  student_name: string;
  gender: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'NOT_RECORDED';
  reason?: string;
  parent_notified: boolean;
  attendance_id?: number;
}

export interface GradingScaleItem {
  id: number;
  grade: string;
  min_score: number;
  max_score: number;
  remark: string;
  grade_point: number;
  order_rank: number;
}

export interface Assessment {
  id: number;
  name: string;
  term_id: number;
  term_name?: string;
  class_level_id: number;
  class_name?: string;
  stream_id?: number;
  stream_name?: string;
  subject_id: number;
  subject_name?: string;
  assessment_type: 'CLASS_SCORE' | 'EXAM';
  max_marks: number;
  weight_percentage: number;
  is_published: boolean;
  is_locked: boolean;
  scores_count?: number;
}

export interface ReportCard {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  class_name: string;
  stream_name?: string;
  term_name: string;
  academic_year_name: string;
  total_marks: number;
  average_score: number;
  overall_grade?: string;
  class_position?: number;
  total_students_in_class?: number;
  attendance_present: number;
  attendance_total_days: number;
  class_teacher_remarks?: string;
  headteacher_remarks?: string;
  promotion_status?: string;
  is_approved: boolean;
  is_published: boolean;
  is_locked: boolean;
}

export interface FeeStructure {
  id: number;
  academic_year_name?: string;
  term_name?: string;
  class_name?: string;
  title: string;
  amount: number;
  is_mandatory: boolean;
  description?: string;
}

export interface Invoice {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  class_name: string;
  invoice_number: string;
  total_amount: number;
  discount_amount: number;
  paid_amount: number;
  balance_due: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID';
  due_date?: string;
}

export interface Payment {
  id: number;
  reference_number: string;
  invoice_number?: string;
  student_name: string;
  admission_number: string;
  amount: number;
  payment_method: string;
  external_transaction_id?: string;
  payment_date: string;
  status: string;
  notes?: string;
  cashier_name?: string;
}

export interface Expense {
  id: number;
  category: string;
  title: string;
  amount: number;
  expense_date: string;
  paid_to: string;
  receipt_reference?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  recorder_name?: string;
  approver_name?: string;
}

export interface TimetableSlot {
  id: number;
  class_name: string;
  stream_name: string;
  subject_name: string;
  teacher_name: string;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  room_number: string;
}

export interface SchoolCalendarEvent {
  id: number;
  title: string;
  event_type: string;
  start_date: string;
  end_date: string;
  description?: string;
  is_holiday: boolean;
  term_name?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  target_role: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  class_name?: string;
  publisher_name?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface LibraryBook {
  id: number;
  book_code: string;
  isbn?: string;
  title: string;
  author: string;
  category: string;
  total_copies: number;
  available_copies: number;
  shelf_location?: string;
}

export interface BookLoan {
  id: number;
  book_title: string;
  book_code: string;
  borrower_name: string;
  borrower_type: string;
  borrower_id: string;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'LOST';
  fine_amount: number;
}

export interface SchoolAsset {
  id: number;
  asset_code: string;
  name: string;
  category: string;
  quantity: number;
  purchase_date?: string;
  purchase_cost: number;
  current_condition: 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'DAMAGED' | 'DISPOSED';
  location: string;
  assigned_to?: string;
  maintenance_notes?: string;
}

export interface SchoolProfile {
  id: number;
  school_name: string;
  school_motto: string;
  school_code: string;
  address: string;
  phone: string;
  alt_phone?: string;
  email: string;
  website?: string;
  currency: string;
  currency_symbol: string;
  ca_weight_percentage: number;
  exam_weight_percentage: number;
  ranking_enabled: boolean;
  current_academic_year_name?: string;
  current_term_name?: string;
}
