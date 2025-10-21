// DOM references (matched to index.html)
const form = document.getElementById("qrForm");
const generateBtn = document.getElementById("generateBtn");
const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyBtn");
const downloadPng = document.getElementById("downloadPng");
const downloadSvg = document.getElementById("downloadSvg");
const downloadWebp = document.getElementById("downloadWebp");

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
const transparentBg = document.getElementById("transparentBg");

const useGradient = document.getElementById("useGradient");
const gradFrom = document.getElementById("gradFrom");
const gradTo = document.getElementById("gradTo");
const gradAngle = document.getElementById("gradAngle");

const marginInput = document.getElementById("margin");
const exportScale = document.getElementById("exportScale");

const logoFile = document.getElementById("logoFile");
const clearLogoBtn = document.getElementById("clearLogoBtn");
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

// tabs behaviour
tabs.forEach((t) =>
  t.addEventListener("click", () => {
    tabs.forEach((b) => b.classList.remove("is-active"));
    contents.forEach((c) => c.classList.remove("is-active"));
    t.classList.add("is-active");
    contentType = t.dataset.type || "url";
    const el = document.getElementById(`content-${contentType}`);
    if (el) el.classList.add("is-active");
  })
);

// helpers for options
const availableSize = (requested) => {
  const max = Math.min(
    640,
    Math.max(128, Math.floor(qrContainer.clientWidth || 420))
  );
  return Math.min(requested, max);
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
  const bg = transparentBg.checked ? "transparent" : bgInput.value || "#ffffff";
  const dots = { type: dotsType.value || "square" };
  if (useGradient.checked) {
    dots.gradient = {
      type: "linear",
      rotation: (parseInt(gradAngle.value || "0", 10) || 0) * (Math.PI / 180),
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
    copyBtn.disabled =
      downloadPng.disabled =
      downloadSvg.disabled =
      downloadWebp.disabled =
        false;
  } catch (err) {
    copyBtn.disabled =
      downloadPng.disabled =
      downloadSvg.disabled =
      downloadWebp.disabled =
        true;
    if (contentType === "url") setError(err.message || "Invalid value.");
  }
}

// logo upload
logoFile.addEventListener("change", () => {
  const f = logoFile.files?.[0];
  if (!f) {
    logoDataUrl = null;
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    logoDataUrl = String(reader.result);
  };
  reader.readAsDataURL(f);
});
clearLogoBtn.addEventListener("click", () => {
  logoFile.value = "";
  logoDataUrl = null;
});

// UI helpers
logoSize.addEventListener("input", () => {
  if (logoSizeVal) logoSizeVal.textContent = logoSize.value;
});
logoRadius.addEventListener("input", () => {
  if (logoRadiusVal) logoRadiusVal.textContent = logoRadius.value;
});

// form handlers
generateBtn.addEventListener("click", (e) => {
  e.preventDefault();
  render();
});
resetBtn.addEventListener("click", () => {
  form.reset();
  logoDataUrl = null;
  logoSizeVal.textContent = logoSize.value;
  logoRadiusVal.textContent = logoRadius.value;
  useGradient.checked = false;
  setError("");
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
  copyBtn.disabled =
    downloadPng.disabled =
    downloadSvg.disabled =
    downloadWebp.disabled =
      true;
});

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

downloadPng.addEventListener("click", async () => {
  try {
    const scale = parseInt(exportScale.value || "1", 10) || 1;
    await qr.download({ name: makeFilename(), extension: "png", scale });
  } catch {}
});
downloadSvg.addEventListener("click", async () => {
  try {
    await qr.download({ name: makeFilename(), extension: "svg", scale: 1 });
  } catch {}
});
downloadWebp.addEventListener("click", async () => {
  try {
    const scale = parseInt(exportScale.value || "1", 10) || 1;
    await qr.download({ name: makeFilename(), extension: "webp", scale });
  } catch {}
});

// copy PNG to clipboard
copyBtn.addEventListener("click", async () => {
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
