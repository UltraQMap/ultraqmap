// Set up the map
var mymap = L.map("map").setView([38, -40], 3);

// Add basemaps
var streets = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20
}).addTo(mymap);

// Create reset view button
var ZoomOutControl = L.Control.extend({
    options: {
        position: "topleft"
    },
    onAdd: function (map) {
        var button = L.DomUtil.create("button", "custom-button");
        button.title = "Reset view";
        button.onclick = function () {
            map.setView([38, -40], 3);
        };
        return button;
    }
});
new ZoomOutControl().addTo(mymap);

// Create locator (inset) map
var miniMap = new L.Control.MiniMap(L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"), {
    toggleDisplay: true,
    position: "bottomright",
    zoomLevelOffset: -5
}).addTo(mymap);

// Add a scale bar to the map
L.control
    .scale({
        imperial: true,
        metric: true,
        position: "bottomleft"
    })
    .addTo(mymap);

// ========== GLOBAL VARIABLES ========== //
var markersByYear = {};
var visibleYears = new Set();

const yearColors = {
    2019: "#23bdb4",
    2020: "#23bd66",
    2021: "#bdb423",
    2022: "#bd237a",
    2023: "#bd232d",
    2024: "#bd6623",
    2025: "#237abd",
    2026: "#6623bd"
};

// Custom map marker icons
var ShowIcon = L.Icon.extend({
    options: {
        iconSize: [20, 30],
        iconAnchor: [10, 30],
        popupAnchor: [0, -20]
    }
});

var iconMap = {
    2019: new ShowIcon({ iconUrl: "MapMarkers/2019_marker2.png" }),
    2020: new ShowIcon({ iconUrl: "MapMarkers/2020_marker2.png" }),
    2021: new ShowIcon({ iconUrl: "MapMarkers/2021_marker2.png" }),
    2022: new ShowIcon({ iconUrl: "MapMarkers/2022_marker2.png" }),
    2023: new ShowIcon({ iconUrl: "MapMarkers/2023_marker2.png" }),
    2024: new ShowIcon({ iconUrl: "MapMarkers/2024_marker2.png" }),
    2025: new ShowIcon({ iconUrl: "MapMarkers/2025_marker2.png" }),
    2026: new ShowIcon({ iconUrl: "MapMarkers/2026_marker2.png" })
};

// Create a custom cluster icon function
function createClusterIcon(cluster) {
    var markers = cluster.getAllChildMarkers();
    var years = {};
    var uniqueYears = new Set();

    // Count markers by year
    markers.forEach(function (marker) {
        var year = marker.feature.properties.year;
        years[year] = (years[year] || 0) + 1;
        uniqueYears.add(year);
    });

    // Create donut chart SVG
    var size = 50;
    var radius = size / 2;
    var weight = 10;
    var svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

    // Draw center circle
    svg += `<circle cx="${radius}" cy="${radius}" r="${radius - weight / 2}" fill="#f1d357" fill-opacity="0.7"/>`;

    // Color scheme for years
    var colors = {
        2019: "#23bdb4",
        2020: "#23bd66",
        2021: "#bdb423",
        2022: "#bd237a",
        2023: "#bd232d",
        2024: "#bd6623",
        2025: "#237abd",
        2026: "#6623bd"
    };

    // Check if all markers are from the same year
    if (uniqueYears.size === 1) {
        const year = uniqueYears.values().next().value;
        const color = colors[year] || "#555";

        // Draw a full circle for single-year clusters
        svg += `<circle cx="${radius}" cy="${radius}" r="${radius - weight / 2}" 
                    stroke="${color}" stroke-width="${weight}" fill="none" />`;
    } else {
        // Draw segments for multi-year clusters
        var total = markers.length;
        var startAngle = -Math.PI / 2;

        Object.keys(years).forEach(function (year) {
            var percentage = years[year] / total;
            var endAngle = startAngle + percentage * Math.PI * 2;

            // Calculate coordinates
            var x1 = radius + Math.cos(startAngle) * (radius - weight / 2);
            var y1 = radius + Math.sin(startAngle) * (radius - weight / 2);
            var x2 = radius + Math.cos(endAngle) * (radius - weight / 2);
            var y2 = radius + Math.sin(endAngle) * (radius - weight / 2);

            // Large arc flag if angle > 180 degrees
            var largeArc = percentage > 0.5 ? 1 : 0;

            svg += `<path d="M ${x1} ${y1} A ${radius - weight / 2} ${radius - weight / 2} 0 ${largeArc} 1 ${x2} ${y2}" 
                       stroke="${colors[year]}" stroke-width="${weight}" fill="none" />`;

            startAngle = endAngle;
        });
    }

    // Add count text
    svg += `<text x="${radius}" y="${radius}" text-anchor="middle" dominant-baseline="middle" 
                font-size="14" font-weight="bold" fill="black">${markers.length}</text>`;

    svg += "</svg>";

    return L.divIcon({
        html: svg,
        className: "donut-cluster",
        iconSize: [size, size]
    });
}

