/**
 * Module-level storage for the Firebase Phone Auth confirmation object.
 * 
 * React Navigation serializes route params, which strips methods from objects.
 * The Firebase ConfirmationResult has a .confirm() method that gets lost.
 * We store it here instead and reference it from the OTP screen.
 */

let _confirmation = null;

export function setPhoneConfirmation(confirmation) {
  _confirmation = confirmation;
}

export function getPhoneConfirmation() {
  return _confirmation;
}

export function clearPhoneConfirmation() {
  _confirmation = null;
}
