'use client';

// Dynamically import pdfmake to avoid SSR issues
let pdfMakeInstance: any = null;

// Lazy load pdfmake
const loadPdfMake = async () => {
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
        } else if ((window as any).pdfMake && (window as any).pdfMake.vfs) {
            pdfMakeInstance.vfs = (window as any).pdfMake.vfs;
        }

        // 🟢 ADD YOUR LOGO TO VFS
        // You need to convert your logo to base64 and add it here
        // or load it from a URL
    }
    return pdfMakeInstance;
};

// Define types
export type OrderForPDF = {
    orderCode: string;
    customerName: string;
    customerPhone: string;
    address: string;
    city: string;
    note: string;
    totalPrice: number;
    paymentMethod: "COD" | "PREPAID";
    createdAt: Date;
    orderItems: {
        id: number;
        quantity: number;
        product: {
            name: string;
        };
    }[];
};

// Format date function
const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Format phone number function
const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits || '06-00-00-00-00';
};

// Function to load image as base64
const loadLogoAsBase64 = async (logoUrl: string): Promise<string> => {
    try {
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                resolve(base64data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Failed to load logo:', error);
        return ''; // Return empty string if logo can't be loaded
    }
};

// Generate invoice PDF document definition
export const createInvoicePDF = (order: OrderForPDF, merchantName: string, merchantPhone?: string, logoBase64?: string) => {
    const customerFirstName = order.customerName.split(' ')[0] || order.customerName;
    const cityName = order.city;  // Use the city name directly from the order
    const address = order.address || customerFirstName;
    const note = order.note || 'Aucun';

    // Document definition with logo
    const docDefinition = {
        pageSize: {
            width: 300,
            height: 300
        },
        pageMargins: [10, 10, 10, 10],
        content: [
            // Header with Logo and Merchant info
            {
                columns: [
                    // Logo column (left)
                    {
                        width: '30%',
                        image: logoBase64 || '', // Use logo if available
                        fit: [60, 40], // Width, Height in points (1 point = 1/72 inch)
                        alignment: 'left',
                        margin: [0, 0, 0, 0]
                    },
                    // Merchant info column (right)
                    {
                        width: '70%',
                        stack: [
                            {
                                text: `Vendeur: ${merchantName} ( ${merchantPhone} )`,
                                fontSize: 9,
                                bold: false,
                                margin: [0, 0, 0, 3],
                                alignment: 'right'
                            },
                            {
                                text: `Date: ${formatDate(order.createdAt)}`,
                                fontSize: 9,
                                margin: [0, 0, 0, 8],
                                alignment: 'right'
                            }
                        ]
                    }
                ],
                margin: [0, 0, 0, 8]
            },

            // Alternative: Logo centered above merchant info
            // Uncomment this if you want logo centered instead of left-aligned
            /*
            {
                image: logoBase64 || '',
                width: 50,
                alignment: 'center',
                margin: [0, 0, 0, 10]
            },
            {
                text: `Vendeur: ${merchantName} ( 0600000000 )`,
                fontSize: 9,
                bold: false,
                margin: [0, 0, 0, 3],
                alignment: 'center'
            },
            {
                text: `Date: ${formatDate(order.createdAt)}`,
                fontSize: 9,
                margin: [0, 0, 0, 8],
                alignment: 'center'
            },
            */

            // Company name
            {
                text: 'Jabrane Delivery',
                fontSize: 12,
                bold: true,
                alignment: 'center',
                margin: [0, 0, 0, 2]
            },
            {
                text: 'SYSTEME GESTION SOCIETE LIVRAISON',
                fontSize: 8,
                bold: true,
                alignment: 'center',
                margin: [0, 0, 0, 6]
            },

            // Separator line
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 0,
                        x2: 280,
                        y2: 0,
                        lineWidth: 0.5
                    }
                ],
                margin: [0, 0, 0, 4]
            },

            // Customer details
            {
                columns: [
                    {
                        width: '30%',
                        text: 'Destinataire:',
                        fontSize: 9,
                        bold: true
                    },
                    {
                        width: '70%',
                        text: customerFirstName,
                        fontSize: 9
                    }
                ],
                margin: [0, 0, 0, 2]
            },
            {
                columns: [
                    {
                        width: '30%',
                        text: 'Telephone:',
                        fontSize: 9,
                        bold: true
                    },
                    {
                        width: '70%',
                        text: formatPhone(order.customerPhone),
                        fontSize: 9
                    }
                ],
                margin: [0, 0, 0, 2]
            },
            {
                columns: [
                    {
                        width: '30%',
                        text: 'City:',
                        fontSize: 9,
                        bold: true
                    },
                    {
                        width: '70%',
                        text: cityName,
                        fontSize: 9
                    }
                ],
                margin: [0, 0, 0, 4]
            },
            {
                columns: [
                    {
                        width: '30%',
                        text: 'Adresse:',
                        fontSize: 9,
                        bold: true
                    },
                    {
                        width: '70%',
                        text: address,
                        fontSize: 9
                    }
                ],
                margin: [0, 0, 0, 4]
            },

            // Comment
            {
                columns: [
                    {
                        width: '30%',
                        text: 'Commentaire:',
                        fontSize: 9,
                        bold: true
                    },
                    {
                        width: '70%',
                        text: `${note}`,
                        fontSize: 9
                    }
                ],
                margin: [0, 0, 0, 4]
            },

            // Separator line
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 0,
                        x2: 280,
                        y2: 0,
                        lineWidth: 0.5
                    }
                ],
                margin: [0, 0, 0, 4]
            },

            {
                columns: [
                    {
                        width: '30%',
                        text: 'Produits:',
                        fontSize: 9,
                        bold: true
                    },
                    {
                        width: '70%',
                        text: `${order.orderItems.map(item => `${item.product.name} x (${item.quantity})`).join(', ')}`,
                        fontSize: 9,
                        margin: [0, 0, 0, 1]
                    }
                ],
                margin: [0, 0, 0, 4]
            },

            // Products
            // {
            //     columns: [
            //         {
            //             text: 'Produit:',
            //             fontSize: 9,
            //             bold: true,
            //         },
            //         {
            //             ...order.orderItems.map(item => ({
            //                 text: `${item.product.name} (${item.quantity})`,
            //                 fontSize: 9,
            //                 // margin: [0, 0, 0, 1]
            //             })),
            //         }

            //     ],
            //     margin: [0, 0, 0, 2]


            // },

            // Spacing
            { text: '', margin: [0, 0, 0, 4] },

            // Payment info
            {
                columns: [
                    // {
                    //     width: '50%',
                    //     columns: [
                    //         {
                    //             width: '40%',
                    //             text: 'Ouvrir:',
                    //             fontSize: 9,
                    //             bold: true
                    //         },
                    //         {
                    //             width: '60%',
                    //             text: order.paymentMethod === "COD" ? "Oui" : "Non",
                    //             fontSize: 9
                    //         }
                    //     ]
                    // },
                    // {
                    //     width: '50%',
                    //     columns: [
                    //         {
                    //             width: '40%',
                    //             text: 'Fragile :',
                    //             fontSize: 9,
                    //             bold: true
                    //         },
                    //         {
                    //             width: '60%',
                    //             text: 'Non',
                    //             fontSize: 9
                    //         }
                    //     ]
                    // }
                ],
                margin: [0, 0, 0, 8]
            },

            // Total price
            {
                text: `Prix Total: ${order.totalPrice.toFixed(0)} Dhs`,
                fontSize: 16,
                bold: true,
                alignment: 'center',
                margin: [0, 0, 0, 8]
            },

            // Separator line
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 0,
                        x2: 280,
                        y2: 0,
                        lineWidth: 0.5
                    }
                ],
                margin: [0, 0, 0, 4]
            },

            // Footer with logo
            {
                columns: [
                    // Left side: Website
                    {
                        width: '60%',
                        stack: [
                            {
                                text: 'Web site: https://dash.sonixpress.ma/login',
                                fontSize: 7,
                                alignment: 'left',
                                margin: [0, 0, 0, 2]
                            },
                            {
                                text: 'Merci de votre confiance',
                                fontSize: 9,
                                bold: true,
                                alignment: 'left'
                            }
                        ]
                    },
                    // Right side: Logo (small) and phone
                    {
                        width: '40%',
                        stack: [
                            // Small logo in footer
                            ...(logoBase64 ? [{
                                image: logoBase64,
                                width: 30,
                                alignment: 'right',
                                margin: [0, 5, 0, 5]
                            }] : []),
                            {

                                text: 'Telephone: 0601717961',
                                fontSize: 7,
                                alignment: 'right',
                                margin: [0, 0, 0, 4]
                            }
                        ]
                    }
                ],
                margin: [0, 0, 0, 0]
            }



            // Alternative simple footer without logo:
            /*
            {
                text: 'Web site: https://sebbarlivraison.com/demo/',
                fontSize: 7,
                alignment: 'center',
                margin: [0, 0, 0, 2]
            },
            {
                text: 'Telephone: 0600000000',
                fontSize: 7,
                alignment: 'center',
                margin: [0, 0, 0, 4]
            },
            {
                text: 'Merci de votre confiance',
                fontSize: 9,
                bold: true,
                alignment: 'center'
            }
            */
        ],
        defaultStyle: {
            font: 'Roboto'
        }
    };

    return docDefinition;
};

