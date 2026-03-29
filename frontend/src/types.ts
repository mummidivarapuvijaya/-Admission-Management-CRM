export type Role = 'admin' | 'admission_officer' | 'management';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Institution {
  _id: string;
  name: string;
  code: string;
  jkCapTotal?: number | null;
  jkCapUsed?: number;
}

export interface Campus {
  _id: string;
  institutionId: string | Institution;
  name: string;
  code: string;
}

export interface Department {
  _id: string;
  campusId: string | Campus;
  name: string;
  code: string;
}

export interface Program {
  _id: string;
  departmentId: string | Department;
  name: string;
  branchCode: string;
  courseType: 'UG' | 'PG';
  entryType: 'Regular' | 'Lateral';
  admissionMode: 'Government' | 'Management';
}

export interface AcademicYear {
  _id: string;
  label: string;
  year: number;
  isActive?: boolean;
}

export interface QuotaSlot {
  quotaType: 'KCET' | 'COMEDK' | 'Management';
  seats: number;
  filled: number;
}

export interface ProgramIntake {
  _id: string;
  programId: Program;
  academicYearId: AcademicYear;
  totalIntake: number;
  quotas: QuotaSlot[];
  supernumeraryTotal?: number;
  supernumeraryFilled?: number;
}

export interface Applicant {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  addressLine: string;
  city?: string;
  state?: string;
  pincode?: string;
  fatherName: string;
  motherName?: string;
  category: string;
  entryType: string;
  quotaType: string;
  marksPercent: number;
  qualifyingExam: string;
  allotmentNumber?: string;
  isJkCategory?: boolean;
  programId: Program;
  academicYearId: AcademicYear;
  programIntakeId?: ProgramIntake | null;
  documentStatus: string;
  documentFileName?: string;
  feeStatus: string;
  admissionStatus: string;
  admissionNumber?: string | null;
  seatLockedQuota?: string | null;
  allocatedAt?: string | null;
  usesSupernumerary?: boolean;
}

export interface DashboardSummary {
  totalIntake: number;
  totalAdmitted: number;
  seatsFilledInQuotas: number;
  remainingSeatsOverall: number;
  supernumeraryRemaining: number;
  quotaTotals: Record<string, { seats: number; filled: number }>;
  pendingDocumentsCount: number;
  feePendingApplicants: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    programId?: { name?: string; branchCode?: string };
  }>;
  intakes: Array<{
    _id: string;
    program: Program;
    academicYear: AcademicYear;
    totalIntake: number;
    quotas: QuotaSlot[];
    remainingByQuota: Array<{ quotaType: string; remaining: number; filled: number; seats: number }>;
  }>;
}
