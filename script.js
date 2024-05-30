const button = document.getElementById("generate");
const input = document.getElementById("url");
const qrdiv = document.getElementById("QR");
const size = document.getElementById("size");
const button2 = document.getElementById("buttons");
let saveUrl = null;

const submitting = (e) => {
  e.preventDefault();

  clearUI(); // clearing screen

  // validation of url
  if (input.value === "") {
    alert("Please enter URL !!!");
  } else {
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
const SaveBtn = () => {
  // remove existed div tags of save button
  let existedBtn = button2.getElementsByTagName("div");
  // console.log(existedBtn);
  // exixtedBtn yha pr Nodelist de rha hai
  //isliye index jaruri hai node remove
  //karne ke liye isliye niche index 0 lagaya hai
  while (existedBtn.length > 0) {
    button2.removeChild(existedBtn[0]);
  }
  // button ka div generate kra hai
  const buttonback = document.createElement("div");
  buttonback.id = "generated";
  buttonback.style.border = "1px solid #000";
  buttonback.style.backgroundColor = "#ff853e";

  button2.appendChild(buttonback);
};

const SaveBtnLink = (saveUrl) => {
  // selecting parent tag of save button
  let linkparent = document.getElementById("generated");

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

button.addEventListener("click", submitting);
