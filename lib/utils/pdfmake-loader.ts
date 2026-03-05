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
    }

    return pdfMakeInstance;
};
