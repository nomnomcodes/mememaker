document.addEventListener("DOMContentLoaded", function () {
  const canvas = new fabric.Canvas("canvas");
  const uploadInput = document.getElementById("uploadImage");
  const undoButton = document.getElementById("undo");
  const redoButton = document.getElementById("redo");
  const downloadButton = document.getElementById("download");
  const flipHorizontalButton = document.getElementById("flipHorizontal");
  const flipVerticalButton = document.getElementById("flipVertical");
  const removeAllButton = document.getElementById("removeAll");
  const removeSelectedButton = document.getElementById("removeSelected");
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
    removeSelectedButton.disabled = false;
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
          // Resize canvas to match the dimensions of the uploaded image
          canvas.setWidth(img.width);
          canvas.setHeight(img.height);

          // Set the uploaded image as the canvas background
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
            scaleX: canvas.width / img.width,
            scaleY: canvas.height / img.height,
          });

          enableButtons();
          saveState();
        },
        { crossOrigin: "anonymous" }
      );
    };
    reader.readAsDataURL(file);
  });

  const folders = {
    general:33,
    gang: 18,
    cartoon: 13,
    music: 5,
    bdsm: 5,
  };

  const totalPresets = Object.values(folders).reduce((sum, num) => sum + num, 0);
document.getElementById('presetstitle').innerText += ` (${totalPresets})`;

  generateAccordion(folders);

  function generateAccordion(folders) {
    const accordion = document.getElementById("accordion");

    Object.keys(folders).forEach((folder) => {
      const presetCount = folders[folder];
      const presets = Array.from({ length: presetCount }, (_, index) => index.toString());
      const folderContainer = document.createElement("div");
      folderContainer.className = "folder-container";

      const folderHeader = document.createElement("div");
      folderHeader.className = "folder-header";
      folderHeader.innerText = `${folder} (${presets.length})`;
      folderHeader.addEventListener("click", function () {
        folderContent.classList.toggle("hidden");
      });

      const folderContent = document.createElement("div");
      folderContent.className = "folder-content hidden";

      presets.forEach((preset) => {
        const button = document.createElement("button");
        button.className = "preset-button";
        button.dataset.image = `./presets/${folder}/${preset}.png`;
        button.disabled = true;

        button.id = `preset-${folder}-${preset}`;
        button.style.backgroundImage = `url(./presets/${folder}/${preset}.png)`;

        button.addEventListener("click", function () {
          const imageSrc = button.getAttribute("data-image");
          addPresetImage(imageSrc);
        });

        folderContent.appendChild(button);
      });

      folderContainer.appendChild(folderHeader);
      folderContainer.appendChild(folderContent);
      accordion.appendChild(folderContainer);
    });
  }


  function addPresetImage(src) {
    const existingObject = canvas.getObjects().find((obj) => obj.getSrc() === src);
    if (existingObject) {
      return;
    }

    fabric.Image.fromURL(src, function (img) {
      img.set({
        left: 100,
        top: 100,
        angle: 0,
        padding: 10,
        cornerSize: 15,
        hasRotatingPoint: true,
        borderColor: 'lightblue', // Set the border color for selection
        cornerColor: 'blue',  // Set the corner color for selection
        cornerStyle: 'circle',
        transparentCorners: false, // Corners filled with color
        cornerStrokeColor: 'lightblue',   // Set the corner style to circle
        borderScaleFactor: 3      // Set the border thickness
      });
      canvas.add(img);
      saveState();
    });
  }



  undoButton.addEventListener("click", function () {
    if (undoStack.length > 0) {
      redoStack.push(JSON.stringify(canvas));
      const state = undoStack.pop();
      canvas.loadFromJSON(state, function () {
        canvas.renderAll();
      });
    }
  });

  redoButton.addEventListener("click", function () {
    if (redoStack.length > 0) {
      undoStack.push(JSON.stringify(canvas));
      const state = redoStack.pop();
      canvas.loadFromJSON(state, function () {
        canvas.renderAll();
      });
    }
  });

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

  flipHorizontalButton.addEventListener("click", function () {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === "image") {
      activeObject.set("flipX", !activeObject.flipX);
      canvas.renderAll();
      saveState();
    }
  });

  flipVerticalButton.addEventListener("click", function () {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === "image") {
      activeObject.set("flipY", !activeObject.flipY);
      canvas.renderAll();
      saveState();
    }
  });

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
