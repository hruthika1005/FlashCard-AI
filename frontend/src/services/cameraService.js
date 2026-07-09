import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

/**
 * True when running inside the Capacitor native shell (Android/iOS),
 * false for a regular web browser.
 */
export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * Opens the native device camera (via the Capacitor Camera plugin) and
 * returns the captured photo as a browser File, so it can be fed straight
 * into the exact same upload pipeline used for regular file uploads.
 *
 * Only call this when isNativePlatform() is true — on the web, use the
 * hidden <input type="file" capture="environment"> fallback instead, since
 * the Capacitor Camera plugin is a native-only bridge.
 */
export async function capturePhotoNative() {
  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    saveToGallery: false,
  });

  const response = await fetch(photo.webPath);
  const blob = await response.blob();
  const ext = (photo.format || 'jpeg').toLowerCase();
  const mimeType = blob.type || `image/${ext}`;
  const fileName = `camera-capture-${Date.now()}.${ext}`;

  return new File([blob], fileName, { type: mimeType });
}
