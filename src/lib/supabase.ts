import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zkrdgsmpgficjyqgqtki.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcmRnc21wZ2ZpY2p5cWdxdGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzE3MjksImV4cCI6MjEwMDIwNzcyOX0.PO83Huqi7N89HTH13lkvRYLk84w0rNT8ni7vZUUTJTU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Database Types ──────────────────────────────────────────────────────────

export type ContentStatus = "draft" | "published" | "archived";
export type BlogLanguage = "en" | "ar" | "de" | "fr" | "es";

export interface Profile {
  id: string;
  full_name: string;
  headline: string;
  bio: string;
  avatar_url: string | null;
  resume_url: string | null;
  email: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProject {
  id: string;
  title: string;
  description: string;
  long_description: string | null;
  tech_stack: string[];
  repo_url: string | null;
  demo_url: string | null;
  image_url: string | null;
  architecture_image_url: string | null;
  status: ContentStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbBlogPost {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  tags: string[];
  status: ContentStatus;
  published_at: string | null;
  read_time_minutes: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbBlogTranslation {
  id: string;
  post_id: string;
  language: BlogLanguage;
  title: string;
  content: string;
  excerpt: string;
  created_at: string;
  updated_at: string;
}

export interface DbCertificate {
  id: string;
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date: string | null;
  credential_url: string | null;
  image_url: string | null;
  status: ContentStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbExperience {
  id: string;
  company: string;
  position: string;
  description: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  logo_url: string | null;
  status: ContentStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbSkill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  icon_url: string | null;
  status: ContentStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
