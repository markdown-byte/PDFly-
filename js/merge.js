document.addEventListener('DOMContentLoaded', () => {
    let filesToMerge = [];
    let mergedPdfBlob = null;

    const uploadState = document.getElementById('upload-state');
    const listState = document.getElementById('list-state');
    const processingState = document.getElementById('processing-state');
    const resultsState = document.getElementById('results-state');
    const fileList = document.getElementById('file-list');
    const errorMsg = document.getElementById('error-msg');
    
    // Buttons
    const mergeBtn = document.getElementById('merge-btn');
    const downloadBtn = document.getElementById('download-btn');
    const startOverBtn = document.getElementById('start-over-btn');
    const addMoreBtn = document.getElementById('add-more-btn');
    const hiddenAddInput = document.getElementById('hidden-add-input');

    const uploader = new Uploader('pdf-uploader', {
        accept: 'application/pdf',
        multiple: true,
        onFilesSelected: (files) => {
            errorMsg.style.display = 'none';
            files.forEach(f => filesToMerge.push(f));
            updateFileList();
            uploadState.style.display = 'none';
            listState.style.display = 'block';
        },
        onError: (err) => {
            errorMsg.textContent = err;
            errorMsg.style.display = 'block';
        }
    });

    addMoreBtn.addEventListener('click', () => {
        hiddenAddInput.click();
    });

    hiddenAddInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(f => {
            if (f.type === 'application/pdf') filesToMerge.push(f);
        });
        updateFileList();
        hiddenAddInput.value = '';
    });

    function updateFileList() {
        fileList.innerHTML = '';
        filesToMerge.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.draggable = true;
            item.dataset.index = index;
            
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            
            item.innerHTML = `
                <div class="file-info">
                    <span class="file-drag-handle">⋮⋮</span>
                    <div class="file-type-icon">PDF</div>
                    <span class="file-name"></span>
                    <span class="file-size">${sizeMB} MB</span>
                </div>
                <button class="remove-btn" data-index="${index}" title="Remove file" aria-label="Remove file">✕</button>
            `;
            item.querySelector('.file-name').textContent = file.name;
            
            // Drag and drop for reordering
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragenter', e => e.preventDefault());
            
            fileList.appendChild(item);
        });

        // Add remove listeners
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                filesToMerge.splice(idx, 1);
                updateFileList();
                if (filesToMerge.length === 0) {
                    listState.style.display = 'none';
                    uploadState.style.display = 'block';
                }
            });
        });
    }

    let draggedItem = null;

    function handleDragStart(e) {
        draggedItem = this;
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDrop(e) {
        e.stopPropagation();
        if (draggedItem !== this) {
            const draggedIdx = parseInt(draggedItem.dataset.index);
            const targetIdx = parseInt(this.dataset.index);
            
            // Swap in array
            const temp = filesToMerge[draggedIdx];
            filesToMerge.splice(draggedIdx, 1);
            filesToMerge.splice(targetIdx, 0, temp);
            
            updateFileList();
        }
        return false;
    }

    mergeBtn.addEventListener('click', async () => {
        if (filesToMerge.length < 2) {
            alert('Please add at least 2 PDF files to merge.');
            return;
        }

        listState.style.display = 'none';
        processingState.style.display = 'block';

        // Add slight delay to allow UI to update before heavy JS task
        setTimeout(async () => {
            try {
                const { PDFDocument } = PDFLib;
                const mergedPdf = await PDFDocument.create();

                for (const file of filesToMerge) {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await PDFDocument.load(arrayBuffer);
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }

                const mergedPdfFile = await mergedPdf.save();
                mergedPdfBlob = new Blob([mergedPdfFile], { type: 'application/pdf' });
                
                processingState.style.display = 'none';
                resultsState.style.display = 'block';
            } catch (error) {
                console.error('Merge Error:', error);
                alert('Something went wrong. A file might be corrupted or password protected.');
                processingState.style.display = 'none';
                listState.style.display = 'block';
            }
        }, 100);
    });

    downloadBtn.addEventListener('click', () => {
        if (!mergedPdfBlob) return;
        const url = URL.createObjectURL(mergedPdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'merged_document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up
    });

    startOverBtn.addEventListener('click', () => {
        filesToMerge = [];
        mergedPdfBlob = null;
        resultsState.style.display = 'none';
        uploadState.style.display = 'block';
    });
});
