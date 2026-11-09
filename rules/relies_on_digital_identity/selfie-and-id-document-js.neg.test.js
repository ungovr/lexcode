// lexcode-expect: 0
// A profile photo upload, a password sign-in, and a social sign-in that only
// links an account: no photo-ID image sits beside the face image.
export async function uploadAvatar(faceBlob) {
  const form = new FormData();
  form.append('selfie', faceBlob);
  form.append('caption', 'me');
  return fetch('/api/me/photo', { method: 'POST', body: form });
}

export function signIn(username, password) {
  return fetch('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export function linkGoogle(profile) {
  return { googleId: profile.id, profileImage: profile.picture, faceImageUrl: profile.picture };
}

export function setFont(el) {
  el.style.fontFace = 'Inter';
  el.dataset.idCard = 'none';
}
