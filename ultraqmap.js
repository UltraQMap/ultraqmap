// Set up the map
var mymap = L.map("map").setView([38, -40], 3);

// Add basemaps
var streets = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20
}).addTo(mymap);

// Create reset view button
var ZoomOutControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd: function(map) {
        var button = L.DomUtil.create("button", "custom-button");
        button.title = "Reset view";
        button.onclick = function() { map.setView([38, -40], 3); };
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
L.control.scale({ imperial: true, metric: true, position: "bottomleft" }).addTo(mymap);

// ========== GLOBAL VARIABLES ========== //
var markersByYear = {};
var visibleYears = new Set();

const yearColors = {
    2019: "#23bdb4", 2020: "#23bd66", 2021: "#bdb423", 2022: "#bd237a",
    2023: "#bd232d", 2024: "#bd6623", 2025: "#237abd", 2026: "#6623bd"
};

// Custom map marker icons
var ShowIcon = L.Icon.extend({
    options: { iconSize: [20, 30], iconAnchor: [10, 30], popupAnchor: [0, -20] }
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
    var size = 50, radius = size / 2, weight = 10;
    var svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

    markers.forEach(function(marker) {
        var year = marker.feature.properties.year;
        years[year] = (years[year] || 0) + 1;
        uniqueYears.add(year);
    });

    svg += `<circle cx="${radius}" cy="${radius}" r="${radius - weight / 2}" fill="#f1d357" fill-opacity="0.7"/>`;

    if (uniqueYears.size === 1) {
        const year = uniqueYears.values().next().value;
        svg += `<circle cx="${radius}" cy="${radius}" r="${radius - weight / 2}" stroke="${yearColors[year] || "#555"}" stroke-width="${weight}" fill="none" />`;
    } else {
        var total = markers.length;
        var startAngle = -Math.PI / 2;
        Object.keys(years).forEach(function(year) {
            var percentage = years[year] / total;
            var endAngle = startAngle + percentage * Math.PI * 2;
            var x1 = radius + Math.cos(startAngle) * (radius - weight / 2);
            var y1 = radius + Math.sin(startAngle) * (radius - weight / 2);
            var x2 = radius + Math.cos(endAngle) * (radius - weight / 2);
            var y2 = radius + Math.sin(endAngle) * (radius - weight / 2);
            var largeArc = percentage > 0.5 ? 1 : 0;
            svg += `<path d="M ${x1} ${y1} A ${radius - weight / 2} ${radius - weight / 2} 0 ${largeArc} 1 ${x2} ${y2}" stroke="${yearColors[year]}" stroke-width="${weight}" fill="none" />`;
            startAngle = endAngle;
        });
    }

    svg += `<text x="${radius}" y="${radius}" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="bold" fill="black">${markers.length}</text></svg>`;
    return L.divIcon({ html: svg, className: "donut-cluster", iconSize: [size, size] });
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
    Object.keys(iconMap).forEach((year) => { markersByYear[year] = []; });

    fetch("UQ_shows.json")
        .then((response) => response.json())
        .then((data) => {
            window.showsData = data;
            calculateAndDisplayTopCities(data);

            data.forEach((show) => {
                const yearStr = show.Year.toString();
                const icon = iconMap[yearStr] || iconMap[2019];
                const marker = L.marker([show.Latitude, show.Longitude], { icon: icon });
                marker.feature = { properties: { year: yearStr } };

                marker.bindPopup(`
                    <b>${show.Venue}</b><br>
                    ${show.City}, ${show.State || show.Country}<br>
                    ${show.Month} ${show.Day}, ${show.Year}
                    <br>
                    <button onclick="openGallery('${show.ID}')" class="gallery-button">View Photos</button>
                    <button onclick="openStories('${show.ID}')" class="stories-button">View Stories</button>
                `);

                if (markersByYear[yearStr]) {
                    markersByYear[yearStr].push(marker);
                    markerClusterGroup.addLayer(marker);
                    visibleYears.add(yearStr);
                }
            });

            createYearControl();
        })
        .catch((error) => console.error("Error loading shows data:", error));
}

function createYearControl() {
    const container = document.getElementById("year-control");
    container.innerHTML = '<strong style="color: rgb(11, 59, 56);">Year & Show Count</strong>';

    Object.keys(markersByYear).sort().forEach((year) => {
        if (markersByYear[year].length > 0) {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = true;
            checkbox.value = year;
            const colorIndicator = document.createElement("span");
            colorIndicator.className = `year-color year-${year}`;
            colorIndicator.style.backgroundColor = yearColors[year];
            const text = document.createTextNode(`${year} (${markersByYear[year].length})`);

            checkbox.addEventListener("change", function() {
                this.checked ? visibleYears.add(year) : visibleYears.delete(year);
                updateVisibleMarkers();
            });

            label.appendChild(checkbox);
            label.appendChild(colorIndicator);
            label.appendChild(text);
            container.appendChild(label);
        }
    });
}

function updateVisibleMarkers() {
    markerClusterGroup.clearLayers();
    Object.keys(markersByYear).forEach((year) => {
        if (visibleYears.has(year)) {
            markersByYear[year].forEach((marker) => markerClusterGroup.addLayer(marker));
        }
    });

    if (window.showsData) {
        const visibleShows = window.showsData.filter((show) => visibleYears.has(show.Year.toString()));
        calculateAndDisplayTopCities(visibleShows);
    }
}

// ========== STATS PANEL ========== //
function calculateAndDisplayTopCities(showsData) {
    const cityCount = {};
    showsData.forEach((show) => {
        let locationKey = show.State && show.State !== "" ? `${show.City}, ${show.State}` : `${show.City}, ${show.Country}`;
        cityCount[locationKey] = (cityCount[locationKey] || 0) + 1;
    });

    const top5 = Object.entries(cityCount)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const container = document.getElementById("top-cities-list");
    if (!container) return;

    container.innerHTML = top5.length === 0 ? "<p style='text-align:center; padding:10px;'>No data available</p>" : "";
    top5.forEach((item, index) => {
        const cityDiv = document.createElement("div");
        cityDiv.className = "city-rank";
        cityDiv.innerHTML = `<span class="rank-number">${index + 1}</span><span class="city-name" title="${item.city}">${item.city}</span><span class="show-count">${item.count}</span>`;
        container.appendChild(cityDiv);
    });
}

// ========== PHOTO GALLERY FUNCTIONS ========== //
let currentGalleryID = null;
let currentPhotoInfo = [];
let currentPhotoIndex = 0;
let allPhotosCache = null;

function extractPhotographerName(filename) {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const lastUnderscoreIndex = nameWithoutExt.lastIndexOf("_");
    if (lastUnderscoreIndex !== -1) {
        const name = nameWithoutExt.substring(lastUnderscoreIndex + 1);
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return "Unknown";
}

async function loadAllPhotos() {
    if (!allPhotosCache) {
        try {
            const response = await fetch("photos.txt");
            const text = await response.text();
            allPhotosCache = text.split("\n").map(line => line.trim()).filter(line => line !== "");
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

    fetch("UQ_shows.json")
        .then(response => response.json())
        .then(data => {
            const show = data.find(s => s.ID === showID);
            if (show) document.getElementById("gallery-title").textContent = `${show.Venue} - ${show.Month} ${show.Day}, ${show.Year}`;
        });

    loadPhotosForShow(showID);
    document.getElementById("gallery-modal").style.display = "block";
}

async function loadPhotosForShow(showID) {
    currentPhotoInfo = [];
    const galleryImages = document.getElementById("gallery-images");
    galleryImages.innerHTML = "<p>Loading photos...</p>";

    const paddedID = showID.toString().padStart(4, "0");

    try {
        const allPhotos = await loadAllPhotos();
        const showPhotoFilenames = allPhotos.filter(filename => filename.startsWith(paddedID)).sort();

        if (showPhotoFilenames.length > 0) {
            showPhotoFilenames.forEach(filename => {
                currentPhotoInfo.push({ path: `sorted_photos/${filename}`, photographer: extractPhotographerName(filename), showID: paddedID });
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
    const currentPhoto = currentPhotoInfo[currentPhotoIndex];
    document.getElementById("gallery-images").innerHTML = `
        <div class="photo-container">
            <img src="${currentPhoto.path}" alt="Photo from ${currentPhoto.showID}">
            <div class="photo-caption">Photo by ${currentPhoto.photographer}</div>
        </div>
    `;
    document.getElementById("photo-counter").textContent = `${currentPhotoIndex + 1} / ${currentPhotoInfo.length}`;
    document.getElementById("prev-photo").disabled = currentPhotoIndex === 0;
    document.getElementById("next-photo").disabled = currentPhotoIndex === currentPhotoInfo.length - 1;
}

// ========== STORIES GALLERY FUNCTIONS ========== //
let currentStoriesID = null;
let currentStories = [];
let currentStoryIndex = 0;
let allStoriesCache = null;

function extractStoryNameFromFilename(filename) {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const parts = nameWithoutExt.split("_");
    if (parts.length >= 3) {
        return parts.slice(2).join(" ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
    }
    return "Story";
}

async function loadAllStories() {
    if (!allStoriesCache) {
        try {
            const response = await fetch("stories.txt");
            const text = await response.text();
            const stories = {};
            text.split("\n").forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                    const storyMatch = trimmedLine.match(/^(\d{4})_(.+?)\.txt$/);
                    if (storyMatch) {
                        const showID = storyMatch[1];
                        if (!stories[showID]) stories[showID] = [];
                        stories[showID].push(trimmedLine);
                    }
                }
            });
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
        for (const filename of showStoryFilenames) {
            try {
                const response = await fetch(`stories/${filename}`);
                if (response.ok) {
                    currentStories.push({
                        id: paddedID,
                        filename: filename,
                        name: extractStoryNameFromFilename(filename),
                        content: await response.text()
                    });
                }
            } catch (error) {
                console.error(`Error loading story ${filename}:`, error);
            }
        }
        return currentStories.length > 0;
    } catch (error) {
        console.error("Error loading stories for show:", error);
        return false;
    }
}

function openStories(showID) {
    currentStoriesID = showID;
    currentStoryIndex = 0;

    fetch("UQ_shows.json")
        .then(response => response.json())
        .then(data => {
            const show = data.find(s => s.ID === showID);
            if (show) document.getElementById("stories-title").textContent = `${show.Venue} - ${show.Month} ${show.Day}, ${show.Year}`;
        });

    loadStoriesForShow(showID).then(hasStories => {
        if (hasStories) {
            displayCurrentStory();
            document.querySelector("#stories-modal .gallery-nav").style.display = "flex";
        } else {
            document.getElementById("stories-content").innerHTML = "<div class='story-container'><p>No stories available for this show yet.</p></div>";
            document.querySelector("#stories-modal .gallery-nav").style.display = "none";
        }
        document.getElementById("stories-modal").style.display = "block";
    });
}

function displayCurrentStory() {
    if (currentStories.length === 0) return;
    const currentStory = currentStories[currentStoryIndex];
    document.getElementById("stories-content").innerHTML = `
        <div class="story-container">
            <h4>${currentStory.name}</h4>
            <div class="story-content">${currentStory.content}</div>
        </div>
    `;
    document.getElementById("story-counter").textContent = `${currentStoryIndex + 1} / ${currentStories.length}`;
    document.getElementById("prev-story").disabled = currentStoryIndex === 0;
    document.getElementById("next-story").disabled = currentStoryIndex === currentStories.length - 1;
}

// ========== MAIN DOMContentLoaded EVENT LISTENER ========== //
document.addEventListener("DOMContentLoaded", function() {
    let currentPage = 1;
    const totalPages = 3;

    function showPage(pageNumber) {
        document.querySelectorAll(".splash-page").forEach(page => page.classList.remove("active"));
        document.getElementById(`page${pageNumber}`).classList.add("active");
        currentPage = pageNumber;
        document.getElementById("prev-page").disabled = currentPage === 1;
        document.getElementById("next-page").disabled = currentPage === totalPages;
    }

    document.getElementById("next-page").addEventListener("click", () => { if (currentPage < totalPages) showPage(currentPage + 1); });
    document.getElementById("prev-page").addEventListener("click", () => { if (currentPage > 1) showPage(currentPage - 1); });

    function closeSplash() {
        document.getElementById("splash-modal").classList.add("hidden");
        setTimeout(() => mymap.invalidateSize(), 300);
    }

    document.getElementById("accept-splash").addEventListener("click", closeSplash);
    document.getElementById("close-splash").addEventListener("click", closeSplash);

    showPage(1);
    loadShowsData();

    // Photo gallery listeners
    document.querySelector(".close-gallery").addEventListener("click", () => document.getElementById("gallery-modal").style.display = "none");
    window.addEventListener("click", (event) => { if (event.target === document.getElementById("gallery-modal")) document.getElementById("gallery-modal").style.display = "none"; });
    document.getElementById("prev-photo").addEventListener("click", () => { if (currentPhotoIndex > 0) { currentPhotoIndex--; displayCurrentPhoto(); } });
    document.getElementById("next-photo").addEventListener("click", () => { if (currentPhotoIndex < currentPhotoInfo.length - 1) { currentPhotoIndex++; displayCurrentPhoto(); } });

    // Collapsible stats panel
    const statsControl = document.getElementById("stats-control");
    const statsToggle = document.getElementById("minimize-stats");
    const statsHeader = document.getElementById("stats-header");

    if (statsToggle && statsControl) {
        const toggleStats = () => {
            statsControl.classList.toggle("minimized");
            statsToggle.textContent = statsControl.classList.contains("minimized") ? "+" : "−";
        };
        statsToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleStats(); });
        if (statsHeader) statsHeader.addEventListener("click", (e) => { if (e.target !== statsToggle) toggleStats(); });
    }

    // Stories gallery listeners
    document.querySelector(".close-stories").addEventListener("click", () => document.getElementById("stories-modal").style.display = "none");
    window.addEventListener("click", (event) => { if (event.target === document.getElementById("stories-modal")) document.getElementById("stories-modal").style.display = "none"; });
    document.getElementById("prev-story").addEventListener("click", () => { if (currentStoryIndex > 0) { currentStoryIndex--; displayCurrentStory(); } });
    document.getElementById("next-story").addEventListener("click", () => { if (currentStoryIndex < currentStories.length - 1) { currentStoryIndex++; displayCurrentStory(); } });
});