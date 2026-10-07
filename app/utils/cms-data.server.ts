import fallbackData from "~/data/subjects.json";
import type { Subject, SubjectsData, Unit } from "~/types";
import type { CmsResource, CmsSubject, ResourceCategory } from "~/types/cms";
import { createSupabaseAnonClient, getSupabasePublicEnv } from "~/utils/supabase.server";

type CmsSubjectWithResources = CmsSubject & {
  resources?: CmsResource[];
};

const fallback = fallbackData as SubjectsData;

function hasSupabaseConfig() {
  const { url, anonKey } = getSupabasePublicEnv();
  return Boolean(url && anonKey);
}

function emptyUnits(): Unit[] {
  return Array.from({ length: 5 }, (_, index) => ({
    number: index + 1,
    title: `Unit ${index + 1}`,
    playlist: "",
    notes: "",
    pyqs: "",
  }));
}

function findFallbackSubject(cmsSubject: CmsSubject) {
  return fallback.subjects.find(
    (subject) =>
      subject.branch === cmsSubject.branch &&
      subject.year === cmsSubject.year &&
      subject.semester === cmsSubject.semester &&
      subject.code === cmsSubject.subject_code
  );
}

function subjectKey(subject: Pick<Subject, "branch" | "year" | "semester" | "code">) {
  return `${subject.branch}:${subject.year}:${subject.semester}:${subject.code}`;
}

function latest(resources: CmsResource[] | undefined, predicate: (resource: CmsResource) => boolean) {
  return (resources ?? []).find(predicate)?.resource_url ?? "";
}

function mapCategoryToUnit(unit: Unit, category: ResourceCategory, url: string) {
  if (category === "unit_notes" || category === "premium_notes") {
    unit.notes = url;
    unit.unitNotes = url;
  }

  if (category === "important_questions" || category === "sessional_pyq") {
    unit.pyqs = url;
  }

  if (category === "playlist") {
    unit.playlist = url;
  }
}

export function mapCmsSubject(cmsSubject: CmsSubjectWithResources): Subject {
  const base = findFallbackSubject(cmsSubject);
  const resources = [...(cmsSubject.resources ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const units = (base?.units ?? emptyUnits()).map((unit) => ({ ...unit }));

  for (const resource of resources) {
    if (!resource.unit_number) continue;
    const unit = units.find((item) => item.number === resource.unit_number);
    if (!unit) continue;
    mapCategoryToUnit(unit, resource.category as ResourceCategory, resource.resource_url);
  }

  return {
    id: cmsSubject.id,
    name: cmsSubject.subject_name,
    code: cmsSubject.subject_code,
    branch: cmsSubject.branch,
    year: cmsSubject.year,
    semester: cmsSubject.semester,
    syllabus: latest(resources, (resource) => resource.category === "syllabus") || base?.syllabus || "",
    syllabusPdf: latest(resources, (resource) => resource.category === "syllabus") || base?.syllabusPdf,
    sessionalPyqs:
      latest(resources, (resource) => resource.category === "sessional_pyq" && !resource.unit_number) ||
      base?.sessionalPyqs,
    semesterPyqs:
      latest(resources, (resource) => resource.category === "semester_pyq" && !resource.unit_number) ||
      base?.semesterPyqs,
    unitNotes: latest(resources, (resource) => resource.category === "unit_notes" && !resource.unit_number) || base?.unitNotes,
    syllabusData: base?.syllabusData,
    units,
    pyqs: {
      sessional:
        latest(resources, (resource) => resource.category === "sessional_pyq" && !resource.unit_number) ||
        base?.pyqs.sessional ||
        "",
      semester:
        latest(resources, (resource) => resource.category === "semester_pyq" && !resource.unit_number) ||
        base?.pyqs.semester ||
        "",
    },
  };
}

export async function getCmsSubjects(): Promise<Subject[]> {
  if (!hasSupabaseConfig()) return fallback.subjects;

  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase
      .from("subjects")
      .select("*, resources(*)")
      .order("subject_name");

    if (error || !data?.length) return fallback.subjects;

    const cmsSubjects = (data as CmsSubjectWithResources[]).map(mapCmsSubject);
    const cmsKeys = new Set(cmsSubjects.map(subjectKey));
    const untouchedFallbackSubjects = fallback.subjects.filter((subject) => !cmsKeys.has(subjectKey(subject)));

    return [...cmsSubjects, ...untouchedFallbackSubjects];
  } catch {
    return fallback.subjects;
  }
}

export async function getCmsSubject(id: string): Promise<Subject | undefined> {
  const subjects = await getCmsSubjects();
  const directMatch = subjects.find((subject) => subject.id === id);
  if (directMatch) return directMatch;

  const fallbackSubject = fallback.subjects.find((subject) => subject.id === id);
  if (!fallbackSubject) return undefined;

  return subjects.find((subject) => subjectKey(subject) === subjectKey(fallbackSubject)) ?? fallbackSubject;
}

export async function getCmsSubjectsByBranchAndYear(branch: string, year: number): Promise<Subject[]> {
  const subjects = await getCmsSubjects();
  return subjects.filter((subject) => subject.branch === branch && subject.year === year);
}

export function getFallbackBranches() {
  return fallback.branches;
}
