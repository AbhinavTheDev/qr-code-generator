// DOM references (matched to index.html)
const form = document.getElementById("qrForm");
const resetBtn = document.getElementById("resetBtn");

// Preview action buttons
const previewGenerateBtn = document.getElementById("previewGenerateBtn");
const previewCopyBtn = document.getElementById("previewCopyBtn");
const previewDownloadBtn = document.getElementById("previewDownloadBtn");
const previewDownloadPng = document.getElementById("previewDownloadPng");
const previewDownloadWebp = document.getElementById("previewDownloadWebp");
const previewDownloadSvg = document.getElementById("previewDownloadSvg");
const downloadMenu = document.getElementById("downloadMenu");

const urlInput = document.getElementById("url");
const urlError = document.getElementById("urlError");
const plainText = document.getElementById("plainText");

const wifiSsid = document.getElementById("wifiSsid");
const wifiAuth = document.getElementById("wifiAuth");
const wifiPass = document.getElementById("wifiPass");
const wifiHidden = document.getElementById("wifiHidden");

const sizeSel = document.getElementById("size");
const eccSel = document.getElementById("ecc");
const dotsType = document.getElementById("dotsType");
const cornerType = document.getElementById("cornerType");

const fgInput = document.getElementById("fg");
const bgInput = document.getElementById("bg");
const fgColorGroup = document.getElementById("fgColorGroup");
const bgColorGroup = document.getElementById("bgColorGroup");
const bgNone = document.getElementById("bgNone");

const gradFrom = document.getElementById("gradFrom");
const gradTo = document.getElementById("gradTo");
const gradAngle = document.getElementById("gradAngle");
const gradFromGroup = document.getElementById("gradFromGroup");
const gradToGroup = document.getElementById("gradToGroup");

const marginInput = document.getElementById("margin");
const exportScale = document.getElementById("exportScale");

const logoFile = document.getElementById("logoFile");
const clearLogoBtn = document.getElementById("clearLogoBtn");
const logoPreview = document.getElementById("logoPreview");
const logoSize = document.getElementById("logoSize");
const logoRadius = document.getElementById("logoRadius");
const logoSizeVal = document.getElementById("logoSizeVal");
const logoRadiusVal = document.getElementById("logoRadiusVal");

const qrContainer = document.getElementById("qrContainer");
const themeToggle = document.getElementById("themeToggle");
const tabs = Array.from(document.querySelectorAll(".tab"));
const contents = Array.from(document.querySelectorAll(".content"));

// Theme icons
const MOON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z"/></svg>`;
const SUN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="#ffffff"><path d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z"/></svg>`;

// helpers
const debounce = (fn, ms = 160) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
};
const setError = (msg = "") => {
  if (urlError) urlError.textContent = msg;
  if (urlInput) urlInput.setAttribute("aria-invalid", msg ? "true" : "false");
};

