// Image Steganography Web Application Script
// Handles both the encoding/decoding functionality and certificates display

document.addEventListener('DOMContentLoaded', function() {
    // ============ Encode/Decode Tab Functionality ============
    const encodeTab = document.getElementById('encodeTab');
    const decodeTab = document.getElementById('decodeTab');
    const encodeForm = document.getElementById('encodeForm');
    const decodeForm = document.getElementById('decodeForm');
    const resultSection = document.getElementById('resultSection');

    encodeTab.addEventListener('click', () => {
        encodeTab.style.backgroundColor = 'var(--secondary-color)';
        encodeTab.classList.add('text-white');
        encodeTab.classList.remove('bg-gray-200', 'text-gray-700');
        decodeTab.style.backgroundColor = '#e2e8f0';
        decodeTab.classList.add('text-gray-700');
        decodeTab.classList.remove('text-white');
        encodeForm.classList.remove('hidden');
        decodeForm.classList.add('hidden');
        resultSection.classList.add('hidden');
    });

    decodeTab.addEventListener('click', () => {
        decodeTab.style.backgroundColor = 'var(--secondary-color)';
        decodeTab.classList.add('text-white');
        decodeTab.classList.remove('bg-gray-200', 'text-gray-700');
        encodeTab.style.backgroundColor = '#e2e8f0';
        encodeTab.classList.add('text-gray-700');
        encodeTab.classList.remove('text-white');
        decodeForm.classList.remove('hidden');
        encodeForm.classList.add('hidden');
        resultSection.classList.add('hidden');
    });

    // ============ File Upload Functionality ============
    function setupDropZone(inputId, previewId) {
        const dropZone = document.querySelector(`#${inputId}`).closest('.drop-zone');
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        const previewImg = document.getElementById(`${previewId}Img`);

        dropZone.addEventListener('click', () => input.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('bg-indigo-50');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('bg-indigo-50');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('bg-indigo-50');
            input.files = e.dataTransfer.files;
            updatePreview();
        });

        input.addEventListener('change', updatePreview);

        function updatePreview() {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    preview.classList.remove('hidden');
                    dropZone.querySelector('div:last-child').classList.add('hidden');
                };
                reader.readAsDataURL(input.files[0]);
            }
        }
    }

    setupDropZone('encodeImage', 'encodePreview');
    setupDropZone('decodeImage', 'decodePreview');

    // ============ Encode/Decode Operations ============
    // Encode handling
    document.getElementById('encodeButton').addEventListener('click', async () => {
        const formData = new FormData();
        formData.append('image', document.getElementById('encodeImage').files[0]);
        formData.append('message', document.getElementById('message').value);
        formData.append('password', document.getElementById('encodePassword').value);

        try {
            const response = await fetch('/encode', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                document.getElementById('resultImage').src = data.encoded_image;
                resultSection.classList.remove('hidden');
                resultSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('An error occurred during encoding');
        }
    });

    // Decode handling
    document.getElementById('decodeButton').addEventListener('click', async () => {
        const formData = new FormData();
        formData.append('image', document.getElementById('decodeImage').files[0]);
        formData.append('password', document.getElementById('decodePassword').value);

        try {
            const response = await fetch('/decode', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                document.getElementById('decodedText').textContent = data.message;
                document.getElementById('decodedMessage').classList.remove('hidden');
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('An error occurred during decoding');
        }
    });

    // Download functionality
    document.getElementById('downloadButton').addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = document.getElementById('resultImage').src;
        link.download = 'encoded-image.png';
        link.click();
    });
})

// Certificate Data
const certificates = [
    {
        image: "static/images/Om Prakash Samantray.png",
        title: "Best Paper Award",
        description: "Awarded for outstanding research contribution in Image Steganography. This certificate recognizes the innovative approach and significant impact of our research paper."
    },
    {
        image: "static/images/G Manoj Reddy.png",
        title: "Innovation Excellence",
        description: "Recognition for innovative approach in security algorithms. This award acknowledges the unique methodology developed for image steganography."
    },
    {
        image: "static/images/Y Srinu.png",
        title: "Technical Excellence",
        description: "Awarded for technical proficiency in implementation. This certificate recognizes the sophisticated technical approach used in the project."
    },
    {
        image: "static/images/T S S Sandeep Reddy.png",
        title: "Research Impact",
        description: "Recognition for significant research contribution. This award acknowledges the potential impact of our research in the field of image steganography."
    },
    {
        image: "static/images/G V D Surya Teja.png",
        title: "Publication Excellence",
        description: "Awarded for successful paper publication. This certificate recognizes the quality and significance of our published research work."
    },
    {
        pdf: "static/pdfs/IJSREM31632.pdf",
        title: "Research Paper",
        description: "Image Steganography Using Midpoint Transformation Technique"
    }
];

// ============ Certificate Modal Functionality ============
const modal = document.getElementById('certificateModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');

// PDF loading functionality
async function loadPDF(url, container) {
    container.innerHTML = '';
    
    try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const totalPages = pdf.numPages;
        
        const pagesWrapper = document.createElement('div');
        pagesWrapper.style.overflow = 'auto';
        pagesWrapper.style.height = '75vh';
        container.appendChild(pagesWrapper);

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const canvas = document.createElement('canvas');
            canvas.style.display = 'block';
            canvas.style.margin = '10px auto';
            pagesWrapper.appendChild(canvas);

            const viewport = page.getViewport({ scale: 1.5 });
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
        }

        pagesWrapper.addEventListener('wheel', function(e) {
            const delta = e.deltaY;
            this.scrollTop += delta;
            e.preventDefault();
        }, { passive: false });

    } catch (error) {
        console.error('Error loading PDF:', error);
        container.innerHTML = 'Error loading PDF';
    }
}

// Modal open/close functionality
window.openModal = async function(index) {
    const certificate = certificates[index];
    
    if (index === 5) {
        modalImage.style.display = 'none';
        modalTitle.textContent = certificate.title;
        modalDescription.textContent = certificate.description;
        
        let pdfContainer = document.getElementById('pdfContainer');
        if (!pdfContainer) {
            pdfContainer = document.createElement('div');
            pdfContainer.id = 'pdfContainer';
            pdfContainer.style.width = '100%';
            pdfContainer.style.position = 'relative';
            modalImage.parentNode.insertBefore(pdfContainer, modalImage);
        }

        pdfContainer.style.display = 'block';
        await loadPDF(certificate.pdf, pdfContainer);
    } else {
        let pdfContainer = document.getElementById('pdfContainer');
        if (pdfContainer) {
            pdfContainer.style.display = 'none';
        }
        
        modalImage.src = certificate.image;
        modalImage.style.display = 'block';
        modalTitle.textContent = certificate.title;
        modalDescription.textContent = certificate.description;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

window.closeModal = function() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    const pdfContainer = document.getElementById('pdfContainer');
    if (pdfContainer) {
        pdfContainer.style.display = 'none';
        pdfContainer.innerHTML = '';
    }
}

// Modal event listeners
modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Certificate scrolling functionality
window.scrollCertificates = function(direction) {
    const container = document.querySelector('.certificates-grid');
    const scrollAmount = 580;
    
    if (direction === 'left') {
        container.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    } else {
        container.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }
}
