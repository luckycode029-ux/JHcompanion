import { X, Target, Table, BookOpen, BookMarked, ClipboardList, GraduationCap } from "lucide-react";
import type { Subject } from "~/types";
import styles from "./syllabus-modal.module.css";

interface SyllabusModalProps {
  subject: Subject;
  onClose: () => void;
}

const PO_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const PSO_KEYS = ["O1", "O2", "O3"];

export function SyllabusModal({ subject, onClose }: SyllabusModalProps) {
  const data = subject.syllabusData;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.drawer}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitle}>Course Syllabus</div>
            <div className={styles.headerSub}>
              {data?.courseCode ?? subject.code} — {data?.courseTitle ?? subject.name}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {data ? (
            <>
              {/* Meta */}
              <div className={styles.metaStrip}>
                {data.lectureHours && <span className={styles.metaChip}>{data.lectureHours}</span>}
                {data.credits && <span className={styles.metaChip}>{data.credits} Credits</span>}
                <span className={styles.metaChip}>Semester {subject.semester}</span>
              </div>

              {/* Course Outcomes */}
              {data.courseOutcomes?.length > 0 && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <Target size={16} className={styles.sectionIcon} />
                    Course Outcomes (COs)
                  </h3>
                  <div className={styles.coList}>
                    {data.courseOutcomes.map((co) => (
                      <div key={co.id} className={styles.coItem}>
                        <span className={styles.coId}>{co.id}</span>
                        <p className={styles.coDesc}>{co.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* CO-PO Mapping */}
              {data.coPoMapping && data.coPoMapping.length > 0 && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <Table size={16} className={styles.sectionIcon} />
                    CO-PO / PSO Mapping
                  </h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>CO</th>
                          {PO_KEYS.map((k) => <th key={k}>PO{k}</th>)}
                          {PSO_KEYS.map((k) => <th key={k}>PS{k}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {data.coPoMapping.map((row) => (
                          <tr key={row.co}>
                            <td>{row.co}</td>
                            {PO_KEYS.map((k) => {
                              const val = row.po[k];
                              return (
                                <td key={k}>
                                  {val != null
                                    ? <span className={styles.tableVal}>{val}</span>
                                    : <span className={styles.tableDash}>--</span>}
                                </td>
                              );
                            })}
                            {PSO_KEYS.map((k) => {
                              const val = row.pso[k];
                              return (
                                <td key={k}>
                                  {val != null
                                    ? <span className={styles.tableVal}>{val}</span>
                                    : <span className={styles.tableDash}>--</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Detailed Syllabus (units) */}
              {subject.units.length > 0 && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <BookOpen size={16} className={styles.sectionIcon} />
                    Detailed Syllabus
                  </h3>
                  <div className={styles.unitList}>
                    {subject.units.map((unit) => (
                      <div key={unit.number} className={styles.unitBlock}>
                        <div className={styles.unitBlockHeader}>
                          <div className={styles.unitBlockTitle}>
                            <span className={styles.unitBadge}>Unit {unit.number}</span>
                            <span className={styles.unitName}>{unit.title}</span>
                          </div>
                          {unit.hours && <span className={styles.unitHours}>{unit.hours} hrs</span>}
                        </div>
                        {unit.topics && unit.topics.length > 0 && (
                          <div className={styles.unitTopics}>
                            <div className={styles.topicsTags}>
                              {unit.topics.map((t, i) => (
                                <span key={i} className={styles.topicTag}>{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Reference Books */}
              {data.referenceBooks && data.referenceBooks.length > 0 && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <BookMarked size={16} className={styles.sectionIcon} />
                    Reference Books
                  </h3>
                  <div className={styles.refList}>
                    {data.referenceBooks.map((book, i) => (
                      <div key={i} className={styles.refItem}>
                        <span className={styles.refNum}>{i + 1}</span>
                        <span>{book}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Assessment */}
              {(data.internalMarks || data.semesterMarks) && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <ClipboardList size={16} className={styles.sectionIcon} />
                    Assessment
                  </h3>
                  <div className={styles.assessGrid}>
                    {data.internalMarks != null && (
                      <div className={styles.assessCard}>
                        <div className={styles.assessMarks}>{data.internalMarks}</div>
                        <div className={styles.assessLabel}>Internal Assessment Marks</div>
                      </div>
                    )}
                    {data.semesterMarks != null && (
                      <div className={styles.assessCard}>
                        <div className={styles.assessMarks}>{data.semesterMarks}</div>
                        <div className={styles.assessLabel}>Semester Exam Marks</div>
                      </div>
                    )}
                  </div>
                  {data.assessmentMethods && data.assessmentMethods.length > 0 && (
                    <div className={styles.simpleList}>
                      {data.assessmentMethods.map((m, i) => (
                        <div key={i} className={styles.simpleItem}>
                          <span className={styles.bullet} />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Teaching Strategies */}
              {data.teachingStrategies && data.teachingStrategies.length > 0 && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <GraduationCap size={16} className={styles.sectionIcon} />
                    Teaching-Learning Strategies
                  </h3>
                  <div className={styles.simpleList}>
                    {data.teachingStrategies.map((s, i) => (
                      <div key={i} className={styles.simpleItem}>
                        <span className={styles.bullet} />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            /* Fallback: no structured data */
            <div className={styles.section}>
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                Detailed syllabus data is not available for this subject yet.
                {subject.syllabus && (
                  <> You can <a href={subject.syllabus} target="_blank" rel="noreferrer"
                    style={{ color: "var(--color-primary)" }}>download the PDF</a> instead.</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
