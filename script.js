const byId = (id) => document.getElementById(id);

const refs = {
  form: byId("qrForm"),
  resetBtn: byId("resetBtn"),
  previewGenerateBtn: byId("previewGenerateBtn"),
  previewCopyBtn: byId("previewCopyBtn"),
  previewDownloadBtn: byId("previewDownloadBtn"),
  previewDownloadPng: byId("previewDownloadPng"),
  previewDownloadWebp: byId("previewDownloadWebp"),
  previewDownloadSvg: byId("previewDownloadSvg"),
  urlInput: byId("url"),
  urlError: byId("urlError"),
  plainText: byId("plainText"),
  wifiSsid: byId("wifiSsid"),
  wifiAuth: byId("wifiAuth"),
  wifiPass: byId("wifiPass"),
  wifiHidden: byId("wifiHidden"),
  sizeSel: byId("size"),
  exportScale: byId("exportScale"),
  fgInput: byId("fg"),
  bgInput: byId("bg"),
  bgNone: byId("bgNone"),
  fgColorGroup: byId("fgColorGroup"),
  bgColorGroup: byId("bgColorGroup"),
  qrContainer: byId("qrContainer"),
  themeToggle: byId("themeToggle"),
};

const tabs = Array.from(document.querySelectorAll(".tab"));
const sections = Array.from(document.querySelectorAll(".content"));
const downloadDropdown = document.querySelector(".download-dropdown");
const THEME_KEY = "qr.theme";
const DEBOUNCE_MS = 160;

const SUN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z"/></svg>`;
const MOON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z"/></svg>`;

const debounce = (fn, delay = DEBOUNCE_MS) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const setThemeIcon = (theme) => {
  if (refs.themeToggle) {
    refs.themeToggle.innerHTML = theme === "light" ? MOON_ICON : SUN_ICON;
  }
};

const applyTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersLight = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: light)").matches;
  const theme = saved || (prefersLight ? "light" : "dark");
  document.documentElement.setAttribute("data-theme", theme);
  setThemeIcon(theme);
};

applyTheme();

if (refs.themeToggle) {
  refs.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    setThemeIcon(next);
  });
}

