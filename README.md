# PDF Toolkit

A fast, modern, and privacy-focused web application offering client-side PDF tools. Built with HTML, CSS, and Vanilla JavaScript.

## Features
- **Merge PDF**: Combine multiple PDFs into one.
- **Split PDF**: Extract specific pages from a PDF.
- **Compress PDF**: Reduce file size by optimizing PDF structure.
- **JPG to PDF**: Convert images (JPG, PNG, WebP) into a single PDF.
- **PDF to JPG**: Extract all pages from a PDF as high-quality JPGs.

All tools process files entirely in the user's browser, ensuring 100% privacy and blazing-fast performance. No files are uploaded to any server.

## Libraries Used
- **pdf-lib**: For merging, splitting, compressing, and embedding images into PDFs.
- **pdf.js**: For rendering PDF pages to canvas to export as JPGs.
- **JSZip**: For packaging multiple exported images into a single ZIP file.

## Local Development
Since this project consists entirely of static HTML, CSS, and Vanilla JavaScript, no build step or package manager is required. 
1. Clone the repository.
2. Open `index.html` directly in your browser or run a simple local server:
```bash
npx serve .
```

## GitHub Deployment
1. Create a new repository on GitHub.
2. Push the contents of this folder to the main branch.
3. You can enable GitHub Pages to host it directly from the repository.

## Vercel Deployment
This project is fully ready for Vercel deployment without any configuration required.
1. Log in to Vercel and click **Add New Project**.
2. Import your GitHub repository.
3. Ensure the Framework Preset is set to **Other** (since it's purely static).
4. Click **Deploy**. Vercel will automatically serve the static files and provide a global CDN for high performance.
