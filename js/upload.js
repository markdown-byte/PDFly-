class Uploader {
    constructor(elementId, options) {
        this.element = document.getElementById(elementId);
        if (!this.element) return;
        
        this.fileInput = this.element.querySelector('input[type="file"]');
        this.options = Object.assign({
            accept: '.pdf',
            multiple: false,
            maxSize: 100 * 1024 * 1024, // 100MB
            onFilesSelected: () => {},
            onError: () => {}
        }, options);

        this.init();
    }

    init() {
        if (!this.fileInput) return;

        this.element.addEventListener('click', (e) => {
            if (e.target !== this.fileInput) {
                this.fileInput.click();
            }
        });
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.element.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.element.addEventListener(eventName, () => {
                this.element.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.element.addEventListener(eventName, () => {
                this.element.classList.remove('dragover');
            }, false);
        });

        this.element.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length > 0) {
                this.handleFiles(dt.files);
            }
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.handleFiles(e.target.files);
            }
            this.fileInput.value = ''; // Reset for consecutive same-file uploads
        });
    }

    handleFiles(files) {
        let validFiles = [];
        let error = null;

        Array.from(files).forEach(file => {
            const fileName = file.name || '';
            const ext = fileName.includes('.') ? ('.' + fileName.split('.').pop().toLowerCase()) : '';
            const fileType = (file.type || '').toLowerCase();
            const acceptedOption = (this.options.accept || '').toLowerCase();
            let isAccepted = false;

            const isPdf = ext === '.pdf' || fileType === 'application/pdf' || fileType.includes('pdf');
            const isImage = fileType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'].includes(ext);

            if (acceptedOption.includes('pdf')) {
                if (isPdf) isAccepted = true;
            } else if (acceptedOption.includes('image') || acceptedOption.includes('jpeg') || acceptedOption.includes('jpg') || acceptedOption.includes('png') || acceptedOption.includes('webp')) {
                if (isImage) isAccepted = true;
            } else {
                isAccepted = true;
            }

            if (!isAccepted) {
                error = `Unsupported file: ${file.name}. Please upload ${this.options.accept} files.`;
                return;
            }

            // Check file size (100MB max)
            if (file.size > this.options.maxSize) {
                error = `File too large: ${file.name}. Max size is ${Math.round(this.options.maxSize / (1024*1024))}MB.`;
                return;
            }

            validFiles.push(file);
        });

        if (error) {
            this.options.onError(error);
        } else if (validFiles.length > 0) {
            if (!this.options.multiple) {
                validFiles = [validFiles[0]];
            }
            this.options.onFilesSelected(validFiles);
        }
    }
}
