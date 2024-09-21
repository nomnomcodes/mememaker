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
  let imageUploaded = false; // Define the variable
  const removeTextButton = document.getElementById("removeText"); // New button



  // Define custom control points

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

 // Add text to canvas
 document.getElementById('addText').addEventListener('click', function() {
  if (!imageUploaded) {
    alert("Please upload an image first.");
    return;
  }

  const textInput = document.getElementById('textInput').value;
  const textColor = document.getElementById('textColor').value;
  const fontSize = parseInt(document.getElementById('fontSize').value, 10);
  const isBold = document.getElementById('bold').checked;
  const isItalic = document.getElementById('italic').checked;
  const hasDropShadow = document.getElementById('dropShadow').checked;

  const text = new fabric.Textbox(textInput, {
    left: 100,
    top: 100,
    fill: textColor,
    fontFamily: 'Impact',
    fontSize: fontSize,
    fontWeight: isBold ? 'bold' : 'normal',
    fontStyle: isItalic ? 'italic' : 'normal',
    shadow: hasDropShadow ? 'rgba(0,0,0,1) 2px 2px 5px' : ''
  });
  removeTextButton.disabled = false; // Enable removeText button

  canvas.add(text);
});

 // Update selected text object
 canvas.on('selection:created', function(e) {
  const activeObject = e.target;
  if (activeObject && activeObject.type === 'textbox') {
    document.getElementById('textInput').value = activeObject.text;
    document.getElementById('textColor').value = activeObject.fill;
    document.getElementById('fontSize').value = activeObject.fontSize;
    document.getElementById('bold').checked = activeObject.fontWeight === 'bold';
    document.getElementById('italic').checked = activeObject.fontStyle === 'italic';
    document.getElementById('dropShadow').checked = !!activeObject.shadow;
  }
});

document.getElementById('textInput').addEventListener('input', function() {
  const activeObject = canvas.getActiveObject();
  if (activeObject && activeObject.type === 'textbox') {
    activeObject.set('text', this.value);
    canvas.renderAll();
  }
});

document.getElementById('textColor').addEventListener('input', function() {
  const activeObject = canvas.getActiveObject();
  if (activeObject && activeObject.type === 'textbox') {
    activeObject.set('fill', this.value);
    canvas.renderAll();
  }
});

textInput.addEventListener('input', function() {
  addTextButton.disabled = textInput.value.trim().length === 0;
});

document.getElementById('fontSize').addEventListener('input', function() {
  const activeObject = canvas.getActiveObject();
  if (activeObject && activeObject.type === 'textbox') {
    activeObject.set('fontSize', parseInt(this.value, 10));
    canvas.renderAll();
  }
});

  // Remove selected text object
  removeTextButton.addEventListener('click', function() {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'textbox') {
      canvas.remove(activeObject);
      saveState();
    }
  });

document.getElementById('bold').addEventListener('change', function() {
  const activeObject = canvas.getActiveObject();
  if (activeObject && activeObject.type === 'textbox') {
    activeObject.set('fontWeight', this.checked ? 'bold' : 'normal');
    canvas.renderAll();
  }
});

document.getElementById('italic').addEventListener('change', function() {
  const activeObject = canvas.getActiveObject();
  if (activeObject && activeObject.type === 'textbox') {
    activeObject.set('fontStyle', this.checked ? 'italic' : 'normal');
    canvas.renderAll();
  }
});

