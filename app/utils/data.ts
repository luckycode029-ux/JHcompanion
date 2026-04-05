import rawData from "~/data/subjects.json";
import type { SubjectsData, Branch, Subject } from "~/types";

const data = rawData as SubjectsData;

export function getBranches(): Branch[] {
  return data.branches;
}

export function getBranch(id: string): Branch | undefined {
  return data.branches.find((b) => b.id === id);
}

export function getSubjectsByBranchAndYear(branch: string, year: number): Subject[] {
  return data.subjects.filter((s) => s.branch === branch && s.year === year);
}

export function getSubject(id: string): Subject | undefined {
  return data.subjects.find((s) => s.id === id);
}

export function searchSubjects(query: string): Subject[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return data.subjects.filter(
    (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
  );
}

export function getAllSubjects(): Subject[] {
  return data.subjects;
}
