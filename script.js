const button = document.getElementById("generate");
const input = document.getElementById("url");
// const FirstColor = document.getElementById("FirstColor");
// const SecondColor = document.getElementById("SecondColor");
const qrdiv = document.getElementById("QR");
const size = document.getElementById("size");
const button2 = document.getElementById("buttons");

const submitting = (e) => {
  e.preventDefault();

  clearUI(); // clearing screen

  // validation of url
  if (input.value === "") {
    alert("Please enter URL !!!");
  } else {
    generateQRCode();
    const saveUrl = qrdiv.querySelector("canvas").toDataURL();
    // Create save button
    createSaveBtn(saveUrl);
  }
};
// function for generating QR Code
const generateQRCode = () => {
  var qrcode = new QRCode(document.getElementById("QR"), {
    text: input.value.trim(),
    width: size.value,
    height: size.value,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
};

// Function for clearing previous QR Code
const clearUI = () => {
  qrdiv.innerHTML = "";
};

// Create save button to download QR code as image
const createSaveBtn = (saveUrl) => {
  const link = document.createElement("a");
  link.id = "save-link";
  link.innerHTML = "Save Image";

  link.href = saveUrl;
  link.download = "qrcode.png";

  document.getElementById("generated").appendChild(link);
};

button.addEventListener("click", submitting);