// Create marker cluster group
var markerClusterGroup = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyDistanceMultiplier: 1,
    showCoverageOnHover: false,
    iconCreateFunction: createClusterIcon
}).addTo(mymap);

// ========== FILTERING FUNCTIONS ========== //
function loadShowsData() {
    // Initialize years object
    Object.keys(iconMap).forEach((year) => {
        markersByYear[year] = [];
    });

    fetch("UQ_shows.json")
        .then((response) => response.json())
        .then((data) => {
            data.forEach((show) => {
                const yearStr = show.Year.toString();
                const icon = iconMap[yearStr] || iconMap[2019];

                const marker = L.marker([show.Latitude, show.Longitude], { icon: icon });

                // Add feature properties
                marker.feature = {
                    properties: {
                        year: yearStr
                    }
                };

                const popupContent = `
                    <b>${show.Venue}
                    </b><br>
                    ${show.City}, ${show.State || show.Country}<br>
                    ${show.Month} ${show.Day}, ${show.Year}
                    <br>
                    <button onclick="openGallery('${show.ID}')" class="gallery-button">
                        View Photos
                    </button>
                    <button onclick="openStories('${show.ID}')" class="stories-button">
                        View Stories
                    </button>
                `;
                marker.bindPopup(popupContent);

                // Store marker by year
                if (markersByYear[yearStr]) {
                    markersByYear[yearStr].push(marker);
                    markerClusterGroup.addLayer(marker);
                    visibleYears.add(yearStr);
                }
            });

            // Create year filter control AFTER data loads
            createYearControl();
        })
        .catch((error) => console.error("Error loading shows data:", error));
}

// Create year filter control
function createYearControl() {
    const container = document.getElementById("year-control");
    container.innerHTML = "<strong>Year & Show Count</strong>";

    Object.keys(markersByYear)
        .sort()
        .forEach((year) => {
            if (markersByYear[year].length > 0) {
                const label = document.createElement("label");

                // Create checkbox
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = true;
                checkbox.value = year;

                // Create color indicator
                const colorIndicator = document.createElement("span");
                colorIndicator.className = `year-color year-${year}`;
                colorIndicator.style.backgroundColor = yearColors[year];

                // Create text
                const text = document.createTextNode(`${year} (${markersByYear[year].length})`);

                checkbox.addEventListener("change", function () {
                    if (this.checked) {
                        visibleYears.add(year);
                    } else {
                        visibleYears.delete(year);
                    }
                    updateVisibleMarkers();
                });

                label.appendChild(checkbox);
                label.appendChild(colorIndicator);
                label.appendChild(text);
                container.appendChild(label);
            }
        });
}

