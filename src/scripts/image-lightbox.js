/**
 * Image lightbox functionality for blog posts
 * Allows images to be clicked to expand to full size in a modal
 */

document.addEventListener('DOMContentLoaded', () => {
  const images = document.querySelectorAll('.post-content img');
  
  images.forEach(img => {
    // Skip if image is already wrapped
    if (img.closest('.image-lightbox-wrapper')) return;
    
    // Wrap the image
    const wrapper = document.createElement('div');
    wrapper.className = 'image-lightbox-wrapper';
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    
    // Add click handler
    img.addEventListener('click', () => {
      showLightbox(img.src, img.alt);
    });
    
    // Add cursor pointer
    img.style.cursor = 'pointer';
  });
});

function showLightbox(imageSrc, imageAlt) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'image-lightbox-modal';
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'image-lightbox-content';
  
  // Create image
  const img = document.createElement('img');
  img.src = imageSrc;
  img.alt = imageAlt;
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'image-lightbox-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close');
  
  // Assemble modal
  modalContent.appendChild(img);
  modal.appendChild(modalContent);
  modal.appendChild(closeBtn);
  
  // Add to page
  document.body.appendChild(modal);
  
  // Show modal with animation
  setTimeout(() => {
    modal.classList.add('active');
  }, 10);
  
  // Close handlers
  const closeModal = () => {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
    }, 300);
  };
  
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Close on Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}
