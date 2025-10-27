import { describe, test, expect } from "bun:test";
import {
  sanitizeString,
  isValidISODate,
  ProjectNameSchema,
  TaskTitleSchema,
  TaskTitlesSchema,
  TagsSchema,
  DueDateSchema,
  PrioritySchema,
  StatusSchema,
} from "../src/validation";

describe("Validation Utilities", () => {
  describe("sanitizeString", () => {
    test("trims whitespace and normalizes spaces", () => {
      expect(sanitizeString("  hello   world  ")).toBe("hello world");
      expect(sanitizeString("hello\t\tworld")).toBe("hello world");
      expect(sanitizeString("hello\n\nworld")).toBe("hello world");
    });

    test("handles empty strings", () => {
      expect(sanitizeString("")).toBe("");
      expect(sanitizeString("   ")).toBe("");
    });
  });

  describe("isValidISODate", () => {
    test("validates correct ISO dates", () => {
      expect(isValidISODate("2025-12-01T10:00:00Z")).toBe(true);
      expect(isValidISODate("2025-12-01T10:00:00.000Z")).toBe(true);
      expect(isValidISODate("2025-12-01T10:00:00+05:00")).toBe(true);
    });

    test("rejects invalid dates", () => {
      expect(isValidISODate("2025-13-01T10:00:00Z")).toBe(false);
      expect(isValidISODate("not-a-date")).toBe(false);
      expect(isValidISODate("2025-12-01-invalid")).toBe(false);
    });
  });
});

describe("Zod Schemas", () => {
  describe("ProjectNameSchema", () => {
    test("accepts valid project names", () => {
      expect(ProjectNameSchema.parse("my-project")).toBe("my-project");
      expect(ProjectNameSchema.parse("My Project 123")).toBe("My Project 123");
      expect(ProjectNameSchema.parse("project_name")).toBe("project_name");
    });

    test("rejects invalid project names", () => {
      expect(() => ProjectNameSchema.parse("")).toThrow(
        "Project name cannot be empty"
      );
      expect(() => ProjectNameSchema.parse("a".repeat(101))).toThrow(
        "Project name cannot exceed 100 characters"
      );
      expect(() => ProjectNameSchema.parse("project@name")).toThrow(
        "Project name can only contain letters, numbers, spaces, hyphens, and underscores"
      );
    });

    test("sanitizes input", () => {
      expect(ProjectNameSchema.parse("  my project  ")).toBe("my project");
    });
  });

  describe("TaskTitleSchema", () => {
    test("accepts valid task titles", () => {
      expect(TaskTitleSchema.parse("Fix bug")).toBe("Fix bug");
      expect(TaskTitleSchema.parse("Implement feature")).toBe(
        "Implement feature"
      );
    });

    test("rejects invalid task titles", () => {
      expect(() => TaskTitleSchema.parse("")).toThrow(
        "Task title cannot be empty"
      );
      expect(() => TaskTitleSchema.parse("a".repeat(201))).toThrow(
        "Task title cannot exceed 200 characters"
      );
    });

    test("sanitizes input", () => {
      expect(TaskTitleSchema.parse("  fix   bug  ")).toBe("fix bug");
    });
  });

  describe("TaskTitlesSchema", () => {
    test("parses comma-separated titles", () => {
      expect(TaskTitlesSchema.parse("Task 1, Task 2, Task 3")).toEqual([
        "Task 1",
        "Task 2",
        "Task 3",
      ]);
    });

    test("filters out empty titles", () => {
      expect(TaskTitlesSchema.parse("Task 1, , Task 2,   ")).toEqual([
        "Task 1",
        "Task 2",
      ]);
    });

    test("sanitizes titles", () => {
      expect(TaskTitlesSchema.parse("  Task 1  ,  Task 2  ")).toEqual([
        "Task 1",
        "Task 2",
      ]);
    });

    test("rejects empty input", () => {
      expect(() => TaskTitlesSchema.parse("")).toThrow(
        "Task titles cannot be empty"
      );
      expect(() => TaskTitlesSchema.parse("   ,   ,   ")).toThrow(
        "No valid task titles provided after sanitization"
      );
    });
  });

  describe("TagsSchema", () => {
    test("parses comma-separated tags", () => {
      expect(TagsSchema.parse("urgent, backend, feature")).toEqual([
        "urgent",
        "backend",
        "feature",
      ]);
    });

    test("converts to lowercase and removes duplicates", () => {
      expect(TagsSchema.parse("URGENT, urgent, Backend, backend")).toEqual([
        "urgent",
        "backend",
      ]);
    });

    test("filters out long tags", () => {
      const longTag = "a".repeat(51);
      expect(TagsSchema.parse(`valid, ${longTag}`)).toEqual(["valid"]);
    });

    test("returns empty array for no tags", () => {
      expect(TagsSchema.parse(undefined)).toEqual([]);
      expect(TagsSchema.parse("")).toEqual([]);
      expect(TagsSchema.parse("   ,   ")).toEqual([]);
    });
  });

  describe("DueDateSchema", () => {
    test("accepts valid ISO dates", () => {
      expect(DueDateSchema.parse("2025-12-01T10:00:00Z")).toBe(
        "2025-12-01T10:00:00Z"
      );
    });

    test("rejects invalid dates", () => {
      expect(() => DueDateSchema.parse("invalid-date")).toThrow(
        "Due date must be a valid ISO 8601 date string"
      );
    });

    test("accepts undefined", () => {
      expect(DueDateSchema.parse(undefined)).toBeUndefined();
    });
  });

  describe("PrioritySchema", () => {
    test("accepts valid priorities", () => {
      expect(PrioritySchema.parse("low")).toBe("low");
      expect(PrioritySchema.parse("medium")).toBe("medium");
      expect(PrioritySchema.parse("high")).toBe("high");
    });

    test("rejects invalid priorities", () => {
      expect(() => PrioritySchema.parse("urgent")).toThrow(
        "Priority must be 'low', 'medium', or 'high'"
      );
    });
  });

  describe("StatusSchema", () => {
    test("accepts valid statuses", () => {
      expect(StatusSchema.parse("todo")).toBe("todo");
      expect(StatusSchema.parse("pending")).toBe("pending");
      expect(StatusSchema.parse("completed")).toBe("completed");
      expect(StatusSchema.parse("archived")).toBe("archived");
    });

    test("rejects invalid statuses", () => {
      expect(() => StatusSchema.parse("in-progress")).toThrow(
        "Status must be 'todo', 'pending', 'completed', or 'archived'"
      );
    });
  });
});
