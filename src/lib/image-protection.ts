/**
 * Image Protection Utilities
 * Provides functions to protect images from copying, screenshots, and unauthorized access
 */

export function initializeImageProtection() {
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Disable keyboard shortcuts for screenshots and saving
  document.addEventListener('keydown', (e) => {
    // Disable Print Screen
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+S (Save)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+P (Print)
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      return false;
    }

    // Disable F12 (Developer Tools)
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+I (Developer Tools)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+C (Inspect Element)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+J (Console)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }
  });

  // Disable drag and drop for images
  document.addEventListener('dragstart', (e) => {
    if ((e.target as HTMLElement).tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  });

  // Disable copy for images
  document.addEventListener('copy', (e) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length === 0) {
      e.preventDefault();
      return false;
    }
  });

  // Disable developer tools detection
  const devtools = { open: false, orientation: null as string | null };
  const threshold = 160;

  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold || window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        // Optional: redirect or show warning
      }
    } else {
      devtools.open = false;
    }
  }, 500);
}
