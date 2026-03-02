const CLOUD_NAME    = 'ddnmdeckd';
const UPLOAD_PRESET = 'chinamanapuram_portal';

/**
 * Upload a file to Cloudinary (free, no billing needed).
 * Returns { promise, cancel }
 * - promise resolves to the secure URL string
 * - cancel() aborts the upload
 */
export function cloudinaryUpload(file, folder, onProgress) {
  const formData = new FormData();
  formData.append('file',           file);
  formData.append('upload_preset',  UPLOAD_PRESET);
  formData.append('folder',         folder);

  let xhr;
  const promise = new Promise((resolve, reject) => {
    xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch {
          reject(new Error('Invalid response from server.'));
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.error?.message || 'Upload failed. Please try again.'));
        } catch {
          reject(new Error('Upload failed. Please try again.'));
        }
      }
    };

    xhr.onerror  = ()  => reject(new Error('Network error. Check your internet connection.'));
    xhr.onabort  = ()  => reject(new Error('canceled'));

    xhr.send(formData);
  });

  return {
    promise,
    cancel: () => xhr && xhr.abort(),
  };
}

export function isCloudinaryConfigured() {
  return true;
}
