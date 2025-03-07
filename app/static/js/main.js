/**
 * F1 Pulse - Main JavaScript File
 */

document.addEventListener("DOMContentLoaded", function () {
  // Initialize search functionality
  initializeSearch();

  // Initialize event listeners for dynamic content
  initializeEventListeners();

  // Setup tooltips and popovers if Bootstrap is available
  if (typeof bootstrap !== "undefined") {
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );
    const tooltipList = [...tooltipTriggerList].map(
      (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );

    const popoverTriggerList = document.querySelectorAll(
      '[data-bs-toggle="popover"]'
    );
    const popoverList = [...popoverTriggerList].map(
      (popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl)
    );
  }
});

/**
 * Initialize search functionality
 */
function initializeSearch() {
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");

  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const query = searchInput.value.trim();

      if (query.length > 0) {
        // Redirect to search results page with query parameter
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
      }
    });
  }
}

/**
 * Initialize event listeners for dynamic content
 */
function initializeEventListeners() {
  // Add any event listeners for dynamic content here
  // For example, for the Pit Stop Challenge
  setupPitStopChallenge();
}

/**
 * Setup Pit Stop Challenge functionality
 */
function setupPitStopChallenge() {
  const pitStopContainer = document.getElementById(
    "pit-stop-challenge-container"
  );

  if (pitStopContainer) {
    // Tire selection
    const tireOptions = document.querySelectorAll(".tire-option");

    tireOptions.forEach((option) => {
      option.addEventListener("click", function () {
        // Remove selected class from all options
        tireOptions.forEach((opt) => opt.classList.remove("selected"));

        // Add selected class to clicked option
        this.classList.add("selected");

        // Update tire strategy information
        updateTireStrategy(this.dataset.tire);
      });
    });

    // Pit stop simulation button
    const simulateButton = document.getElementById("simulate-pit-stop");

    if (simulateButton) {
      simulateButton.addEventListener("click", function () {
        const selectedTire = document.querySelector(".tire-option.selected");

        if (selectedTire) {
          simulatePitStop(selectedTire.dataset.tire);
        } else {
          showMessage("Please select a tire compound first!", "warning");
        }
      });
    }
  }
}

/**
 * Update tire strategy information based on selected tire
 *
 * @param {string} tireType - The type of tire selected (soft, medium, hard)
 */
function updateTireStrategy(tireType) {
  const strategyInfo = document.getElementById("tire-strategy-info");

  if (!strategyInfo) return;

  let info = "";

  switch (tireType) {
    case "soft":
      info = `
                <h4 class="text-danger">Soft Compound (Red)</h4>
                <p><strong>Grip:</strong> High</p>
                <p><strong>Durability:</strong> Low (15-20 laps)</p>
                <p><strong>Best for:</strong> Qualifying, race starts, and short stints</p>
                <p><strong>Strategy:</strong> Ideal for fast lap times and overtaking, but wears quickly requiring more pit stops.</p>
            `;
      break;
    case "medium":
      info = `
                <h4 class="text-warning">Medium Compound (Yellow)</h4>
                <p><strong>Grip:</strong> Moderate</p>
                <p><strong>Durability:</strong> Medium (25-35 laps)</p>
                <p><strong>Best for:</strong> Balanced race strategy</p>
                <p><strong>Strategy:</strong> Good compromise between performance and longevity, suitable for a two-stop strategy.</p>
            `;
      break;
    case "hard":
      info = `
                <h4 class="text-white">Hard Compound (White)</h4>
                <p><strong>Grip:</strong> Low</p>
                <p><strong>Durability:</strong> High (40+ laps)</p>
                <p><strong>Best for:</strong> Long stints and one-stop strategies</p>
                <p><strong>Strategy:</strong> Sacrifices some lap time for extended tire life, allowing fewer pit stops.</p>
            `;
      break;
  }

  strategyInfo.innerHTML = info;
}

/**
 * Simulate a pit stop with the selected tire type
 *
 * @param {string} tireType - The type of tire selected
 */
function simulatePitStop(tireType) {
  const resultContainer = document.getElementById("pit-stop-result");

  if (!resultContainer) return;

  // Show loading animation
  resultContainer.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Simulating pit stop...</span>
            </div>
            <p class="mt-2">Simulating pit stop...</p>
        </div>
    `;

  // Simulate a delay for realism
  setTimeout(() => {
    // Generate a random pit stop time between 2 and 4 seconds
    const pitStopTime = (Math.random() * 2 + 2).toFixed(3);

    // Calculate position gain/loss based on tire selection and pit stop time
    let positionChange = 0;
    let strategyMessage = "";

    // Base strategy messages on tire type
    switch (tireType) {
      case "soft":
        positionChange = pitStopTime < 2.5 ? 2 : -1;
        strategyMessage =
          positionChange > 0
            ? "Great choice! The soft tires gave you an immediate advantage."
            : "The soft tires will wear quickly - you may need to pit again soon.";
        break;
      case "medium":
        positionChange = pitStopTime < 2.8 ? 1 : 0;
        strategyMessage =
          positionChange > 0
            ? "Solid choice. The medium compound provides a good balance."
            : "The medium tires should last well into the next phase of the race.";
        break;
      case "hard":
        positionChange = pitStopTime < 3 ? 0 : -2;
        strategyMessage =
          positionChange >= 0
            ? "Playing the long game! These tires should last to the end."
            : "You lost some positions, but might gain them back when others need to pit.";
        break;
    }

    // Display the result
    resultContainer.innerHTML = `
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h4 class="mb-0">Pit Stop Complete</h4>
                </div>
                <div class="card-body">
                    <h5>Pit Stop Time: ${pitStopTime} seconds</h5>
                    <p class="lead">Position Change: <span class="${
                      positionChange > 0
                        ? "text-success"
                        : positionChange < 0
                        ? "text-danger"
                        : ""
                    }">
                        ${
                          positionChange > 0
                            ? "+" + positionChange
                            : positionChange
                        }
                    </span></p>
                    <p>${strategyMessage}</p>
                    <div class="mt-3">
                        <button class="btn btn-primary" onclick="setupPitStopChallenge()">Try Another Strategy</button>
                    </div>
                </div>
            </div>
        `;
  }, 2000);
}

/**
 * Display a message to the user
 *
 * @param {string} message - The message to display
 * @param {string} type - The type of message (success, warning, danger, info)
 */
function showMessage(message, type = "info") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.setAttribute("role", "alert");

  alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  // Find a suitable container for the alert
  const container =
    document.querySelector("main .container") || document.querySelector("main");

  if (container) {
    // Insert at the beginning of the container
    container.insertBefore(alertDiv, container.firstChild);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      alertDiv.classList.remove("show");
      setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
  }
}
