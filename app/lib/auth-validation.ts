export const genderOptions = ['Male', 'Female', 'Other'] as const;

export type RegistrationFormValues = {
  name: string;
  gender: string;
  dob: string;
  email: string;
  phone: string;
  userId: string;
  password: string;
};

export type RegistrationField = keyof RegistrationFormValues;

export type RegistrationFormErrors = Partial<Record<RegistrationField, string>>;

export const emptyRegistrationForm: RegistrationFormValues = {
  name: '',
  gender: '',
  dob: '',
  email: '',
  phone: '',
  userId: '',
  password: ''
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userIdPattern = /^[A-Za-z0-9][A-Za-z0-9._]*$/;
const nameCharactersPattern = /^[A-Za-z' -]+$/;
const nameStructurePattern = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
const dobPattern = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

function titleCaseSegment(segment: string) {
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}

function formatName(value: string) {
  return value
    .split(' ')
    .map((part) => part
      .split(/([-'])/)
      .map((segment) => (segment === '-' || segment === '\'' || !segment ? segment : titleCaseSegment(segment)))
      .join(''))
    .join(' ');
}

export function normalizeFieldValue(field: RegistrationField, value: string, finalize = false) {
  switch (field) {
    case 'name': {
      const normalized = finalize ? value.trim() : value.replace(/^\s+/, '');
      return finalize ? formatName(normalized) : normalized;
    }
    case 'email':
      return value.trim().replace(/\s+/g, '').toLowerCase();
    case 'phone':
      return value.replace(/\D/g, '').slice(0, 10);
    case 'userId':
      return value.trim().replace(/\s+/g, '').slice(0, 64);
    case 'password':
      return value.replace(/\s+/g, '').slice(0, 15);
    case 'dob': {
      const digits = value.replace(/\D/g, '').slice(0, 8);
      const day = digits.slice(0, 2);
      const month = digits.slice(2, 4);
      const year = digits.slice(4, 8);

      if (digits.length <= 2) {
        return day;
      }

      if (digits.length <= 4) {
        return `${day}/${month}`;
      }

      return `${day}/${month}/${year}`;
    }
    case 'gender':
      return value.trim();
    default:
      return finalize ? value.trim() : value;
  }
}

export function normalizeRegistrationValues(values: RegistrationFormValues, finalize = false): RegistrationFormValues {
  return {
    name: normalizeFieldValue('name', values.name, finalize),
    gender: normalizeFieldValue('gender', values.gender, finalize),
    dob: normalizeFieldValue('dob', values.dob, finalize),
    email: normalizeFieldValue('email', values.email, finalize),
    phone: normalizeFieldValue('phone', values.phone, finalize),
    userId: normalizeFieldValue('userId', values.userId, finalize),
    password: normalizeFieldValue('password', values.password, finalize)
  };
}

function calculateAge(dateOfBirth: Date) {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDifference = today.getMonth() - dateOfBirth.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }

  return age;
}

export function validateRegistrationValues(values: RegistrationFormValues): RegistrationFormErrors {
  const errors: RegistrationFormErrors = {};

  if (!values.name) {
    errors.name = 'Name is required.';
  } else if (values.name.length < 2 || values.name.length > 64) {
    errors.name = 'Name must be between 2 and 64 characters.';
  } else if (/\s{2,}/.test(values.name)) {
    errors.name = 'Please enter your full name.';
  } else if (!nameCharactersPattern.test(values.name) || /\d/.test(values.name) || !nameStructurePattern.test(values.name)) {
    errors.name = 'Name must contain only letters.';
  }

  if (!values.gender || !genderOptions.includes(values.gender as (typeof genderOptions)[number])) {
    errors.gender = 'Please select your gender.';
  }

  if (!values.dob) {
    errors.dob = 'Date of Birth is required.';
  } else if (!dobPattern.test(values.dob)) {
    errors.dob = 'Please use DD/MM/YYYY format.';
  } else {
    const [dayPart, monthPart, yearPart] = values.dob.split('/');
    const day = Number(dayPart);
    const month = Number(monthPart);
    const year = Number(yearPart);
    const date = new Date(year, month - 1, day);
    const isCalendarDate =
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;

    if (!isCalendarDate) {
      errors.dob = 'Please enter a valid date.';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date > today) {
      errors.dob = 'Future dates are not allowed.';
      } else {
        const age = calculateAge(date);
        if (age < 18) {
          errors.dob = 'You must be at least 18 years old.';
        } else if (age > 120) {
          errors.dob = 'Please enter a valid date.';
        }
      }
    }
  }

  if (!values.email) {
    errors.email = 'Email is required.';
  } else if (values.email.length > 64) {
    errors.email = 'Email address must be 64 characters or fewer.';
  } else if (!emailPattern.test(values.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!values.phone) {
    errors.phone = 'Phone number is required.';
  } else if (!/^\d{10}$/.test(values.phone)) {
    errors.phone = 'Phone number must contain exactly 10 digits.';
  }

  if (!values.userId) {
    errors.userId = 'User ID is required.';
  } else if (values.userId.length < 5 || values.userId.length > 64) {
    errors.userId = 'User ID must contain 5 to 64 characters.';
  } else if (!userIdPattern.test(values.userId) && !emailPattern.test(values.userId)) {
    errors.userId = 'User ID must be a valid email or use only letters, numbers, underscore (_) and period (.).';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8 || values.password.length > 15) {
    errors.password = 'Password length must be between 8 and 15 characters.';
  } else if (!/[A-Z]/.test(values.password) || !/[a-z]/.test(values.password) || !/\d/.test(values.password) || !/[^A-Za-z0-9]/.test(values.password)) {
    errors.password = 'Password must contain at least: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.';
  }

  return errors;
}

export function getPasswordStrength(password: string) {
  const trimmed = password.trim();
  if (!trimmed) {
    return { label: 'Weak', tone: 'weak' as const };
  }

  let score = 0;

  if (/[A-Z]/.test(trimmed)) score += 1;
  if (/[a-z]/.test(trimmed)) score += 1;
  if (/\d/.test(trimmed)) score += 1;
  if (/[^A-Za-z0-9]/.test(trimmed)) score += 1;
  if (trimmed.length >= 12) score += 1;

  if (trimmed.length < 8 || score <= 2) {
    return { label: 'Weak', tone: 'weak' as const };
  }

  if (score <= 4) {
    return { label: 'Medium', tone: 'medium' as const };
  }

  return { label: 'Strong', tone: 'strong' as const };
}