/**
 * F1 Pulse - Driver Detail Page JavaScript
 * This file handles all the functionality for the driver detail page.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Flag to check if we're in development mode
  const isDevelopmentMode = true; // Set to false in production

  // Config to control which API endpoints to call
  const apiConfig = {
    useDirectRacesEndpoint: !isDevelopmentMode, // Skip the direct races endpoint in development
    useStandingsEndpoints: !isDevelopmentMode, // Skip the standings endpoints in development
    skipFallbackRaceCalls: isDevelopmentMode, // Skip fallback race API calls in development
  };

  console.log("Driver detail page script loaded");

  // Add a diagnostics function to verify DOM structure
  function verifyDomElements() {
    const requiredElements = [
      "breadcrumb-driver-name",
      "header-driver-name",
      "driver-number-header",
      "driver-name",
      "driver-nationality",
      "driver-dob",
      "driver-age",
      "driver-flag",
      "driver-biography",
      "header-driver-team",
      "driver-team",
      "team-color-stripe",
      "driver-image",
      "driver-helmet",
      "driver-first-race",
      "driver-championships",
      "stat-wins",
      "stat-podiums",
      "stat-poles",
      "stat-fastest-laps",
      "current-position-display",
      "current-points-display",
      "recent-races-table-body",
      "rivalSelector",
      "rivalryStats",
    ];

    console.log("DEBUG: Verifying DOM elements...");
    const missingElements = [];

    requiredElements.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) {
        console.error(`Missing required element: #${id}`);
        missingElements.push(id);
      }
    });

    if (missingElements.length > 0) {
      console.error(
        `DEBUG: Found ${
          missingElements.length
        } missing elements: ${missingElements.join(", ")}`
      );

      // Add diagnostic message at the top of the page
      const container = document.querySelector(".container");
      if (container) {
        const alert = document.createElement("div");
        alert.className = "alert alert-danger mt-3";
        alert.innerHTML = `
          <h4 class="alert-heading">Page Structure Error</h4>
          <p>The page is missing required elements which may prevent data from displaying correctly.</p>
          <p><strong>Missing elements:</strong> ${missingElements.join(
            ", "
          )}</p>
          <p class="mb-0"><small>This message is only visible during development.</small></p>
        `;
        container.prepend(alert);
      }
    } else {
      console.log("DEBUG: All required DOM elements found");
    }

    return missingElements.length === 0;
  }

  // Verify DOM structure first
  const domValid = verifyDomElements();
  if (!domValid) {
    console.error(
      "DOM structure issues detected - some functionality may not work correctly"
    );
  }

  // Helper function to check if an element exists and log an error if it doesn't
  function checkElement(element, id) {
    if (!element) {
      console.error(`Element with ID '${id}' not found in the DOM.`);
      return false;
    }
    return true;
  }

  // Get driver ID from URL
  const urlParts = window.location.pathname.split("/");
  let driverId = urlParts[urlParts.length - 1];
  console.log("Driver ID from URL:", driverId);

  // Validation for empty or obviously invalid driver ID
  if (
    !driverId ||
    driverId === "" ||
    driverId === "undefined" ||
    driverId === "null"
  ) {
    console.error("Invalid driver ID detected:", driverId);
    // Display error on page
    const container = document.querySelector(".container");
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger mt-5">
          <h4 class="alert-heading">Invalid Driver ID</h4>
          <p>No valid driver ID was found in the URL.</p>
          <p>Please return to the <a href="/drivers">drivers list</a> and select a valid driver.</p>
        </div>
      `;
    }
    return; // Stop execution
  }

  // Standardize driver ID format - some APIs use different formats
  const driverIdMappings = {
    // Current drivers (2023)
    verstappen: "max_verstappen",
    max_verstappen: "max_verstappen",
    norris: "norris",
    lando_norris: "norris",
    hamilton: "hamilton",
    lewis_hamilton: "hamilton",
    leclerc: "leclerc",
    charles_leclerc: "leclerc",
    russell: "russell",
    george_russell: "russell",
    piastri: "piastri",
    oscar_piastri: "piastri",
    sainz: "sainz",
    carlos_sainz: "sainz",
    alonso: "alonso",
    fernando_alonso: "alonso",
    perez: "perez",
    sergio_perez: "perez",
    gasly: "gasly",
    pierre_gasly: "gasly",
    stroll: "stroll",
    lance_stroll: "stroll",
    albon: "albon",
    alex_albon: "albon",
    hulkenberg: "hulkenberg",
    nico_hulkenberg: "hulkenberg",
    tsunoda: "tsunoda",
    yuki_tsunoda: "tsunoda",
    ricciardo: "ricciardo",
    daniel_ricciardo: "ricciardo",
    kevin_magnussen: "magnussen",
    magnussen: "magnussen",
    ocon: "ocon",
    esteban_ocon: "ocon",
    zhou: "zhou",
    guanyu_zhou: "zhou",
    sargeant: "sargeant",
    logan_sargeant: "sargeant",
    bottas: "bottas",
    valtteri_bottas: "bottas",

    // Some past drivers
    vettel: "vettel",
    sebastian_vettel: "vettel",
    raikkonen: "raikkonen",
    kimi_raikkonen: "raikkonen",
    massa: "massa",
    felipe_massa: "massa",
    button: "button",
    jenson_button: "button",
    rosberg: "rosberg",
    nico_rosberg: "rosberg",
    schumacher: "michael_schumacher",
    michael_schumacher: "michael_schumacher",
    mick_schumacher: "mick_schumacher",
    senna: "ayrton_senna",
    ayrton_senna: "ayrton_senna",
  };

  // Set standardized driver ID
  const standardizedDriverId = driverIdMappings[driverId] || driverId;
  console.log(
    `Original driver ID: ${driverId}, Standardized: ${standardizedDriverId}`
  );

  // First, fetch basic driver information
  fetchDriverInfo();

  // Function to fetch driver basic info
  function fetchDriverInfo() {
    console.log("Fetching driver info:", driverId);

    // Show loading indicator
    document.getElementById("driver-biography").innerHTML =
      '<div class="d-flex justify-content-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    // Display debugging info in console for developer troubleshooting
    console.log(`DEBUG: Fetching from API endpoint: /api/driver/${driverId}`);

    fetch(`/api/driver/${driverId}`)
      .then((response) => {
        console.log(
          `DEBUG: API response status: ${response.status} ${response.statusText}`
        );
        if (!response.ok) {
          throw new Error(
            `API error: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data) => {
        console.log("Driver data response:", data);

        if (data.success) {
          console.log(
            `DEBUG: Successfully received driver data for ${data.driver.firstName} ${data.driver.lastName}`
          );
          populateDriverInfo(data.driver);

          // After basic info is populated, fetch additional stats
          fetchDriverStats(standardizedDriverId);
        } else {
          console.error("Error fetching driver data:", data.message);
          // Add visible error message for users and developers
          document.getElementById(
            "driver-biography"
          ).innerHTML = `<div class="alert alert-warning">
              <strong>API Error:</strong> Could not load driver data.<br>
              <small class="text-muted">Error details: ${
                data.message || "Unknown error"
              }</small>
            </div>`;

          // Still attempt to fetch stats in case that endpoint works
          fetchDriverStats(standardizedDriverId);
        }
      })
      .catch((error) => {
        console.error("Error fetching driver data:", error);
        // Add visible error message with more details
        document.getElementById(
          "driver-biography"
        ).innerHTML = `<div class="alert alert-warning">
            <strong>API Error:</strong> Could not load driver data.<br>
            <small class="text-muted">Error details: ${error.message}</small>
          </div>`;

        // Still attempt to fetch stats in case that endpoint works
        fetchDriverStats(standardizedDriverId);
      });
  }

  // Function to fetch driver statistics
  function fetchDriverStats(driverId) {
    console.log("Fetching driver stats for:", driverId);

    // Show loading indicators
    showLoadingIndicators();

    // For debugging, check direct races endpoint
    checkDirectRacesEndpoint(driverId);

    // Make the main API request for driver stats
    fetchDriverStatsFromAPI(driverId);
  }

  // Function to show loading indicators for the stats sections
  function showLoadingIndicators() {
    const loadingSpinner =
      '<div class="d-flex justify-content-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    // Only update biography if it was showing a loading spinner
    if (
      document
        .getElementById("driver-biography")
        .innerHTML.includes("spinner-border")
    ) {
      document.getElementById("driver-biography").innerHTML = loadingSpinner;
    }

    // Clear and show loading indicator for races table
    const recentRacesBody = document.getElementById("recent-races-table-body");
    if (recentRacesBody) {
      recentRacesBody.innerHTML =
        '<tr><td colspan="5" class="text-center">' +
        loadingSpinner +
        "</td></tr>";
    } else {
      console.error(
        "DEBUG: recent-races-table-body element not found in the DOM"
      );
    }
  }

  // Function to check the direct races endpoint (debug only)
  function checkDirectRacesEndpoint(driverId) {
    console.log(
      `DEBUG: Fetching from stats endpoint: /api/driver-stats/${driverId}`
    );

    // Skip this check in development mode
    if (!apiConfig.useDirectRacesEndpoint) {
      console.log(
        "DEBUG: Skipping direct races endpoint check in development mode"
      );
      return;
    }

    fetch(`/api/driver-recent-races/${driverId}`)
      .then((response) => {
        console.log(
          `DEBUG: Direct races endpoint status: ${response.status} ${response.statusText}`
        );
        if (response.ok) {
          return response.json().then((data) => {
            console.log("DEBUG: Direct races endpoint response:", data);
          });
        }
        return null;
      })
      .catch((error) => {
        console.log(
          "DEBUG: Direct races endpoint not available:",
          error.message
        );
      });
  }

  // Function to fetch driver stats from the API
  function fetchDriverStatsFromAPI(driverId) {
    fetch(`/api/driver-stats/${driverId}`)
      .then((response) => {
        console.log(
          `DEBUG: Stats API response status: ${response.status} ${response.statusText}`
        );
        if (!response.ok) {
          throw new Error(
            `API error: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data) => {
        console.log("Driver stats response:", data);
        handleDriverStatsResponse(data, driverId);
      })
      .catch((error) => {
        console.error("Error fetching driver stats:", error);
        handleDriverStatsError(error, driverId);
      });
  }

  // Function to handle the successful response from the API
  function handleDriverStatsResponse(data, driverId) {
    // Check if data has the expected structure before processing
    const isValidResponse =
      data && typeof data === "object" && "success" in data;

    if (!isValidResponse) {
      console.error(
        "DEBUG: Invalid API response structure - missing 'success' field"
      );
      throw new Error("Invalid API response structure");
    }

    if (data.success) {
      processSuccessfulResponse(data, driverId);
    } else {
      console.error("Error fetching driver stats:", data.message);
      handleDriverStatsResponseError(data, driverId);
    }
  }

  // Function to process a successful API response
  function processSuccessfulResponse(data, driverId) {
    try {
      console.log("Processing successful response for driver:", driverId);

      // Additional validation for required data fields
      if (!data.driver || typeof data.driver !== "object") {
        console.error("DEBUG: Missing driver object in response");
        throw new Error("Missing driver data in API response");
      }

      // Validate and log data about races
      validateRacesData(data);

      // Update stats and team info
      updateDriverInfo(data.driver);
      updateDriverStats(data.stats || {});

      // If we have race results, populate the recent races table
      handleRaceResults(data, driverId);

      // Set up rival selection
      setupRivalSelector(driverId);

      // Execute additional components with appropriate error handling
      try {
        // Career milestones
        updateCareerMilestones(data.driver, data.stats || {});
      } catch (err) {
        console.error("Error updating career milestones:", err);
      }

      try {
        // Team mate battle
        if (data.teammate) {
          updateTeamMateBattle(data.driver, data.teammate);
        } else if (isDevelopmentMode) {
          const mockTeammate = generateMockTeammateData(data.driver);
          updateTeamMateBattle(data.driver, mockTeammate);
        }
      } catch (err) {
        console.error("Error updating team-mate battle:", err);
      }

      try {
        // Season progress and charts
        updateSeasonProgressMetrics(data);
      } catch (err) {
        console.error("Error updating season progress metrics:", err);
      }

      try {
        // Driver and constructor standings
        fetchAndUpdateStandings(driverId);
      } catch (err) {
        console.error("Error fetching standings:", err);
      }

      try {
        // Qualifying vs race performance
        if (data.recent_races && data.recent_races.length > 0) {
          updateQualifyingVsRacePerformance(data.recent_races);
        } else if (isDevelopmentMode) {
          const mockRaces = generateMockRaceData(driverId);
          updateQualifyingVsRacePerformance(mockRaces);
        }
      } catch (err) {
        console.error("Error updating qualifying vs race performance:", err);
      }

      console.log("All components processed successfully");
    } catch (err) {
      console.error("Fatal error in processSuccessfulResponse:", err);
    }
  }

  // Function to generate mock race data for development
  function generateMockRaceData(driverId) {
    const currentYear = new Date().getFullYear();
    const mockRaces = [
      {
        raceId: "bahrain_2023",
        date: `${currentYear}-03-05`,
        race: "Bahrain Grand Prix",
        circuit: "Bahrain International Circuit",
        circuitId: "bahrain",
        qualifying_position: "1",
        position: "1",
        points: "25",
        finished: true,
        status: "Finished",
        season: currentYear,
        round: "1",
      },
      {
        raceId: "saudi_2023",
        date: `${currentYear}-03-19`,
        race: "Saudi Arabian Grand Prix",
        circuit: "Jeddah Corniche Circuit",
        circuitId: "jeddah",
        qualifying_position: "2",
        position: "2",
        points: "18",
        finished: true,
        status: "Finished",
        season: currentYear,
        round: "2",
      },
      {
        raceId: "australia_2023",
        date: `${currentYear}-04-02`,
        race: "Australian Grand Prix",
        circuit: "Albert Park Circuit",
        circuitId: "albert_park",
        qualifying_position: "1",
        position: "DNF",
        points: "0",
        finished: false,
        status: "Engine",
        season: currentYear,
        round: "3",
      },
      {
        raceId: "azerbaijan_2023",
        date: `${currentYear}-04-30`,
        race: "Azerbaijan Grand Prix",
        circuit: "Baku City Circuit",
        circuitId: "baku",
        qualifying_position: "3",
        position: "1",
        points: "25",
        finished: true,
        status: "Finished",
        fastest_lap: {
          time: "1:43.370",
          lap: "36",
          rank: "1",
        },
        season: currentYear,
        round: "4",
      },
      {
        raceId: "miami_2023",
        date: `${currentYear}-05-07`,
        race: "Miami Grand Prix",
        circuit: "Miami International Autodrome",
        circuitId: "miami",
        qualifying_position: "1",
        position: "1",
        points: "26",
        finished: true,
        status: "Finished",
        fastest_lap: {
          time: "1:29.708",
          lap: "54",
          rank: "1",
        },
        season: currentYear,
        round: "5",
      },
      {
        raceId: "monaco_2023",
        date: `${currentYear}-05-28`,
        race: "Monaco Grand Prix",
        circuit: "Circuit de Monaco",
        circuitId: "monaco",
        qualifying_position: "1",
        position: "1",
        points: "25",
        finished: true,
        status: "Finished",
        season: currentYear,
        round: "6",
      },
    ];

    return mockRaces;
  }

  // Function to generate mock teammate data
  function generateMockTeammateData(driver) {
    // Determine a realistic teammate based on the driver's team
    let teammateName = {
      firstName: "Sergio",
      lastName: "Perez",
    };

    if (driver.team && driver.team.toLowerCase().includes("mercedes")) {
      teammateName = {
        firstName: "George",
        lastName: "Russell",
      };
    } else if (driver.team && driver.team.toLowerCase().includes("ferrari")) {
      teammateName = {
        firstName: "Carlos",
        lastName: "Sainz",
      };
    }

    return {
      firstName: teammateName.firstName,
      lastName: teammateName.lastName,
      image: `/static/images/drivers/${teammateName.firstName.toLowerCase()}_${teammateName.lastName.toLowerCase()}.jpg`,
      current_points: "156",
      best_result: "1st (Saudi Arabia)",
      avg_qualifying: "3.6",
      avg_finish: "2.8",
      quali_battle: {
        driver_wins: 8,
        teammate_wins: 4,
      },
      race_battle: {
        driver_wins: 10,
        teammate_wins: 2,
      },
      points: {
        driver: 240,
        teammate: 156,
      },
    };
  }

  // Function to generate mock driver standings
  function generateMockDriverStandings() {
    return [
      {
        position: "1",
        driverId: "max_verstappen",
        firstName: "Max",
        lastName: "Verstappen",
        team: "Red Bull Racing",
        points: "240",
      },
      {
        position: "2",
        driverId: "lewis_hamilton",
        firstName: "Lewis",
        lastName: "Hamilton",
        team: "Mercedes",
        points: "190",
      },
      {
        position: "3",
        driverId: "lando_norris",
        firstName: "Lando",
        lastName: "Norris",
        team: "McLaren",
        points: "175",
      },
      {
        position: "4",
        driverId: "charles_leclerc",
        firstName: "Charles",
        lastName: "Leclerc",
        team: "Ferrari",
        points: "168",
      },
      {
        position: "5",
        driverId: "sergio_perez",
        firstName: "Sergio",
        lastName: "Perez",
        team: "Red Bull Racing",
        points: "156",
      },
      {
        position: "6",
        driverId: "carlos_sainz",
        firstName: "Carlos",
        lastName: "Sainz",
        team: "Ferrari",
        points: "150",
      },
      {
        position: "7",
        driverId: "george_russell",
        firstName: "George",
        lastName: "Russell",
        team: "Mercedes",
        points: "145",
      },
      {
        position: "8",
        driverId: "oscar_piastri",
        firstName: "Oscar",
        lastName: "Piastri",
        team: "McLaren",
        points: "98",
      },
    ];
  }

  // Function to generate mock constructor standings
  function generateMockConstructorStandings() {
    return [
      {
        position: "1",
        name: "Red Bull Racing",
        points: "396",
      },
      {
        position: "2",
        name: "Ferrari",
        points: "318",
      },
      {
        position: "3",
        name: "Mercedes",
        points: "335",
      },
      {
        position: "4",
        name: "McLaren",
        points: "273",
      },
      {
        position: "5",
        name: "Aston Martin",
        points: "112",
      },
    ];
  }

  // Function to generate mock points progression data
  function generateMockPointsProgression() {
    return [
      {
        driverId: "max_verstappen",
        firstName: "Max",
        lastName: "Verstappen",
        rounds: [
          "Bahrain",
          "Saudi Arabia",
          "Australia",
          "Azerbaijan",
          "Miami",
          "Monaco",
        ],
        points: [25, 43, 43, 68, 94, 119],
      },
      {
        driverId: "lewis_hamilton",
        firstName: "Lewis",
        lastName: "Hamilton",
        rounds: [
          "Bahrain",
          "Saudi Arabia",
          "Australia",
          "Azerbaijan",
          "Miami",
          "Monaco",
        ],
        points: [15, 33, 38, 48, 66, 84],
      },
      {
        driverId: "lando_norris",
        firstName: "Lando",
        lastName: "Norris",
        rounds: [
          "Bahrain",
          "Saudi Arabia",
          "Australia",
          "Azerbaijan",
          "Miami",
          "Monaco",
        ],
        points: [12, 20, 36, 44, 60, 75],
      },
      {
        driverId: "charles_leclerc",
        firstName: "Charles",
        lastName: "Leclerc",
        rounds: [
          "Bahrain",
          "Saudi Arabia",
          "Australia",
          "Azerbaijan",
          "Miami",
          "Monaco",
        ],
        points: [18, 26, 34, 42, 62, 80],
      },
      {
        driverId: "sergio_perez",
        firstName: "Sergio",
        lastName: "Perez",
        rounds: [
          "Bahrain",
          "Saudi Arabia",
          "Australia",
          "Azerbaijan",
          "Miami",
          "Monaco",
        ],
        points: [18, 36, 54, 62, 74, 86],
      },
    ];
  }

  // Function to validate races data in the API response
  function validateRacesData(data) {
    if (data.recent_races) {
      if (Array.isArray(data.recent_races)) {
        console.log(
          `DEBUG: Successfully received stats data. Recent races count: ${data.recent_races.length}`
        );

        // Inspect first race object to verify structure
        if (data.recent_races.length > 0) {
          const sampleRace = data.recent_races[0];
          console.log("DEBUG: Sample race structure:", sampleRace);
        }
      } else {
        console.error(
          "DEBUG: recent_races is not an array:",
          data.recent_races
        );
        data.recent_races = []; // Fix the data structure
      }
    } else {
      console.log("DEBUG: No recent_races field in response");
      data.recent_races = []; // Ensure it exists
    }
  }

  // Function to handle race results
  function handleRaceResults(data, driverId) {
    const recentRacesBody = document.getElementById("recent-races-table-body");

    if (data.recent_races && data.recent_races.length > 0) {
      console.log(
        `DEBUG: Populating ${data.recent_races.length} races from API`
      );
      populateRecentRaces(data.recent_races);
    } else {
      console.log("DEBUG: No recent races data available in API response");

      // In development mode, use mock race data
      if (isDevelopmentMode) {
        console.log("DEBUG: Using mock race data in development mode");
        const mockRaces = generateMockRaceData(driverId);
        populateRecentRaces(mockRaces);
        return;
      }

      if (recentRacesBody) {
        recentRacesBody.innerHTML =
          '<tr><td colspan="8" class="text-center">No recent race results available from the API</td></tr>';
      }

      // Try a fallback approach in production, but skip in development
      if (!apiConfig.skipFallbackRaceCalls) {
        tryFallbackRacesCall(driverId);
      } else {
        console.log("DEBUG: Skipping fallback race calls in development mode");
      }
    }
  }

  // Function to handle driver stats response error
  function handleDriverStatsResponseError(data, driverId) {
    // Show error message but still update what we can
    if (
      document
        .getElementById("driver-biography")
        .innerHTML.includes("spinner-border")
    ) {
      document.getElementById(
        "driver-biography"
      ).innerHTML = `<div class="alert alert-warning">
          <strong>API Error:</strong> Could not load driver statistics.<br>
          <small class="text-muted">Error details: ${
            data.message || "Unknown error"
          }</small>
        </div>`;
    }

    // Make sure stats are still shown with zeroes
    updateDriverStats({});

    // Show error message in the race results table
    const recentRacesBody = document.getElementById("recent-races-table-body");
    if (recentRacesBody) {
      recentRacesBody.innerHTML =
        '<tr><td colspan="5" class="text-center">No recent race results available (API error)</td></tr>';
    }

    // Try fallback approach for races
    tryFallbackRacesCall(driverId);

    // Still set up rival selection
    setupRivalSelector(driverId);
  }

  // Function to handle driver stats error
  function handleDriverStatsError(error, driverId) {
    // Show error message but still update what we can
    if (
      document
        .getElementById("driver-biography")
        .innerHTML.includes("spinner-border")
    ) {
      document.getElementById(
        "driver-biography"
      ).innerHTML = `<div class="alert alert-warning">
          <strong>API Error:</strong> Could not load driver statistics.<br>
          <small class="text-muted">Error details: ${error.message}</small>
        </div>`;
    }

    // Make sure stats are still shown with zeroes
    updateDriverStats({});

    // Show error message in the race results table
    const recentRacesBody = document.getElementById("recent-races-table-body");
    if (recentRacesBody) {
      recentRacesBody.innerHTML =
        '<tr><td colspan="5" class="text-center">No race results available from the API</td></tr>';
    }

    // Try fallback approach for races
    tryFallbackRacesCall(driverId);

    // Still set up rival selection
    setupRivalSelector(driverId);
  }

  // Function to populate basic driver info
  function populateDriverInfo(driver) {
    console.log("Populating driver info:", driver);

    // Update document title
    document.title = `${driver.firstName} ${driver.lastName} - F1 Pulse`;

    // Update breadcrumb and header
    const breadcrumbElement = document.getElementById("breadcrumb-driver-name");
    if (checkElement(breadcrumbElement, "breadcrumb-driver-name")) {
      breadcrumbElement.textContent = `${driver.firstName} ${driver.lastName}`;
    }

    const headerNameElement = document.getElementById("header-driver-name");
    if (checkElement(headerNameElement, "header-driver-name")) {
      headerNameElement.textContent = `${driver.firstName} ${driver.lastName}`;
    }

    // Driver number header
    const driverNumberHeader = document.getElementById("driver-number-header");
    if (checkElement(driverNumberHeader, "driver-number-header")) {
      driverNumberHeader.innerHTML = `<span class="fs-4 fw-bold">#${
        driver.number || "??"
      }</span>`;
    }

    // Profile card
    const driverNameElement = document.getElementById("driver-name");
    if (checkElement(driverNameElement, "driver-name")) {
      driverNameElement.textContent = `${driver.firstName} ${driver.lastName}`;
    }

    const nationalityElement = document.getElementById("driver-nationality");
    if (checkElement(nationalityElement, "driver-nationality")) {
      nationalityElement.textContent = driver.nationality || "Unknown";
    }

    // Format date of birth
    if (driver.dateOfBirth) {
      const birthDate = new Date(driver.dateOfBirth);
      const dobElement = document.getElementById("driver-dob");
      if (checkElement(dobElement, "driver-dob")) {
        dobElement.textContent = birthDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      // Calculate age
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      const ageElement = document.getElementById("driver-age");
      if (checkElement(ageElement, "driver-age")) {
        ageElement.textContent = age;
      }
    }

    // Set nationality flag with fallback
    const flagElement = document.getElementById("driver-flag");
    if (checkElement(flagElement, "driver-flag") && driver.nationality) {
      setFlagWithFallback(flagElement, driver.nationality);
    }

    // Update biography with simple text
    const bioElement = document.getElementById("driver-biography");
    if (checkElement(bioElement, "driver-biography")) {
      bioElement.textContent = `${driver.firstName} ${
        driver.lastName
      } is a Formula 1 driver from ${driver.nationality || "Unknown"}.`;
    }
  }

  // Function to set flag with fallback
  function setFlagWithFallback(flagElement, nationality) {
    if (!flagElement || !nationality) {
      console.warn("Missing element or nationality for flag");
      return;
    }

    console.log(`Setting flag for nationality: ${nationality}`);
    // Clean up the nationality for use in file paths
    let flagName = nationality.toLowerCase().replace(/\s+/g, "_");

    const flagMappings = {
      monégasque: "monaco",
      monegasque: "monaco",
      united_kingdom: "british",
      great_britain: "british",
      uk: "british",
      england: "british",
      united_states: "american",
      usa: "american",
      us: "american",
      new_zealand: "new_zealander",
      the_netherlands: "dutch",
      netherlands: "dutch",
      german: "germany",
      spanish: "spain",
      italian: "italy",
      french: "france",
      finnish: "finland",
      japanese: "japan",
      australian: "australia",
      canadian: "canada",
      mexican: "mexico",
      thai: "thailand",
      danish: "denmark",
      chinese: "china",
      polish: "poland",
      brazilian: "brazil",
      argentine: "argentina",
      austrian: "austria",
      belgian: "belgium",
      swiss: "switzerland",
      russia: "russian",
      russian: "russia",
    };

    // Check if we have a mapping for this nationality
    if (flagMappings[flagName]) {
      flagName = flagMappings[flagName];
    }

    // In development mode, just use the placeholder
    if (isDevelopmentMode) {
      console.log(
        `Using placeholder flag in development mode for ${nationality}`
      );
      flagElement.src = "/static/images/flag-placeholder.png";
      flagElement.alt = `${nationality} flag (placeholder)`;
      return;
    }

    // Try these flag variants in order until one works
    const flagVariants = [
      // Original standardized name
      flagName,
      // Try with hyphen instead of underscore
      nationality.toLowerCase().replace(/\s+/g, "-"),
      // Try just the first word
      nationality.toLowerCase().split(" ")[0],
    ];

    tryLoadFlagVariant(flagVariants, 0, flagElement, nationality);
  }

  // Helper function to try loading flag variants recursively
  function tryLoadFlagVariant(variants, index, flagElement, nationality) {
    if (index >= variants.length) {
      // All attempts failed, use placeholder
      console.log(
        `All flag attempts failed for ${nationality}, using placeholder`
      );
      flagElement.src = "/static/images/flag-placeholder.png";
      flagElement.alt = `${nationality} flag (placeholder)`;
      return;
    }

    const variant = variants[index];
    const flagSrc = `/static/images/flags/${variant}.png`;
    console.log(
      `Trying flag variant ${index + 1}/${variants.length}: ${flagSrc}`
    );

    const img = new Image();
    img.onload = function () {
      flagElement.src = flagSrc;
      flagElement.alt = `${nationality} flag`;
      console.log(`Flag loaded successfully: ${flagSrc}`);
    };
    img.onerror = function () {
      // Try next variant
      tryLoadFlagVariant(variants, index + 1, flagElement, nationality);
    };
    img.src = flagSrc;
  }

  // Function to update driver info
  function updateDriverInfo(driver) {
    try {
      console.log(
        "Updating driver info for:",
        driver.firstName,
        driver.lastName
      );

      // Basic info
      if (document.getElementById("driver-name")) {
        document.getElementById(
          "driver-name"
        ).textContent = `${driver.firstName} ${driver.lastName}`;
      }

      if (document.getElementById("header-driver-name")) {
        document.getElementById(
          "header-driver-name"
        ).textContent = `${driver.firstName} ${driver.lastName}`;
      }

      if (document.getElementById("breadcrumb-driver-name")) {
        document.getElementById(
          "breadcrumb-driver-name"
        ).textContent = `${driver.firstName} ${driver.lastName}`;
      }

      // Team info
      if (driver.team) {
        if (document.getElementById("driver-team")) {
          document.getElementById("driver-team").textContent = driver.team;
        }

        if (document.getElementById("header-driver-team")) {
          document.getElementById("header-driver-team").textContent =
            driver.team;
        }
      }

      // Driver number
      if (driver.number && document.getElementById("driver-number-header")) {
        document.getElementById(
          "driver-number-header"
        ).innerHTML = `<span class="fs-4 fw-bold">#${driver.number}</span>`;
      }

      // Nationality and flag
      if (driver.nationality) {
        if (document.getElementById("driver-nationality")) {
          document.getElementById("driver-nationality").textContent =
            driver.nationality;
        }

        const flagElement = document.getElementById("driver-flag");
        if (flagElement) {
          setFlagWithFallback(flagElement, driver.nationality);
        }
      }

      // Biography
      if (document.getElementById("driver-biography")) {
        if (driver.biography) {
          document.getElementById("driver-biography").textContent =
            driver.biography;
        } else {
          document.getElementById("driver-biography").textContent = `${
            driver.firstName
          } ${driver.lastName} is a Formula 1 driver currently racing for ${
            driver.team || "their team"
          }.`;
        }
      }

      // Date of birth and age
      if (driver.dateOfBirth) {
        if (document.getElementById("driver-dob")) {
          document.getElementById("driver-dob").textContent = formatDate(
            driver.dateOfBirth
          );
        }

        // Calculate age
        if (document.getElementById("driver-age")) {
          const birthDate = new Date(driver.dateOfBirth);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }
          document.getElementById("driver-age").textContent = age;
        }
      }

      // First race
      if (driver.firstRace && document.getElementById("driver-first-race")) {
        document.getElementById("driver-first-race").textContent =
          driver.firstRace;
      }

      // Driver image and helmet
      updateDriverImages(driver);

      console.log("Driver info updated successfully");
    } catch (err) {
      console.error("Error updating driver info:", err);
    }
  }

  // Helper function to update driver images with proper fallbacks
  function updateDriverImages(driver) {
    const imageElement = document.getElementById("driver-image");
    const helmetElement = document.getElementById("driver-helmet");

    if (!imageElement || !helmetElement) return;

    // In development mode, just use placeholders
    if (isDevelopmentMode) {
      console.log("Using placeholder images for driver in development mode");
      imageElement.src = "/static/images/driver-placeholder.jpg";
      imageElement.alt = `${driver.firstName} ${driver.lastName} (placeholder)`;
      helmetElement.src = "/static/images/helmet-placeholder.jpg";
      helmetElement.alt = `${driver.firstName} ${driver.lastName}'s helmet (placeholder)`;
      return;
    }

    // In production, try to load the actual images
    const driverId =
      driver.id ||
      driver.driverId ||
      `${driver.firstName.toLowerCase()}_${driver.lastName.toLowerCase()}`;

    // Try driver image variants
    const driverImg = new Image();
    driverImg.onload = function () {
      imageElement.src = this.src;
      imageElement.alt = `${driver.firstName} ${driver.lastName}`;
    };
    driverImg.onerror = function () {
      imageElement.src = "/static/images/driver-placeholder.jpg";
      imageElement.alt = `${driver.firstName} ${driver.lastName} (placeholder)`;
    };
    driverImg.src = `/static/images/drivers/${driverId}.jpg`;

    // Try helmet image variants
    const helmetImg = new Image();
    helmetImg.onload = function () {
      helmetElement.src = this.src;
      helmetElement.alt = `${driver.firstName} ${driver.lastName}'s helmet`;
    };
    helmetImg.onerror = function () {
      helmetElement.src = "/static/images/helmet-placeholder.jpg";
      helmetElement.alt = `${driver.firstName} ${driver.lastName}'s helmet (placeholder)`;
    };
    helmetImg.src = `/static/images/helmets/${driverId}.png`;
  }

  // Helper function to format a date string
  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  }

  // Function to update driver statistics
  function updateDriverStats(stats) {
    console.log("Updating driver stats with:", stats);

    // Use mock data in development mode if stats are empty or all zeros
    if (
      isDevelopmentMode &&
      (!stats ||
        (stats.championships === 0 &&
          stats.race_wins === 0 &&
          stats.podiums === 0 &&
          stats.pole_positions === 0 &&
          stats.fastest_laps === 0))
    ) {
      console.log("Using mock stats data in development mode");
      stats = {
        championships: Math.floor(Math.random() * 3),
        race_wins: 5 + Math.floor(Math.random() * 20),
        podiums: 15 + Math.floor(Math.random() * 30),
        pole_positions: 8 + Math.floor(Math.random() * 15),
        fastest_laps: 10 + Math.floor(Math.random() * 12),
        current_position: 1 + Math.floor(Math.random() * 5),
        current_points: 150 + Math.floor(Math.random() * 100),
      };
    }

    if (!stats) {
      stats = {
        championships: 0,
        race_wins: 0,
        podiums: 0,
        pole_positions: 0,
        fastest_laps: 0,
        current_position: 0,
        current_points: 0,
      };
    }

    // Update championships
    const championshipsElement = document.getElementById(
      "driver-championships"
    );
    if (championshipsElement) {
      championshipsElement.textContent = stats.championships || "0";
    }

    // Update key stats
    const winsElement = document.getElementById("stat-wins");
    if (winsElement) {
      winsElement.textContent = stats.race_wins || "0";
    }

    const podiumsElement = document.getElementById("stat-podiums");
    if (podiumsElement) {
      podiumsElement.textContent = stats.podiums || "0";
    }

    const polesElement = document.getElementById("stat-poles");
    if (polesElement) {
      polesElement.textContent = stats.pole_positions || "0";
    }

    const fastestLapsElement = document.getElementById("stat-fastest-laps");
    if (fastestLapsElement) {
      fastestLapsElement.textContent = stats.fastest_laps || "0";
    }

    // Update current position and points
    const positionElement = document.getElementById("current-position-display");
    if (positionElement) {
      positionElement.textContent = stats.current_position || "-";
    }

    const pointsElement = document.getElementById("current-points-display");
    if (pointsElement) {
      pointsElement.textContent = stats.current_points || "0";
    }

    console.log("Driver stats updated successfully");
  }

  // Function to populate recent races table
  function populateRecentRaces(races) {
    console.log("Populating recent races:", races);
    const tableBody = document.getElementById("recent-races-table-body");
    if (!tableBody) {
      console.error("Recent races table body not found");
      return;
    }

    // Clear existing content
    tableBody.innerHTML = "";

    if (!races || races.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="5" class="text-center">No recent race results available from the API</td></tr>';
      return;
    }

    // Detailed logging for debugging
    console.log(`DEBUG: Processing ${races.length} races for display`);

    // Sort races by date (most recent first)
    races.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateB - dateA;
    });

    // Add each race to the table
    let raceCount = 0;
    races.forEach((race) => {
      raceCount++;
      console.log(
        `DEBUG: Adding race ${raceCount}: ${race.race} (${race.date}), position: ${race.position}`
      );

      // Ensure required fields have default values
      validateRaceData(race, raceCount);

      // Create and append the table row
      const row = createRaceTableRow(race, raceCount);
      tableBody.appendChild(row);
    });

    console.log(`DEBUG: Successfully added ${raceCount} races to the table`);
  }

  // Helper function to validate and set defaults for race data
  function validateRaceData(race, raceCount) {
    if (!race.race) {
      console.warn(`DEBUG: Race ${raceCount} has no race name`);
      race.race = "Unknown Race";
    }

    if (!race.circuit) {
      console.warn(`DEBUG: Race ${raceCount} has no circuit name`);
      race.circuit = "Unknown Circuit";
    }
  }

  // Helper function to create a table row for a race
  function createRaceTableRow(race, raceCount) {
    const row = document.createElement("tr");

    // Add class based on position
    applyPositionStyling(row, race.position);

    // Format date
    const raceDate = formatRaceDate(race.date, raceCount);

    // Create race and circuit names with links if IDs are available
    const raceName = createLinkIfPossible(
      race.race,
      "race-link",
      race.circuitId,
      "/circuit/"
    );
    const circuitName = createLinkIfPossible(
      race.circuit,
      "circuit-link",
      race.circuitId,
      "/circuit/"
    );

    // Create qualifying position display
    const qualifyingPosition = race.qualifying_position || "N/A";

    // Create position display with DNF indicator
    const positionDisplay = formatPositionDisplay(race);

    // Create race status indicator
    const statusDisplay = createStatusIndicator(race);

    // Create details button
    const detailsButton = `<button class="btn btn-sm btn-outline-primary race-details-btn" data-race-id="${
      race.raceId || ""
    }" data-bs-toggle="modal" data-bs-target="#raceDetailsModal">Details</button>`;

    // Create row content
    row.innerHTML = `
      <td>${raceDate}</td>
      <td>${raceName}</td>
      <td>${circuitName}</td>
      <td>${qualifyingPosition}</td>
      <td>${positionDisplay}</td>
      <td>${race.points || "0"}</td>
      <td>${statusDisplay}</td>
      <td>${detailsButton}</td>
    `;

    // Add event listener to details button
    const detailsBtn = row.querySelector(".race-details-btn");
    if (detailsBtn) {
      detailsBtn.addEventListener("click", () => showRaceDetails(race));
    }

    return row;
  }

  // Helper function to apply styling based on podium position
  function applyPositionStyling(row, position) {
    const pos = parseInt(position);
    if (pos === 1) {
      row.classList.add("table-warning"); // Gold for 1st
    } else if (pos === 2) {
      row.classList.add("table-light"); // Silver for 2nd
    } else if (pos === 3) {
      row.classList.add("table-danger"); // Bronze for 3rd
    }
  }

  // Helper function to format race date
  function formatRaceDate(dateString, raceCount) {
    if (!dateString) return "Unknown";

    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    } catch (e) {
      console.warn(
        `DEBUG: Invalid date format for race ${raceCount}: ${dateString}`
      );
    }

    return "Unknown";
  }

  // Helper function to create link if ID is available
  function createLinkIfPossible(text, className, id, basePath) {
    if (!text) return "Unknown";

    if (id) {
      return `<a href="${basePath}${id}" class="${className}">${text}</a>`;
    }

    return text;
  }

  // Helper function to format position display
  function formatPositionDisplay(race) {
    let positionDisplay = race.position || "N/A";
    if (race.finished === false && race.status) {
      positionDisplay = `DNF (${race.status})`;
    }
    return positionDisplay;
  }

  // Helper function to create status indicator
  function createStatusIndicator(race) {
    if (race.finished === false) {
      const status = race.status || "DNF";
      let statusClass = "status-dnf";

      if (status.toLowerCase().includes("dns")) {
        statusClass = "status-dns";
      } else if (
        status.toLowerCase().includes("dsq") ||
        status.toLowerCase().includes("disq")
      ) {
        statusClass = "status-dsq";
      }

      return `<span class="race-status ${statusClass}">${status}</span>`;
    }

    return `<span class="race-status status-finished">Finished</span>`;
  }

  // Function to show race details in modal
  function showRaceDetails(race) {
    const modalTitle = document.getElementById("raceDetailsModalLabel");
    const modalContent = document.getElementById("race-details-content");

    if (!modalTitle || !modalContent) {
      console.error("Race details modal elements not found");
      return;
    }

    // Set modal title
    modalTitle.textContent = `${race.race || "Race"} Details`;

    // Create the content for the modal
    const content = `
      <div class="row">
        <div class="col-md-6">
          <h5>Race Information</h5>
          <table class="table table-sm">
            <tbody>
              <tr>
                <th>Date:</th>
                <td>${formatRaceDate(race.date)}</td>
              </tr>
              <tr>
                <th>Circuit:</th>
                <td>${race.circuit || "Unknown"}</td>
              </tr>
              <tr>
                <th>Season:</th>
                <td>${race.season || "Unknown"}</td>
              </tr>
              <tr>
                <th>Round:</th>
                <td>${race.round || "Unknown"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="col-md-6">
          <h5>Driver Performance</h5>
          <table class="table table-sm">
            <tbody>
              <tr>
                <th>Grid Position:</th>
                <td>${race.qualifying_position || race.grid || "N/A"}</td>
              </tr>
              <tr>
                <th>Final Position:</th>
                <td>${race.position || "N/A"}</td>
              </tr>
              <tr>
                <th>Points:</th>
                <td>${race.points || "0"}</td>
              </tr>
              <tr>
                <th>Status:</th>
                <td>${
                  race.status || (race.finished === false ? "DNF" : "Finished")
                }</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      ${
        race.fastest_lap
          ? `
      <div class="row mt-3">
        <div class="col-12">
          <h5>Fastest Lap</h5>
          <table class="table table-sm">
            <tbody>
              <tr>
                <th>Time:</th>
                <td>${race.fastest_lap.time || "N/A"}</td>
              </tr>
              <tr>
                <th>Lap:</th>
                <td>${race.fastest_lap.lap || "N/A"}</td>
              </tr>
              <tr>
                <th>Rank:</th>
                <td>${race.fastest_lap.rank || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      `
          : ""
      }
      
      <div class="row mt-3">
        <div class="col-12">
          <h5>Additional Information</h5>
          <p class="mb-1">${
            race.notes || "No additional notes available for this race."
          }</p>
          <p class="text-muted small">Data sourced from F1 API.</p>
        </div>
      </div>
    `;

    modalContent.innerHTML = content;
  }

  // Function to setup rival selector
  function setupRivalSelector(driverId) {
    console.log("Setting up rival selector for driver:", driverId);
    const rivalSelector = document.getElementById("rivalSelector");
    if (!rivalSelector) {
      console.error("Rival selector not found");
      return;
    }

    // Clear existing options except the first
    while (rivalSelector.options.length > 1) {
      rivalSelector.remove(1);
    }

    // Default popular drivers for comparison
    const defaultRivals = [
      { id: "max_verstappen", name: "Max Verstappen" },
      { id: "hamilton", name: "Lewis Hamilton" },
      { id: "norris", name: "Lando Norris" },
      { id: "leclerc", name: "Charles Leclerc" },
      { id: "alonso", name: "Fernando Alonso" },
      { id: "piastri", name: "Oscar Piastri" },
      { id: "sainz", name: "Carlos Sainz" },
      { id: "russell", name: "George Russell" },
      { id: "perez", name: "Sergio Perez" },
      { id: "stroll", name: "Lance Stroll" },
      { id: "albon", name: "Alex Albon" },
      { id: "tsunoda", name: "Yuki Tsunoda" },
      { id: "ocon", name: "Esteban Ocon" },
      { id: "gasly", name: "Pierre Gasly" },
      { id: "hulkenberg", name: "Nico Hulkenberg" },
      { id: "ricciardo", name: "Daniel Ricciardo" },
    ];

    // Filter out the current driver
    const rivals = defaultRivals.filter(
      (driver) => driver.id !== driverId && driver.id !== standardizedDriverId
    );

    // Add options to selector
    rivals.forEach((rival) => {
      const option = document.createElement("option");
      option.value = rival.id;
      option.textContent = rival.name;
      rivalSelector.appendChild(option);
    });

    // Add event listener for rival selection
    rivalSelector.addEventListener("change", function () {
      const selectedRivalId = this.value;
      if (selectedRivalId) {
        // Use standardized ID format if available
        const standardizedRivalId =
          driverIdMappings[selectedRivalId] || selectedRivalId;
        fetchRivalComparisonData(standardizedDriverId, standardizedRivalId);
      }
    });

    // Select first rival by default and trigger comparison
    if (rivalSelector.options.length > 1) {
      rivalSelector.selectedIndex = 1;
      const selectedRivalId = rivalSelector.value;
      fetchRivalComparisonData(standardizedDriverId, selectedRivalId);
    }
  }

  // Function to fetch rival comparison data
  function fetchRivalComparisonData(driverId, rivalId) {
    console.log(`Comparing ${driverId} with rival ${rivalId}`);

    // Display a loading message in the comparison section
    const rivalryStatsElement = document.getElementById("rivalryStats");
    if (rivalryStatsElement) {
      rivalryStatsElement.innerHTML = `
        <div class="text-center">
          <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <span class="ms-2">Loading comparison data from API...</span>
        </div>
      `;
    }

    // Fetch driver 1 stats
    fetch(`/api/driver-stats/${driverId}`)
      .then((response) => {
        console.log(
          `DEBUG: Rivalry API response for driver1 status: ${response.status}`
        );
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return response.json();
      })
      .then((driverData) => {
        if (!driverData.success) {
          throw new Error("Failed to load driver data from API");
        }

        // Now fetch driver 2 stats
        return fetch(`/api/driver-stats/${rivalId}`)
          .then((response) => {
            console.log(
              `DEBUG: Rivalry API response for driver2 status: ${response.status}`
            );
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            return response.json();
          })
          .then((rivalData) => {
            if (!rivalData.success) {
              throw new Error("Failed to load rival data from API");
            }

            // Update the rivalry comparison
            updateRivalryComparison(driverData, rivalData);
          });
      })
      .catch((error) => {
        console.error("Error in rivalry comparison:", error);

        // Show error message
        if (rivalryStatsElement) {
          rivalryStatsElement.innerHTML = `
            <div class="alert alert-warning">
              <p>Unable to load comparison data from the API. Please try again later.</p>
              <p class="small text-muted">${error.message}</p>
            </div>
          `;
        }
      });
  }

  // Function to update rivalry comparison
  function updateRivalryComparison(driverData, rivalData) {
    console.log(
      "Updating rivalry comparison with data:",
      driverData,
      rivalData
    );
    const rivalryStatsElement = document.getElementById("rivalryStats");
    if (!rivalryStatsElement) {
      console.error("Rivalry stats element not found");
      return;
    }

    // Check if we have valid data from both API calls
    if (!driverData.driver || !rivalData.driver) {
      rivalryStatsElement.innerHTML = `
        <div class="alert alert-warning">
          <p>Cannot display comparison - incomplete driver data from API.</p>
        </div>
      `;
      return;
    }

    const driver1 = driverData.driver;
    const driver2 = rivalData.driver;
    const stats1 = driverData.stats || {};
    const stats2 = rivalData.stats || {};

    const driver1Name = `${driver1.firstName} ${driver1.lastName}`;
    const driver2Name = `${driver2.firstName} ${driver2.lastName}`;

    // Create table rows for comparison
    const comparisonRows = generateComparisonRows(stats1, stats2);

    // Create a comparison table with better styling
    rivalryStatsElement.innerHTML = `
      <div class="row">
        <div class="col-md-12">
          <h5 class="mb-3">Head-to-Head Comparison: ${driver1Name} vs ${driver2Name}</h5>
          <div class="table-responsive">
            <table class="table table-sm table-bordered">
              <thead class="bg-light">
                <tr>
                  <th>Category</th>
                  <th class="text-center">${driver1Name}</th>
                  <th class="text-center">${driver2Name}</th>
                  <th class="text-center">Difference</th>
                </tr>
              </thead>
              <tbody>
                ${comparisonRows}
              </tbody>
            </table>
          </div>
          <p class="small text-muted mt-2">Data sourced directly from the API - no mock data used.</p>
        </div>
      </div>
    `;
  }

  // Helper function to generate comparison table rows
  function generateComparisonRows(stats1, stats2) {
    // Define comparison categories and their properties
    const categories = [
      {
        name: "World Championships",
        key: "championships",
        type: "int",
        higherIsBetter: true,
      },
      {
        name: "Race Wins",
        key: "race_wins",
        type: "int",
        higherIsBetter: true,
      },
      {
        name: "Podiums",
        key: "podiums",
        type: "int",
        higherIsBetter: true,
      },
      {
        name: "Pole Positions",
        key: "pole_positions",
        type: "int",
        higherIsBetter: true,
      },
      {
        name: "Fastest Laps",
        key: "fastest_laps",
        type: "int",
        higherIsBetter: true,
      },
      {
        name: "2024 Championship Position",
        key: "current_position",
        type: "int",
        higherIsBetter: false,
        ignoreZero: true,
      },
      {
        name: "2024 Points",
        key: "current_points",
        type: "float",
        higherIsBetter: true,
        decimalPlaces: 1,
      },
    ];

    // Generate HTML for each row
    return categories
      .map((category) => {
        const value1 = stats1[category.key] || 0;
        const value2 = stats2[category.key] || 0;

        let parsedValue1, parsedValue2, difference;

        if (category.type === "int") {
          parsedValue1 = parseInt(value1);
          parsedValue2 = parseInt(value2);
          difference = Math.abs(parsedValue1 - parsedValue2);
        } else if (category.type === "float") {
          parsedValue1 = parseFloat(value1);
          parsedValue2 = parseFloat(value2);
          difference = Math.abs(parsedValue1 - parsedValue2).toFixed(
            category.decimalPlaces || 0
          );
        }

        const isValue1Better = category.higherIsBetter
          ? parsedValue1 > parsedValue2
          : parsedValue1 < parsedValue2 &&
            (!category.ignoreZero || parsedValue1 > 0);

        const isValue2Better = category.higherIsBetter
          ? parsedValue2 > parsedValue1
          : parsedValue2 < parsedValue1 &&
            (!category.ignoreZero || parsedValue2 > 0);

        const displayValue1 =
          category.name === "2024 Championship Position" &&
          !stats1[category.key]
            ? "-"
            : value1;
        const displayValue2 =
          category.name === "2024 Championship Position" &&
          !stats2[category.key]
            ? "-"
            : value2;
        const displayDifference =
          category.name === "2024 Championship Position" &&
          (!stats1[category.key] || !stats2[category.key])
            ? "-"
            : difference;

        return `
        <tr>
          <td>${category.name}</td>
          <td class="text-center ${
            isValue1Better ? "table-success" : ""
          }">${displayValue1}</td>
          <td class="text-center ${
            isValue2Better ? "table-success" : ""
          }">${displayValue2}</td>
          <td class="text-center">${displayDifference}</td>
        </tr>
      `;
      })
      .join("");
  }

  // Function to update team-mate battle
  function updateTeamMateBattle(driver, teammate) {
    try {
      console.log(
        "Updating team-mate battle between",
        driver.firstName,
        "and",
        teammate.firstName
      );
      const battleContainer = document.getElementById("team-mate-battle");
      if (!battleContainer || !teammate) {
        console.log(
          "Team mate battle container not found or teammate data missing"
        );
        return;
      }

      const driverName = `${driver.firstName} ${driver.lastName}`;
      const teammateName = `${teammate.firstName} ${teammate.lastName}`;

      // Create comparison statistics
      const qualiWins = teammate.quali_battle
        ? `${teammate.quali_battle.driver_wins || 0}-${
            teammate.quali_battle.teammate_wins || 0
          }`
        : `${Math.floor(Math.random() * 8 + 6)}-${Math.floor(
            Math.random() * 7 + 4
          )}`; // Random for development

      const raceWins = teammate.race_battle
        ? `${teammate.race_battle.driver_wins || 0}-${
            teammate.race_battle.teammate_wins || 0
          }`
        : `${Math.floor(Math.random() * 7 + 5)}-${Math.floor(
            Math.random() * 6 + 3
          )}`; // Random for development

      const pointsComparison = teammate.points
        ? `${teammate.points.driver || 0}-${teammate.points.teammate || 0}`
        : `${Math.floor(Math.random() * 80 + 120)}-${Math.floor(
            Math.random() * 60 + 80
          )}`; // Random for development

      // If we need to generate more fake data for development
      if (!teammate.image) {
        teammate.image = "/static/images/driver-placeholder.jpg";
      }

      if (!teammate.current_points) {
        teammate.current_points = Math.floor(Math.random() * 60 + 80);
      }

      if (!teammate.best_result) {
        const possibleResults = [
          "1st (Monaco)",
          "2nd (Italy)",
          "3rd (Belgium)",
          "4th (Austria)",
        ];
        teammate.best_result =
          possibleResults[Math.floor(Math.random() * possibleResults.length)];
      }

      if (!teammate.avg_qualifying) {
        teammate.avg_qualifying = (Math.random() * 3 + 5).toFixed(2);
      }

      if (!teammate.avg_finish) {
        teammate.avg_finish = (Math.random() * 3 + 4).toFixed(2);
      }

      // Generate the HTML for the battle comparison
      const html = `
        <div class="row">
          <div class="col-md-4">
            <div class="card qualifying-battle-card mb-3">
              <div class="card-body text-center">
                <h5>Qualifying Battle</h5>
                <div class="battle-score">${qualiWins}</div>
                <div class="driver-vs">${driverName} vs ${teammateName}</div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card qualifying-battle-card mb-3">
              <div class="card-body text-center">
                <h5>Race Finish Battle</h5>
                <div class="battle-score">${raceWins}</div>
                <div class="driver-vs">${driverName} vs ${teammateName}</div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card qualifying-battle-card mb-3">
              <div class="card-body text-center">
                <h5>Points Battle</h5>
                <div class="battle-score">${pointsComparison}</div>
                <div class="driver-vs">${driverName} vs ${teammateName}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            <div class="card team-mate-card">
              <div class="card-body">
                <div class="row align-items-center">
                  <div class="col-md-3 text-center">
                    <img src="${teammate.image}" 
                         alt="${teammateName}" class="img-fluid rounded mb-2" style="max-width: 100px;">
                    <h5>${teammateName}</h5>
                  </div>
                  <div class="col-md-9">
                    <table class="table table-sm">
                      <tbody>
                        <tr>
                          <th>Current Points:</th>
                          <td>${teammate.current_points}</td>
                        </tr>
                        <tr>
                          <th>Best Result:</th>
                          <td>${teammate.best_result}</td>
                        </tr>
                        <tr>
                          <th>Average Qualifying:</th>
                          <td>${teammate.avg_qualifying}</td>
                        </tr>
                        <tr>
                          <th>Average Finish:</th>
                          <td>${teammate.avg_finish}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      battleContainer.innerHTML = html;
      console.log("Team-mate battle updated successfully");
    } catch (err) {
      console.error("Error updating team-mate battle:", err);

      // Fallback to a simple display if there's an error
      const battleContainer = document.getElementById("team-mate-battle");
      if (battleContainer) {
        battleContainer.innerHTML = `
          <div class="alert alert-info">
            <p>Team mate comparison data will be available soon!</p>
          </div>
        `;
      }
    }
  }

  // Function to update qualifying vs race performance
  function updateQualifyingVsRacePerformance(races) {
    // Only proceed if we have race data with qualifying positions
    const validRaces = races.filter(
      (race) =>
        race.qualifying_position && race.position && race.finished !== false
    );

    if (validRaces.length === 0) return;

    // Calculate positions gained/lost statistics
    let positionsGained = 0;
    let positionsLost = 0;
    let positionsSame = 0;

    validRaces.forEach((race) => {
      const qualiPos = parseInt(race.qualifying_position);
      const racePos = parseInt(race.position);

      if (isNaN(qualiPos) || isNaN(racePos)) return;

      if (qualiPos > racePos) {
        positionsGained++;
      } else if (qualiPos < racePos) {
        positionsLost++;
      } else {
        positionsSame++;
      }
    });

    // Update the stats display
    document.getElementById("positions-gained").textContent = positionsGained;
    document.getElementById("positions-lost").textContent = positionsLost;
    document.getElementById("positions-same").textContent = positionsSame;

    // Create the chart if the chart.js library is loaded
    if (window.Chart && document.getElementById("qualifyingVsRaceChart")) {
      initializeQualifyingVsRaceChart(validRaces);
    }
  }

  // Function to initialize the qualifying vs race performance chart
  function initializeQualifyingVsRaceChart(races) {
    try {
      if (typeof Chart === "undefined") {
        console.warn(
          "Chart.js is not loaded, skipping qualifying vs race chart"
        );
        return;
      }

      const chartElement = document.getElementById("qualifyingVsRaceChart");
      if (!chartElement) {
        console.warn("qualifyingVsRaceChart element not found");
        return;
      }

      console.log(
        `Found ${currentSeasonRaces.length} races for current season`
      );

      // Calculate season completion
      const totalRaces = 23; // Typical F1 season length, could be fetched from API
      const completedRaces = currentSeasonRaces.length;
      const completionPercentage = (completedRaces / totalRaces) * 100;

      // Update progress bar and counts
      if (document.getElementById("season-completed-races")) {
        document.getElementById("season-completed-races").textContent =
          completedRaces;
      }

      if (document.getElementById("season-total-races")) {
        document.getElementById("season-total-races").textContent = totalRaces;
      }

      if (document.getElementById("season-progress-bar")) {
        document.getElementById(
          "season-progress-bar"
        ).style.width = `${completionPercentage}%`;
      }

      // Calculate performance metrics
      const finishedRaces = currentSeasonRaces.filter(
        (race) => race.finished !== false
      );
      const dnfRaces = currentSeasonRaces.filter(
        (race) => race.finished === false
      );

      // Average finish position for completed races
      let avgFinish = "-";
      if (finishedRaces.length > 0) {
        const positions = finishedRaces
          .map((race) => parseInt(race.position) || 0)
          .filter((pos) => pos > 0);
        if (positions.length > 0) {
          avgFinish = (
            positions.reduce((sum, pos) => sum + pos, 0) / positions.length
          ).toFixed(1);
        }
      }

      // DNF rate
      const dnfRate =
        currentSeasonRaces.length > 0
          ? `${((dnfRaces.length / currentSeasonRaces.length) * 100).toFixed(
              1
            )}%`
          : "-";

      // Points per race
      let pointsPerRace = "-";
      if (currentSeasonRaces.length > 0) {
        const totalPoints = currentSeasonRaces.reduce(
          (sum, race) => sum + (parseFloat(race.points) || 0),
          0
        );
        pointsPerRace = (totalPoints / currentSeasonRaces.length).toFixed(1);
      }

      // Update the metrics on the page
      if (document.getElementById("average-finish")) {
        document.getElementById("average-finish").textContent = avgFinish;
      }

      if (document.getElementById("dnf-rate")) {
        document.getElementById("dnf-rate").textContent = dnfRate;
      }

      if (document.getElementById("points-per-race")) {
        document.getElementById("points-per-race").textContent = pointsPerRace;
      }

      // If we have enough races, initialize the performance chart
      if (
        currentSeasonRaces.length >= 3 &&
        window.Chart &&
        document.getElementById("performanceChart")
      ) {
        try {
          initializePerformanceChart(currentSeasonRaces);
        } catch (chartErr) {
          console.error("Error initializing performance chart:", chartErr);
        }
      }

      console.log("Season progress metrics updated successfully");
    } catch (err) {
      console.error("Error updating season progress metrics:", err);
    }
  }

  // Function to update career milestones
  function updateCareerMilestones(driver, stats) {
    try {
      console.log(
        "Updating career milestones for",
        driver.firstName,
        driver.lastName
      );
      const milestonesContainer = document.getElementById("career-milestones");
      if (!milestonesContainer) {
        console.log("Career milestones container not found");
        return;
      }

      // Create milestones based on career data
      let milestones = [];

      // First race milestone
      if (driver.firstRaceDate) {
        milestones.push({
          date: new Date(driver.firstRaceDate),
          title: "First F1 Race",
          description: `${driver.firstName} made their F1 debut at the ${
            driver.firstRaceEvent || "Grand Prix"
          }.`,
        });
      }

      // First win milestone
      if (stats.first_win_date) {
        milestones.push({
          date: new Date(stats.first_win_date),
          title: "First F1 Win",
          description: `${driver.firstName} secured their first win at the ${
            stats.first_win_event || "Grand Prix"
          }.`,
        });
      }

      // First pole milestone
      if (stats.first_pole_date) {
        milestones.push({
          date: new Date(stats.first_pole_date),
          title: "First Pole Position",
          description: `${
            driver.firstName
          } claimed their first pole position at the ${
            stats.first_pole_event || "Grand Prix"
          }.`,
        });
      }

      // Championship milestone(s)
      if (stats.championships && parseInt(stats.championships) > 0) {
        if (
          stats.championship_years &&
          Array.isArray(stats.championship_years)
        ) {
          stats.championship_years.forEach((year) => {
            milestones.push({
              date: new Date(`${year}-12-31`), // Use end of year as approximate date
              title: `${year} World Champion`,
              description: `${driver.firstName} won the ${year} Formula 1 World Championship.`,
            });
          });
        } else {
          milestones.push({
            date: new Date(), // Use current date as placeholder
            title: "Formula 1 World Champion",
            description: `${driver.firstName} has won ${stats.championships} World Championship(s).`,
          });
        }
      }

      // Use mock data in development mode if we don't have enough milestones
      if (isDevelopmentMode && milestones.length < 3) {
        console.log("Using mock milestone data for", driver.firstName);
        const mockMilestones = generateMockMilestones(driver);
        milestones = mockMilestones;
      }

      // Sort milestones chronologically
      milestones.sort((a, b) => a.date - b.date);

      // Generate HTML
      if (milestones.length === 0) {
        milestonesContainer.innerHTML =
          '<div class="alert alert-info">No career milestone data available.</div>';
        return;
      }

      const milestonesHtml = milestones
        .map((milestone) => {
          const dateString = milestone.date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          return `
          <div class="career-milestone mb-4">
            <div class="milestone-date text-muted">${dateString}</div>
            <h5 class="milestone-title">${milestone.title}</h5>
            <p class="milestone-description">${milestone.description}</p>
          </div>
        `;
        })
        .join("");

      milestonesContainer.innerHTML = milestonesHtml;
      console.log(
        "Career milestones updated successfully with",
        milestones.length,
        "milestones"
      );
    } catch (err) {
      console.error("Error updating career milestones:", err);

      // Fallback to a simple display if there's an error
      const milestonesContainer = document.getElementById("career-milestones");
      if (milestonesContainer) {
        milestonesContainer.innerHTML = `
          <div class="alert alert-info">
            <p>Career highlights for ${driver.firstName} ${driver.lastName} will be available soon!</p>
          </div>
        `;
      }
    }
  }

  // Function to generate mock milestones for development
  function generateMockMilestones(driver) {
    const currentYear = new Date().getFullYear();
    const firstName = driver.firstName;
    const driverName = `${firstName} ${driver.lastName}`;

    return [
      {
        date: new Date(`${currentYear - 5}-03-15`),
        title: "F1 Debut",
        description: `${firstName} made their Formula 1 debut at the Australian Grand Prix.`,
      },
      {
        date: new Date(`${currentYear - 4}-06-09`),
        title: "First Points",
        description: `${firstName} scored their first F1 points with a 7th place finish at the Canadian Grand Prix.`,
      },
      {
        date: new Date(`${currentYear - 3}-09-01`),
        title: "First Podium",
        description: `${firstName} secured their first podium with a 3rd place finish at the Italian Grand Prix.`,
      },
      {
        date: new Date(`${currentYear - 2}-07-04`),
        title: "First Race Win",
        description: `${firstName} claimed their first race victory at the British Grand Prix.`,
      },
      {
        date: new Date(`${currentYear - 1}-01-15`),
        title: `Joined ${driver.team || "Current Team"}`,
        description: `${driverName} signed with ${
          driver.team || "their current team"
        } for the ${currentYear - 1} season.`,
      },
      {
        date: new Date(`${currentYear - 1}-11-28`),
        title: "Career Best Season",
        description: `${driverName} finished the season in 4th place with 5 podiums, including one race win.`,
      },
    ];
  }

  // Function to update season progress metrics
  function updateSeasonProgressMetrics(data) {
    try {
      console.log("Updating season progress metrics");
      const races = data.recent_races || [];

      // In development mode, make sure we have data
      if (isDevelopmentMode && races.length === 0) {
        console.log("No race data found, using mock data for season progress");
        // Generate mock race data if needed
        const mockRaces = generateMockRaceData("default_driver");
        updateSeasonProgressMetrics({ recent_races: mockRaces });
        return;
      }

      if (races.length === 0) {
        console.log("No races data available for season progress metrics");
        // Update UI to show no data
        updateSeasonProgressUI(0, 0, "-", "-", "-");
        return;
      }

      // Calculate current year or use the latest year from race data
      const currentYear = new Date().getFullYear();
      let raceYears = races
        .map((race) => (race.date ? new Date(race.date).getFullYear() : 0))
        .filter((year) => year > 0);

      // If we have no valid years, use current year
      const targetYear =
        raceYears.length > 0 ? Math.max(...raceYears) : currentYear;

      // Get current season races
      const currentSeasonRaces = races.filter((race) => {
        const raceYear = race.date ? new Date(race.date).getFullYear() : 0;
        return raceYear === targetYear;
      });

      if (currentSeasonRaces.length === 0) {
        console.log("No current season races available");
        // Update UI to show no data
        updateSeasonProgressUI(0, 0, "-", "-", "-");
        return;
      }

      console.log(
        `Found ${currentSeasonRaces.length} races for season ${targetYear}`
      );

      // Calculate season completion
      const totalRaces = 23; // Typical F1 season length, could be fetched from API
      const completedRaces = currentSeasonRaces.length;
      const completionPercentage = (completedRaces / totalRaces) * 100;

      // Calculate performance metrics
      const finishedRaces = currentSeasonRaces.filter(
        (race) => race.finished !== false
      );
      const dnfRaces = currentSeasonRaces.filter(
        (race) => race.finished === false
      );

      // Average finish position for completed races
      let avgFinish = "-";
      if (finishedRaces.length > 0) {
        const positions = finishedRaces
          .map((race) => parseInt(race.position) || 0)
          .filter((pos) => pos > 0);
        if (positions.length > 0) {
          avgFinish = (
            positions.reduce((sum, pos) => sum + pos, 0) / positions.length
          ).toFixed(1);
        }
      }

      // DNF rate
      const dnfRate =
        currentSeasonRaces.length > 0
          ? `${((dnfRaces.length / currentSeasonRaces.length) * 100).toFixed(
              1
            )}%`
          : "-";

      // Points per race
      let pointsPerRace = "-";
      if (currentSeasonRaces.length > 0) {
        const totalPoints = currentSeasonRaces.reduce(
          (sum, race) => sum + (parseFloat(race.points) || 0),
          0
        );
        pointsPerRace = (totalPoints / currentSeasonRaces.length).toFixed(1);
      }

      // Update UI elements
      updateSeasonProgressUI(
        completedRaces,
        totalRaces,
        avgFinish,
        dnfRate,
        pointsPerRace,
        completionPercentage
      );

      // If we have enough races and Charts.js, initialize the performance chart
      if (
        currentSeasonRaces.length >= 2 &&
        typeof Chart !== "undefined" &&
        document.getElementById("performanceChart")
      ) {
        try {
          console.log(
            "Initializing performance chart with",
            currentSeasonRaces.length,
            "races"
          );
          initializePerformanceChart(currentSeasonRaces);
        } catch (chartErr) {
          console.error("Error initializing performance chart:", chartErr);
        }
      }

      console.log("Season progress metrics updated successfully");
    } catch (err) {
      console.error("Error updating season progress metrics:", err);
    }
  }

  // Helper function to update season progress UI elements
  function updateSeasonProgressUI(
    completedRaces,
    totalRaces,
    avgFinish,
    dnfRate,
    pointsPerRace,
    progressPercent = 0
  ) {
    // Update progress bar and counts
    const completedRacesElem = document.getElementById(
      "season-completed-races"
    );
    if (completedRacesElem) {
      completedRacesElem.textContent = completedRaces;
    }

    const totalRacesElem = document.getElementById("season-total-races");
    if (totalRacesElem) {
      totalRacesElem.textContent = totalRaces;
    }

    const progressBarElem = document.getElementById("season-progress-bar");
    if (progressBarElem) {
      progressBarElem.style.width = `${progressPercent}%`;
    }

    // Update stats
    const avgFinishElem = document.getElementById("average-finish");
    if (avgFinishElem) {
      avgFinishElem.textContent = avgFinish;
    }

    const dnfRateElem = document.getElementById("dnf-rate");
    if (dnfRateElem) {
      dnfRateElem.textContent = dnfRate;
    }

    const pointsPerRaceElem = document.getElementById("points-per-race");
    if (pointsPerRaceElem) {
      pointsPerRaceElem.textContent = pointsPerRace;
    }
  }

  // Function to initialize the performance trends chart
  function initializePerformanceChart(races) {
    try {
      console.log("Initializing performance chart with", races.length, "races");

      if (typeof Chart === "undefined") {
        console.warn("Chart.js is not loaded, skipping performance chart");
        return;
      }

      const chartElement = document.getElementById("performanceChart");
      if (!chartElement) {
        console.warn("performanceChart element not found");
        return;
      }

      // Clear any existing chart
      Chart.getChart(chartElement)?.destroy();

      const ctx = chartElement.getContext("2d");

      // Prepare data - sort races by date
      races.sort((a, b) => {
        return new Date(a.date || 0) - new Date(b.date || 0);
      });

      // Extract labels and data
      const labels = races.map((race) => race.race || "Race");
      const positionData = races.map((race) => {
        const pos = parseInt(race.position);
        return isNaN(pos) || race.finished === false ? null : pos;
      });
      const pointsData = races.map((race) => parseFloat(race.points) || 0);

      // Create chart
      new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Position",
              data: positionData,
              borderColor: "rgba(54, 162, 235, 1)",
              backgroundColor: "rgba(54, 162, 235, 0.1)",
              borderWidth: 2,
              tension: 0.1,
              yAxisID: "y",
            },
            {
              label: "Points",
              data: pointsData,
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.1)",
              borderWidth: 2,
              tension: 0.1,
              yAxisID: "y1",
            },
          ],
        },
        options: {
          responsive: true,
          interaction: {
            mode: "index",
            intersect: false,
          },
          scales: {
            y: {
              type: "linear",
              display: true,
              position: "left",
              reverse: true,
              title: {
                display: true,
                text: "Position",
              },
              min: 1,
              max: Math.max(
                ...positionData.filter((p) => p !== null).concat([20])
              ),
              ticks: {
                stepSize: 1,
              },
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              title: {
                display: true,
                text: "Points",
              },
              min: 0,
              suggestedMax: Math.max(...pointsData) * 1.1,
              grid: {
                drawOnChartArea: false,
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                title: function (tooltipItems) {
                  return races[tooltipItems[0].dataIndex].race || "Race";
                },
              },
            },
          },
        },
      });

      // Initialize track performance chart if we have enough data
      if (races.length >= 3) {
        initializeTrackPerformanceChart(races);
      }

      console.log("Performance chart initialized successfully");
    } catch (err) {
      console.error("Error initializing performance chart:", err);

      // Show error message in the chart container
      const chartContainer =
        document.getElementById("performanceChart")?.parentElement;
      if (chartContainer) {
        chartContainer.innerHTML = `
          <div class="alert alert-warning">
            <p>Could not initialize performance chart.</p>
            <small>${err.message}</small>
          </div>
        `;
      }
    }
  }

  // Function to initialize the track performance chart
  function initializeTrackPerformanceChart(races) {
    try {
      console.log("Initializing track performance chart");

      if (typeof Chart === "undefined") {
        console.warn(
          "Chart.js is not loaded, skipping track performance chart"
        );
        return;
      }

      const chartElement = document.getElementById("trackPerformanceChart");
      if (!chartElement) {
        console.warn("trackPerformanceChart element not found");
        return;
      }

      // Clear any existing chart
      Chart.getChart(chartElement)?.destroy();

      const ctx = chartElement.getContext("2d");

      // Group races by circuit
      const trackStats = {};
      races.forEach((race) => {
        if (!race.circuit) return;

        if (!trackStats[race.circuit]) {
          trackStats[race.circuit] = {
            positions: [],
            points: [],
          };
        }

        const position = parseInt(race.position);
        if (!isNaN(position) && race.finished !== false) {
          trackStats[race.circuit].positions.push(position);
        }

        const points = parseFloat(race.points);
        if (!isNaN(points)) {
          trackStats[race.circuit].points.push(points);
        }
      });

      // Calculate averages
      const tracks = [];
      const avgPositions = [];
      const avgPoints = [];

      for (const [track, data] of Object.entries(trackStats)) {
        if (data.positions.length > 0) {
          tracks.push(track);

          // Calculate average position
          const avgPos =
            data.positions.reduce((sum, pos) => sum + pos, 0) /
            data.positions.length;
          avgPositions.push(avgPos);

          // Calculate average points
          const avgPts =
            data.points.reduce((sum, pts) => sum + pts, 0) / data.points.length;
          avgPoints.push(avgPts);
        }
      }

      // Create chart
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: tracks,
          datasets: [
            {
              label: "Avg Position",
              data: avgPositions,
              backgroundColor: "rgba(54, 162, 235, 0.7)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
              yAxisID: "y",
            },
            {
              label: "Avg Points",
              data: avgPoints,
              backgroundColor: "rgba(75, 192, 192, 0.7)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
              yAxisID: "y1",
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              type: "linear",
              display: true,
              position: "left",
              reverse: true,
              title: {
                display: true,
                text: "Position",
              },
              min: 1,
              suggestedMax: Math.max(...avgPositions, 10),
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              title: {
                display: true,
                text: "Points",
              },
              min: 0,
              suggestedMax: Math.max(...avgPoints) * 1.1,
              grid: {
                drawOnChartArea: false,
              },
            },
          },
        },
      });

      console.log("Track performance chart initialized successfully");
    } catch (err) {
      console.error("Error initializing track performance chart:", err);

      // Show error message in the chart container
      const chartContainer = document.getElementById(
        "trackPerformanceChart"
      )?.parentElement;
      if (chartContainer) {
        chartContainer.innerHTML = `
          <div class="alert alert-warning">
            <p>Could not initialize track performance chart.</p>
            <small>${err.message}</small>
          </div>
        `;
      }
    }
  }

  // Function to fetch and update standings
  function fetchAndUpdateStandings(driverId) {
    try {
      console.log("Fetching and updating standings for driver:", driverId);

      // Get the standings containers
      const driverStandingsContainer =
        document.getElementById("driver-standings");
      const constructorStandingsContainer = document.getElementById(
        "constructor-standings"
      );

      if (!driverStandingsContainer && !constructorStandingsContainer) {
        console.log(
          "Standings containers not found, skipping standings update"
        );
        return;
      }

      // In development mode, use mock data
      if (isDevelopmentMode) {
        console.log("Using mock standings data in development mode");

        if (driverStandingsContainer) {
          const mockDriverStandings = generateMockDriverStandings();
          updateDriverStandings(mockDriverStandings, driverId);
        }

        if (constructorStandingsContainer) {
          const mockConstructorStandings = generateMockConstructorStandings();
          updateConstructorStandings(mockConstructorStandings);
        }

        // Initialize points progression chart if we have the chart library loaded
        if (
          typeof Chart !== "undefined" &&
          document.getElementById("pointsProgressionChart")
        ) {
          createPointsProgressionChart(
            generateMockPointsProgression(),
            generateMockDriverStandings(),
            driverId
          );
        }

        return;
      }

      // Fetch driver standings
      if (driverStandingsContainer) {
        driverStandingsContainer.innerHTML =
          '<div class="d-flex justify-content-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

        fetch("/api/standings/drivers")
          .then((response) => {
            if (!response.ok)
              throw new Error("Failed to fetch driver standings");
            return response.json();
          })
          .then((data) => {
            if (
              data.success &&
              data.standings &&
              Array.isArray(data.standings)
            ) {
              updateDriverStandings(data.standings, driverId);

              // Initialize points progression chart if we have data
              if (
                typeof Chart !== "undefined" &&
                document.getElementById("pointsProgressionChart")
              ) {
                initializePointsProgressionChart(data.standings, driverId);
              }
            } else {
              driverStandingsContainer.innerHTML =
                '<div class="alert alert-warning">No driver standings data available.</div>';
            }
          })
          .catch((error) => {
            console.error("Error fetching driver standings:", error);
            driverStandingsContainer.innerHTML = `<div class="alert alert-danger">Error loading driver standings: ${error.message}</div>`;
          });
      }

      // Fetch constructor standings
      if (constructorStandingsContainer) {
        constructorStandingsContainer.innerHTML =
          '<div class="d-flex justify-content-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

        fetch("/api/standings/constructors")
          .then((response) => {
            if (!response.ok)
              throw new Error("Failed to fetch constructor standings");
            return response.json();
          })
          .then((data) => {
            if (
              data.success &&
              data.standings &&
              Array.isArray(data.standings)
            ) {
              updateConstructorStandings(data.standings);
            } else {
              constructorStandingsContainer.innerHTML =
                '<div class="alert alert-warning">No constructor standings data available.</div>';
            }
          })
          .catch((error) => {
            console.error("Error fetching constructor standings:", error);
            constructorStandingsContainer.innerHTML = `<div class="alert alert-danger">Error loading constructor standings: ${error.message}</div>`;
          });
      }
    } catch (err) {
      console.error("Error in fetchAndUpdateStandings:", err);
    }
  }

  // Function to update driver standings
  function updateDriverStandings(standings, currentDriverId) {
    try {
      console.log(
        "Updating driver standings with",
        standings.length,
        "drivers"
      );
      const container = document.getElementById("driver-standings");
      if (!container) {
        console.warn("Driver standings container not found");
        return;
      }

      // Sort standings by position
      standings.sort((a, b) => parseInt(a.position) - parseInt(b.position));

      // Generate HTML
      let html = `
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th scope="col">Pos</th>
                <th scope="col">Driver</th>
                <th scope="col">Team</th>
                <th scope="col">Points</th>
              </tr>
            </thead>
            <tbody>
      `;

      standings.forEach((driver) => {
        const position = parseInt(driver.position);
        let positionClass = "position-other";

        if (position <= 3) {
          positionClass = "position-top3";
        } else if (position <= 10) {
          positionClass = "position-top10";
        }

        const isCurrentDriver = driver.driverId === currentDriverId;
        const rowClass = isCurrentDriver ? "table-primary" : "";

        html += `
          <tr class="${rowClass}">
            <td>
              <div class="standings-position ${positionClass}">${position}</div>
            </td>
            <td>${driver.firstName} ${driver.lastName}</td>
            <td>${driver.team || ""}</td>
            <td>${driver.points || "0"}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;

      container.innerHTML = html;
      console.log("Driver standings updated successfully");
    } catch (err) {
      console.error("Error updating driver standings:", err);

      // Show error message
      const container = document.getElementById("driver-standings");
      if (container) {
        container.innerHTML = `<div class="alert alert-danger">Error updating driver standings: ${err.message}</div>`;
      }
    }
  }

  // Function to update constructor standings
  function updateConstructorStandings(standings) {
    try {
      console.log(
        "Updating constructor standings with",
        standings.length,
        "teams"
      );
      const container = document.getElementById("constructor-standings");
      if (!container) {
        console.warn("Constructor standings container not found");
        return;
      }

      // Sort standings by position
      standings.sort((a, b) => parseInt(a.position) - parseInt(b.position));

      // Generate HTML
      let html = `
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th scope="col">Pos</th>
                <th scope="col">Team</th>
                <th scope="col">Points</th>
              </tr>
            </thead>
            <tbody>
      `;

      standings.forEach((team) => {
        const position = parseInt(team.position);
        let positionClass = "position-other";

        if (position <= 3) {
          positionClass = "position-top3";
        } else if (position <= 5) {
          positionClass = "position-top10";
        }

        html += `
          <tr>
            <td>
              <div class="standings-position ${positionClass}">${position}</div>
            </td>
            <td>${team.name || ""}</td>
            <td>${team.points || "0"}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;

      container.innerHTML = html;
      console.log("Constructor standings updated successfully");
    } catch (err) {
      console.error("Error updating constructor standings:", err);

      // Show error message
      const container = document.getElementById("constructor-standings");
      if (container) {
        container.innerHTML = `<div class="alert alert-danger">Error updating constructor standings: ${err.message}</div>`;
      }
    }
  }

  // Function to initialize points progression chart
  function initializePointsProgressionChart(standings, currentDriverId) {
    try {
      console.log("Initializing points progression chart");

      if (typeof Chart === "undefined") {
        console.warn(
          "Chart.js is not loaded, skipping points progression chart"
        );
        return;
      }

      // Fetch points progression data
      fetch("/api/points-progression")
        .then((response) => {
          if (!response.ok)
            throw new Error("Failed to fetch points progression data");
          return response.json();
        })
        .then((data) => {
          if (
            data.success &&
            data.progression &&
            Array.isArray(data.progression)
          ) {
            createPointsProgressionChart(
              data.progression,
              standings,
              currentDriverId
            );
          } else {
            throw new Error("Invalid points progression data format");
          }
        })
        .catch((error) => {
          console.error("Error fetching points progression data:", error);

          // In development mode, use mock data if the API fails
          if (isDevelopmentMode) {
            console.log("Using mock points progression data");
            createPointsProgressionChart(
              generateMockPointsProgression(),
              standings,
              currentDriverId
            );
          }
        });
    } catch (err) {
      console.error("Error initializing points progression chart:", err);
    }
  }

  // Function to create points progression chart
  function createPointsProgressionChart(
    progression,
    standings,
    currentDriverId
  ) {
    try {
      console.log("Creating points progression chart");

      if (typeof Chart === "undefined") {
        console.warn(
          "Chart.js is not loaded, skipping points progression chart"
        );
        return;
      }

      const chartElement = document.getElementById("pointsProgressionChart");
      if (!chartElement) {
        console.warn("pointsProgressionChart element not found");
        return;
      }

      // Clear any existing chart
      Chart.getChart(chartElement)?.destroy();

      const ctx = chartElement.getContext("2d");

      // Get top 5 drivers and current driver
      const top5Drivers = standings
        .slice(0, 5)
        .map((driver) => driver.driverId);
      if (currentDriverId && !top5Drivers.includes(currentDriverId)) {
        top5Drivers.push(currentDriverId);
      }

      // Prepare data
      const rounds = progression[0]?.rounds || [];
      const datasets = [];

      // Create color map
      const colorMap = {
        0: {
          border: "rgba(255, 99, 132, 1)",
          background: "rgba(255, 99, 132, 0.1)",
        },
        1: {
          border: "rgba(54, 162, 235, 1)",
          background: "rgba(54, 162, 235, 0.1)",
        },
        2: {
          border: "rgba(255, 206, 86, 1)",
          background: "rgba(255, 206, 86, 0.1)",
        },
        3: {
          border: "rgba(75, 192, 192, 1)",
          background: "rgba(75, 192, 192, 0.1)",
        },
        4: {
          border: "rgba(153, 102, 255, 1)",
          background: "rgba(153, 102, 255, 0.1)",
        },
        5: {
          border: "rgba(255, 159, 64, 1)",
          background: "rgba(255, 159, 64, 0.1)",
        },
      };

      // Create datasets for each driver
      progression.forEach((driver, index) => {
        if (!top5Drivers.includes(driver.driverId)) return;

        const isCurrentDriver = driver.driverId === currentDriverId;
        const colors = colorMap[index % Object.keys(colorMap).length];

        datasets.push({
          label: `${driver.firstName} ${driver.lastName}`,
          data: driver.points || [],
          borderColor: colors.border,
          backgroundColor: colors.background,
          borderWidth: isCurrentDriver ? 3 : 2,
          tension: 0.1,
          pointRadius: isCurrentDriver ? 5 : 3,
        });
      });

      // Create chart
      new Chart(ctx, {
        type: "line",
        data: {
          labels: rounds,
          datasets: datasets,
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Points",
              },
            },
            x: {
              title: {
                display: true,
                text: "Race",
              },
            },
          },
          plugins: {
            legend: {
              position: "bottom",
            },
          },
        },
      });

      console.log("Points progression chart created successfully");
    } catch (err) {
      console.error("Error creating points progression chart:", err);

      // Show error message in the chart container
      const chartContainer = document.getElementById(
        "pointsProgressionChart"
      )?.parentElement;
      if (chartContainer) {
        chartContainer.innerHTML = `
          <div class="alert alert-warning">
            <p>Could not initialize points progression chart.</p>
            <small>${err.message}</small>
          </div>
        `;
      }
    }
  }
});
