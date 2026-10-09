/**
 * GyanVerse Examination & Scholarship Hub Type Definitions
 * Shared across Next.js Web (`frontend/`) and React Native Mobile (`mobileapp/`).
 */

export type ExamCategory =
  | 'scholarship'
  | 'school_admission'
  | 'engineering'
  | 'medical'
  | 'defense'
  | 'research'
  | 'central_university'
  | 'law'
  | 'olympiad'
  | 'architecture'
  | 'agriculture';

export type TargetClassBracket = 'class_5_8' | 'class_9_10' | 'class_11_12' | 'all';

export type StreamType =
  | 'pcm'
  | 'pcb'
  | 'pcmb'
  | 'commerce'
  | 'arts_humanities'
  | 'general'
  | 'any';

export type StudentAspiration =
  | 'scholarship_financial_aid'
  | 'school_excellence'
  | 'engineering_technology'
  | 'medicine_healthcare'
  | 'defense_armed_forces'
  | 'research_pure_science'
  | 'central_universities'
  | 'law_legal_studies'
  | 'architecture_design'
  | 'agriculture_allied'
  | 'math_aptitude_olympiads';

export type FamilyIncomeBracket =
  | 'below_1_5L'
  | '1_5L_to_3_5L'
  | '3_5L_to_8L'
  | 'above_8L'
  | 'any';

export interface ExamBenefit {
  type:
    | 'monetary_stipend'
    | 'free_education'
    | 'premier_admission'
    | 'officer_commission'
    | 'cash_award'
    | 'fee_concession';
  title: string;
  description: string;
  monetaryAmountPerYear?: number;
  durationYears?: number;
  disbursementMethod?: string;
  perks: string[];
}

export interface ExamEligibility {
  classesAllowed: number[];
  minPercentage?: number;
  minPercentageReserved?: number;
  ageRange?: {
    minAge?: number;
    maxAge?: number;
    referenceDate?: string;
    notes?: string;
  };
  incomeCap?: number;
  streamRequired?: StreamType[];
  schoolTypeAllowed?: ('government' | 'government_aided' | 'private' | 'any')[];
  domicile?: string;
  genderAllowed?: 'all' | 'boys_only' | 'girls_only';
  summary: string;
}

export interface TimelineStep {
  stepNumber: number;
  title: string;
  description: string;
  timeWindow: string;
  actionType:
    | 'document_prep'
    | 'registration'
    | 'admit_card'
    | 'exam'
    | 'result'
    | 'counseling';
  documentChecklist?: string[];
  tips?: string[];
  officialUrl?: string;
}

export interface ExamImportantDates {
  notificationRelease: string;
  applicationStart: string;
  applicationDeadline: string;
  admitCardDate: string;
  examDate: string;
  resultDate: string;
  counselingDate?: string;
  isDeadlineApproaching?: boolean;
  isApplicationLive?: boolean;
  daysLeft?: number;
}

export interface SubjectWeightage {
  name: string;
  weightageMarks?: number;
  questionCount?: number;
  keyTopics: string[];
}

export interface ExamSyllabusPattern {
  mode: 'Online (CBT)' | 'Offline (OMR Pen & Paper)' | 'Hybrid' | 'School Level';
  durationMinutes: number;
  totalMarks: number;
  questionFormat: string;
  markingScheme: string;
  negativeMarking: boolean;
  negativeMarkingDetails?: string;
  subjects: SubjectWeightage[];
  languagesAvailable: string[];
}

export interface OfficialResource {
  title: string;
  url: string;
  type: 'official_portal' | 'bulletin_pdf' | 'sample_papers' | 'syllabus_pdf';
}

export interface ExamDetail {
  id: string;
  slug: string;
  title: string;
  shortName: string;
  conductingBody: string;
  category: ExamCategory;
  classBracket: TargetClassBracket;
  eligibleClasses: number[];
  badge: string;
  icon: string;
  overview: string;
  howItWorks: string;
  benefits: ExamBenefit;
  eligibility: ExamEligibility;
  timeline: TimelineStep[];
  importantDates: ExamImportantDates;
  syllabusPattern: ExamSyllabusPattern;
  officialLinks: OfficialResource[];
  recommendationTags: string[];
  targetAspirations: StudentAspiration[];
}

export interface StudentProfileForRecommendation {
  studentClass: number;
  stream?: StreamType;
  aspiration?: StudentAspiration;
  familyIncome?: FamilyIncomeBracket;
  state?: string;
  category?: 'general' | 'obc' | 'sc' | 'st' | 'ebc';
  schoolType?: 'government' | 'aided' | 'private';
}

export interface ExamRecommendation {
  exam: ExamDetail;
  matchScore: number; // 0 to 100
  matchReasons: string[];
  eligibilityStatus: 'eligible' | 'target_next_year' | 'ineligible';
  urgencyLevel: 'open_now' | 'closing_soon' | 'upcoming' | 'planning_ahead';
  keyHighlight: string;
}
