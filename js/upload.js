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
        this.element.addEventListener('click', () => this.fileInput.click());
        
        // Drag and drop events
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
            const files = dt.files;
            this.handleFiles(files);
        });

        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
            this.fileInput.value = ''; // Reset for consecutive same-file uploads
        });
    }

    handleFiles(files) {
        let validFiles = [];
        let error = null;

        Array.from(files).forEach(file => {
            // Robust check for PDF and images across mobile/desktop OS
            const isPdf = ext === '.pdf' || file.type === 'application/pdf' || file.type.includes('pdf');
            const isImage = file.type.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);

            if (this.options.accept.includes('pdf')) {
                if (isPdf) isAccepted = true;
            } else if (this.options.accept.includes('image') || this.options.accept.includes('jpeg') || this.options.accept.includes('png')) {
                if (isImage) isAccepted = true;
            } else if (acceptedTypes.includes(ext) || acceptedTypes.includes(file.type.toLowerCase())) {
                isAccepted = true;
            }

            if (!isAccepted) {
                error = `Unsupported file: ${file.name}. Please upload ${this.options.accept} files.`;
                return;
            }

            // Check file size
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
