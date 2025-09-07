export const uploadImagesToCloudinary = async (files: File[]): Promise<string[]> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing');
  }
  
  const urls: string[] = [];
  
  for (const file of files) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', uploadPreset);
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { 
      method: 'POST', 
      body: fd 
    });
    
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    urls.push(data.secure_url);
  }
  
  return urls;
};

export const extractPublicId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find the index of 'upload' in the path
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex >= pathParts.length - 1) return null;
    
    // Join all parts after 'upload' + 1 (to skip the version if exists)
    const publicIdParts = pathParts.slice(uploadIndex + 2);
    return publicIdParts.join('/').replace(/\..+$/, ''); // Remove file extension
  } catch (e) {
    console.error('Error extracting public ID:', e);
    return null;
  }
};

export const deleteImagesFromCloudinary = async (urls: string[]) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return;

  try {
    await Promise.all(urls.map(async (url) => {
      const publicId = extractPublicId(url);
      
      if (!publicId) {
        console.error(`Could not extract public ID from URL: ${url}`);
        return;
      }
      
      const res = await fetch(`/api/admin/delete-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Failed to delete image: ${publicId}, error: ${errorText}`);
      }
    }));
  } catch (error) {
    console.error('Error deleting images from Cloudinary:', error);
  }
};