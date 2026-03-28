// ─── Elements ─────────────────────────────────────────────────────
const imageUpload    = document.getElementById("imageUpload");
const preview        = document.getElementById("preview");
const spinner        = document.getElementById("spinner");
const result         = document.getElementById("result");
const resultLabel    = document.getElementById("resultLabel");
const confidenceText = document.getElementById("confidenceText");
const confidenceBar  = document.getElementById("confidenceBar");
const errorBox       = document.getElementById("errorBox");
const resetBtn       = document.getElementById("resetBtn");
const statusMsg      = document.getElementById("statusMsg");

// ─── Load Model ───────────────────────────────────────────────────
let model;

async function loadModel() {
  statusMsg.textContent = "⏳ Loading AI model...";
  try {
    model = await tmImage.load("./model/model.json", "./model/metadata.json");
    statusMsg.textContent = "✅ Model ready! Upload an image.";
  } catch (err) {
    statusMsg.textContent = "❌ Model failed to load. Check your model folder.";
    console.error(err);
  }
}

// ─── Handle Upload ────────────────────────────────────────────────
imageUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    showError("Please upload an image file (JPG or PNG).");
    return;
  }

  // Reset UI
  resetUI();

  // Show preview
  const reader = new FileReader();
  reader.onload = (event) => {
    preview.src = event.target.result;
    preview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);

  // Predict
  await predict(file);
});

// ─── Predict ──────────────────────────────────────────────────────
async function predict(file) {
  if (!model) {
    showError("Model not loaded yet. Please wait a moment and try again.");
    return;
  }

  showSpinner(true);

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = async () => {
    try {
      const predictions = await model.predict(img);

      // Find best result
      const best = predictions.reduce((a, b) =>
        a.probability > b.probability ? a : b
      );

      const confidence = (best.probability * 100).toFixed(1);
      showResult(best.className, confidence);
    } catch (err) {
      showError("Something went wrong during prediction. Try a clearer image.");
      console.error(err);
    } finally {
      showSpinner(false);
    }
  };

  img.onerror = () => {
    showSpinner(false);
    showError("Could not read the image. Please try a different file.");
  };
}

// ─── Show Result ──────────────────────────────────────────────────
function showResult(label, confidence) {
  result.classList.remove("hidden");
  resultLabel.textContent = label;
  confidenceText.textContent = confidence + "%";

  // Color bar based on confidence
  if (confidence >= 80) {
    confidenceBar.className = "h-2.5 rounded-full transition-all duration-700 bg-green-500";
  } else if (confidence >= 50) {
    confidenceBar.className = "h-2.5 rounded-full transition-all duration-700 bg-yellow-400";
  } else {
    confidenceBar.className = "h-2.5 rounded-full transition-all duration-700 bg-red-400";
  }

  // Animate bar
  setTimeout(() => {
    confidenceBar.style.width = confidence + "%";
  }, 100);

  resetBtn.classList.remove("hidden");
}

// ─── Show Error ───────────────────────────────────────────────────
function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
  resetBtn.classList.remove("hidden");
}

// ─── Spinner ──────────────────────────────────────────────────────
function showSpinner(show) {
  spinner.classList.toggle("hidden", !show);
}

// ─── Reset ────────────────────────────────────────────────────────
resetBtn.addEventListener("click", () => {
  imageUpload.value = "";
  resetUI();
  preview.src = "";
  preview.classList.add("hidden");
});

function resetUI() {
  result.classList.add("hidden");
  errorBox.classList.add("hidden");
  resetBtn.classList.add("hidden");
  spinner.classList.add("hidden");
  confidenceBar.style.width = "0%";
}

// ─── Start ────────────────────────────────────────────────────────
loadModel();