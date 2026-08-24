document.addEventListener('DOMContentLoaded', () => {
    let sourcePdfFile = null;
    let zipBlob = null;
    let singleImageBlob = null;
    let totalPages = 0;

    const uploadState = document.getElementById('upload-state');
    const processingState = document.getElementById('processing-state');
    const resultsState = document.getElementById('results-state');
    const errorMsg = document.getElementById('error-msg');
    
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');
    const resultDesc = document.getElementById('result-desc');
    
    // Buttons
    const downloadBtn = document.getElementById('download-btn');
    const startOverBtn = document.getElementById('start-over-btn');

    const uploader = new Uploader('pdf-uploader', {
        accept: 'application/pdf',
        multiple: false,
        onFilesSelected: (files) => {
            errorMsg.style.display = 'none';
            sourcePdfFile = files[0];
            
            uploadState.style.display = 'none';
            processingState.style.display = 'block';
            
            processPdfToJpg();
        },
        onError: (err) => {
            errorMsg.textContent = err;
            errorMsg.style.display = 'block';
        }
    });

    async function processPdfToJpg() {
        try {
            const arrayBuffer = await sourcePdfFile.arrayBuffer();
            
            // Using modern pdf.js syntax
            const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
            const pdf = await loadingTask.promise;
            totalPages = pdf.numPages;
            
            const zip = new JSZip();
            const scale = 2; // High resolution rendering

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                statusText.textContent = `Converting page ${pageNum} of ${totalPages}...`;
                progressBar.style.width = `${(pageNum / totalPages) * 100}%`;
                
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: scale });
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;
                
                // Get JPG data URL
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                const base64Data = dataUrl.split(',')[1];
                
                if (totalPages === 1) {
                    // For a single page, we can just offer the direct JPG download
                    const byteString = atob(base64Data);
                    const ia = new Uint8Array(byteString.length);
                    for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }
                    singleImageBlob = new Blob([ia], { type: 'image/jpeg' });
                } else {
                    // Add to zip
                    const fileName = `page_${pageNum.toString().padStart(3, '0')}.jpg`;
                    zip.file(fileName, base64Data, { base64: true });
                }
            }

            statusText.textContent = 'Packaging files...';
            const originalName = (sourcePdfFile && sourcePdfFile.name) ? sourcePdfFile.name.replace('.pdf', '') : 'document';
            const downloadBtnText = document.getElementById('download-btn-text');
            
            if (totalPages > 1) {
                zipBlob = await zip.generateAsync({ type: 'blob' });
                const downloadUrl = URL.createObjectURL(zipBlob);
                downloadBtn.href = downloadUrl;
                downloadBtn.download = `${originalName}_images.zip`;
                if (downloadBtnText) downloadBtnText.textContent = 'Download ZIP Archive';
                resultDesc.textContent = `Successfully converted ${totalPages} pages into JPG images.`;
            } else {
                const downloadUrl = URL.createObjectURL(singleImageBlob);
                downloadBtn.href = downloadUrl;
                downloadBtn.download = `${originalName}.jpg`;
                if (downloadBtnText) downloadBtnText.textContent = 'Download JPG Image';
                resultDesc.textContent = `Successfully converted 1 page into a JPG image.`;
            }

            processingState.style.display = 'none';
            resultsState.style.display = 'block';
        } catch (error) {
            console.error(error);
            errorMsg.textContent = 'Something went wrong. The PDF might be corrupted or password protected.';
            errorMsg.style.display = 'block';
            processingState.style.display = 'none';
            uploadState.style.display = 'block';
        }
    }

    startOverBtn.addEventListener('click', () => {
        if (downloadBtn.href && downloadBtn.href.startsWith('blob:')) {
            URL.revokeObjectURL(downloadBtn.href);
            downloadBtn.href = '#';
        }
        sourcePdfFile = null;
        zipBlob = null;
        singleImageBlob = null;
        totalPages = 0;
        
        progressBar.style.width = '0%';
        statusText.textContent = 'Parsing PDF...';
        
        resultsState.style.display = 'none';
        uploadState.style.display = 'block';
    });
});
