// Profile API types based on TECHNICAL_DOCUMENTATION.md Section 5.1.1

/**
 * Profile response schema as specified in API documentation
 */
export interface ProfileResponse {
  fullName: string;
  title: string;
  bio: string;
  location: string;
  availability: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
}

/**
 * Full Profile model from database
 */
export interface Profile {
  id: string;
  fullName: string;
  title: string;
  email: string;
  phone: string | null;
  location: string;
  bio: string;
  shortBio: string;
  yearsExperience: number;
  githubUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  availability: string;
  hourlyRate: number | null;
  resumeUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
