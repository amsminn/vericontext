export type ErrorReason =
  | "path_escape"
  | "invalid_path"
  | "file_missing"
  | "not_a_file"
  | "range_invalid"
  | "hash_mismatch"
  | "invalid_utf8"
  | "binary_file"
  | "symlink_skipped"
  | "exists"
  | "missing"
  | "not_file"
  | "not_dir"
  | "invalid_input";

export type StructureKind = "exists" | "exists-file" | "exists-dir" | "missing";

export type VerifyKind = "citation" | "structure";

export interface VerifyResultItem {
  claim: string;
  kind: VerifyKind;
  ok: boolean;
  reason?: ErrorReason;
}

export interface VerifyWorkspaceResult {
  ok: boolean;
  total: number;
  ok_count: number;
  fail_count: number;
  results: VerifyResultItem[];
}

export interface JsonError {
  ok: false;
  reason: ErrorReason;
  details?: Record<string, unknown>;
}

export interface CiteSuccess {
  ok: true;
  citation: string;
  sha256_full: string;
}

export interface ClaimSuccess {
  ok: true;
  claim: string;
  kind: StructureKind;
  normalized_path: string;
}
