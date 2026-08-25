document.addEventListener('DOMContentLoaded', () => {
    let sourcePdfFile = null;
    let sourcePdfDoc = null;
    let splitPdfBlob = null;
    let totalPages = 0;

    const uploadState = document.getElementById('upload-state');
    const optionsState = document.getElementById('options-state');
    const processingState = document.getElementById('processing-state');
    const resultsState = document.getElementById('results-state');
    const errorMsg = document.getElementById('error-msg');
    
    const fileNameDisplay = document.getElementById('file-name-display');
    const totalPagesDisplay = document.getElementById('total-pages-display');
    const pageRangeInput = document.getElementById('page-range');
    
    // Buttons
    const splitBtn = document.getElementById('split-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const downloadBtn = document.getElementById('download-btn');
    const startOverBtn = document.getElementById('start-over-btn');

    const uploader = new Uploader('pdf-uploader', {
        accept: 'application/pdf',
        multiple: false,
        onFilesSelected: async (files) => {
            errorMsg.style.display = 'none';
            sourcePdfFile = files[0];
            
            uploadState.style.display = 'none';
            processingState.style.display = 'block';
            
            try {
                const arrayBuffer = await sourcePdfFile.arrayBuffer();
                const { PDFDocument } = PDFLib;
                sourcePdfDoc = await PDFDocument.load(arrayBuffer);
                totalPages = sourcePdfDoc.getPageCount();
                
                fileNameDisplay.textContent = sourcePdfFile.name;
                totalPagesDisplay.textContent = totalPages;
                pageRangeInput.placeholder = `e.g. 1-${Math.min(5, totalPages)}`;
                
                processingState.style.display = 'none';
                optionsState.style.display = 'block';
            } catch (error) {
                console.error(error);
                errorMsg.textContent = 'Could not read PDF. It might be corrupted or password protected.';
                errorMsg.style.display = 'block';
                processingState.style.display = 'none';
                uploadState.style.display = 'block';
            }
        },
        onError: (err) => {
            errorMsg.textContent = err;
            errorMsg.style.display = 'block';
        }
    });

    cancelBtn.addEventListener('click', () => {
        resetState();
    });

    function resetState() {
        sourcePdfFile = null;
        sourcePdfDoc = null;
        splitPdfBlob = null;
        totalPages = 0;
        pageRangeInput.value = '';
        
        optionsState.style.display = 'none';
        resultsState.style.display = 'none';
        uploadState.style.display = 'block';
    }

    function parsePageRange(rangeStr, maxPages) {
        const pages = new Set();
        const parts = rangeStr.split(',');
        
        for (let part of parts) {
            part = part.trim();
            if (!part) continue;
            
            if (part.includes('-')) {
                const [startStr, endStr] = part.split('-');
                const start = parseInt(startStr);
                const end = parseInt(endStr);
                
                if (isNaN(start) || isNaN(end) || start > end || start < 1 || end > maxPages) {
                    throw new Error(`Invalid range: ${part}. Ensure pages are between 1 and ${maxPages}.`);
                }
                
                for (let i = start; i <= end; i++) {
                    pages.add(i - 1); // pdf-lib uses 0-based index
                }
            } else {
                const pageNum = parseInt(part);
                if (isNaN(pageNum) || pageNum < 1 || pageNum > maxPages) {
                    throw new Error(`Invalid page number: ${part}. Ensure pages are between 1 and ${maxPages}.`);
                }
                pages.add(pageNum - 1);
            }
        }
        
        const sortedPages = Array.from(pages).sort((a, b) => a - b);
        if (sortedPages.length === 0) {
            throw new Error('Please enter at least one valid page number.');
        }
        return sortedPages;
    }

    splitBtn.addEventListener('click', async () => {
        let pagesToExtract;
        try {
            pagesToExtract = parsePageRange(pageRangeInput.value, totalPages);
        } catch (err) {
            alert(err.message);
            return;
        }

        optionsState.style.display = 'none';
        processingState.style.display = 'block';

        setTimeout(async () => {
            try {
                const { PDFDocument } = PDFLib;
                const newPdf = await PDFDocument.create();
                
                const copiedPages = await newPdf.copyPages(sourcePdfDoc, pagesToExtract);
                copiedPages.forEach(page => newPdf.addPage(page));
                
                const pdfBytes = await newPdf.save();
                splitPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                
                const downloadUrl = URL.createObjectURL(splitPdfBlob);
                const originalName = (sourcePdfFile && sourcePdfFile.name) ? sourcePdfFile.name.replace('.pdf', '') : 'document';
                downloadBtn.href = downloadUrl;
                downloadBtn.download = `${originalName}_split.pdf`;

                processingState.style.display = 'none';
                resultsState.style.display = 'block';
            } catch (error) {
                console.error(error);
                alert('Something went wrong while splitting the PDF.');
                processingState.style.display = 'none';
                optionsState.style.display = 'block';
            }
        }, 100);
    });

    downloadBtn.addEventListener('click', () => {
        if (window.triggerDirectAd) window.triggerDirectAd();
    });

    startOverBtn.addEventListener('click', () => {
        if (downloadBtn.href && downloadBtn.href.startsWith('blob:')) {
            URL.revokeObjectURL(downloadBtn.href);
            downloadBtn.href = '#';
        }
        resetState();
    });
});
