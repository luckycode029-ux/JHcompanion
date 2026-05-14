export type CmsSubject = {
  id: string;
  subject_name: string;
  subject_code: string;
  branch: string;
  year: number;
  semester: number;
};

export type CmsResource = {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  category: string;
  unit_number: number | null;
  resource_url: string;
  resource_size: number | null;
  resource_type: string;
  exam_year: number | null;
  exam_type: string | null;
  is_premium: boolean;
  created_at: string;
  subjects?: CmsSubject | null;
};

export const RESOURCE_CATEGORIES = [
  "syllabus",
  "unit_notes",
  "sessional_pyq",
  "semester_pyq",
  "important_questions",
  "playlist",
  "premium_notes",
  "premium_questions",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];
