'use client';

// Dynamically import pdfmake to avoid SSR issues
let pdfMakeInstance: any = null;

// Lazy load pdfmake
export const loadPdfMake = async () => {
    if (!pdfMakeInstance) {
        const pdfMakeModule = await import('pdfmake/build/pdfmake.min.js');
        const vfsFontsModule = await import('pdfmake/build/vfs_fonts.js');

        pdfMakeInstance = pdfMakeModule.default;

        // TypeScript workaround - use type assertion
        const vfsFonts = vfsFontsModule as any;

        // Check different possible structures
        if (vfsFonts.default && vfsFonts.default.vfs) {
            pdfMakeInstance.vfs = vfsFonts.default.vfs;
        } else if (vfsFonts.vfs) {
            pdfMakeInstance.vfs = vfsFonts.vfs;
        } else if (vfsFonts.default) {
            pdfMakeInstance.vfs = vfsFonts.default;
        } else {
            console.warn('Could not load VFS fonts');
        }

        // Load and register Arabic fonts
        await loadArabicFonts();
    }

    return pdfMakeInstance;
};

// Function to load Arabic fonts and add them to VFS
const loadArabicFonts = async () => {
    try {
        // Load Lateef Arabic fonts
        const arabicRegularResponse = await fetch('/fonts/Lateef-Regular.ttf');
        const arabicBoldResponse = await fetch('/fonts/Lateef-Bold.ttf');

        const arabicRegularBlob = await arabicRegularResponse.blob();
        const arabicBoldBlob = await arabicBoldResponse.blob();

        // Convert to base64
        const arabicRegularBase64 = await blobToBase64(arabicRegularBlob);
        const arabicBoldBase64 = await blobToBase64(arabicBoldBlob);

        // Add Arabic fonts to VFS
        if (pdfMakeInstance.vfs) {
            pdfMakeInstance.vfs['Lateef-Regular.ttf'] = arabicRegularBase64;
            pdfMakeInstance.vfs['Lateef-Bold.ttf'] = arabicBoldBase64;
        }
    } catch (error) {
        console.warn('Failed to load Arabic fonts:', error);
    }
};

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
