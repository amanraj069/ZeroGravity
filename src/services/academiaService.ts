import { apiCallWithAuth, API_ENDPOINTS } from "@/config/api";

export interface Course {
  courseId: string;
  name: string;
  grade: string;
  credits: number;
  additionalInfo: string;
  createdAt: string;
  updatedAt: string;
}

export interface Semester {
  semesterId: string;
  name: string;
  order: number;
  isCurrent: boolean;
  courses: Course[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSemesterData {
  name: string;
}

export interface UpdateSemesterData {
  name: string;
}

export interface CreateCourseData {
  name: string;
  grade?: string;
  credits?: number;
  additionalInfo?: string;
}

export interface UpdateCourseData {
  name?: string;
  grade?: string;
  credits?: number;
  additionalInfo?: string;
}

// Grade points mapping
export const GRADE_POINTS: Record<string, number> = {
  O: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  P: 5,
  F: 0,
};

export const GRADE_OPTIONS = [
  { value: "O", label: "O (10/10)" },
  { value: "A", label: "A (9/10)" },
  { value: "B", label: "B (8/10)" },
  { value: "C", label: "C (7/10)" },
  { value: "D", label: "D (6/10)" },
  { value: "P", label: "P (5/10)" },
  { value: "F", label: "F (0/10)" },
];

// Calculate SGPA for a semester
export function calculateSGPA(courses: Course[]): number | null {
  const coursesWithGrades = courses.filter(
    (course) => course.grade && course.grade.trim() !== ""
  );

  if (coursesWithGrades.length === 0) {
    return null;
  }

  let totalPoints = 0;
  let totalCredits = 0;

  for (const course of coursesWithGrades) {
    const gradePoints = GRADE_POINTS[course.grade.toUpperCase()];
    if (gradePoints !== undefined) {
      const credits = course.credits || 4;
      totalPoints += gradePoints * credits;
      totalCredits += credits;
    }
  }

  if (totalCredits === 0) {
    return null;
  }

  return totalPoints / totalCredits;
}

// Check if a semester is complete (all courses have grades)
export function isSemesterComplete(courses: Course[]): boolean {
  if (courses.length === 0) {
    return false;
  }
  return courses.every(
    (course) => course.grade && course.grade.trim() !== ""
  );
}

// Calculate CGPA across all semesters
// Only calculates if at least one complete semester exists
// Returns both CGPA and the last complete semester name
export function calculateCGPA(semesters: Semester[]): { cgpa: number | null; lastSemesterName: string | null } {
  // Find all complete semesters (all courses have grades)
  const completeSemesters = semesters.filter((semester) =>
    isSemesterComplete(semester.courses)
  );

  // If no complete semester exists, return null
  if (completeSemesters.length === 0) {
    return { cgpa: null, lastSemesterName: null };
  }

  // Calculate CGPA across all complete semesters
  let totalPoints = 0;
  let totalCredits = 0;

  for (const semester of completeSemesters) {
    for (const course of semester.courses) {
      const gradePoints = GRADE_POINTS[course.grade.toUpperCase()];
      if (gradePoints !== undefined) {
        const credits = course.credits || 4;
        totalPoints += gradePoints * credits;
        totalCredits += credits;
      }
    }
  }

  if (totalCredits === 0) {
    return { cgpa: null, lastSemesterName: null };
  }

  // Get the last complete semester name (last in the order)
  const lastCompleteSemester = completeSemesters[completeSemesters.length - 1];
  const lastSemesterName = lastCompleteSemester ? lastCompleteSemester.name : null;

  return {
    cgpa: totalPoints / totalCredits,
    lastSemesterName: lastSemesterName,
  };
}

class AcademiaService {
  // Get all semesters for the current user
  // Data is decrypted on the backend before being returned
  async getSemesters(): Promise<Semester[]> {
    const response = await apiCallWithAuth(API_ENDPOINTS.ACADEMIA.LIST);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Get a specific semester by ID
  // Data is decrypted on the backend before being returned
  async getSemester(semesterId: string): Promise<Semester> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.ACADEMIA.GET_SEMESTER(semesterId)
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Create a new semester
  // Data is encrypted on the backend before being stored
  async createSemester(semesterData: CreateSemesterData): Promise<Semester> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.ACADEMIA.CREATE_SEMESTER,
      {
        method: "POST",
        body: JSON.stringify(semesterData),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Update a semester
  // Data is encrypted on the backend before being stored
  async updateSemester(
    semesterId: string,
    semesterData: UpdateSemesterData
  ): Promise<Semester> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.ACADEMIA.UPDATE_SEMESTER(semesterId),
      {
        method: "PUT",
        body: JSON.stringify(semesterData),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Delete a semester
  async deleteSemester(semesterId: string): Promise<void> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.ACADEMIA.DELETE_SEMESTER(semesterId),
      {
        method: "DELETE",
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }
  }

  // Reorder semesters
  async reorderSemesters(semesterIds: string[]): Promise<Semester[]> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.ACADEMIA.REORDER_SEMESTERS,
      {
        method: "POST",
        body: JSON.stringify({ semesterIds }),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Set a semester as current
  async setCurrentSemester(semesterId: string): Promise<Semester> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.ACADEMIA.SET_CURRENT_SEMESTER(semesterId),
      {
        method: "PUT",
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Add a course to a semester
  // Data is encrypted on the backend before being stored
  async addCourse(
    semesterId: string,
    courseData: CreateCourseData
  ): Promise<Course> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.ACADEMIA.ADD_COURSE(semesterId),
      {
        method: "POST",
        body: JSON.stringify(courseData),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Update a course
  // Data is encrypted on the backend before being stored
  async updateCourse(
    semesterId: string,
    courseId: string,
    courseData: UpdateCourseData
  ): Promise<Course> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.ACADEMIA.UPDATE_COURSE(semesterId, courseId),
      {
        method: "PUT",
        body: JSON.stringify(courseData),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Delete a course
  async deleteCourse(semesterId: string, courseId: string): Promise<void> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.ACADEMIA.DELETE_COURSE(semesterId, courseId),
      {
        method: "DELETE",
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }
  }
}

export const academiaService = new AcademiaService();
