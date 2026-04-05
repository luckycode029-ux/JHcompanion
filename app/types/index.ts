export interface Branch {
  id: string;
  name: string;
  fullName: string;
  icon: string;
  color: string;
}

export interface Unit {
  number: number;
  title: string;
  topics?: string[];
  hours?: number;
  playlist: string;
  notes: string;
  pyqs: string;
}

export interface CourseOutcome {
  id: string;
  description: string;
}

export interface CoPoMapping {
  co: string;
  po: Record<string, number | null>;
  pso: Record<string, number | null>;
}

export interface SyllabusData {
  courseCode: string;
  courseTitle: string;
  lectureHours: string;
  credits: number;
  courseOutcomes: CourseOutcome[];
  coPoMapping?: CoPoMapping[];
  referenceBooks?: string[];
  teachingStrategies?: string[];
  assessmentMethods?: string[];
  internalMarks?: number;
  semesterMarks?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  branch: string;
  year: number;
  semester: number;
  syllabus: string;
  syllabusData?: SyllabusData;
  units: Unit[];
  pyqs: {
    sessional: string;
    semester: string;
  };
}

export interface SubjectsData {
  branches: Branch[];
  subjects: Subject[];
}