// Update visible markers based on selected years
function updateVisibleMarkers() {
    // Remove all markers first
    markerClusterGroup.clearLayers();

    // Add back markers for visible years
    Object.keys(markersByYear).forEach((year) => {
        if (visibleYears.has(year)) {
            markersByYear[year].forEach((marker) => {
                markerClusterGroup.addLayer(marker);
            });
        }
    });
}

// ========== PHOTO GALLERY FUNCTIONS ========== //
let currentGalleryID = null;
let currentPhotos = [];
let currentPhotoInfo = []; // Store photo info objects
let currentPhotoIndex = 0;
let allPhotosCache = null;

// Function to extract photographer name from filename
function extractPhotographerName(filename) {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

    // Find the last underscore and get everything after it
    const lastUnderscoreIndex = nameWithoutExt.lastIndexOf("_");

    if (lastUnderscoreIndex !== -1) {
        const name = nameWithoutExt.substring(lastUnderscoreIndex + 1);
        return name.charAt(0).toUpperCase() + name.slice(1); // Capitalize first letter
    }

    return "Unknown";
}

async function loadAllPhotos() {
    if (!allPhotosCache) {
        try {
            const response = await fetch("photos.txt");
            const text = await response.text();
            // Split by lines, remove empty lines, and trim whitespace
            allPhotosCache = text
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line !== "");
        } catch (error) {
            console.error("Error loading photos:", error);
            allPhotosCache = [];
        }
    }
    return allPhotosCache;
}

function openGallery(showID) {
    currentGalleryID = showID;
    currentPhotoIndex = 0;

    // Find show details for title
    fetch("UQ_shows.json")
        .then((response) => response.json())
        .then((data) => {
            const show = data.find((s) => s.ID === showID);
            if (show) {
                document.getElementById("gallery-title").textContent =
                    `${show.Venue} - ${show.Month} ${show.Day}, ${show.Year}`;
            }
        });

    // Load photos for this show
    loadPhotosForShow(showID);

    // Show modal
    document.getElementById("gallery-modal").style.display = "block";
}

async function loadPhotosForShow(showID) {
    currentPhotos = [];
    currentPhotoInfo = [];
    const galleryImages = document.getElementById("gallery-images");
    galleryImages.innerHTML = "<p>Loading photos...</p>";

    // Pad ID to 4 digits
    const paddedID = showID.toString().padStart(4, "0");

    try {
        // Load all photos from the text file
        const allPhotos = await loadAllPhotos();

        // Filter photos for this show
        const showPhotoFilenames = allPhotos.filter((filename) => filename.startsWith(paddedID));

        if (showPhotoFilenames.length > 0) {
            // Sort photos by filename (so they appear in order)
            showPhotoFilenames.sort();

            // Create photo info objects for each photo
            showPhotoFilenames.forEach((filename) => {
                const photographer = extractPhotographerName(filename);

                currentPhotoInfo.push({
                    path: `sorted_photos/${filename}`,
                    filename: filename,
                    photographer: photographer,
                    showID: paddedID
                });
            });

            displayCurrentPhoto();
            document.querySelector(".gallery-nav").style.display = "flex";
        } else {
            galleryImages.innerHTML = "<p>No photos available for this show yet.</p>";
            document.querySelector(".gallery-nav").style.display = "none";
        }
    } catch (error) {
        console.error("Error loading photos:", error);
        galleryImages.innerHTML = "<p>Error loading photos. Please try again.</p>";
        document.querySelector(".gallery-nav").style.display = "none";
    }
}

function displayCurrentPhoto() {
    if (currentPhotoInfo.length === 0) return;

    const galleryImages = document.getElementById("gallery-images");
    const photoCounter = document.getElementById("photo-counter");

    const currentPhoto = currentPhotoInfo[currentPhotoIndex];

    galleryImages.innerHTML = `
        <div class="photo-container">
            <img src="${currentPhoto.path}" alt="Photo from ${currentPhoto.showID}">
            <div class="photo-caption">
                Photo by ${currentPhoto.photographer}
            </div>
        </div>
    `;

    photoCounter.textContent = `${currentPhotoIndex + 1} / ${currentPhotoInfo.length}`;

    // Update button states
    document.getElementById("prev-photo").disabled = currentPhotoIndex === 0;
    document.getElementById("next-photo").disabled = currentPhotoIndex === currentPhotoInfo.length - 1;
}

