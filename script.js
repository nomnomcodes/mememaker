document.addEventListener("DOMContentLoaded", function () {
  const canvas = new fabric.Canvas("canvas");

  // Mobile touch enhancements
  let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Enhanced mobile touch controls
  if (isMobile) {
    // Enable touch scrolling for mobile
    canvas.allowTouchScrolling = true;

    // Custom touch controls for better mobile experience
    canvas.on('touch:gesture', function(e) {
      if (e.e.touches && e.e.touches.length == 2) {
        var delta = e.self.scale - e.self.lastScale;
        canvas.getActiveObject() && canvas.getActiveObject().scale(delta);
        canvas.renderAll();
      }
    });

    // Improve object selection on mobile
    canvas.on('mouse:down', function(e) {
      if (e.target) {
        // Make objects easier to select on mobile
        canvas.setActiveObject(e.target);
        canvas.renderAll();
      }
    });

    // Add double-tap to zoom
    let tapTimeout;
    let lastTap = 0;
    canvas.on('mouse:down', function(e) {
      var currentTime = new Date().getTime();
      var tapLength = currentTime - lastTap;
      if (tapLength < 500 && tapLength > 0) {
        // Double tap detected
        if (canvas.getZoom() == 1) {
          canvas.zoomToPoint(e.e, 1.5);
        } else {
          canvas.zoomToPoint(e.e, 1);
        }
        canvas.renderAll();
      }
      lastTap = currentTime;
    });

    // Improve touch object manipulation
    canvas.on('object:moving', function(e) {
      var obj = e.target;
      // Constrain movement to canvas bounds
      var canvasWidth = canvas.getWidth();
      var canvasHeight = canvas.getHeight();
      var objWidth = obj.getScaledWidth();
      var objHeight = obj.getScaledHeight();

      if (obj.left < 0) obj.left = 0;
      if (obj.top < 0) obj.top = 0;
      if (obj.left + objWidth > canvasWidth) obj.left = canvasWidth - objWidth;
      if (obj.top + objHeight > canvasHeight) obj.top = canvasHeight - objHeight;
    });
  }
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
  const accordion = document.getElementById("accordion");

  // Mobile-specific helper functions
  function addMobileHelpers() {
    // Add mobile-specific visual feedback
    if (isMobile) {
      // Add haptic feedback for supported devices
      function vibrate(duration = 50) {
        if (navigator.vibrate) {
          navigator.vibrate(duration);
        }
      }

      // Add visual feedback for touch interactions
      function addTouchFeedback(element) {
        element.addEventListener('touchstart', function() {
          this.style.transform = 'scale(0.95)';
          vibrate(25);
        });
        element.addEventListener('touchend', function() {
          this.style.transform = 'scale(1)';
        });
      }

      // Apply touch feedback to all buttons
      const buttons = document.querySelectorAll('button, .upload-button');
      buttons.forEach(addTouchFeedback);

      // Add mobile-specific zoom controls
      const zoomControls = document.createElement('div');
      zoomControls.className = 'mobile-zoom-controls';
      zoomControls.innerHTML = `
        <button id="zoomIn" class="zoom-btn">🔍+</button>
        <button id="zoomOut" class="zoom-btn">🔍-</button>
        <button id="zoomReset" class="zoom-btn">↻</button>
      `;

      // Add zoom controls to canvas container
      const canvasContainer = document.querySelector('.canvas-container') || document.querySelector('#canvas').parentNode;
      canvasContainer.appendChild(zoomControls);

      // Zoom control event listeners
      document.getElementById('zoomIn').addEventListener('click', function() {
        canvas.setZoom(canvas.getZoom() * 1.2);
        canvas.renderAll();
      });

      document.getElementById('zoomOut').addEventListener('click', function() {
        canvas.setZoom(canvas.getZoom() / 1.2);
        canvas.renderAll();
      });

      document.getElementById('zoomReset').addEventListener('click', function() {
        canvas.setZoom(1);
        canvas.renderAll();
      });
    }
  }

  // Call mobile helpers after DOM is ready
  setTimeout(addMobileHelpers, 100);

  // PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available
                showUpdateNotification();
              }
            });
          });
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }

  // PWA Install Prompt
  let deferredPrompt;
  let installButton;

  function createInstallButton() {
    installButton = document.createElement('button');
    installButton.textContent = '📱 Install App';
    installButton.className = 'install-button upload-button';
    installButton.style.display = 'none';

    installButton.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installButton.style.display = 'none';
      }
    });

    // Add to top button area
    const topButton = document.querySelector('.top-button');
    topButton.appendChild(installButton);
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (!installButton) {
      createInstallButton();
    }
    installButton.style.display = 'inline-block';
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    if (installButton) {
      installButton.style.display = 'none';
    }
    deferredPrompt = null;
  });

  // Update notification
  function showUpdateNotification() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
      <div class="update-content">
        <span>🔄 New version available!</span>
        <button onclick="updateApp()" class="update-btn">Update</button>
        <button onclick="dismissUpdate()" class="dismiss-btn">✕</button>
      </div>
    `;
    document.body.appendChild(updateBanner);
  }

  // Global functions for update handling
  window.updateApp = function() {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({type: 'SKIP_WAITING'});
      window.location.reload();
    }
  };

  window.dismissUpdate = function() {
    const updateBanner = document.querySelector('.update-banner');
    if (updateBanner) {
      updateBanner.remove();
    }
  };

  // Offline status handling
  function handleOfflineStatus() {
    const offlineIndicator = document.createElement('div');
    offlineIndicator.className = 'offline-indicator';
    offlineIndicator.textContent = '📡 You are offline';
    offlineIndicator.style.display = 'none';
    document.body.appendChild(offlineIndicator);

    function updateOnlineStatus() {
      if (navigator.onLine) {
        offlineIndicator.style.display = 'none';
      } else {
        offlineIndicator.style.display = 'block';
      }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }

  // Initialize offline status handling
  handleOfflineStatus();

  document
    .getElementById("downloadPfpsLabel")
    .addEventListener("click", function () {
      const isPfpDownload = accordion.classList.toggle("pfpDownload");

      if (isPfpDownload) {
        // Switch to "Download Pfps" mode
        document.querySelector(".action-buttons").style.display = "none";
        document.querySelector(".text-controls").style.display = "none";
        document.querySelector(".canvas-container").style.display = "none";
        document.querySelector("#presetmessage").style.display = "block";
        document.querySelector("#downloadAllPfps").style.display = "inline-block";
        document.querySelector("#download").style.display = "none";
        document.querySelector('#uploadButton').style.display = "none";
        document.querySelector('#presets').style.marginTop = "100px";
        this.textContent = "⬅️ Back to Editor"; // Change button text
        enableButtons();
      } else {
        // Revert to editor mode
        document.querySelector('#uploadButton').style.display = "inline-block";
        document.querySelector('#presets').style.marginTop = "0px";

        document.querySelector(".action-buttons").style.display = "block";
        document.querySelector('.action-buttons').style.marginTop = "100px";

        document.querySelector(".text-controls").style.display = "block";
        document.querySelector(".canvas-container").style.display = "block";
        document.querySelector("#presetmessage").style.display = "none";
        document.querySelector("#downloadAllPfps").style.display = "none";
        document.querySelector("#download").style.display = "block";
        this.textContent = "⬇️ Download Pfps"; // Change button text back

      }
    });

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
  document.getElementById("addText").addEventListener("click", function () {
    if (!imageUploaded) {
      alert("Please upload an image first.");
      return;
    }

    const textInput = document.getElementById("textInput").value;
    const textColor = document.getElementById("textColor").value;
    const fontSize = parseInt(document.getElementById("fontSize").value, 10);
    const isBold = document.getElementById("bold").checked;
    const isItalic = document.getElementById("italic").checked;
    const hasDropShadow = document.getElementById("dropShadow").checked;

    const text = new fabric.Textbox(textInput, {
      left: 100,
      top: 100,
      fill: textColor,
      fontFamily: "Impact",
      fontSize: fontSize,
      fontWeight: isBold ? "bold" : "normal",
      fontStyle: isItalic ? "italic" : "normal",
      shadow: hasDropShadow ? "rgba(0,0,0,1) 2px 2px 5px" : "",
    });
    removeTextButton.disabled = false; // Enable removeText button

    canvas.add(text);
  });

  // Update selected text object
  canvas.on("selection:created", function (e) {
    const activeObject = e.target;
    if (activeObject && activeObject.type === "textbox") {
      document.getElementById("textInput").value = activeObject.text;
      document.getElementById("textColor").value = activeObject.fill;
      document.getElementById("fontSize").value = activeObject.fontSize;
      document.getElementById("bold").checked =
        activeObject.fontWeight === "bold";
      document.getElementById("italic").checked =
        activeObject.fontStyle === "italic";
      document.getElementById("dropShadow").checked = !!activeObject.shadow;
    }
  });

  document.getElementById("textInput").addEventListener("input", function () {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === "textbox") {
      activeObject.set("text", this.value);
      canvas.renderAll();
    }
  });

  document.getElementById("textColor").addEventListener("input", function () {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === "textbox") {
      activeObject.set("fill", this.value);
      canvas.renderAll();
    }
  });

  textInput.addEventListener("input", function () {
    addTextButton.disabled = textInput.value.trim().length === 0;
  });

  document.getElementById("fontSize").addEventListener("input", function () {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === "textbox") {
      activeObject.set("fontSize", parseInt(this.value, 10));
      canvas.renderAll();
    }
  });

  // Remove selected text object
  removeTextButton.addEventListener("click", function () {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === "textbox") {
      canvas.remove(activeObject);
      saveState();
    }
  });

  document.getElementById("bold").addEventListener("change", function () {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === "textbox") {
      activeObject.set("fontWeight", this.checked ? "bold" : "normal");
      canvas.renderAll();
    }
  });

  const presetButtons = document.querySelectorAll(".preset-button");
  presetButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Check if the accordion has the 'pfpDownload' class
      if (accordion.classList.contains("pfpDownload")) {
        console.log("here");
        const imageUrl = button.style.backgroundImage.slice(5, -2); // Extract URL from background-image
        downloadImage(imageUrl);
      }
    });
  });

  document.getElementById("italic").addEventListener("change", function () {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === "textbox") {
      activeObject.set("fontStyle", this.checked ? "italic" : "normal");
      canvas.renderAll();
    }
  });

  document.getElementById("dropShadow").addEventListener("change", function () {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === "textbox") {
      activeObject.set(
        "shadow",
        this.checked ? "rgba(0,0,0,1) 2px 2px 5px" : ""
      );
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
          document.getElementById("addText").disabled = false;
          imageUploaded = true; // Update the variable

          saveState();
        },
        { crossOrigin: "anonymous" }
      );
    };
    reader.readAsDataURL(file);
  });

  const folders = {
    original:3,
    heads:4,
    ai: 11,
    cartoon: 143,
    general: 97,
    brands: 17,
    gang: 18,
    music: 8,
    bdsm: 7,

  };
  const loadingMessage = document.getElementById("loadingMessage");
  const countdownElement = document.getElementById("countdown");
  let countdown = 20;

  // Function to start the countdown
  function startCountdown() {
    loadingMessage.style.display = "block"; // Show the loading message
    const interval = setInterval(() => {
      countdown--;
      countdownElement.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(interval);
        // Optionally hide the loading message or perform another action
        loadingMessage.style.display = "none";
      }
    }, 1000);
  }

  // downloadPfpsButton.addEventListener('click', function() {
  //   document.body.classList.toggle('pfpDownload');
  // });

  // // Add event listeners to each preset button
  // const presetButtons = document.querySelectorAll('.preset-button');
  // presetButtons.forEach(button => {
  //   button.addEventListener('click', function() {
  //       // Check if the body has the 'pfpDownload' class
  //       if (document.body.classList.contains('pfpDownload')) {
  //           const imageUrl = button.style.backgroundImage.slice(5, -2); // Extract URL from background-image
  //           downloadImage(imageUrl);
  //       }
  //   });
  // });
  function downloadImage(imageUrl) {
    // Create a temporary anchor element
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = imageUrl.split("/").pop(); // Use the image file name as the download name

    // Append the anchor to the body
    document.body.appendChild(link);

    // Trigger the download by simulating a click
    link.click();

    // Remove the anchor from the body
    document.body.removeChild(link);
  }

  document
    .getElementById("downloadAllPfps")
    .addEventListener("click", async function () {
      const loadingMessage = document.getElementById("loadingMessage");
      loadingMessage.style.display = "block"; // Show loading message
      startCountdown();
      const zip = new JSZip();
      const folderPromises = Object.keys(folders).map(async (folder) => {
        const presetCount = folders[folder];
        const presets = Array.from({ length: presetCount }, (_, index) =>
          index.toString()
        );

        const folderPromises = presets.map(async (preset) => {
          let imageSrc = `./presets/${folder}/${preset}.png`;
          let response = await fetch(imageSrc);

          // If PNG fails, try WebP
          if (!response.ok) {
            imageSrc = `./presets/${folder}/${preset}.webp`;
            response = await fetch(imageSrc);
          }

          if (response.ok) {
            const blob = await response.blob();
            // Use the actual extension from the successful fetch
            const extension = imageSrc.endsWith('.webp') ? '.webp' : '.png';
            zip.file(`${folder}/${preset}${extension}`, blob);
          }
        });

        await Promise.all(folderPromises);
      });

      await Promise.all(folderPromises);

      zip
        .generateAsync({ type: "blob" })
        .then(function (content) {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(content);
          link.download = "presets.zip";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          loadingMessage.style.display = "none"; // Hide loading message
        })
        .catch(function (error) {
          console.error("Error generating zip:", error);
          loadingMessage.style.display = "none"; // Hide loading message on error
        });
    });

  const totalPresets = Object.values(folders).reduce(
    (sum, num) => sum + num,
    0
  );
  document.getElementById("presetstitle").innerText += ` (${totalPresets})`;

  generateAccordion(folders);

  function generateAccordion(folders) {
    const accordion = document.getElementById("accordion");

    for (const folder of Object.keys(folders)) {
      const presetCount = folders[folder];
      const presets = Array.from({ length: presetCount }, (_, index) =>
        index.toString()
      );
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
        button.disabled = true;
        button.id = `preset-${folder}-${preset}`;

        // Default to PNG, but we'll handle both formats in the click handler
        let imageSrc = `./presets/${folder}/${preset}.png`;

        button.dataset.image = imageSrc;
        button.dataset.folder = folder;
        button.dataset.preset = preset;
        button.style.backgroundImage = `url(${imageSrc})`;

        // Handle image load error by trying WebP format
        const img = new Image();
        img.onload = function() {
          // PNG loaded successfully, keep it
        };
        img.onerror = function() {
          // PNG failed, try WebP
          const webpSrc = `./presets/${folder}/${preset}.webp`;
          button.dataset.image = webpSrc;
          button.style.backgroundImage = `url(${webpSrc})`;
        };
        img.src = imageSrc;

        button.addEventListener("click", function () {
          // Check if the accordion has the 'pfpDownload' class
          if (accordion.classList.contains("pfpDownload")) {
            console.log("here");
            const imageUrl = button.style.backgroundImage.slice(5, -2); // Extract URL from background-image
            downloadImage(imageUrl);
          } else {
            // Add the image to the canvas if 'pfpDownload' class is not present
            const imageSrc = button.getAttribute("data-image");
            addPresetImage(imageSrc);
          }
        });

        folderContent.appendChild(button);
      });

      folderContainer.appendChild(folderHeader);
      folderContainer.appendChild(folderContent);
      accordion.appendChild(folderContainer);
    }
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
        borderColor: "lightblue", // Set the border color for selection
        cornerStyle: "circle",
        cornerColor: "blue",
        transparentCorners: false, // Corners filled with color
        cornerStrokeColor: "lightblue", // Set the corner style to circle
        borderScaleFactor: 3, // Set the border thickness
      });

      fabric.Object.prototype.controls = {
        ...fabric.Object.prototype.controls,
        mt: new fabric.Control({
          x: 0,
          y: -0.5,
          offsetY: -10,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.scalingY,
          actionName: "scaleY",
          cornerSize: 45,
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "blue"; // Fill color
            ctx.strokeStyle = "blue"; // Border color
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
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.rotationWithSnapping,
          actionName: "rotate",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "red"; // Fill color
            ctx.strokeStyle = "red"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 15,
        }),
        mb: new fabric.Control({
          x: 0,
          y: 0.5,
          offsetY: 10,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.scalingY,
          actionName: "scaleY",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "blue"; // Fill color
            ctx.strokeStyle = "blue"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
        mbRotate: new fabric.Control({
          x: 0,
          y: 0.5,
          offsetY: 60,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.rotationWithSnapping,
          actionName: "rotate",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "red"; // Fill color
            ctx.strokeStyle = "red"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
        ml: new fabric.Control({
          x: -0.5,
          y: 0,
          offsetX: -10,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.scalingX,
          actionName: "scaleX",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "blue"; // Fill color
            ctx.strokeStyle = "blue"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
        mlRotate: new fabric.Control({
          x: -0.5,
          y: 0,
          offsetX: -60,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.rotationWithSnapping,
          actionName: "rotate",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "red"; // Fill color
            ctx.strokeStyle = "red"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
        mr: new fabric.Control({
          x: 0.5,
          y: 0,
          offsetX: 10,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.scalingX,
          actionName: "scaleX",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "blue"; // Fill color
            ctx.strokeStyle = "blue"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
        mrRotate: new fabric.Control({
          x: 0.5,
          y: 0,
          offsetX: 60,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.rotationWithSnapping,
          actionName: "rotate",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "red"; // Fill color
            ctx.strokeStyle = "red"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
        tl: new fabric.Control({
          x: -0.5,
          y: -0.5,
          offsetX: -10,
          offsetY: -10,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.scalingEqually,
          actionName: "scale",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "blue"; // Fill color
            ctx.strokeStyle = "blue"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
        tlRotate: new fabric.Control({
          x: -0.5,
          y: -0.5,
          offsetX: -60,
          offsetY: -60,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.rotationWithSnapping,
          actionName: "rotate",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "red"; // Fill color
            ctx.strokeStyle = "red"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
        tr: new fabric.Control({
          x: 0.5,
          y: -0.5,
          offsetX: 10,
          offsetY: -10,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.scalingEqually,
          actionName: "scale",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "blue"; // Fill color
            ctx.strokeStyle = "blue"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
        trRotate: new fabric.Control({
          x: 0.5,
          y: -0.5,
          offsetX: 60,
          offsetY: -60,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.rotationWithSnapping,
          actionName: "rotate",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "red"; // Fill color
            ctx.strokeStyle = "red"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
        bl: new fabric.Control({
          x: -0.5,
          y: 0.5,
          offsetX: -10,
          offsetY: 10,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.scalingEqually,
          actionName: "scale",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "blue"; // Fill color
            ctx.strokeStyle = "blue"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
        blRotate: new fabric.Control({
          x: -0.5,
          y: 0.5,
          offsetX: -60,
          offsetY: 60,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.rotationWithSnapping,
          actionName: "rotate",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "red"; // Fill color
            ctx.strokeStyle = "red"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
        br: new fabric.Control({
          x: 0.5,
          y: 0.5,
          offsetX: 10,
          offsetY: 10,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.scalingEqually,
          actionName: "scale",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "blue"; // Fill color
            ctx.strokeStyle = "blue"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
        brRotate: new fabric.Control({
          x: 0.5,
          y: 0.5,
          offsetX: 60,
          offsetY: 60,
          cursorStyle: "pointer",
          actionHandler: fabric.controlsUtils.rotationWithSnapping,
          actionName: "rotate",
          render: function (ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.fillStyle = "red"; // Fill color
            ctx.strokeStyle = "red"; // Border color
            ctx.lineWidth = window.innerWidth >= 768 ? 5 : 20;
            ctx.beginPath();
            ctx.arc(left, top, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
          cornerSize: 45,
        }),
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
        br: true, // bottom right
        mtr: false,
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
