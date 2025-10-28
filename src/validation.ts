import { z } from "zod";

// Custom validation functions
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, " ");
};

export const isValidISODate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && !isNaN(Date.parse(dateString));
};

export const isFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
};

// Enhanced Zod schemas with better error messages
export const ProjectNameSchema = z
  .string()
  .min(1, "Project name cannot be empty")
  .max(100, "Project name cannot exceed 100 characters")
  .regex(
    /^[a-zA-Z0-9\s\-_]+$/,
    "Project name can only contain letters, numbers, spaces, hyphens, and underscores"
  )
  .transform(sanitizeString);

export const ProjectDescriptionSchema = z
  .string()
  .max(500, "Project description cannot exceed 500 characters")
  .optional()
  .transform((val) => (val ? sanitizeString(val) : val));

export const TaskTitleSchema = z
  .string()
  .min(1, "Task title cannot be empty")
  .max(200, "Task title cannot exceed 200 characters")
  .transform(sanitizeString);

export const TaskDescriptionSchema = z
  .string()
  .max(2000, "Task description cannot exceed 2000 characters")
  .optional()
  .transform((val) => (val ? sanitizeString(val) : val));

export const TaskRemarksSchema = z
  .string()
  .max(2000, "Task remarks cannot exceed 2000 characters")
  .optional()
  .transform((val) => (val ? sanitizeString(val) : val));

export const TaskTitlesSchema = z
  .string()
  .min(1, "Task titles cannot be empty")
  .max(5000, "Task titles too long")
  .transform((val) => {
    const titles = val
      .split(",")
      .map((t) => sanitizeString(t))
      .filter((t) => t.length > 0);
    if (titles.length === 0) {
      throw new Error("No valid task titles provided after sanitization");
    }
    return titles;
  });

export const TagsSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return [];
    const tags = val
      .split(",")
      .map((tag) => sanitizeString(tag))
      .filter((tag) => tag.length > 0 && tag.length <= 50)
      .map((tag) => tag.toLowerCase());
    return [...new Set(tags)]; // Remove duplicates
  });

export const DueDateSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      return isValidISODate(val);
    },
    {
      message:
        "Due date must be a valid ISO 8601 date string (e.g., '2025-12-01T10:00:00Z')",
    }
  );

export const PrioritySchema = z.enum(["low", "medium", "high"], {
  errorMap: () => ({ message: "Priority must be 'low', 'medium', or 'high'" }),
});

export const StatusSchema = z.enum(
  ["todo", "pending", "completed", "archived"],
  {
    errorMap: () => ({
      message: "Status must be 'todo', 'pending', 'completed', or 'archived'",
    }),
  }
);

export const TaskIdSchema = z
  .string()
  .min(1, "Task ID cannot be empty")
  .max(100, "Task ID is too long")
  .regex(
    /^[a-zA-Z0-9\-_]+$/,
    "Task ID can only contain letters, numbers, hyphens, and underscores"
  );

export const ProjectIdSchema = z
  .string()
  .min(1, "Project ID cannot be empty")
  .max(100, "Project ID is too long")
  .regex(
    /^[a-zA-Z0-9\-_]+$/,
    "Project ID can only contain letters, numbers, hyphens, and underscores"
  );

export const SortBySchema = z.enum(
  ["createdAt", "dueDate", "priority", "title"],
  {
    errorMap: () => ({
      message: "Sort by must be 'createdAt', 'dueDate', 'priority', or 'title'",
    }),
  }
);

export const OrderSchema = z.enum(["asc", "desc"], {
  errorMap: () => ({ message: "Order must be 'asc' or 'desc'" }),
});

export const BooleanSchema = z.boolean({
  errorMap: () => ({ message: "Must be true or false" }),
});

// Query validation for search
export const SearchQuerySchema = z
  .string()
  .max(500, "Search query is too long")
  .optional()
  .transform((val) => (val ? sanitizeString(val) : val));

// Pagination/infinite scroll support
export const LimitSchema = z
  .number()
  .int()
  .min(1, "Limit must be at least 1")
  .max(1000, "Limit cannot exceed 1000")
  .optional();

export const ProjectNamesSchema = z
  .string()
  .min(1, "Project names cannot be empty")
  .max(5000, "Project names too long")
  .transform((val) => {
    const names = val
      .split(",")
      .map((n) => sanitizeString(n))
      .filter((n) => n.length > 0 && /^\S+$/.test(n));
    if (names.length === 0) {
      throw new Error("No valid project names provided after sanitization");
    }
    return names;
  });

export const ProjectNamesStringSchema = z
  .string()
  .min(1, "Project names cannot be empty")
  .max(5000, "Project names too long")
  .transform((val) => {
    const names = val
      .split(",")
      .map((n) => sanitizeString(n))
      .filter((n) => n.length > 0);
    if (names.length === 0) {
      throw new Error("No valid project names provided after sanitization");
    }
    return names;
  });
