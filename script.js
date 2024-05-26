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

button.addEventListener("click", submitting);

var html5QrcodeScanner = new Html5QrcodeScanner("reader", {
  fps: 10,
  qrbox: 250,
});

const CodeMessage = function () {
  // Handle on success condition with the decoded text or result.
  document.getElementById("result").innerHTML = "Scanned result: " + qrMessage;
  // ...
  html5QrcodeScanner.clear();
  // ^ this will stop the scanner (video feed) and clear the scan area.
}

const qrError = function () {
  // handle on error condition, with error message
  alert("Error !!!");
}

html5QrcodeScanner.render(CodeMessage, qrError);