if (!refs.form || !refs.qrContainer || typeof QRCodeStyling === "undefined") {
  // Theme controls remain available on the about page.
} else {
  let contentType = "url";

  const normalizeUrl = (value, fallbackMessage = "Enter a valid URL (example: https://example.com).") => {
    const trimmed = String(value || "").trim();
    if (!trimmed) throw new Error("URL is required.");
    const withScheme = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      return new URL(withScheme).toString();
    } catch {
      throw new Error(fallbackMessage);
    }
  };

  const escapeWifi = (value) => String(value || "").replace(/([;,:\\"])/g, "\\$1");

  const setError = (message = "") => {
    if (refs.urlError) refs.urlError.textContent = message;
    if (refs.urlInput) refs.urlInput.setAttribute("aria-invalid", message ? "true" : "false");
  };

  const qr = new QRCodeStyling({
    width: 256,
    height: 256,
    data: "",
    qrOptions: { errorCorrectionLevel: "H", margin: 8 },
    dotsOptions: { color: "#8af7b8", type: "square" },
    cornersSquareOptions: { type: "square", color: "#8af7b8" },
    cornersDotOptions: { color: "#8af7b8" },
    backgroundOptions: { color: "#0d1110" },
  });

  qr.append(refs.qrContainer);

  const availableSize = (requested) => {
    const max = Math.min(640, Math.max(128, Math.floor(refs.qrContainer.clientWidth || 340)));
    return Math.min(requested, max);
  };

  const updateButtonStates = (enabled) => {
    [
      refs.previewCopyBtn,
      refs.previewDownloadBtn,
      refs.previewDownloadPng,
      refs.previewDownloadWebp,
      refs.previewDownloadSvg,
    ].forEach((button) => {
      if (button) button.disabled = !enabled;
    });
  };

  const getData = () => {
    if (contentType === "text") {
      const text = String(refs.plainText?.value || "").trim();
      if (!text) throw new Error("Text is required.");
      return text;
    }

    if (contentType === "wifi") {
      const ssid = String(refs.wifiSsid?.value || "").trim();
      if (!ssid) throw new Error("WiFi SSID is required.");
      const auth = refs.wifiAuth?.value || "WPA";
      const pass = String(refs.wifiPass?.value || "");
      const hidden = !!refs.wifiHidden?.checked;
      return `WIFI:T:${auth};S:${escapeWifi(ssid)};P:${escapeWifi(pass)};H:${hidden ? "true" : "false"};;`;
    }

    return normalizeUrl(refs.urlInput?.value, "Enter a valid website URL.");
  };

  const getOptions = () => {
    const size = availableSize(parseInt(refs.sizeSel?.value || "256", 10));
    const fg = refs.fgInput?.value || "#8af7b8";
    const bg = refs.bgNone?.classList.contains("active") ? "transparent" : refs.bgInput?.value || "#0d1110";
    const dots = { type: "square", color: fg };

    return {
      width: size,
      height: size,
      data: getData(),
      qrOptions: { errorCorrectionLevel: "H", margin: 8 },
      backgroundOptions: { color: bg },
      dotsOptions: dots,
      cornersSquareOptions: { type: "square", color: fg },
      cornersDotOptions: { color: fg },
    };
  };

  const render = async () => {
    try {
      setError("");
      const options = getOptions();
      if (refs.bgInput) refs.bgInput.disabled = options.backgroundOptions.color === "transparent";
      await qr.update(options);
      updateButtonStates(true);
    } catch (error) {
      updateButtonStates(false);
      setError(error?.message || "Invalid content.");
    }
  };

  const activateType = (type) => {
    if (!["url", "text", "wifi"].includes(type)) return;
    contentType = type;

    tabs.forEach((tab) => {
      const active = tab.dataset.type === type;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });

    sections.forEach((section) => {
      section.classList.toggle("is-active", section.id === `content-${type}`);
    });

    debouncedRender();
  };

  const makeFilename = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    try {
      if (contentType === "url") {
        const hostname = new URL(normalizeUrl(refs.urlInput?.value)).hostname.replace(/^www\./, "");
        return `qr-${hostname || "url"}-${stamp}`;
      }
      return `qr-${contentType}-${stamp}`;
    } catch {
      return `qr-code-${stamp}`;
    }
  };

  const debouncedRender = debounce(render, DEBOUNCE_MS);

  const bindLiveInput = (element) => {
    if (!element) return;
    element.addEventListener("input", debouncedRender);
    element.addEventListener("change", debouncedRender);
  };

  [
    refs.urlInput,
    refs.plainText,
    refs.wifiSsid,
    refs.wifiAuth,
    refs.wifiPass,
    refs.wifiHidden,
    refs.sizeSel,
    refs.exportScale,
    refs.fgInput,
    refs.bgInput,
  ].forEach(bindLiveInput);

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateType(tab.dataset.type || "url"));
  });

  const setupColorGroup = (groupId, colorInputId, defaultActive = "palette") => {
    const group = byId(groupId);
    const colorInput = byId(colorInputId);
    if (!group || !colorInput) return;

    const noneBtn = group.querySelector(".color-none-btn");
    const paletteBtn = group.querySelector(".color-palette-btn");
    const swatches = group.querySelector(".swatches");

    if (defaultActive === "palette") {
      if (noneBtn) noneBtn.classList.remove("active");
      if (paletteBtn) paletteBtn.classList.add("active");
    } else {
      if (noneBtn) noneBtn.classList.add("active");
      if (paletteBtn) paletteBtn.classList.remove("active");
    }

    if (noneBtn) {
      noneBtn.addEventListener("click", (event) => {
        event.preventDefault();
        noneBtn.classList.add("active");
        if (paletteBtn) paletteBtn.classList.remove("active");
        render();
      });
    }

    if (paletteBtn) {
      paletteBtn.addEventListener("click", (event) => {
        event.preventDefault();
        if (noneBtn) noneBtn.classList.remove("active");
        paletteBtn.classList.add("active");
        const input = paletteBtn.querySelector("input[type='color']");
        if (input) {
          if (typeof input.showPicker === "function") input.showPicker();
          else input.click();
        }
      });

      const paletteInput = paletteBtn.querySelector("input[type='color']");
      if (paletteInput) {
        paletteInput.addEventListener("change", () => {
          colorInput.value = paletteInput.value;
          if (noneBtn) noneBtn.classList.remove("active");
          paletteBtn.classList.add("active");
          render();
        });
      }
    }

    if (swatches) {
      swatches.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          const color = button.style.getPropertyValue("--c");
          colorInput.value = color;
          const paletteInput = paletteBtn?.querySelector("input[type='color']");
          if (paletteInput) paletteInput.value = color;
          if (noneBtn) noneBtn.classList.remove("active");
          if (paletteBtn) paletteBtn.classList.add("active");
          render();
        });
      });
    }
  };

  setupColorGroup("fgColorGroup", "fg", "palette");
  setupColorGroup("bgColorGroup", "bg", "palette");

  if (refs.form) {
    refs.form.addEventListener("submit", (event) => {
      event.preventDefault();
      render();
    });
  }

  if (refs.previewCopyBtn) {
    refs.previewCopyBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      try {
        const scale = parseInt(refs.exportScale?.value || "1", 10) || 1;
        const blob = await qr.getRawData("png", scale);
        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        }
      } catch {}
    });
  }

  if (refs.previewDownloadBtn) {
    refs.previewDownloadBtn.addEventListener("click", (event) => {
      event.preventDefault();
      downloadDropdown?.classList.toggle("open");
    });
  }

  [refs.previewDownloadPng, refs.previewDownloadWebp, refs.previewDownloadSvg].forEach((button) => {
    if (!button) return;

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      downloadDropdown?.classList.remove("open");

      try {
        const scale = parseInt(refs.exportScale?.value || "1", 10) || 1;
        if (button === refs.previewDownloadSvg) {
          await qr.download({ name: makeFilename(), extension: "svg", scale: 1 });
        } else if (button === refs.previewDownloadWebp) {
          await qr.download({ name: makeFilename(), extension: "webp", scale });
        } else {
          await qr.download({ name: makeFilename(), extension: "png", scale });
        }
      } catch {}
    });
  });

  document.addEventListener("click", (event) => {
    if (downloadDropdown && !downloadDropdown.contains(event.target)) {
      downloadDropdown.classList.remove("open");
    }
  });

  if (refs.resetBtn) {
    refs.resetBtn.addEventListener("click", () => {
      refs.form?.reset();
      contentType = "url";

      tabs.forEach((tab) => {
        const active = tab.dataset.type === "url";
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });

      sections.forEach((section) => {
        section.classList.toggle("is-active", section.id === "content-url");
      });

      setError("");

      const fgPalette = refs.fgColorGroup?.querySelector(".color-palette-btn");
      const bgNoneBtn = refs.bgColorGroup?.querySelector(".color-none-btn");
      const bgPaletteBtn = refs.bgColorGroup?.querySelector(".color-palette-btn");

      if (fgPalette) fgPalette.classList.add("active");
      if (bgNoneBtn) bgNoneBtn.classList.remove("active");
      if (bgPaletteBtn) bgPaletteBtn.classList.add("active");

      qr.update({
        data: "",
        width: 256,
        height: 256,
        qrOptions: { errorCorrectionLevel: "H", margin: 8 },
        backgroundOptions: { color: "#0d1110" },
        dotsOptions: { color: "#8af7b8", type: "square" },
      });

      updateButtonStates(false);
    });
  }

  updateButtonStates(false);
  render();
}
