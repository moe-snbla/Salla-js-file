(function () {
  let STORE_ID = null;
  let lastProductId = null;
  let discountPercentage = 0;
  let debounceTimer = null;

  /* ============================= */
  /* UTILITIES                     */
  /* ============================= */

  function getStoreId() {
    if (window.salla && salla.config) {
      return salla.config.get("store.id");
    }
    return null;
  }

  function extractProductIdFromUrl() {
    const path = window.location.pathname;

    const match =
      path.match(/[\/-]p[\/-]?(\d+)/i) ||
      path.match(/\/products\/(\d+)/i) ||
      path.match(/\/(\d+)$/);

    if (match && match[1]) {
      return parseInt(match[1], 10);
    }

    return null;
  }

  function getProductIdFromDOM() {
    const el = document.querySelector("[data-product-id]");
    if (el && el.dataset.productId) {
      return parseInt(el.dataset.productId, 10);
    }
    return null;
  }

  function getCurrentProductId() {
    return extractProductIdFromUrl() || getProductIdFromDOM();
  }

  function removeButton() {
    const existing = document.getElementById("snbla-save-button");
    if (existing) existing.remove();
  }

  function debounce(fn, delay = 300) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, delay);
  }

  /* ============================= */
  /* API CALL                      */
  /* ============================= */

  async function checkProduct(productId) {
    if (!STORE_ID || !productId) return { show: false };

    try {
      const url = `https://app.snblapay.com/api/v1/storefront/${STORE_ID}/check/${productId}`;
      console.log("SNBLA: Checking product", productId);

      const response = await fetch(url);

      if (!response.ok) {
        console.error("SNBLA: API error", response.status);
        return { show: false };
      }

      const result = await response.json();

      discountPercentage = result.discountPercentage || 0;

      return result.data || { show: false };
    } catch (err) {
      console.error("SNBLA: API failed", err);
      return { show: false };
    }
  }

  /* ============================= */
  /* BUTTON CREATION               */
  /* ============================= */

  function createButton(redirectUrl) {
    if (document.getElementById("snbla-save-button")) return;

    const addToCartButton = document.querySelector(
      "salla-add-product-button, [data-add-to-cart], .add-to-cart-btn, button[aria-label='Add to cart']",
    );

    if (!addToCartButton) {
      console.log("SNBLA: Add to cart not found, retrying...");
      debounce(handleProductPage, 500);
      return;
    }

    const btn = document.createElement("button");
    btn.id = "snbla-save-button";

    btn.style.cssText = `
      color:#4c4c4c;
      border:1px solid #474df4;
      border-radius:12px;
      padding:8px 16px;
      margin-top:10px;
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:4px;
      width:100%;
    `;

    btn.innerHTML = `
      <span style="font-weight:700;color:#27272A;direction:rtl;">ليس الان؟</span>
      <span style="color:#71717B;direction:rtl;"> - ادخر واحصل على خصم</span>
      <span style="
        background:#ECFDF5;
        border:1px solid #A7F3D0;
        border-radius:25px;
        padding:0 12px;
        margin-left:10px;
        font-size:12px;
        font-weight:600;
        color:#047857;
        white-space:nowrap;
      ">% ${discountPercentage}</span>
    `;

    btn.onclick = function (e) {
      e.preventDefault();

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        alert("Product saved!");
      }
    };

    addToCartButton.parentNode.insertBefore(btn, addToCartButton.nextSibling);
  }

  /* ============================= */
  /* MAIN PRODUCT HANDLER          */
  /* ============================= */

  async function handleProductPage() {
    if (!STORE_ID) return;

    const productId = getCurrentProductId();

    if (!productId) {
      removeButton();
      lastProductId = null;
      return;
    }

    if (productId === lastProductId) {
      return; // prevent duplicate API calls
    }

    lastProductId = productId;

    const { show, redirectUrl } = await checkProduct(productId);

    if (!show) {
      removeButton();
      return;
    }

    createButton(redirectUrl);
  }

  /* ============================= */
  /* INITIALIZATION                */
  /* ============================= */

  function init() {
    STORE_ID = getStoreId();

    if (!STORE_ID) {
      console.warn("SNBLA: Store ID not available");
      return;
    }

    console.log("SNBLA initialized for store", STORE_ID);

    debounce(handleProductPage);
  }

  /* ============================= */
  /* EVENTS                        */
  /* ============================= */

  document.addEventListener("DOMContentLoaded", init);

  document.addEventListener("salla.page.loaded", function () {
    if (!STORE_ID) {
      STORE_ID = getStoreId();
    }
    debounce(handleProductPage);
  });
})();