// ========== STORIES GALLERY VARIABLES ========== //
let currentStoriesID = null;
let currentStories = [];
let currentStoryIndex = 0;
let allStoriesCache = null;

// ========== STORIES GALLERY FUNCTIONS ========== //
// Helper function to extract name from story filename (removes number prefix)
function extractStoryNameFromFilename(filename) {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    
    // Split by underscores
    const parts = nameWithoutExt.split('_');
    
    // Format: [showID, number, nameParts...]
    if (parts.length >= 3) {
        // Join all parts after the number (index 2 and beyond)
        const nameParts = parts.slice(2);
        const name = nameParts.join(' ');
        
        // Capitalize each word
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    
    return "Story";
}

async function loadAllStories() {
    if (!allStoriesCache) {
        try {
            const response = await fetch("stories.txt");
            const text = await response.text();

            // Parse stories text file
            const stories = {};
            const lines = text.split("\n");
            let currentStory = null;

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                // Check if line starts with a show ID (format: ID_Number_Filename.txt)
                const storyMatch = trimmedLine.match(/^(\d{4})_(.+?)\.txt$/);
                if (storyMatch) {
                    const showID = storyMatch[1];
                    const storyFilename = trimmedLine;

                    if (!stories[showID]) {
                        stories[showID] = [];
                    }
                    stories[showID].push(storyFilename);
                }
            }

            allStoriesCache = stories;
        } catch (error) {
            console.error("Error loading stories:", error);
            allStoriesCache = {};
        }
    }
    return allStoriesCache;
}

async function loadStoriesForShow(showID) {
    currentStories = [];
    const paddedID = showID.toString().padStart(4, "0");

    try {
        const allStories = await loadAllStories();
        const showStoryFilenames = allStories[paddedID] || [];

        if (showStoryFilenames.length > 0) {
            // Load each story file
            for (const filename of showStoryFilenames) {
                try {
                    const response = await fetch(`stories/${filename}`);
                    if (response.ok) {
                        const storyText = await response.text();

                        currentStories.push({
                            id: paddedID,
                            filename: filename,
                            name: extractStoryNameFromFilename(filename),
                            content: storyText
                        });
                    }
                } catch (error) {
                    console.error(`Error loading story ${filename}:`, error);
                }
            }

            return currentStories.length > 0;
        }
    } catch (error) {
        console.error("Error loading stories for show:", error);
    }

    return false;
}

function openStories(showID) {
    currentStoriesID = showID;
    currentStoryIndex = 0;

    // Find show details for title
    fetch("UQ_shows.json")
        .then((response) => response.json())
        .then((data) => {
            const show = data.find((s) => s.ID === showID);
            if (show) {
                document.getElementById("stories-title").textContent =
                    `${show.Venue} - ${show.Month} ${show.Day}, ${show.Year}`;
            }
        });

    // Load stories for this show
    loadStoriesForShow(showID).then((hasStories) => {
        if (hasStories) {
            displayCurrentStory();
            document.querySelector("#stories-modal .gallery-nav").style.display = "flex";
        } else {
            document.getElementById("stories-content").innerHTML =
                "<div class='story-container'><p>No stories available for this show yet.</p></div>";
            document.querySelector("#stories-modal .gallery-nav").style.display = "none";
        }

        // Show modal
        document.getElementById("stories-modal").style.display = "block";
    });
}

