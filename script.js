const button = document.getElementById("generate");
const input = document.getElementById("url");
const FirstColor = document.getElementById("FirstColor");
const SecondColor = document.getElementById("SecondColor");
const qrdiv = document.getElementById("QR");

const submitting = (e) => {
  e.preventDefault();

  clearUI(); // clearing screen

  // validation of url
  if (input.value === "") {
    alert("Please enter URL !!!");
  } else {
    generateQRCode();
  }
};
// function for generating QR Code
const generateQRCode = () => {
  var qrcode = new QRCode(document.getElementById("QR"), {
    text: input.value,
    colorDark: SecondColor.value,
    colorLight: FirstColor.value,
    correctLevel: QRCode.CorrectLevel.H,
  });
};

// Function for clearing previous QR Code
const clearUI = () => {
  qrdiv.innerHTML = "";
};

button.addEventListener("click",submitting);


const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: 250 },
        qrCodeMessage => {
            console.log(`QR Code detected: ${qrCodeMessage}`);
        },
        errorMessage => {
            console.error(`QR Code scan error: ${errorMessage}`);
        }
    ).catch(err => {
        console.error(`Unable to start scanning: ${err}`);
    });