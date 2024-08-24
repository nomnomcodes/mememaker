// script.js

document.addEventListener("DOMContentLoaded", function () {
    const canvas = new fabric.Canvas("canvas");
    const uploadInput = document.getElementById("uploadImage");
    const undoButton = document.getElementById("undo");
    const redoButton = document.getElementById("redo");
    const downloadButton = document.getElementById("download");
    const flipHorizontalButton = document.getElementById("flipHorizontal");
    const flipVerticalButton = document.getElementById("flipVertical");
    const removeAllButton = document.getElementById("removeAll");
    const removeSelectedButton = document.getElementById("removeSelected"); // New button
    const presetsContainer = document.querySelector(".presets");
  
    let undoStack = [];
    let redoStack = [];
  
    // Function to enable all buttons
    function enableButtons() {
      undoButton.disabled = false;
      redoButton.disabled = false;
      downloadButton.disabled = false;
      flipHorizontalButton.disabled = false;
      flipVerticalButton.disabled = false;
      removeAllButton.disabled = false;
      removeSelectedButton.disabled = false; // Enable the new button
      const presetButtons = document.querySelectorAll(".preset-button");
  
      presetButtons.forEach((button) => (button.disabled = false));
    }
  
    // Function to save the current state
    function saveState() {
      undoStack.push(JSON.stringify(canvas));
      redoStack = [];
    }
  
    // Upload Image to Canvas and Set as Background
    uploadInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;
  
      const reader = new FileReader();
      reader.onload = function (f) {
        const data = f.target.result;
        fabric.Image.fromURL(
          data,
          function (img) {
            // Adjust the size of the uploaded image to match the canvas size
            img.scaleToWidth(canvas.width);
            img.scaleToHeight(canvas.height);
  
            // Set the uploaded image as the canvas background
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
              // These options ensure the image fits the canvas
              scaleX: canvas.width / img.width,
              scaleY: canvas.height / img.height,
            });
  
            enableButtons(); // Enable buttons after image is set
            saveState();
          },
          { crossOrigin: "anonymous" }
        ); // Cross-origin for potential CORS issues
      };
      reader.readAsDataURL(file);
    });
  
    const arrayOfStrings = Array.from({ length: 49 }, (_, index) => index.toString());
    generatePresetButtons(arrayOfStrings);
  
  
  
  
    function generatePresetButtons(presets) {
      presets.forEach((preset, index) => {
        const button = document.createElement("button");
        button.className = "preset-button";
        button.dataset.image = `./presets/${preset}.png`;
        button.disabled = true; // Disable until an image is uploaded
  
        // Set button style
        button.id = preset;
  
        button.style.backgroundImage = `url(./presets/${preset}.png)`; // Set background image
  
        // Add click event to button
        button.addEventListener("click", function () {
          const imageSrc = button.getAttribute("data-image");
          addPresetImage(imageSrc);
        });
  
        // Add button to container
        presetsContainer.appendChild(button);
      });
    }
  
    // Add Pre-set Image to Canvas
    function addPresetImage(src) {
      fabric.Image.fromURL(src, function (img) {
        img.set({
          left: 100,
          top: 100,
          angle: 0,
          padding: 10,
          cornerSize: 10,
          hasRotatingPoint: true,
        });
        canvas.add(img);
        saveState();
      });
    }
    const presetButtons = document.querySelectorAll(".preset-button");
  
  
    presetButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const imageSrc = button.getAttribute("data-image");
        addPresetImage(imageSrc);
      });
      button.style.backgroundImage = `url(${button.getAttribute("data-image")})`;
    });
    // Undo Functionality
    undoButton.addEventListener("click", function () {
      if (undoStack.length > 0) {
        redoStack.push(JSON.stringify(canvas));
        const state = undoStack.pop();
        canvas.loadFromJSON(state, function () {
          canvas.renderAll();
        });
      }
    });
  
    // Redo Functionality
    redoButton.addEventListener("click", function () {
      if (redoStack.length > 0) {
        undoStack.push(JSON.stringify(canvas));
        const state = redoStack.pop();
        canvas.loadFromJSON(state, function () {
          canvas.renderAll();
        });
      }
    });
  
    // Download the Image
    downloadButton.addEventListener("click", function () {
      const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1.0,
      });
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "edited-image.png";
      link.click();
    });
  
    // Flip Horizontal Functionality
    flipHorizontalButton.addEventListener("click", function () {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "image") {
        activeObject.set("flipX", !activeObject.flipX); // Flip horizontally
        canvas.renderAll();
        saveState();
      }
    });
  
    // Flip Vertical Functionality
    flipVerticalButton.addEventListener("click", function () {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "image") {
        activeObject.set("flipY", !activeObject.flipY); // Flip vertically
        canvas.renderAll();
        saveState();
      }
    });
  
    // Remove All Overlays Functionality
    removeAllButton.addEventListener("click", function () {
      canvas.getObjects().forEach((obj) => {
        if (obj !== canvas.backgroundImage) {
          canvas.remove(obj);
        }
      });
      saveState();
    });
  
    removeSelectedButton.addEventListener("click", function () {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "image") {
        canvas.remove(activeObject);
        saveState();
      }
    });
  });
  