/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// NOTE: The Fal.ai API key is hardcoded here for demonstration.
// In a production environment, this should be handled securely, for example,
// via environment variables and a backend proxy.
const FAL_API_KEY = '252b3236-74c7-4ce5-89f1-b0ed06ad52b6:ec95266c14ec1c9a308c947f03f72b47';
const FAL_API_URL = 'https://fal.run/fal-ai/bytedance/seedream/v4/edit';

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const urlToDataUrl = async (url: string): Promise<string> => {
    // Note: Use a CORS proxy if you encounter issues fetching the result from fal.ai.
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${url}. Status: ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const generateVirtualTryOnImage_Fal = async (modelImageUrl: string, garmentImage: File): Promise<string> => {
    if (!FAL_API_KEY) {
        throw new Error("Fal.ai API key is not configured.");
    }
    
    const garmentDataUrl = await fileToDataUrl(garmentImage);

    // A more specific prompt for the virtual try-on task.
    const prompt = `Apply the garment from the second image onto the person in the first image. Preserve the person's pose and the background.`;

    // Fal.ai API expects image_urls. We send data URLs, assuming the API can handle them.
    // The first image is the model, the second is the garment.
    const response = await fetch(FAL_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Key ${FAL_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: prompt,
            image_urls: [modelImageUrl, garmentDataUrl]
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Fal.ai API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();

    if (!result.images || result.images.length === 0 || !result.images[0].url) {
        console.error("Fal.ai API response:", result);
        throw new Error("Fal.ai API did not return a valid image URL.");
    }

    // The result is a public URL. To keep our state consistent (using data URLs),
    // we fetch the image from this URL and convert it to a data URL.
    try {
        const finalImageUrl = await urlToDataUrl(result.images[0].url);
        return finalImageUrl;
    } catch (fetchError) {
        console.error("Failed to fetch and convert final image from Fal.ai URL:", fetchError);
        throw new Error(`Failed to retrieve generated image from Fal.ai. This may be a CORS issue or the URL may have expired.`);
    }
};
