const Gnbtn = document.getElementById("generateBtn");
const input = document.getElementById("url");
const qrdiv = document.getElementById("QR");
const qrimg = document.querySelector("img");
const color = document.getElementById("colorInput");
const button2 = document.getElementById("buttons");
const toggle = document.getElementById("toggle");
const error = document.getElementById("error");
let saveUrl = null;

const submitting = (e) => {
  e.preventDefault();

  clearUI(); // clearing screen
  if (!input.value.startsWith("https://")) {
    // this condition check if input starts with https:// or not
    error.innerHTML = "Invalid URL!!";
  } else {
    // validation of url
    generateQRCode();
    SaveBtn();
    const qrCanvas = qrdiv.querySelector("canvas");
    qrCanvas.toBlob((blob) => {
      if (saveUrl) {
        URL.revokeObjectURL(saveUrl);
      }
      saveUrl = URL.createObjectURL(blob);
      console.log(saveUrl);
      // Create save button
      SaveBtnLink(saveUrl);
    });
  }
};
// function for generating QR Code
const generateQRCode = () => {
  var qrcode = new QRCode(document.getElementById("QR"), {
    text: input.value.trim(),
    width: 200,
    height: 200,
    colorDark: color.value,
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
};

// Function for clearing previous QR Code
const clearUI = () => {
  qrdiv.innerHTML = "";
};

// Create save button to download QR code as image
const SaveBtn = () => {
  // remove existed button tags of save button
  let existedBtn = button2.getElementsByClassName("SaveButton");
  // console.log(existedBtn);
  // exixtedBtn yha pr Nodelist de rha hai
  //isliye index jaruri hai node remove
  //karne ke liye isliye niche index 0 lagaya hai
  while (existedBtn.length > 0) {
    button2.removeChild(existedBtn[0]);
  }
  // Save button ka button tag generate kra hai
  const buttonback = document.createElement("button");
  buttonback.id = "SaveBtn";
  buttonback.className = "SaveButton";
  buttonback.style.border = "1px solid #000";
  buttonback.style.backgroundColor = "#ff853e";

  button2.appendChild(buttonback);
};

const SaveBtnLink = (saveUrl) => {
  // selecting parent tag of save button
  let linkparent = document.getElementById("SaveBtn");

  // remove existed anchor tags
  let existedanchor = linkparent.getElementsByTagName("a");
  while (existedanchor.length > 0) {
    linkparent.removeChild(existedanchor);
  }
  // button pr link add kra hai
  const link = document.createElement("a");
  link.id = "save-link";
  link.innerHTML = "Save Image";
  link.href = saveUrl;
  link.download = "qrcode.png";

  linkparent.appendChild(link);
};

Gnbtn.addEventListener("click", submitting);

// // JS Code for dark mode toggle
toggle.addEventListener("change", (e) => {
  document.body.classList.toggle("light", e.target.checked);
});
