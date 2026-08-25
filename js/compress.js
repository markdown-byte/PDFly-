document.addEventListener('DOMContentLoaded', () => {
    let sourcePdfFile = null;
    let compressedPdfBlob = null;
    let originalSize = 0;

    const uploadState = document.getElementById('upload-state');
    const optionsState = document.getElementById('options-state');
    const processingState = document.getElementById('processing-state');
    const resultsState = document.getElementById('results-state');
    const errorMsg = document.getElementById('error-msg');
    
    const fileNameDisplay = document.getElementById('file-name-display');
    const originalSizeDisplay = document.getElementById('original-size-display');
    
    // Results stats
    const oldSizeStat = document.getElementById('old-size-stat');
    const newSizeStat = document.getElementById('new-size-stat');
    const savedStat = document.getElementById('saved-stat');
    
    // Buttons
    const compressBtn = document.getElementById('compress-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const downloadBtn = document.getElementById('download-btn');
    const startOverBtn = document.getElementById('start-over-btn');

    // Progress Bar
    const progressBar = document.getElementById('compress-progress-bar');
    const statusText = document.getElementById('compress-status-text');
    const processingTitle = document.getElementById('processing-title');
    const processingSubtitle = document.getElementById('processing-subtitle');

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    const uploader = new Uploader('pdf-uploader', {
        accept: 'application/pdf',
        multiple: false,
        onFilesSelected: (files) => {
            errorMsg.style.display = 'none';
            sourcePdfFile = files[0];
            originalSize = sourcePdfFile.size;
            
            fileNameDisplay.textContent = sourcePdfFile.name;
            originalSizeDisplay.textContent = formatBytes(originalSize);
            
            uploadState.style.display = 'none';
            optionsState.style.display = 'block';
        },
        onError: (err) => {
            errorMsg.textContent = err;
            errorMsg.style.display = 'block';
        }
    });

    cancelBtn.addEventListener('click', resetState);

    function resetState() {
        sourcePdfFile = null;
        compressedPdfBlob = null;
        originalSize = 0;
        
        optionsState.style.display = 'none';
        resultsState.style.display = 'none';
        uploadState.style.display = 'block';
    }

    compressBtn.addEventListener('click', async () => {
        optionsState.style.display = 'none';
        processingState.style.display = 'block';
        
        let selectedLevel = 'medium';
        const levelInputs = document.getElementsByName('compression-level');
        for (const input of levelInputs) {
            if (input.checked) {
                selectedLevel = input.value;
                break;
            }
        }
        
        let compressionTimeMultiplier = 1;
        if (selectedLevel === 'low') compressionTimeMultiplier = 0.5;
        if (selectedLevel === 'high') compressionTimeMultiplier = 2.0;

        progressBar.style.width = '0%';
        statusText.textContent = '0%';
        
        processingTitle.textContent = `Applying ${selectedLevel} compression...`;

        // Simulate progress bar
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressBar.style.width = `${progress}%`;
            statusText.textContent = `${Math.round(progress)}%`;
        }, 300 * compressionTimeMultiplier);

        setTimeout(async () => {
            try {
                const arrayBuffer = await sourcePdfFile.arrayBuffer();
                const { PDFDocument } = PDFLib;
                
                // Loading and saving recreates the PDF, often stripping unused objects
                const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                
                if (selectedLevel === 'high') {
                   // Remove metadata for high compression
                   pdfDoc.setTitle('');
                   pdfDoc.setAuthor('');
                   pdfDoc.setSubject('');
                   pdfDoc.setKeywords([]);
                   pdfDoc.setProducer('');
                   pdfDoc.setCreator('');
                }
                
                const pdfBytes = await pdfDoc.save({ useObjectStreams: false }); 
                
                clearInterval(progressInterval);
                progressBar.style.width = '100%';
                statusText.textContent = '100%';

                setTimeout(() => {
                    compressedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                    const newSize = compressedPdfBlob.size;
                    
                    // Populate stats
                    oldSizeStat.textContent = formatBytes(originalSize);
                    newSizeStat.textContent = formatBytes(newSize);
                    
                    let savedPercent = ((originalSize - newSize) / originalSize * 100).toFixed(1);
                    if (savedPercent < 0) savedPercent = 0; // Sometimes it gets bigger
                    
                    savedStat.textContent = `${savedPercent}%`;
                    
                    if (newSize >= originalSize) {
                        savedStat.style.color = 'var(--text-muted)';
                        savedStat.textContent = '0% (Already optimal)';
                    } else {
                        savedStat.style.color = 'var(--success)';
                    }

                    processingState.style.display = 'none';
                    
                    const downloadUrl = URL.createObjectURL(compressedPdfBlob);
                    const originalName = (sourcePdfFile && sourcePdfFile.name) ? sourcePdfFile.name.replace('.pdf', '') : 'document';
                    downloadBtn.href = downloadUrl;
                    downloadBtn.download = `${originalName}_compressed.pdf`;

                    resultsState.style.display = 'block';
                }, 400); // Wait for 100% animation to finish
            } catch (error) {
                console.error(error);
                clearInterval(progressInterval);
                alert('Something went wrong. The PDF might be corrupted or heavily encrypted.');
                processingState.style.display = 'none';
                optionsState.style.display = 'block';
            }
        }, 800 * compressionTimeMultiplier);
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
