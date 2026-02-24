  document.addEventListener("DOMContentLoaded", () => {
    console.log("SNBLA snippet loaded for merchant", {{store.id}});

    const STORE_ID = {{store.id}}; // Salla injects this

    function extractProductIdFromUrl() {
      // Salla product URLs typically look like: /products/p-123456 or /p-123456
      const path = window.location.pathname;
      
      // Try to extract numeric ID from patterns like p-123456
      const match = path.match(/[\/-]p[\/-]?(\d+)/i) || path.match(/\/(\d+)$/);
      
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
      
      return null;
    }

    let discount_percentage;
    async function checkProductWithApi(productId) {
      if (!productId) return { show: false };

      try {
        const apiUrl = `https://app.snblapay.com/api/v1/storefront/${STORE_ID}/check/${productId}`;
        console.log(`SNBLA: Checking API for product ${productId}`, apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.error(`SNBLA: API error - ${response.status}`);
          return { show: false };
        }

        const data = await response.json();
        console.log(`SNBLA: API response for product ${productId}:`, data);
        discount_percentage = data.discountPercentage
        
        return data.data; // Returns { show: boolean, redirectUrl: string|null }
      } catch (error) {
        console.error("SNBLA: API call failed:", error);
        return { show: false };
      }
    }

    async function shouldShowButton() {
      // First check if we're on a product page
      const isProductPage = 
        window.location.pathname.includes('/products/') || 
        window.location.pathname.match(/\/p-?\d+/) ||
        document.querySelector('[data-product-id]') !== null ||
        document.querySelector('salla-product-view') !== null;
      
      if (!isProductPage) {
        console.log("SNBLA: Not a product page");
        return { show: false };
      }

      // Try to get product ID from URL
      const urlProductId = extractProductIdFromUrl();
      if (urlProductId) {
        console.log(`SNBLA: Found product ID ${urlProductId} in URL, checking API...`);
        return await checkProductWithApi(urlProductId);
      }

      // Try to get product ID from DOM (Salla often stores it in data attributes)
      const productElement = document.querySelector('[data-product-id]');
      if (productElement) {
        const domProductId = parseInt(productElement.dataset.productId, 10);
        console.log(`SNBLA: Found product ID ${domProductId} in DOM, checking API...`);
        return await checkProductWithApi(domProductId);
      }

      console.log("SNBLA: Could not determine product ID");
      return { show: false };
    }

    async function addSaveButton() {
      // Check if we should show the button based on API
      const { show, redirectUrl } = await shouldShowButton();
      
      if (!show) {
        console.log("SNBLA: API returned show=false, not adding button");
        
        // Remove button if it exists (for cases where product changed)
        const existingBtn = document.getElementById("snbla-save-button");
        if (existingBtn) existingBtn.remove();
        return;
      }

      console.log("SNBLA: API returned show=true, adding Save button", redirectUrl);

      // Check if button already exists
      if (document.getElementById("snbla-save-button")) return;

      // Find the add-to-cart button
      const addToCartButton = document.querySelector(
        'salla-add-product-button, [data-add-to-cart], .add-to-cart-btn, button[aria-label="Add to cart"]'
      );

      if (!addToCartButton) {
        console.log("SNBLA: Add to cart button not found yet, retrying...");
        setTimeout(addSaveButton, 500);
        return;
      }

      console.log("SNBLA: Found add to cart button, adding Save button");

      // Create the Save button
      const saveBtn = document.createElement("button");
      saveBtn.id = "snbla-save-button";
      saveBtn.style.color = "#4c4c4c";
      saveBtn.style.border = "1px solid #474df4";
      saveBtn.style.borderRadius = "12px";
      saveBtn.style.padding = "8px 16px";
      saveBtn.style.marginTop = "10px";
      saveBtn.style.cursor = "pointer";
      saveBtn.style.display = "flex";
      saveBtn.style.alignItems = "center";
      saveBtn.style.width = "100%";
      saveBtn.style.justifyContent = "center";
      saveBtn.style.gap = "4px";
      
      // Create the button icon
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "24");
      svg.setAttribute("height", "24");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      
      // Create first path (heart shape)
      const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path1.setAttribute("d", "M14.479 19.374L13.508 20.313C13.3217 20.527 13.0919 20.6989 12.834 20.8173C12.5762 20.9357 12.296 20.9978 12.0123 20.9996C11.7285 21.0014 11.4476 20.9428 11.1883 20.8277C10.9289 20.7126 10.697 20.5436 10.508 20.332L5 15C3.5 13.5 2 11.8 2 9.49999C2.00002 8.3872 2.33759 7.30058 2.96813 6.38366C3.59867 5.46674 4.49252 4.76265 5.53161 4.36439C6.5707 3.96613 7.70616 3.89244 8.78801 4.15304C9.86987 4.41364 10.8472 4.99627 11.591 5.82399C11.6434 5.88001 11.7067 5.92466 11.7771 5.95519C11.8474 5.98572 11.9233 6.00148 12 6.00148C12.0767 6.00148 12.1526 5.98572 12.2229 5.95519C12.2933 5.92466 12.3566 5.88001 12.409 5.82399C13.1504 4.99089 14.128 4.40336 15.2116 4.1396C16.2952 3.87583 17.4335 3.94834 18.4749 4.34748C19.5163 4.74661 20.4114 5.45345 21.0411 6.3739C21.6708 7.29435 22.0053 8.38475 22 9.49999C21.9997 10.0047 21.9259 10.5066 21.781 10.99");
      path1.setAttribute("stroke", "#27272A");
      path1.setAttribute("stroke-width", "2");
      path1.setAttribute("stroke-linecap", "round");
      path1.setAttribute("stroke-linejoin", "round");
      
      // Create second path (horizontal line of plus)
      const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path2.setAttribute("d", "M15 15H21");
      path2.setAttribute("stroke", "#27272A");
      path2.setAttribute("stroke-width", "2");
      path2.setAttribute("stroke-linecap", "round");
      path2.setAttribute("stroke-linejoin", "round");
      
      // Create third path (vertical line of plus)
      const path3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path3.setAttribute("d", "M18 12V18");
      path3.setAttribute("stroke", "#27272A");
      path3.setAttribute("stroke-width", "2");
      path3.setAttribute("stroke-linecap", "round");
      path3.setAttribute("stroke-linejoin", "round");
      
      // Append all paths to SVG
      svg.appendChild(path1);
      svg.appendChild(path2);
      svg.appendChild(path3);
            
      // Create the text span (Arabic)
      const boldText = document.createElement("span");
      boldText.innerHTML = "ليس الان؟";
      boldText.style.direction = "rtl";
      boldText.style.fontWeight = 700;
      boldText.style.color = "#27272A";
      
      const textSpan = document.createElement("span");
      textSpan.innerHTML = " - ادخر واحصل على خصم";
      textSpan.style.direction = "rtl"; 
      textSpan.style.color = "#71717B";
      
      // Create the badge for 10%
      const badge = document.createElement("span");
      badge.innerHTML = `% ${discount_percentage ? discount_percentage : 0}`;
      badge.style.backgroundColor = "#ECFDF5"; 
      badge.style.border = "1px solid #A7F3D0";
      badge.style.borderRadius = "25px";
      badge.style.padding = "0px 12px";
      badge.style.marginLeft = "10px"; 
      badge.style.fontSize = "12px";
      badge.style.fontWeight = "600";
      badge.style.color = "#047857"; 
      badge.style.whiteSpace = "nowrap";
      
      // Assemble the button
      saveBtn.appendChild(svg);
      saveBtn.appendChild(boldText);
      saveBtn.appendChild(textSpan);
      saveBtn.appendChild(badge);
  
      saveBtn.onclick = function (e) {
        e.preventDefault();
        console.log("SNBLA: Save button clicked for product");
        
        if (redirectUrl) {
          console.log(`SNBLA: Redirecting to ${redirectUrl}`);
          window.location.href = redirectUrl;
        } else {
          alert("Product saved!");
          // Add your custom save logic here
        }
      };
  
      // Insert after the add-to-cart button
      addToCartButton.parentNode.insertBefore(saveBtn, addToCartButton.nextSibling);
    }
  
    // Debounced version to avoid multiple rapid calls
    let timeoutId = null;
    function debouncedAddSaveButton() {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        addSaveButton();
        timeoutId = null;
      }, 300);
    }
  
    // Initialize based on DOM ready state
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", debouncedAddSaveButton);
    } else {
      debouncedAddSaveButton();
    }
  
    // Handle Salla's dynamic page navigation
    document.addEventListener('salla.page.loaded', debouncedAddSaveButton);
  
    // Watch for URL changes (for SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        debouncedAddSaveButton();
      }
    }).observe(document, { subtree: true, childList: true });
});