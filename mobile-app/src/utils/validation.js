export function validateName(name) {
  if (!name || !name.trim()) return 'Please enter your name';
  return null;
}

export function validateEmail(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address';
  return null;
}

export function validatePhone(phone) {
  if (!phone || !/^[0-9]{10}$/.test(phone)) return 'Please enter a valid 10-digit phone number';
  return null;
}

export function validatePincode(pincode) {
  if (!pincode || !/^[0-9]{6}$/.test(pincode)) return 'Please enter a valid 6-digit pincode';
  return null;
}

export function validatePassword(password) {
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  return null;
}

export function validateRegistrationForm({ name, email, phone, pincode, password }) {
  return {
    name: validateName(name),
    email: validateEmail(email),
    phone: validatePhone(phone),
    pincode: validatePincode(pincode),
    password: validatePassword(password),
  };
}