// Generate PDF and download directly (client-side)
export const downloadInvoicePDF = async (order: OrderForPDF, merchantName: string, merchantPhone?: string, logoUrl?: string) => {
    try {
        const pdfMake = await loadPdfMake();

        // Load logo as base64 if URL is provided
        let logoBase64 = '';
        if (logoUrl) {
            try {
                logoBase64 = await loadLogoAsBase64(logoUrl);
            } catch (error) {
                console.warn('Could not load logo, proceeding without it:', error);
            }
        }

        const docDefinition = createInvoicePDF(order, merchantName, merchantPhone, logoBase64);
        const fileName = `invoice-${order.orderCode}.pdf`;

        // Define fonts
        const fonts = {
            Roboto: {
                normal: 'Roboto-Regular.ttf',
                bold: 'Roboto-Medium.ttf',
                italics: 'Roboto-Italic.ttf',
                bolditalics: 'Roboto-MediumItalic.ttf'
            }
        };

        // Pass the fonts definition when creating the PDF
        pdfMake.createPdf(docDefinition, null, fonts).download(fileName);

        return { success: true, fileName };
    } catch (error) {
        console.error('[v0] Error downloading PDF:', error);
        return {
            success: false,
            fileName: `invoice-${order.orderCode}.pdf`,
            error: error instanceof Error ? error.message : 'Failed to download PDF'
        };
    }
};