function displayCurrentStory() {
    if (currentStories.length === 0) return;

    const storiesContent = document.getElementById("stories-content");
    const storyCounter = document.getElementById("story-counter");

    const currentStory = currentStories[currentStoryIndex];

    storiesContent.innerHTML = `
        <div class="story-container">
            <h4>${currentStory.name}</h4>
            <div class="story-content">${currentStory.content}</div>
        </div>
    `;

    storyCounter.textContent = `${currentStoryIndex + 1} / ${currentStories.length}`;

    // Update button states
    document.getElementById("prev-story").disabled = currentStoryIndex === 0;
    document.getElementById("next-story").disabled = currentStoryIndex === currentStories.length - 1;
}

// ========== MAIN DOMContentLoaded EVENT LISTENER ========== //
document.addEventListener("DOMContentLoaded", function () {
    // Splash screen functionality
    let currentPage = 1;
    const totalPages = 3;

    function showPage(pageNumber) {
        // Hide all pages
        document.querySelectorAll(".splash-page").forEach((page) => {
            page.classList.remove("active");
        });

        // Show current page
        document.getElementById(`page${pageNumber}`).classList.add("active");
        currentPage = pageNumber;

        // Update button states
        document.getElementById("prev-page").disabled = currentPage === 1;
        document.getElementById("next-page").disabled = currentPage === totalPages;
    }

    // Navigation event listeners
    document.getElementById("next-page").addEventListener("click", function () {
        if (currentPage < totalPages) {
            showPage(currentPage + 1);
        }
    });

    document.getElementById("prev-page").addEventListener("click", function () {
        if (currentPage > 1) {
            showPage(currentPage - 1);
        }
    });

    document.querySelectorAll("#prev-page").forEach((button) => {
        button.addEventListener("click", function () {
            if (currentPage > 1) {
                showPage(currentPage - 1);
            }
        });
    });

    // Close splash screen
    document.getElementById("accept-splash").addEventListener("click", function () {
        document.getElementById("splash-modal").classList.add("hidden");
        setTimeout(() => {
            mymap.invalidateSize();
        }, 300);
    });

    document.getElementById("close-splash").addEventListener("click", function () {
        document.getElementById("splash-modal").classList.add("hidden");
        setTimeout(() => {
            mymap.invalidateSize();
        }, 300);
    });

    // Initialize first page
    showPage(1);

    // Load shows data
    loadShowsData();

    document.getElementById("accept-splash").addEventListener("click", function () {
        document.getElementById("splash-modal").classList.add("hidden");
        document.getElementById("map").classList.remove("inactive");
    });

    // ========== PHOTO GALLERY EVENT LISTENERS ========== //
    // Close gallery
    document.querySelector(".close-gallery").addEventListener("click", function () {
        document.getElementById("gallery-modal").style.display = "none";
    });

    // Close when clicking outside photo gallery
    window.addEventListener("click", function (event) {
        const modal = document.getElementById("gallery-modal");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Photo navigation buttons
    document.getElementById("prev-photo").addEventListener("click", function () {
        if (currentPhotoIndex > 0) {
            currentPhotoIndex--;
            displayCurrentPhoto();
        }
    });

    document.getElementById("next-photo").addEventListener("click", function () {
        if (currentPhotoIndex < currentPhotoInfo.length - 1) {
            currentPhotoIndex++;
            displayCurrentPhoto();
        }
    });

    // ========== STORIES GALLERY EVENT LISTENERS ========== //
    // Close stories
    document.querySelector(".close-stories").addEventListener("click", function () {
        document.getElementById("stories-modal").style.display = "none";
    });

    // Close when clicking outside stories modal
    window.addEventListener("click", function (event) {
        const storiesModal = document.getElementById("stories-modal");
        if (event.target === storiesModal) {
            storiesModal.style.display = "none";
        }
    });

    // Stories navigation buttons
    document.getElementById("prev-story").addEventListener("click", function () {
        if (currentStoryIndex > 0) {
            currentStoryIndex--;
            displayCurrentStory();
        }
    });

    document.getElementById("next-story").addEventListener("click", function () {
        if (currentStoryIndex < currentStories.length - 1) {
            currentStoryIndex++;
            displayCurrentStory();
        }
    });
});