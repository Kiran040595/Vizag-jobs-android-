import {
  isValidStudentPhone,
  normalizeStudentPhone,
  phoneToAuthEmail,
} from '../studentPhoneAuth';

describe('studentPhoneAuth', () => {
  it('normalizes 10-digit Indian mobiles to E.164', () => {
    expect(normalizeStudentPhone('9876543210')).toBe('+919876543210');
    expect(normalizeStudentPhone('91 98765 43210')).toBe('+919876543210');
  });

  it('validates Indian mobile numbers', () => {
    expect(isValidStudentPhone('9876543210')).toBe(true);
    expect(isValidStudentPhone('5876543210')).toBe(false);
    expect(isValidStudentPhone('123')).toBe(false);
  });

  it('builds phone auth emails', () => {
    expect(phoneToAuthEmail('9876543210')).toBe('919876543210@phone.jobsinvizag.in');
  });
});
