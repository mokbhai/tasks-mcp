import { format, formatDistance, parseISO, isValid } from 'date-fns';

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    return format(date, 'MMM d, yyyy');
  } catch {
    return '';
  }
}

export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    return format(date, 'MMM d, yyyy h:mm a');
  } catch {
    return '';
  }
}

export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    return formatDistance(date, new Date(), { addSuffix: true });
  } catch {
    return '';
  }
}

export function isOverdue(dateString: string | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return false;
    return date < new Date();
  } catch {
    return false;
  }
}
