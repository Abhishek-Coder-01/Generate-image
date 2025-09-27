
    // Main DOM Content Loaded
    document.addEventListener('DOMContentLoaded', function () {
      // Theme toggle functionality
      const themeToggle = document.getElementById('themeToggle');
      const themeIcon = document.getElementById('themeIcon');
      const body = document.body;

      // Fixed: Added try-catch for localStorage
      let currentTheme = 'light';
      try {
        currentTheme = localStorage.getItem('theme') || 'light';
      } catch (e) {
        console.warn('LocalStorage not available, using default theme');
      }

      body.setAttribute('data-theme', currentTheme);
      updateThemeIcon(currentTheme);

      function updateThemeIcon(theme) {
        if (!themeIcon) return;

        if (theme === 'dark') {
          themeIcon.innerHTML = `
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" 
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            `;
        } else {
          themeIcon.innerHTML = `
                <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            `;
        }
      }

      if (themeToggle) {
        themeToggle.addEventListener('click', function () {
          const newTheme = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
          body.setAttribute('data-theme', newTheme);
          try {
            localStorage.setItem('theme', newTheme);
          } catch (e) {
            console.warn('Could not save theme to localStorage');
          }
          updateThemeIcon(newTheme);
          showNotification(`Switched to ${newTheme} mode`);
        });
      }

      // Initialize the app after theme setup
      init();
    });

    // API configuration
    const API_BASE_URL = 'https://api.studio.nebius.com/v1/';
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IlV6SXJWd1h0dnprLVRvdzlLZWstc0M1akptWXBvX1VaVkxUZlpnMDRlOFUiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiJnb29nbGUtb2F1dGgyfDExMzkxMjU2OTAwMzA1NzQ2MTEyOSIsInNjb3BlIjoib3BlbmlkIG9mZmxpbmVfYWNjZXNzIiwiaXNzIjoiYXBpX2tleV9pc3N1ZXIiLCJhdWQiOlsiaHR0cHM6Ly9uZWJpdXMtaW5mZXJlbmNlLmV1LmF1dGgwLmNvbS9hcGkvdjIvIl0sImV4cCI6MTkxNjYwOTYwNywidXVpZCI6IjAxOTk4ODVmLWU2MjgtN2M4Yy1iODc1LTc5MDYyYjM3NzE0NCIsIm5hbWUiOiJNeSBUZXN0IEtleSIsImV4cGlyZXNfYXQiOiIyMDMwLTA5LTI1VDIzOjMzOjI3KzAwMDAifQ.yJOs1UbwN0YU_nry_qn-Zie9OTQvKAnoOUFr8lRoY2I'; // Replace with your actual API key

    // DOM elements
    const promptInput = document.getElementById('prompt');
    const negativePromptInput = document.getElementById('negativePrompt');
    const ratioSelect = document.getElementById('ratio');
    const generateBtn = document.getElementById('generateBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const galleryGrid = document.getElementById('galleryGrid');
    const imageCount = document.getElementById('imageCount');
    const clearGalleryBtn = document.getElementById('clearGallery');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    const historyToggle = document.getElementById('historyToggle');
    const closeHistory = document.getElementById('closeHistory');
    const historyPanel = document.getElementById('historyPanel');
    const historyList = document.getElementById('historyList');

    // Aspect ratio mappings
    const ratioDimensions = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1024, height: 1024 },
      '9:16': { width: 1024, height: 1024 },
      '4:3': { width: 1024, height: 1024 },
      '3:4': { width: 1024, height: 1024 }
    };

    // State management
    let generatedImages = [];
    let promptHistory = [];

    // Load data from localStorage
    try {
      const savedImages = localStorage.getItem('astraforge_images');
      const savedHistory = localStorage.getItem('astraforge_history');

      generatedImages = savedImages ? JSON.parse(savedImages) : [];
      promptHistory = savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) {
      console.warn('Could not load data from localStorage');
      generatedImages = [];
      promptHistory = [];
    }

    // Initialize the app
    function init() {
      updateGallery();
      updateHistoryList();
      setupEventListeners();
    }

    // Set up event listeners
    function setupEventListeners() {
      if (generateBtn) {
        generateBtn.addEventListener('click', generateImage);
      }

      // Fixed: Only one event listener for clearGalleryBtn
      if (clearGalleryBtn) {
        clearGalleryBtn.addEventListener('click', openClearModal);
      }

      if (historyToggle) {
        historyToggle.addEventListener('click', () => {
          historyPanel.classList.toggle('translate-x-full');
        });
      }

      if (closeHistory) {
        closeHistory.addEventListener('click', () => {
          historyPanel.classList.add('translate-x-full');
        });
      }

      // Close history panel when clicking outside (for mobile)
      document.addEventListener('click', (e) => {
        if (historyPanel && !historyPanel.contains(e.target) && historyToggle && !historyToggle.contains(e.target)) {
          historyPanel.classList.add('translate-x-full');
        }
      });

      // Enter key to generate (Ctrl+Enter or Cmd+Enter)
      if (promptInput) {
        promptInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            generateImage();
          }
        });
      }
    }

    // Generate image function
    async function generateImage() {
      if (!promptInput) return;

      const prompt = promptInput.value.trim();
      const negativePrompt = negativePromptInput ? negativePromptInput.value.trim() : '';
      const ratio = ratioSelect ? ratioSelect.value : '1:1';

      if (!prompt) {
        showNotification('Please enter a prompt', 'error');
        promptInput.focus();
        return;
      }

      // Show loading state
      generateBtn.disabled = true;
      if (loadingSpinner) loadingSpinner.classList.remove('hidden');
      generateBtn.innerHTML = 'Generating... <div class="loading-spinner"></div>';

      try {
        const dimensions = ratioDimensions[ratio];

        // Fixed: Added proper error handling for fetch
        const response = await fetch(`${API_BASE_URL}images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            model: "black-forest-labs/flux-dev",
            response_format: "b64_json",
            response_extension: "png",
            width: dimensions.width,
            height: dimensions.height,
            num_inference_steps: 28,
            negative_prompt: negativePrompt || "",
            seed: -1,
            loras: null,
            prompt: prompt
          })
        });

        if (!response.ok) {
          let errorMessage = `API error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorMessage;
          } catch (e) {
            // Ignore JSON parsing errors
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (data.data && data.data[0] && data.data[0].b64_json) {
          const imageData = {
            id: Date.now(),
            prompt: prompt,
            negativePrompt: negativePrompt,
            ratio: ratio,
            timestamp: new Date().toISOString(),
            b64Data: data.data[0].b64_json
          };

          // Add to generated images
          generatedImages.unshift(imageData);

          // Save to localStorage
          try {
            localStorage.setItem('astraforge_images', JSON.stringify(generatedImages));
          } catch (e) {
            console.warn('Could not save images to localStorage');
          }

          // Add to history if not duplicate
          if (!promptHistory.some(item => item.prompt === prompt && item.type === 'prompt')) {
            promptHistory.unshift({
              type: 'prompt',
              prompt: prompt,
              timestamp: new Date().toISOString()
            });
            // Keep only last 50 history items
            promptHistory = promptHistory.slice(0, 50);
            try {
              localStorage.setItem('astraforge_history', JSON.stringify(promptHistory));
            } catch (e) {
              console.warn('Could not save history to localStorage');
            }
            updateHistoryList();
          }

          // Update gallery
          updateGallery();

          showNotification('Image generated successfully!', 'success');

        } else {
          throw new Error('Invalid response format from API');
        }

      } catch (error) {
        console.error('Error generating image:', error);
        showNotification(`Error: ${error.message}`, 'error');
      } finally {
        // Reset loading state
        generateBtn.disabled = false;
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
        generateBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M22 2L18 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13 11L18 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Generate
        `;
      }
    }

    // Update gallery display - Fixed: Better layout and scrolling
    function updateGallery() {
      if (!galleryGrid) return;

      if (generatedImages.length === 0) {
        galleryGrid.innerHTML = `
            <div class="gallery-placeholder liquid-glass">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 16L8 12L11.5 15.5L14.5 12.5L16 14M4 16V20H20V4H4V16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p class="text-sm text-center mt-2">Generated images will appear here</p>
                <p class="text-xs mt-1 text-center">Enter a prompt and click Generate to begin</p>
            </div>
        `;
        if (clearGalleryBtn) clearGalleryBtn.disabled = true;
      } else {
        // Fixed: Better responsive grid layout
        galleryGrid.innerHTML = generatedImages.map(image => {
          const safePrompt = image.prompt ? image.prompt.replace(/"/g, '&quot;') : '';
          return `
            <div class="image-card rounded-xl overflow-hidden fade-in liquid-glass">
                <div class="relative group">
                    <img class="fit" src="data:image/png;base64,${image.b64Data}" 
                         alt="${safePrompt}"
                         class="w-full h-48 object-cover fit rounded-t-xl" />
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div class="flex gap-2">
                            <button onclick="downloadImage('${image.id}')" class="action-btn p-2 rounded-full text-white bg-opacity-80 hover:bg-opacity-100 liquid-glass">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button onclick="deleteImage('${image.id}')" class="action-btn p-2 rounded-full text-white bg-opacity-80 hover:bg-opacity-100 liquid-glass">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="p-3">
                    <p class="text-sm font-medium truncate" title="${safePrompt}">${image.prompt || 'No prompt'}</p>
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-xs text-slate-500 dark:text-slate-400">${new Date(image.timestamp).toLocaleDateString()}</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">${image.ratio}</span>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        if (clearGalleryBtn) clearGalleryBtn.disabled = false;
      }

      if (imageCount) {
        imageCount.textContent = `${generatedImages.length} image${generatedImages.length !== 1 ? 's' : ''}`;
      }
    }

    // Clear gallery modal functions
    function openClearModal() {
      document.getElementById('clearModal').classList.remove('hidden');
    }

    function closeClearModal() {
      document.getElementById('clearModal').classList.add('hidden');
    }

    function confirmClearGallery() {
      generatedImages = [];
      try {
        localStorage.setItem('astraforge_images', JSON.stringify(generatedImages));
      } catch (e) {
        console.warn('Could not clear images from localStorage');
      }
      updateGallery();
      showNotification('Gallery cleared', 'info');
      closeClearModal();
    }

    // Delete single image
    function deleteImage(id) {
      generatedImages = generatedImages.filter(img => img.id !== parseInt(id));
      try {
        localStorage.setItem('astraforge_images', JSON.stringify(generatedImages));
      } catch (e) {
        console.warn('Could not delete image from localStorage');
      }
      updateGallery();
      showNotification('Image deleted', 'info');
    }

    // Download image
    function downloadImage(id) {
      const image = generatedImages.find(img => img.id === parseInt(id));
      if (image) {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${image.b64Data}`;
        link.download = `Image-${image.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Image downloaded', 'success');
      }
    }

    // Update history list
    function updateHistoryList() {
      if (!historyList) return;

      if (promptHistory.length === 0) {
        historyList.innerHTML = `
            <div class="text-center text-slate-500 dark:text-slate-400 py-8">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-2 opacity-50">
                    <path d="M12 8V12L15 15M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p class="text-sm">No prompt history yet</p>
            </div>
        `;
      } else {
        historyList.innerHTML = promptHistory.map((item, index) => {
          if (!item) return '';

          if (item.type === 'image') {
            const image = generatedImages.find(img => img.id === item.imageId);
            if (!image || !image.prompt) return '';

            const safePrompt = image.prompt ? image.prompt.replace(/"/g, '&quot;') : '';
            return `
                    <div class="history-item p-3 rounded-lg cursor-pointer liquid-glass" onclick="openImageFromHistory('${image.id}')">
                        <div class="flex gap-3">
                            <div class="flex-shrink-0">
                                <img src="data:image/png;base64,${image.b64Data}" 
                                     alt="${safePrompt}"
                                     class="w-12 h-12 object-cover rounded-lg">
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title="${safePrompt}">${image.prompt || 'No prompt'}</p>
                                <div class="flex justify-between items-center mt-1">
                                    <span class="text-xs text-slate-500 dark:text-slate-400">${item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Unknown date'}</span>
                                    <span class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1 rounded">Image</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
          } else {
            if (!item.prompt) return '';

            const safePrompt = item.prompt.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const displayPrompt = item.prompt || 'No prompt';

            return `
                    <div class="history-item p-3 rounded-lg cursor-pointer liquid-glass" onclick="useHistoryPrompt('${safePrompt}')">
                        <div class="flex items-start gap-3">
                            <div class="flex-shrink-0 mt-1">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-slate-400">
                                    <path d="M12 8V12L15 15M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm  truncate" title="${safePrompt}">${displayPrompt}</p>
                                <div class="flex justify-between items-center mt-1">
                                    <span class="text-xs text-slate-500 dark:text-slate-400">${item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Unknown date'}</span>

                                    <div>
                                    <span class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1 rounded">Prompt</span>
                                     
                                    
                                    <button class="text-xs text-red-500 hover:underline ml-2"
                                    onclick="event.stopPropagation(); deleteHistoryItem(${index});">
                                   <span class="text-red-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
                                   </button>
                                   </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
          }
        }).filter(item => item !== '').join('');

        if (historyList.innerHTML === '') {
          historyList.innerHTML = `
                <div class="text-center text-slate-500 dark:text-slate-400 py-8">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-2 opacity-50">
                        <path d="M12 8V12L15 15M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p class="text-sm">No valid prompt history</p>
                </div>
            `;
        }
      }
    }

    // Delete history item
    function deleteHistoryItem(index) {
      if (index >= 0 && index < promptHistory.length) {
        promptHistory.splice(index, 1);
        try {
          localStorage.setItem('astraforge_history', JSON.stringify(promptHistory));
        } catch (e) {
          console.warn('Could not delete history item from localStorage');
        }
        updateHistoryList();
        showNotification('History item deleted', 'info');
      }
    }

    // Use prompt from history
    function useHistoryPrompt(prompt) {
      if (promptInput) {
        promptInput.value = prompt;
        promptInput.focus();
      }
      if (historyPanel) historyPanel.classList.add('translate-x-full');
      showNotification('Prompt loaded from history', 'info');
    }

    // Open image from history
    function openImageFromHistory(imageId) {
      const image = generatedImages.find(img => img.id === parseInt(imageId));
      if (image) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4';
        modal.innerHTML = `
            <div class="relative max-w-4xl max-h-full w-full">
                <div class="glass rounded-2xl overflow-hidden liquid-glass">
                    <div class="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                        <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 truncate" title="${image.prompt.replace(/"/g, '&quot;')}">${image.prompt}</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 action-btn rounded-full p-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    <div class="p-4 max-h-96 overflow-auto">
                        <img src="data:image/png;base64,${image.b64Data}" 
                             alt="${image.prompt.replace(/"/g, '&quot;')}"
                             class="w-full h-auto object-contain max-h-80 rounded-lg">
                    </div>
                    <div class="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span class="text-sm text-slate-600 dark:text-slate-400">Generated: ${new Date(image.timestamp).toLocaleString()}</span>
                        <div class="flex gap-2">
                            <button onclick="downloadImage('${image.id}')" class="action-btn px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Download
                            </button>
                            <button onclick="regenerateImage('${image.id}')" class="generate-btn px-3 py-1 rounded-lg text-sm text-white flex items-center gap-1">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M22 2L18 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M13 11L18 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Regenerate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.remove();
          }
        });

        document.body.appendChild(modal);
        if (historyPanel) historyPanel.classList.add('translate-x-full');
      } else {
        showNotification('Image not found', 'error');
      }
    }

    // Regenerate image with same prompt
    function regenerateImage(imageId) {
      const image = generatedImages.find(img => img.id === parseInt(imageId));
      if (image && promptInput && negativePromptInput && ratioSelect) {
        promptInput.value = image.prompt;
        negativePromptInput.value = image.negativePrompt;
        ratioSelect.value = image.ratio;
        generateImage();
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) modal.remove();
      }
    }

    // Show notification
    function showNotification(message, type = 'info') {
      if (!notification || !notificationText) return;

      const colors = {
        success: 'text-green-800 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-900/20 dark:border-green-800',
        error: 'text-red-800 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900/20 dark:border-red-800',
        info: 'text-blue-800 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-800',
        warning: 'text-yellow-800 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-800'
      };

      // Reset & apply colors
      notification.className = `notification fixed top-5 right-5 px-6 py-3 rounded-xl transform transition-all duration-300 z-50 border ${colors[type] || colors.info}`;
      notificationText.textContent = message;

      // Start hidden off-screen
      notification.classList.remove('hidden');
      notification.classList.add('translate-x-full', 'opacity-0');

      // Force reflow so transition triggers
      void notification.offsetWidth;

      // Slide in
      notification.classList.remove('translate-x-full', 'opacity-0');
      notification.classList.add('translate-x-0', 'opacity-100');

      // Slide out after 3s
      setTimeout(() => {
        notification.classList.remove('translate-x-0', 'opacity-100');
        notification.classList.add('translate-x-full', 'opacity-0');

        // Hide completely after transition
        setTimeout(() => {
          notification.classList.add('hidden');
        }, 300);
      }, 3000);
    }

    // Make functions globally available for onclick handlers
    window.downloadImage = downloadImage;
    window.deleteImage = deleteImage;
    window.useHistoryPrompt = useHistoryPrompt;
    window.openImageFromHistory = openImageFromHistory;
    window.regenerateImage = regenerateImage;
    window.openClearModal = openClearModal;
    window.closeClearModal = closeClearModal;
    window.confirmClearGallery = confirmClearGallery;
    window.deleteHistoryItem = deleteHistoryItem;
