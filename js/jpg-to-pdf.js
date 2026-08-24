document.addEventListener('DOMContentLoaded', () => {
    let images = [];
    let convertedPdfBlob = null;

    const uploadState = document.getElementById('upload-state');
    const listState = document.getElementById('list-state');
    const processingState = document.getElementById('processing-state');
    const resultsState = document.getElementById('results-state');
    const imageList = document.getElementById('image-list');
    const errorMsg = document.getElementById('error-msg');
    
    // Settings
    const orientationSelect = document.getElementById('orientation');
    
    // Buttons
    const convertBtn = document.getElementById('convert-btn');
    const downloadBtn = document.getElementById('download-btn');
    const startOverBtn = document.getElementById('start-over-btn');
    const addMoreBtn = document.getElementById('add-more-btn');
    const hiddenAddInput = document.getElementById('hidden-add-input');

    const uploader = new Uploader('image-uploader', {
        accept: 'image/jpeg, image/png, image/webp',
        multiple: true,
        onFilesSelected: (files) => {
            errorMsg.style.display = 'none';
            handleNewImages(files);
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
        handleNewImages(Array.from(e.target.files));
        hiddenAddInput.value = '';
    });

    function handleNewImages(files) {
        files.forEach(f => {
            if (f.type.startsWith('image/')) {
                const url = URL.createObjectURL(f);
                images.push({ file: f, url: url });
            }
        });
        updateImageList();
    }

    function updateImageList() {
        imageList.innerHTML = '';
        images.forEach((imgObj, index) => {
            const item = document.createElement('div');
            item.className = 'image-preview-item';
            item.draggable = true;
            item.dataset.index = index;
            
            const img = document.createElement('img');
            img.src = imgObj.url;
            img.alt = imgObj.file.name;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '✕';
            removeBtn.title = "Remove image";
            removeBtn.dataset.index = index;
            
            item.appendChild(img);
            item.appendChild(removeBtn);
            
            // Drag and drop events
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragenter', e => e.preventDefault());
            
            imageList.appendChild(item);
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                URL.revokeObjectURL(images[idx].url);
                images.splice(idx, 1);
                updateImageList();
                if (images.length === 0) {
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
            
            const temp = images[draggedIdx];
            images.splice(draggedIdx, 1);
            images.splice(targetIdx, 0, temp);
            
            updateImageList();
        }
        return false;
    }

    async function fileToUint8Array(file) {
        return new Uint8Array(await file.arrayBuffer());
    }

    convertBtn.addEventListener('click', async () => {
        if (images.length === 0) return;

        listState.style.display = 'none';
        processingState.style.display = 'block';

        setTimeout(async () => {
            try {
                const { PDFDocument } = PDFLib;
                const pdfDoc = await PDFDocument.create();
                const orientation = orientationSelect.value;

                for (const imgObj of images) {
                    const imgBytes = await fileToUint8Array(imgObj.file);
                    let pdfImage;
                    
                    if (imgObj.file.type === 'image/jpeg') {
                        pdfImage = await pdfDoc.embedJpg(imgBytes);
                    } else if (imgObj.file.type === 'image/png') {
                        pdfImage = await pdfDoc.embedPng(imgBytes);
                    } else {
                        // WebP workaround: draw to canvas and get PNG bytes
                        const img = new Image();
                        img.src = imgObj.url;
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                        });
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        const dataUrl = canvas.toDataURL('image/png');
                        const base64 = dataUrl.split(',')[1];
                        pdfImage = await pdfDoc.embedPng(base64);
                    }

                    const dims = pdfImage.scale(1);
                    
                    // A4 size in points is approx [595.28, 841.89]
                    let pageW, pageH;
                    
                    if (orientation === 'portrait') {
                        pageW = 595.28;
                        pageH = 841.89;
                    } else if (orientation === 'landscape') {
                        pageW = 841.89;
                        pageH = 595.28;
                    } else { // auto
                        if (dims.width > dims.height) {
                            pageW = 841.89;
                            pageH = 595.28;
                        } else {
                            pageW = 595.28;
                            pageH = 841.89;
                        }
                    }

                    const page = pdfDoc.addPage([pageW, pageH]);
                    
                    // Scale image to fit within page with margins
                    const scale = Math.min(pageW / dims.width, pageH / dims.height);
                    const scaledW = dims.width * scale;
                    const scaledH = dims.height * scale;
                    
                    const x = (pageW - scaledW) / 2;
                    const y = (pageH - scaledH) / 2;

                    page.drawImage(pdfImage, {
                        x: x,
                        y: y,
                        width: scaledW,
                        height: scaledH,
                    });
                }

                const pdfBytes = await pdfDoc.save();
                convertedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                
                processingState.style.display = 'none';
                resultsState.style.display = 'block';
            } catch (error) {
                console.error(error);
                alert('Something went wrong during conversion.');
                processingState.style.display = 'none';
                listState.style.display = 'block';
            }
        }, 100);
    });

    downloadBtn.addEventListener('click', () => {
        if (!convertedPdfBlob) return;
        const url = URL.createObjectURL(convertedPdfBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'converted_images.pdf';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            if (document.body.contains(a)) document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 15000);
    });

    startOverBtn.addEventListener('click', () => {
        images.forEach(img => URL.revokeObjectURL(img.url));
        images = [];
        convertedPdfBlob = null;
        resultsState.style.display = 'none';
        uploadState.style.display = 'block';
    });
});