document.getElementById('dropShadow').addEventListener('change', function() {
  const activeObject = canvas.getActiveObject();
  if (activeObject && activeObject.type === 'textbox') {
    activeObject.set('shadow', this.checked ? 'rgba(0,0,0,1) 2px 2px 5px' : '');
    canvas.renderAll();
  }
});

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
          document.getElementById('addText').disabled = false;
          imageUploaded = true; // Update the variable

          saveState();
        },
        { crossOrigin: "anonymous" }
      );
    };
    reader.readAsDataURL(file);
  });

  const folders = {
    general:47,
    cartoon: 32,
    brands: 8,
    gang: 18,
    music: 5,
    bdsm: 7,
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
    fabric.Image.fromURL(src, function (img) {
      img.set({
        left: 100,
        top: 100,
        angle: 0,
        padding: 10,
        cornerSize: 45,
        hasRotatingPoint: false,
        borderColor: 'lightblue', // Set the border color for selection
        cornerStyle: 'circle',
        cornerColor: 'blue',
        transparentCorners: false, // Corners filled with color
        cornerStrokeColor: 'lightblue',   // Set the corner style to circle
        borderScaleFactor: 3      // Set the border thickness
      });



   fabric.Object.prototype.controls = {
    ...fabric.Object.prototype.controls,
    mt: new fabric.Control({
      x: 0,
      y: -0.5,
      offsetY: -10,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.scalingY,
      actionName: 'scaleY',
      cornerSize: 45,
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'blue'; // Fill color
        ctx.strokeStyle = 'blue'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
    }),
    mtRotate: new fabric.Control({
      x: 0,
      y: -0.5,
      offsetY: -60,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.rotationWithSnapping,
      actionName: 'rotate',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'red'; // Fill color
        ctx.strokeStyle = 'red'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 15
    }),
    mb: new fabric.Control({
      x: 0,
      y: 0.5,
      offsetY: 10,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.scalingY,
      actionName: 'scaleY',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'blue'; // Fill color
        ctx.strokeStyle = 'blue'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    }),
    mbRotate: new fabric.Control({
      x: 0,
      y: 0.5,
      offsetY: 60,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.rotationWithSnapping,
      actionName: 'rotate',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'red'; // Fill color
        ctx.strokeStyle = 'red'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    }),
    ml: new fabric.Control({
      x: -0.5,
      y: 0,
      offsetX: -10,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.scalingX,
      actionName: 'scaleX',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'blue'; // Fill color
        ctx.strokeStyle = 'blue'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    }),
    mlRotate: new fabric.Control({
      x: -0.5,
      y: 0,
      offsetX: -60,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.rotationWithSnapping,
      actionName: 'rotate',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'red'; // Fill color
        ctx.strokeStyle = 'red'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    }),
    mr: new fabric.Control({
      x: 0.5,
      y: 0,
      offsetX: 10,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.scalingX,
      actionName: 'scaleX',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'blue'; // Fill color
        ctx.strokeStyle = 'blue'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    }),
    mrRotate: new fabric.Control({
      x: 0.5,
      y: 0,
      offsetX: 60,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.rotationWithSnapping,
      actionName: 'rotate',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'red'; // Fill color
        ctx.strokeStyle = 'red'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    }),
    tl: new fabric.Control({
      x: -0.5,
      y: -0.5,
      offsetX: -10,
      offsetY: -10,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.scalingEqually,
      actionName: 'scale',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'blue'; // Fill color
        ctx.strokeStyle = 'blue'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    }),
    tlRotate: new fabric.Control({
      x: -0.5,
      y: -0.5,
      offsetX: -60,
      offsetY: -60,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.rotationWithSnapping,
      actionName: 'rotate',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'red'; // Fill color
        ctx.strokeStyle = 'red'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    }),
    tr: new fabric.Control({
      x: 0.5,
      y: -0.5,
      offsetX: 10,
      offsetY: -10,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.scalingEqually,
      actionName: 'scale',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'blue'; // Fill color
        ctx.strokeStyle = 'blue'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    }),
    trRotate: new fabric.Control({
      x: 0.5,
      y: -0.5,
      offsetX: 60,
      offsetY: -60,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.rotationWithSnapping,
      actionName: 'rotate',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'red'; // Fill color
        ctx.strokeStyle = 'red'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    }),
    bl: new fabric.Control({
      x: -0.5,
      y: 0.5,
      offsetX: -10,
      offsetY: 10,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.scalingEqually,
      actionName: 'scale',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'blue'; // Fill color
        ctx.strokeStyle = 'blue'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    }),
    blRotate: new fabric.Control({
      x: -0.5,
      y: 0.5,
      offsetX: -60,
      offsetY: 60,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.rotationWithSnapping,
      actionName: 'rotate',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'red'; // Fill color
        ctx.strokeStyle = 'red'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    }),
    br: new fabric.Control({
      x: 0.5,
      y: 0.5,
      offsetX: 10,
      offsetY: 10,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.scalingEqually,
      actionName: 'scale',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'blue'; // Fill color
        ctx.strokeStyle = 'blue'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    }),
    brRotate: new fabric.Control({
      x: 0.5,
      y: 0.5,
      offsetX: 60,
      offsetY: 60,
      cursorStyle: 'pointer',
      actionHandler: fabric.controlsUtils.rotationWithSnapping,
      actionName: 'rotate',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = 'red'; // Fill color
        ctx.strokeStyle = 'red'; // Border color
        ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
        ctx.beginPath();
        ctx.arc(left, top, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 45
    })
  };

      // Enable rotation control points on all corners and sides
      img.setControlsVisibility({
        mt: true, // middle top
        mb: true, // middle bottom
        ml: true, // middle left
        mr: true, // middle right
        tl: true, // top left
        tr: true, // top right
        bl: true, // bottom left
        br: true , // bottom right
        mtr: false
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
