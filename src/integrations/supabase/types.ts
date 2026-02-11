// Simplified Supabase types to avoid TypeScript deep instantiation errors.
// The original auto-generated `Database` type can be extremely large
// and cause `Type instantiation is excessively deep and possibly infinite`.
// This file provides a small, permissive alternative for development.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// NOTE: Using `any` here intentionally avoids recursive/huge types from the
// Supabase auto-generated schema which can blow up TypeScript's type system.
// If you need strict types, replace this file with a generated one and
// consider narrowing usages only where necessary.
export type Database = any;

// Optional: export a few narrow helper interfaces if some files import them
// (kept minimal to avoid reintroducing deep types).
export interface SimpleRecord {
  id?: string;
  created_at?: string;
  created_by?: string | null;
  owner_id?: string | null;
}