// content builders
const normalizeUrl = (v) => {
  const t = String(v || "").trim();
  if (!t) throw new Error("URL is required.");
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(t) ? t : `https://${t}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    throw new Error("Enter a valid URL (example: https://example.com).");
  }
};
const buildWifi = ({ ssid, pass, auth, hidden }) => {
  const T = auth || "WPA";
  const S = (ssid || "").replace(/([;,:"])/g, "\\$1");
  const P = (pass || "").replace(/([;,:"])/g, "\\$1");
  const H = hidden ? "true" : "false";
  return `WIFI:T:${T};S:${S};P:${P};H:${H};;`;
};

// theme management
const THEME_KEY = "qr.theme";

const updateThemeIcon = (theme) => {
  if (themeToggle) {
    themeToggle.innerHTML = theme === "light" ? MOON_ICON : SUN_ICON;
  }
};

const applySavedTheme = () => {
  const t =
    localStorage.getItem(THEME_KEY) ||
    (matchMedia && matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark");
  document.documentElement.setAttribute("data-theme", t);
  updateThemeIcon(t);
};

applySavedTheme();

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const curr = document.documentElement.getAttribute("data-theme") || "dark";
    const next = curr === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    updateThemeIcon(next);
  });
}

// QRCodeStyling instance (initial)
const qr = new QRCodeStyling({
  width: 256,
  height: 256,
  data: "",
  qrOptions: { errorCorrectionLevel: "H", margin: 8 },
  imageOptions: { crossOrigin: "anonymous", margin: 4, imageSize: 0.22 },
  dotsOptions: { color: "#000000", type: "square" },
  cornersSquareOptions: { type: "square", color: "#000000" },
  cornersDotOptions: { color: "#000000" },
  backgroundOptions: { color: "#ffffff" },
});
qr.append(qrContainer);

// state
let logoDataUrl = null;
let contentType = "url";

// helpers for options
const availableSize = (requested) => {
  const max = Math.min(
    640,
    Math.max(128, Math.floor(qrContainer.clientWidth || 420))
  );
  return Math.min(requested, max);
};

// Sync button states
const updateButtonStates = (enabled) => {
  if (previewCopyBtn) previewCopyBtn.disabled = !enabled;
  if (previewDownloadBtn) previewDownloadBtn.disabled = !enabled;
  if (previewDownloadPng) previewDownloadPng.disabled = !enabled;
  if (previewDownloadWebp) previewDownloadWebp.disabled = !enabled;
  if (previewDownloadSvg) previewDownloadSvg.disabled = !enabled;
};

const getData = () => {
  if (contentType === "url") return normalizeUrl(urlInput.value || "");
  if (contentType === "wifi")
    return buildWifi({
      ssid: wifiSsid.value || "",
      pass: wifiPass.value || "",
      auth: wifiAuth.value || "WPA",
      hidden: !!wifiHidden.checked,
    });
  const t = (plainText.value || "").trim();
  if (!t) throw new Error("Text is required.");
  return t;
};

const getOptions = () => {
  const req = parseInt(sizeSel.value || "256", 10);
  const size = availableSize(req);
  const ecc = eccSel.value || "H";
  const margin = Math.max(
    0,
    Math.min(60, parseInt(marginInput.value || "0", 10))
  );
  const fg = fgInput.value || "#000000";
  const bg = bgNone?.classList.contains("active") ? "transparent" : bgInput.value || "#ffffff";
  const dots = { type: dotsType.value || "square" };
  
  // Check if both gradient colors are selected (not "none")
  const gradFromNoneBtn = gradFromGroup?.querySelector(".color-none-btn");
  const gradToNoneBtn = gradToGroup?.querySelector(".color-none-btn");
  const gradFromActive = gradFromNoneBtn && !gradFromNoneBtn.classList.contains("active");
  const gradToActive = gradToNoneBtn && !gradToNoneBtn.classList.contains("active");
  
  if (gradFromActive && gradToActive) {
    dots.gradient = {
      type: "linear",
      rotation:
        (parseInt(gradAngle?.value || "45", 10) || 45) * (Math.PI / 180),
      colorStops: [
        { offset: 0, color: gradFrom.value || fg },
        { offset: 1, color: gradTo.value || fg },
      ],
    };
  } else {
    dots.color = fg;
  }
  
  const imageSize = Math.max(
    0.08,
    (parseInt(logoSize.value || "22", 10) || 22) / 100
  );
  return {
    width: size,
    height: size,
    data: getData(),
    qrOptions: { errorCorrectionLevel: ecc, margin },
    backgroundOptions: { color: bg },
    dotsOptions: dots,
    cornersSquareOptions: { type: cornerType.value || "square", color: fg },
    cornersDotOptions: { color: fg },
    image: logoDataUrl || undefined,
    imageOptions: {
      crossOrigin: "anonymous",
      hideBackgroundDots: false,
      imageSize,
      margin: Math.max(0, Math.min(8, parseInt(logoRadius.value || "8", 10))),
    },
  };
};

// render
async function render() {
  try {
    setError("");
    const opts = getOptions();
    bgInput.disabled = opts.backgroundOptions.color === "transparent";
    await qr.update(opts);
    updateButtonStates(true);
  } catch (err) {
    updateButtonStates(false);
    if (contentType === "url") setError(err.message || "Invalid value.");
  }
}

// logo upload
if (logoFile && logoPreview && clearLogoBtn) {
  logoFile.addEventListener("change", () => {
    const f = logoFile.files?.[0];
    if (!f) {
      logoDataUrl = null;
      logoPreview.innerHTML = `
        <div class="logo-upload-prompt">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span>Click to upload logo</span>
        </div>
      `;
      clearLogoBtn.style.display = "none";
      render();
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      logoDataUrl = String(reader.result);
      logoPreview.innerHTML = `<img src="${logoDataUrl}" alt="Logo preview" />`;
      clearLogoBtn.style.display = "flex";
      render();
    };
    reader.readAsDataURL(f);
  });

  logoPreview.addEventListener("click", (e) => {
    e.preventDefault();
    logoFile.click();
  });

  clearLogoBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    logoFile.value = "";
    logoDataUrl = null;
    logoPreview.innerHTML = `
      <div class="logo-upload-prompt">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <span>Click to upload logo</span>
      </div>
    `;
    clearLogoBtn.style.display = "none";
    render();
  });
}

// UI helpers
if (logoSize && logoSizeVal && logoRadius && logoRadiusVal) {
  logoSize.addEventListener("input", () => {
    logoSizeVal.textContent = logoSize.value;
    render();
  });
  logoRadius.addEventListener("input", () => {
    logoRadiusVal.textContent = logoRadius.value;
    render();
  });
}

// Auto-render on form input changes
const autoRenderInputs = [
  urlInput, plainText, wifiSsid, wifiAuth, wifiPass, wifiHidden,
  sizeSel, exportScale, fgInput, bgInput, eccSel, dotsType, cornerType,
  marginInput, gradAngle, logoSize, logoRadius
];

autoRenderInputs.forEach(input => {
  if (input) {
    input.addEventListener("input", debounce(() => render(), 160));
    if (input.type === "checkbox" || input.type === "select-one") {
      input.addEventListener("change", debounce(() => render(), 160));
    }
  }
});

// Re-render on tab change
if (tabs && tabs.length > 0 && contents && contents.length > 0) {
  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("is-active"));
      contents.forEach((c) => c.classList.remove("is-active"));
      t.classList.add("is-active");
      contentType = t.dataset.type || "url";
      const el = document.getElementById(`content-${contentType}`);
      if (el) el.classList.add("is-active");
      debounce(() => render(), 160)();
    })
  );
}

// form handlers
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (form) form.reset();
    logoDataUrl = null;
    if (logoSizeVal) logoSizeVal.textContent = logoSize?.value || "22";
    if (logoRadiusVal) logoRadiusVal.textContent = logoRadius?.value || "8";
    
    // Reset color radio groups
    const bgNoneBtn = bgColorGroup?.querySelector(".color-none-btn");
    if (bgNoneBtn) bgNoneBtn.classList.remove("active");
    const bgPaletteBtn = bgColorGroup?.querySelector(".color-palette-btn");
    if (bgPaletteBtn) bgPaletteBtn.classList.add("active");
    
    const gradFromNoneBtn = gradFromGroup?.querySelector(".color-none-btn");
    if (gradFromNoneBtn) gradFromNoneBtn.classList.add("active");
    const gradFromPaletteBtn = gradFromGroup?.querySelector(".color-palette-btn");
    if (gradFromPaletteBtn) gradFromPaletteBtn.classList.remove("active");
    
    const gradToNoneBtn = gradToGroup?.querySelector(".color-none-btn");
    if (gradToNoneBtn) gradToNoneBtn.classList.add("active");
    const gradToPaletteBtn = gradToGroup?.querySelector(".color-palette-btn");
    if (gradToPaletteBtn) gradToPaletteBtn.classList.remove("active");
    
    setError("");
    // reset logo preview
    if (logoPreview) {
      logoPreview.innerHTML = `
        <div class="logo-upload-prompt">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span>Click to upload logo</span>
        </div>
      `;
    }
    if (clearLogoBtn) clearLogoBtn.style.display = "none";
    // reset QR to placeholder
    qr.update({
      data: "",
      width: 256,
      height: 256,
      qrOptions: { errorCorrectionLevel: "H", margin: 8 },
      backgroundOptions: { color: "#ffffff" },
      dotsOptions: { color: "#000000", type: "square" },
      image: undefined,
    });
    updateButtonStates(false);
  });
}

// export helpers
const makeFilename = () => {
  try {
    const key =
      contentType === "url"
        ? new URL(normalizeUrl(urlInput.value)).hostname.replace(/^www\./, "")
        : contentType;
    return `qr-${key}-${new Date().toISOString().slice(0, 10)}`;
  } catch {
    return `qrcode-${new Date().toISOString().slice(0, 10)}`;
  }
};

// ===== Color Radio Groups =====
const setupColorRadioGroup = (groupId, colorInputId) => {
  const group = document.getElementById(groupId);
  const colorInput = document.getElementById(colorInputId);
  
  if (!group || !colorInput) return;
  
  const noneBtn = group.querySelector(".color-none-btn");
  const paletteBtn = group.querySelector(".color-palette-btn");
  const swatches = group.querySelector(".swatches");
  
  const updateActiveState = () => {
    if (noneBtn) {
      const isNone = noneBtn.classList.contains("active");
      noneBtn.classList.toggle("active", isNone);
      if (paletteBtn) paletteBtn.classList.toggle("active", !isNone);
    }
  };
  
  // None button (transparent background or no gradient)
  if (noneBtn) {
    noneBtn.addEventListener("click", (e) => {
      e.preventDefault();
      noneBtn.classList.add("active");
      if (paletteBtn) paletteBtn.classList.remove("active");
      render();
    });
  }
  
  // Palette button (open color picker)
  if (paletteBtn) {
    paletteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (noneBtn) noneBtn.classList.remove("active");
      paletteBtn.classList.add("active");
      const input = paletteBtn.querySelector("input[type='color']");
      if (input) {
        if (typeof input.showPicker === "function") input.showPicker();
        else input.click();
      }
    });
    
    const colorInputInBtn = paletteBtn.querySelector("input[type='color']");
    if (colorInputInBtn) {
      colorInputInBtn.addEventListener("change", () => {
        colorInput.value = colorInputInBtn.value;
        if (noneBtn) noneBtn.classList.remove("active");
        if (paletteBtn) paletteBtn.classList.add("active");
        render();
      });
    }
  }
  
  // Swatch buttons
  if (swatches) {
    swatches.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const color = btn.style.getPropertyValue("--c");
        colorInput.value = color;
        const colorInputInBtn = paletteBtn?.querySelector("input[type='color']");
        if (colorInputInBtn) colorInputInBtn.value = color;
        if (noneBtn) noneBtn.classList.remove("active");
        if (paletteBtn) paletteBtn.classList.add("active");
        render();
      });
    });
  }
  
  updateActiveState();
};

setupColorRadioGroup("fgColorGroup", "fg");
setupColorRadioGroup("bgColorGroup", "bg");
setupColorRadioGroup("gradFromGroup", "gradFrom");
setupColorRadioGroup("gradToGroup", "gradTo");

// ===== Download Dropdown =====
const downloadDropdown = document.querySelector(".download-dropdown");

if (previewDownloadBtn) {
  previewDownloadBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (downloadDropdown) downloadDropdown.classList.toggle("open");
  });
}

[previewDownloadPng, previewDownloadWebp, previewDownloadSvg].forEach((btn) => {
  if (!btn) return;
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (downloadDropdown) downloadDropdown.classList.remove("open");
    
    if (btn === previewDownloadPng) {
      try {
        const scale = parseInt(exportScale.value || "1", 10) || 1;
        await qr.download({ name: makeFilename(), extension: "png", scale });
      } catch {}
    } else if (btn === previewDownloadWebp) {
      try {
        const scale = parseInt(exportScale.value || "1", 10) || 1;
        await qr.download({ name: makeFilename(), extension: "webp", scale });
      } catch {}
    } else if (btn === previewDownloadSvg) {
      try {
        await qr.download({ name: makeFilename(), extension: "svg", scale: 1 });
      } catch {}
    }
  });
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (downloadDropdown && !downloadDropdown.contains(e.target)) {
    downloadDropdown.classList.remove("open");
  }
});

// ===== Preview Action Buttons =====
if (previewGenerateBtn) {
  previewGenerateBtn.addEventListener("click", (e) => {
    e.preventDefault();
    render();
  });
}

if (previewCopyBtn) {
  previewCopyBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const scale = parseInt(exportScale.value || "1", 10) || 1;
      const blob = await qr.getRawData("png", scale);
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      }
    } catch {}
  });
}

// ===== Initialization =====
// Initialize color radio group states
const initFgState = () => {
  const btn = fgColorGroup?.querySelector(".color-palette-btn");
  if (btn) btn.classList.add("active");
};

const initBgState = () => {
  const noneBtn = bgColorGroup?.querySelector(".color-none-btn");
  const paletteBtn = bgColorGroup?.querySelector(".color-palette-btn");
  if (noneBtn) noneBtn.classList.remove("active");
  if (paletteBtn) paletteBtn.classList.add("active");
};

const initGradFromState = () => {
  const noneBtn = gradFromGroup?.querySelector(".color-none-btn");
  const paletteBtn = gradFromGroup?.querySelector(".color-palette-btn");
  if (noneBtn) noneBtn.classList.add("active");
  if (paletteBtn) paletteBtn.classList.remove("active");
};

const initGradToState = () => {
  const noneBtn = gradToGroup?.querySelector(".color-none-btn");
  const paletteBtn = gradToGroup?.querySelector(".color-palette-btn");
  if (noneBtn) noneBtn.classList.add("active");
  if (paletteBtn) paletteBtn.classList.remove("active");
};

initFgState();
initBgState();
initGradFromState();
initGradToState();

// Initialize button states
updateButtonStates(false);

// Close dropdown when clicking outside
if (downloadDropdown) {
  document.addEventListener("click", (e) => {
    if (!downloadDropdown.contains(e.target)) {
      downloadDropdown.classList.remove("open");
    }
  });
}
