// Set up the map
var mymap = L.map("map").setView([40, -42], 3);

// Add basemaps
var streets = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20
}).addTo(mymap);

// Create reset view button with help button below it
var ZoomOutControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd: function (map) {
        var container = L.DomUtil.create("div", "custom-control-container");

        // Reset view button
        var button = L.DomUtil.create("button", "custom-button", container);
        button.title = "Reset view";
        button.onclick = function () {
            map.setView([40, -42], 3);
        };

        // Help button
        var helpButton = L.DomUtil.create("button", "custom-help-button", container);
        helpButton.textContent = "?";
        helpButton.title = "About this map";
        helpButton.onclick = function (e) {
            e.stopPropagation();
            showHelpPopup();
        };
        
        // QR button
        var qrButton = L.DomUtil.create("button", "custom-qr-button", container);
        qrButton.title = "Share this map";
        qrButton.onclick = function (e) {
            e.stopPropagation();
            // Open business card modal
            var modal = document.getElementById("business-card-modal");
            if (modal) modal.style.display = "block";
        };

        return container;
    }
});
new ZoomOutControl().addTo(mymap);

// ========== HELP POPUP ========== //
function showHelpPopup() {
    // Remove existing help popup if any
    const existingPopup = document.getElementById("help-popup");
    if (existingPopup) {
        existingPopup.remove();
        return;
    }

    const popup = document.createElement("div");
    popup.id = "help-popup";

    const content = document.createElement("div");
    content.className = "help-content";

    content.innerHTML = `
        <button class="help-close-btn">×</button>
        <h2 class="help-title">About This Map</h2>
        <p class="help-text">Welcome to the <strong>Ultra Q Map</strong>! This is an interactive web map tracking every past Ultra Q show.</p>
        <p class="help-text">I'm incorporating pictures and stories from showgoers to document their experiences at these shows, so if you have something you'd like to share, send me an email or fill out this <strong><a href="https://docs.google.com/forms/d/e/1FAIpQLSerjweiGwejyVxnbYcIk_LWk8W_3PQZixh8N9DtJifwg9Qn2w/viewform?usp=header" target="_blank" rel="noopener norefferer">Google Form</a></strong>!</p>
        <p class="help-text">The web map uses a cartographic technique called Donut Clustering, where each color in the cluster's ring represents the year the show took place. Zoom in, and the clusters expand into individual markers.</p>
        <p class="help-text">In the top left corner are zoom controls and a button to reset the map view to its starting zoom level. You'll also find controls to turn on and off the <strong>Donut Clusters</strong> and <strong>Heat Map</strong> layers of the map. The Heat Map layer visualizes the density of Ultra Q shows across North America and Europe, updating based on which years are selected.</p>
        <p class="help-text">Underneath these layer controls is the <strong>"Find Photos/Stories"</strong> button which, when clicked, automatically zooms to a randomized show that has had photos and/or stories submitted for it.</p>
        <p class="help-text">Below that is the <strong>"Submit Photos/Stories"</strong> button which opens a Google Form where you can share your concert experiences.</p>
        <p class="help-text">Next is the <strong>"Today in UQ History"</strong> button which shows all shows that happened on this date in past years.</p>
        <p class="help-text">In the top right corner of the map is a <strong>layer control</strong> box where shows can be filtered by year. Only show markers from years that are selected will show up on the map.</p>
        <p class="help-text">The bottom left corner shows the <strong>Top 5 Cities</strong> where Ultra Q have had shows. This stats panel updates depending on which years are selected to appear on the map.</p>
        <p class="help-divider">If you have any suggestions on ways to improve or things to add to the map, let me know via email <strong style="color: rgb(208, 113, 38)">(ultraqmap@gmail.com)</strong>, or send me a message on Instagram <strong style="color: rgb(208, 113, 38)">(<a href="https://www.instagram.com/ultraqmap/" target="_blank" rel="noopener noreferrer">@ultraqmap</a>)</strong>!</p>
        <button class="help-got-it-btn">Got it!</button>
    `;

    popup.appendChild(content);
    document.body.appendChild(popup);

    // Close handlers
    const closeBtn = content.querySelector(".help-close-btn");
    const gotItBtn = content.querySelector(".help-got-it-btn");

    function closeHelp() {
        popup.remove();
    }

    closeBtn.addEventListener("click", closeHelp);
    gotItBtn.addEventListener("click", closeHelp);
    popup.addEventListener("click", function (e) {
        if (e.target === this) closeHelp();
    });
}

// Temporary notification helper
function showTemporaryNotification(message) {
    var notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: rgba(11, 59, 56, 0.9);
        color: white;
        padding: 8px 16px;
        border-radius: 25px;
        font-family: "Changa", sans-serif;
        font-size: 14px;
        z-index: 2000;
        animation: fadeOut 2s ease forwards;
        pointer-events: none;
        max-width: 300px;
        text-align: center;
    `;

    if (!document.querySelector("#fade-out-animation")) {
        var style = document.createElement("style");
        style.id = "fade-out-animation";
        style.textContent = `
            @keyframes fadeOut {
                0% { opacity: 1; transform: translateY(0); }
                70% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); visibility: hidden; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);
    setTimeout(function () {
        if (notification.parentNode) notification.parentNode.removeChild(notification);
    }, 3000);
}

// Create locator (inset) map
var miniMap = new L.Control.MiniMap(L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"), {
    toggleDisplay: true,
    position: "bottomright",
    zoomLevelOffset: -6
}).addTo(mymap);

// Add a scale bar to the map
L.control.scale({ imperial: true, metric: true, position: "bottomleft" }).addTo(mymap);

// ========== LAYER CONTROLS ========== //
var clusterLayer = null;
var heatmapLayer = null;
var clusterEnabled = true;
var heatmapEnabled = false;

// Create layer control panel
var LayerControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd: function (map) {
        var container = L.DomUtil.create("div", "layer-control-container");
        container.style.backgroundColor = "white";
        container.style.borderRadius = "4px";
        container.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
        container.style.padding = "5px";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "5px";

        // Cluster toggle button
        var clusterBtn = L.DomUtil.create("button", "layer-toggle-btn", container);
        clusterBtn.id = "cluster-toggle-btn";
        clusterBtn.style.cssText = `
            padding: 5px 10px;
            font-family: "Changa", sans-serif;
            font-weight: bold;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            white-space: nowrap;
        `;

        // Create checkbox inside button
        var clusterCheckbox = L.DomUtil.create("input", "", clusterBtn);
        clusterCheckbox.type = "checkbox";
        clusterCheckbox.checked = clusterEnabled;
        clusterCheckbox.style.cssText = `
            width: 14px;
            height: 14px;
            cursor: pointer;
            margin: 0;
        `;

        var clusterLabel = L.DomUtil.create("span", "", clusterBtn);
        clusterLabel.textContent = "Donut Clusters";

        // Heatmap toggle button
        var heatmapBtn = L.DomUtil.create("button", "layer-toggle-btn", container);
        heatmapBtn.id = "heatmap-toggle-btn";

        // Create checkbox inside button
        var heatmapCheckbox = L.DomUtil.create("input", "", heatmapBtn);
        heatmapCheckbox.type = "checkbox";
        heatmapCheckbox.checked = heatmapEnabled;
        heatmapCheckbox.style.cssText = `
            width: 14px;
            height: 14px;
            cursor: pointer;
            margin: 0;
        `;

        var heatmapLabel = L.DomUtil.create("span", "", heatmapBtn);
        heatmapLabel.textContent = "Heat Map";

        // Update button styles based on checkbox state
        function updateClusterButtonStyle() {
            if (clusterCheckbox.checked) {
                clusterBtn.style.backgroundColor = "rgb(11, 59, 56)";
                clusterBtn.style.color = "white";
                clusterLabel.style.color = "white";
            } else {
                clusterBtn.style.backgroundColor = "#f0f0f0";
                clusterBtn.style.color = "#666";
                clusterLabel.style.color = "#666";
            }
        }

        function updateHeatmapButtonStyle() {
            if (heatmapCheckbox.checked) {
                // Changed from orange to teal to match cluster button
                heatmapBtn.style.backgroundColor = "rgb(11, 59, 56)";
                heatmapBtn.style.color = "white";
                heatmapLabel.style.color = "white";
            } else {
                heatmapBtn.style.backgroundColor = "#f0f0f0";
                heatmapBtn.style.color = "#666";
                heatmapLabel.style.color = "#666";
            }
        }

        // Add click handlers for checkboxes
        clusterCheckbox.addEventListener("change", function (e) {
            e.stopPropagation();
            toggleClusters(this.checked);
            updateClusterButtonStyle();
        });

        heatmapCheckbox.addEventListener("change", function (e) {
            e.stopPropagation();
            toggleHeatmap(this.checked);
            updateHeatmapButtonStyle();
        });

        // Also allow clicking the button to toggle checkbox
        clusterBtn.addEventListener("click", function (e) {
            // Don't trigger if clicking directly on checkbox
            if (e.target !== clusterCheckbox) {
                clusterCheckbox.checked = !clusterCheckbox.checked;
                toggleClusters(clusterCheckbox.checked);
                updateClusterButtonStyle();
            }
        });

        heatmapBtn.addEventListener("click", function (e) {
            // Don't trigger if clicking directly on checkbox
            if (e.target !== heatmapCheckbox) {
                heatmapCheckbox.checked = !heatmapCheckbox.checked;
                toggleHeatmap(heatmapCheckbox.checked);
                updateHeatmapButtonStyle();
            }
        });

        // Set initial styles
        updateClusterButtonStyle();
        updateHeatmapButtonStyle();

        return container;
    }
});

new LayerControl().addTo(mymap);

// ========== RANDOM STORY FINDER CONTROL ========== //
var StoryFinderControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd: function (map) {
        var button = L.DomUtil.create("button", "story-finder-btn");
        button.innerHTML = "Find Photos/Stories";
        button.title = "Find a random show with photos or stories";

        // Add hover effects
        button.addEventListener("mouseenter", function () {
            this.style.backgroundColor = "rgb(218,126,53)";
            this.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
        });

        button.addEventListener("mouseleave", function () {
            this.style.transform = "scale(1)";
            this.style.backgroundColor = "rgb(208, 113, 38)";
            this.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
        });

        // Click handler
        button.addEventListener("click", function (e) {
            e.stopPropagation();
            findRandomStory();
        });

        return button;
    }
});

// Add the control to the map
new StoryFinderControl().addTo(mymap);

// ========== SUBMIT PHOTO/STORY CONTROL ========== //
var SubmitControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd: function (map) {
        var button = L.DomUtil.create("button", "story-finder-btn submit-btn");
        button.innerHTML = "Submit Photos/Stories";
        button.title = "Submit your concert photos and stories";
        button.style.backgroundColor = "rgb(208, 113, 38)";
        button.style.color = "white";

        // Add hover effects
        button.addEventListener("mouseenter", function () {
            this.style.backgroundColor = "rgb(218,126,53)";
            this.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
        });

        button.addEventListener("mouseleave", function () {
            this.style.transform = "scale(1)";
            this.style.backgroundColor = "rgb(208, 113, 38)";
            this.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
        });

        // Click handler - open the Google Form in a new tab
        button.addEventListener("click", function (e) {
            e.stopPropagation();
            window.open("https://docs.google.com/forms/d/e/1FAIpQLSerjweiGwejyVxnbYcIk_LWk8W_3PQZixh8N9DtJifwg9Qn2w/viewform?usp=sharing&ouid=115915436845269291117", "_blank");
        });

        return button;
    }
});

// Add the control to the map
new SubmitControl().addTo(mymap);

// ========== ANNIVERSARY REMINDER CONTROL ========== //
var AnniversaryControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd: function (map) {
        var button = L.DomUtil.create("button", "story-finder-btn anniversary-btn");
        button.innerHTML = "Today in UQ History";
        button.title = "See shows that happened on this date in previous years";
        button.style.backgroundColor = "rgb(208, 113, 38)";
        button.style.color = "white";

        // Add hover effects
        button.addEventListener("mouseenter", function () {
            this.style.backgroundColor = "rgb(218,126,53)";
            this.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
        });

        button.addEventListener("mouseleave", function () {
            this.style.transform = "scale(1)";
            this.style.backgroundColor = "rgb(208, 113, 38)";
            this.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
        });

        // Click handler
        button.addEventListener("click", function (e) {
            e.stopPropagation();
            showAnniversaryReminders();
        });

        return button;
    }
});

// Add the control to the map
new AnniversaryControl().addTo(mymap);

// ========== ANNIVERSARY REMINDER FUNCTIONALITY ========== //
function showAnniversaryReminders() {
    if (!window.showsData) {
        console.error("Show data not loaded");
        return;
    }

    const today = new Date();
    const todayMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
    const todayDay = today.getDate();

    // Get month name
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
    const monthName = monthNames[today.getMonth()];

    // Find shows that happened on this date in any year
    const anniversaryShows = window.showsData.filter((show) => {
        // Parse the show date
        const monthIndex = monthNames.indexOf(show.Month);
        const showMonth = monthIndex + 1;
        const showDay = parseInt(show.Day);

        return showMonth === todayMonth && showDay === todayDay;
    });

    // Sort by year (most recent first)
    anniversaryShows.sort((a, b) => b.Year - a.Year);

    // Create the modal
    const existingModal = document.getElementById("anniversary-modal");
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.id = "anniversary-modal";
    modal.className = "modal";
    modal.style.display = "block";
    modal.style.zIndex = "10000";

    const content = document.createElement("div");
    content.className = "modal-content";
    content.style.maxWidth = "700px";
    content.style.maxHeight = "80vh";
    content.style.overflowY = "auto";
    content.style.position = "relative";

    // Build the content
    let html = `
        <span class="close-anniversary" style="position:absolute;right:10px;top:5px;font-size:28px;cursor:pointer;color:#333;">&times;</span>
        <h2 style="color:rgb(11,59,56);font-family:'Changa',sans-serif;margin-bottom:5px;font-size:1.8rem;">Today in UQ History</h2>
        <p style="color:#666;font-family:'Changa',sans-serif;font-size:1rem;margin-bottom:15px;">${monthName} ${todayDay} — Shows on this date in past years</p>
    `;

    if (anniversaryShows.length === 0) {
        html += `
            <div style="text-align:center;padding:30px 0;font-family:'Changa',sans-serif;color:#666;">
                <p style="font-size:1.1rem;">No shows on this date yet!</p>
                <p style="font-size:0.9rem;margin-top:5px;">Check back another day for more Ultra Q history.</p>
            </div>
        `;
    } else {
        // Group by year for display
        const years = [...new Set(anniversaryShows.map((s) => s.Year))].sort((a, b) => b - a);

        html += `<div style="margin-top:10px;">`;

        years.forEach((year) => {
            const showsInYear = anniversaryShows.filter((s) => s.Year === year);
            const yearsAgo = new Date().getFullYear() - year;
            const yearLabel = yearsAgo === 0 ? "This year!" : `${yearsAgo} year${yearsAgo > 1 ? "s" : ""} ago`;

            html += `
                <div style="margin-bottom:15px;border-left:4px solid rgb(208,113,38);padding-left:12px;">
                    <h4 style="color:rgb(11,59,56);font-family:'Changa',sans-serif;margin:0 0 4px 0;font-size:1.1rem;">
                        ${year} — ${yearLabel}
                    </h4>
            `;

            showsInYear.forEach((show) => {
                const location =
                    show.State && show.State !== "" ? `${show.City}, ${show.State}` : `${show.City}, ${show.Country}`;

                // Check if show has photos or stories
                const paddedID = show.ID.toString().padStart(4, "0");
                const hasPhotos = allPhotosCache && allPhotosCache.some((f) => f.startsWith(paddedID));
                const hasStories = allStoriesCache && allStoriesCache[paddedID] && allStoriesCache[paddedID].length > 0;

                let mediaBadges = "";
                if (hasPhotos)
                    mediaBadges += `<span style="background:#23bdb4;color:white;padding:1px 8px;border-radius:12px;font-size:10px;margin-right:4px;">📷</span>`;
                if (hasStories)
                    mediaBadges += `<span style="background:#bd6623;color:white;padding:1px 8px;border-radius:12px;font-size:10px;">📖</span>`;

                html += `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f0f0f0;font-family:'Changa',sans-serif;font-size:0.95rem;">
                        <span>
                            <strong>${show.Venue}</strong> — ${location}
                            ${mediaBadges}
                        </span>
                        <button onclick="window.zoomToShow('${show.ID}', '${show.Venue}', ${show.Latitude}, ${show.Longitude}, '${show.City}', ${show.Year})" style="background:rgb(11,59,56);color:white;border:none;padding:2px 12px;border-radius:4px;cursor:pointer;font-family:'Changa',sans-serif;font-size:0.8rem;white-space:nowrap;">
                            Map →
                        </button>
                    </div>
                `;
            });

            html += `</div>`;
        });

        html += `</div>`;
    }

    content.innerHTML = html;
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Close handlers
    const closeBtn = content.querySelector(".close-anniversary");
    const closeModal = () => {
        modal.remove();
    };

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) {
        if (e.target === this) closeModal();
    });

    // Also close with Escape key
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            const modal = document.getElementById("anniversary-modal");
            if (modal) modal.remove();
        }
    });
}

// ========== GLOBAL ZOOM TO SHOW FUNCTION ========== //
// Make this function globally accessible for the onclick handler in the anniversary modal
window.zoomToShow = function(showID, venue, lat, lng, city, year) {
    if (!window.showsData) {
        console.error("Show data not loaded");
        return;
    }

    // Find the show data
    let show = window.showsData.find((s) => s.ID === showID);
    if (!show) {
        // If we have the data passed directly, use it
        if (lat && lng) {
            show = { ID: showID, Venue: venue || "", City: city || "", Year: year || "", Latitude: lat, Longitude: lng };
        } else {
            console.error("Show not found:", showID);
            return;
        }
    }

    // Close the anniversary modal
    const modal = document.getElementById("anniversary-modal");
    if (modal) modal.remove();

    // Zoom to the show location
    mymap.setView([show.Latitude, show.Longitude], 18);

    // Try to find and open the marker
    setTimeout(() => {
        let markerFound = false;

        // First try to find by exact location match
        allMarkers.forEach((marker) => {
            const latLng = marker.getLatLng();
            if (Math.abs(latLng.lat - show.Latitude) < 0.0005 &&
                Math.abs(latLng.lng - show.Longitude) < 0.0005) {
                try {
                    marker.openPopup();
                    markerFound = true;
                    console.log("Marker found and opened by location");
                } catch (e) {
                    console.log("Could not open popup:", e);
                }
            }
        });

        // If not found, try by matching popup content
        if (!markerFound) {
            allMarkers.forEach((marker) => {
                const popupContent = marker.getPopup().getContent();
                if (popupContent) {
                    // Check if this marker matches the show
                    const venueMatch = show.Venue && popupContent.includes(show.Venue);
                    const cityMatch = show.City && popupContent.includes(show.City);
                    const yearMatch = show.Year && popupContent.includes(show.Year.toString());
                    
                    if (venueMatch || (cityMatch && yearMatch)) {
                        try {
                            marker.openPopup();
                            markerFound = true;
                            console.log("Marker found and opened by popup content");
                        } catch (e) {
                            console.log("Could not open popup:", e);
                        }
                    }
                }
            });
        }

        // If still not found, try to find by coordinates with a larger tolerance
        if (!markerFound) {
            allMarkers.forEach((marker) => {
                const latLng = marker.getLatLng();
                if (Math.abs(latLng.lat - show.Latitude) < 0.01 &&
                    Math.abs(latLng.lng - show.Longitude) < 0.01) {
                    try {
                        marker.openPopup();
                        markerFound = true;
                        console.log("Marker found and opened by approximate location");
                    } catch (e) {
                        console.log("Could not open popup:", e);
                    }
                }
            });
        }

        if (!markerFound) {
            console.log("Could not find the marker for this show, but zoomed to its location!");
            // Show a temporary notification
            const displayName = show.Venue || show.City || "show";
            showTemporaryNotification(`📍 ${displayName} — ${show.City || ""} ${show.Year || ""}`);
        }
    }, 800);
};

// ========== GLOBAL VARIABLES ========== //
var markersByYear = {};
var visibleYears = new Set();
var allMarkers = [];

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
    var size = 50,
        radius = size / 2,
        weight = 10;
    var svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

    markers.forEach(function (marker) {
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
        Object.keys(years).forEach(function (year) {
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
});

// ========== LAYER MANAGEMENT FUNCTIONS ========== //
function refreshClusterLayer() {
    // Remove existing cluster layer if it exists
    if (clusterLayer) {
        mymap.removeLayer(clusterLayer);
        clusterLayer = null;
    }

    // Only add markers if clusters are enabled
    if (clusterEnabled) {
        // Get visible markers based on selected years
        var visibleMarkers = [];
        Object.keys(markersByYear).forEach((year) => {
            if (visibleYears.has(year)) {
                visibleMarkers.push(...markersByYear[year]);
            }
        });

        if (visibleMarkers.length > 0) {
            // Create new cluster layer with visible markers
            markerClusterGroup.clearLayers();
            visibleMarkers.forEach(function (marker) {
                markerClusterGroup.addLayer(marker);
            });
            clusterLayer = markerClusterGroup;
            mymap.addLayer(clusterLayer);
            console.log("Clusters enabled - showing", visibleMarkers.length, "markers in clusters");
        } else {
            console.log("No markers to display");
        }
    } else {
        console.log("Clusters disabled - no markers showing");
    }
}

function toggleClusters(enabled) {
    clusterEnabled = enabled;
    refreshClusterLayer();
}

function refreshHeatmapLayer() {
    if (!window.showsData) return;

    // Remove existing heatmap layer
    if (heatmapLayer) {
        mymap.removeLayer(heatmapLayer);
        heatmapLayer = null;
    }

    if (heatmapEnabled) {
        // Filter shows by visible years
        const visibleShows = window.showsData.filter((show) => visibleYears.has(show.Year.toString()));

        // Generate heat points (each show contributes equally)
        var heatPoints = generateHeatmapData(visibleShows);

        var heatOptions = {
            radius: 30,
            blur: 30,
            maxZoom: 17,
            minOpacity: 0.4,
            gradient: {
                0.2: "#23bdb4",
                0.4: "#bdb423",
                0.6: "#bd6623",
                0.8: "#bd232d",
                1.0: "#bd237a"
            }
        };

        heatmapLayer = L.heatLayer(heatPoints, heatOptions);
        heatmapLayer.addTo(mymap);
        console.log("Heatmap enabled - showing", visibleShows.length, "shows");
    }
}

function toggleHeatmap(enabled) {
    heatmapEnabled = enabled;
    refreshHeatmapLayer();
}

// Generate heat map data - each show contributes equally (intensity = 1)
function generateHeatmapData(showsData) {
    if (!showsData || showsData.length === 0) return [];

    var heatPoints = [];

    showsData.forEach(function (show) {
        if (show.Latitude && show.Longitude) {
            // Each show gets equal intensity (1)
            heatPoints.push([show.Latitude, show.Longitude, 1]);
        }
    });

    console.log(`Generated ${heatPoints.length} heat points from ${showsData.length} shows`);
    return heatPoints;
}

// ========== RANDOM STORY FINDER ========== //
// Track the last selected show to avoid repeats
let lastSelectedShowID = null;

async function findRandomStory() {
    // Make sure all data is loaded first
    if (!window.showsData) {
        return;
    }

    // Load photos and stories if not already loaded
    if (!allPhotosCache) {
        await loadAllPhotos();
    }

    if (!allStoriesCache) {
        await loadAllStories();
    }

    // Get currently visible years from the filter
    const visibleYearsArray = Array.from(visibleYears);

    // If no years are selected, return
    if (visibleYearsArray.length === 0) {
        return;
    }

    // Filter shows to only those from visible years
    const visibleShows = window.showsData.filter((show) => {
        const yearStr = show.Year.toString();
        return visibleYearsArray.includes(yearStr);
    });

    if (visibleShows.length === 0) {
        return;
    }

    // Now check for shows with media among the visible shows
    let showsWithMedia = visibleShows.filter((show) => {
        const paddedID = show.ID.toString().padStart(4, "0");
        // Check if show has photos or stories
        const hasPhotos = allPhotosCache && allPhotosCache.some((filename) => filename.startsWith(paddedID));
        const hasStories = allStoriesCache && allStoriesCache[paddedID] && allStoriesCache[paddedID].length > 0;
        return hasPhotos || hasStories;
    });

    if (showsWithMedia.length === 0) {
        return;
    }

    // If there's more than one show with media, remove the last one shown
    if (showsWithMedia.length > 1 && lastSelectedShowID !== null) {
        showsWithMedia = showsWithMedia.filter((show) => show.ID !== lastSelectedShowID);

        // If filtering removed all shows (should only happen if there was only 1 show with media), use the full list again
        if (showsWithMedia.length === 0) {
            showsWithMedia = visibleShows.filter((show) => {
                const paddedID = show.ID.toString().padStart(4, "0");
                const hasPhotos = allPhotosCache && allPhotosCache.some((filename) => filename.startsWith(paddedID));
                const hasStories = allStoriesCache && allStoriesCache[paddedID] && allStoriesCache[paddedID].length > 0;
                return hasPhotos || hasStories;
            });
        }
    }

    // Pick a random show from the filtered list
    const randomIndex = Math.floor(Math.random() * showsWithMedia.length);
    const selectedShow = showsWithMedia[randomIndex];

    // Store the selected show ID to avoid repeats
    lastSelectedShowID = selectedShow.ID;

    // First, zoom to the show location (this will also zoom out of any clusters)
    mymap.setView([selectedShow.Latitude, selectedShow.Longitude], 18);

    // Wait for the map to finish zooming and for clusters to update
    setTimeout(() => {
        // Function to find and open the marker
        function findAndOpenMarker() {
            let markerFound = false;

            // First check if clusters are enabled
            if (clusterEnabled && clusterLayer) {
                // Try to find the marker within the cluster and check if the marker is in the cluster
                allMarkers.forEach((marker) => {
                    const latLng = marker.getLatLng();
                    const popupContent = marker.getPopup().getContent();

                    // Check if this marker matches the selected show
                    if (
                        popupContent.includes(selectedShow.Venue) &&
                        popupContent.includes(selectedShow.City) &&
                        popupContent.includes(selectedShow.Year.toString())
                    ) {
                        // Check if the marker is currently visible (not in a hidden cluster) and try to open it directly
                        try {
                            // If the marker is in a cluster, force the cluster to open
                            const allLayers = markerClusterGroup.getLayers();
                            const markerInCluster = allLayers.some((layer) => {
                                // Check if this is the marker we want
                                if (layer === marker) return true;
                                // If it's a cluster, check if it contains our marker
                                if (layer.getChildCount && layer.getAllChildMarkers) {
                                    const childMarkers = layer.getAllChildMarkers();
                                    return childMarkers.includes(marker);
                                }
                                return false;
                            });

                            if (markerInCluster) {
                                // The marker is in a cluster - need to zoom in more
                                const currentZoom = mymap.getZoom();
                                if (currentZoom < 18) {
                                    mymap.setView([selectedShow.Latitude, selectedShow.Longitude], currentZoom + 1);
                                    // Try again after zoom
                                    setTimeout(() => {
                                        try {
                                            marker.openPopup();
                                            markerFound = true;
                                        } catch (e) {
                                            console.log("Could not open popup after zoom");
                                        }
                                    }, 400);
                                } else {
                                    // Already at high zoom, try to open directly
                                    try {
                                        marker.openPopup();
                                        markerFound = true;
                                    } catch (e) {
                                        console.log("Could not open popup at high zoom");
                                    }
                                }
                            } else {
                                // Marker is not in a cluster, open directly
                                try {
                                    marker.openPopup();
                                    markerFound = true;
                                } catch (e) {
                                    console.log("Could not open popup directly");
                                }
                            }
                        } catch (e) {
                            console.log("Error opening marker:", e);
                        }
                    }
                });
            } else {
                // Clusters are disabled, search through all markers directly
                allMarkers.forEach((marker) => {
                    const popupContent = marker.getPopup().getContent();
                    if (
                        popupContent.includes(selectedShow.Venue) &&
                        popupContent.includes(selectedShow.City) &&
                        popupContent.includes(selectedShow.Year.toString())
                    ) {
                        try {
                            marker.openPopup();
                            markerFound = true;
                        } catch (e) {
                            console.log("Could not open popup:", e);
                        }
                    }
                });
            }

            // If we couldn't find the exact marker, try by location
            if (!markerFound) {
                allMarkers.forEach((marker) => {
                    const latLng = marker.getLatLng();
                    if (
                        Math.abs(latLng.lat - selectedShow.Latitude) < 0.001 &&
                        Math.abs(latLng.lng - selectedShow.Longitude) < 0.001
                    ) {
                        try {
                            marker.openPopup();
                            markerFound = true;
                        } catch (e) {
                            console.log("Could not open popup by location:", e);
                        }
                    }
                });
            }

            if (!markerFound) {
                console.log("Could not find the marker for this show, but zoomed to its location!");
            }
        }

        // Try to find and open the marker
        findAndOpenMarker();

        // If the marker wasn't found after the first attempt, try again after a short delay
        // (this helps if the cluster needs time to update after zooming)
        setTimeout(() => {
            // Check if a popup is already open
            if (!mymap.getPopup() || !mymap.getPopup().isOpen()) {
                // Try one more time with a different approach
                allMarkers.forEach((marker) => {
                    const latLng = marker.getLatLng();
                    // Check by location with a slightly larger tolerance
                    if (
                        Math.abs(latLng.lat - selectedShow.Latitude) < 0.005 &&
                        Math.abs(latLng.lng - selectedShow.Longitude) < 0.005
                    ) {
                        try {
                            // Force the map to zoom to the exact location
                            mymap.setView([selectedShow.Latitude, selectedShow.Longitude], 18);
                            setTimeout(() => {
                                try {
                                    marker.openPopup();
                                } catch (e) {
                                    console.log("Final attempt failed:", e);
                                }
                            }, 300);
                        } catch (e) {
                            console.log("Final attempt failed:", e);
                        }
                    }
                });
            }
        }, 800);
    }, 500);
}

// ========== FILTERING FUNCTIONS ========== //
function loadShowsData() {
    Object.keys(iconMap).forEach((year) => {
        markersByYear[year] = [];
    });

    fetch("UQ_shows.json")
        .then((response) => response.json())
        .then((data) => {
            console.log("Shows data loaded:", data.length, "shows");
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
                    allMarkers.push(marker);
                    visibleYears.add(yearStr);
                }
            });

            console.log("Visible years:", Array.from(visibleYears));
            createYearControl();

            // Initialize both layers
            refreshClusterLayer();
            refreshHeatmapLayer();
        })
        .catch((error) => console.error("Error loading shows data:", error));
}

function createYearControl() {
    const container = document.getElementById("year-control");
    container.innerHTML = '<strong style="color: rgb(11, 59, 56);">Year & Show Count</strong>';

    Object.keys(markersByYear)
        .sort()
        .forEach((year) => {
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

                checkbox.addEventListener("change", function () {
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
    // Refresh both layers with new year selection
    refreshClusterLayer();
    refreshHeatmapLayer();

    if (window.showsData) {
        const visibleShows = window.showsData.filter((show) => visibleYears.has(show.Year.toString()));
        calculateAndDisplayTopCities(visibleShows);
    }
}

// ========== STATS PANEL ========== //
function calculateAndDisplayTopCities(showsData) {
    const cityCount = {};
    showsData.forEach((show) => {
        let locationKey =
            show.State && show.State !== "" ? `${show.City}, ${show.State}` : `${show.City}, ${show.Country}`;
        cityCount[locationKey] = (cityCount[locationKey] || 0) + 1;
    });

    const top5 = Object.entries(cityCount)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const container = document.getElementById("top-cities-list");
    if (!container) return;

    container.innerHTML = "";
    if (top5.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:10px;'>No data available</p>";
    } else {
        top5.forEach((item, index) => {
            const cityDiv = document.createElement("div");
            cityDiv.className = "city-rank";
            cityDiv.innerHTML = `<span class="rank-number">${index + 1}</span><span class="city-name" title="${item.city}">${item.city}</span><span class="show-count">${item.count}</span>`;
            container.appendChild(cityDiv);
        });
    }
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

    fetch("UQ_shows.json")
        .then((response) => response.json())
        .then((data) => {
            const show = data.find((s) => s.ID === showID);
            if (show)
                document.getElementById("gallery-title").textContent =
                    `${show.Venue} - ${show.Month} ${show.Day}, ${show.Year}`;
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
        const showPhotoFilenames = allPhotos.filter((filename) => filename.startsWith(paddedID)).sort();

        if (showPhotoFilenames.length > 0) {
            showPhotoFilenames.forEach((filename) => {
                currentPhotoInfo.push({
                    path: `sorted_photos/${filename}`,
                    photographer: extractPhotographerName(filename),
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
        return parts
            .slice(2)
            .join(" ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
    }
    return "Story";
}

async function loadAllStories() {
    if (!allStoriesCache) {
        try {
            const response = await fetch("stories.txt");
            const text = await response.text();
            const stories = {};
            text.split("\n").forEach((line) => {
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
        .then((response) => response.json())
        .then((data) => {
            const show = data.find((s) => s.ID === showID);
            if (show)
                document.getElementById("stories-title").textContent =
                    `${show.Venue} - ${show.Month} ${show.Day}, ${show.Year}`;
        });

    loadStoriesForShow(showID).then((hasStories) => {
        if (hasStories) {
            displayCurrentStory();
            document.querySelector("#stories-modal .gallery-nav").style.display = "flex";
        } else {
            document.getElementById("stories-content").innerHTML =
                "<div class='story-container'><p>No stories available for this show yet.</p></div>";
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
document.addEventListener("DOMContentLoaded", function () {
    let currentPage = 1;
    const totalPages = 3;

    function showPage(pageNumber) {
        document.querySelectorAll(".splash-page").forEach((page) => page.classList.remove("active"));
        document.getElementById(`page${pageNumber}`).classList.add("active");
        currentPage = pageNumber;
        document.getElementById("prev-page").disabled = currentPage === 1;
        document.getElementById("next-page").disabled = currentPage === totalPages;
    }

    document.getElementById("next-page").addEventListener("click", () => {
        if (currentPage < totalPages) showPage(currentPage + 1);
    });
    document.getElementById("prev-page").addEventListener("click", () => {
        if (currentPage > 1) showPage(currentPage - 1);
    });

    function closeSplash() {
        document.getElementById("splash-modal").classList.add("hidden");
        setTimeout(() => mymap.invalidateSize(), 300);
    }

    document.getElementById("accept-splash").addEventListener("click", closeSplash);
    document.getElementById("close-splash").addEventListener("click", closeSplash);

    showPage(1);

    // Load all data
    loadShowsData();
    // Load photos and stories in the background
    loadAllPhotos().then(() => console.log("Photos loaded"));
    loadAllStories().then(() => console.log("Stories loaded"));

    // Photo gallery listeners
    document
        .querySelector(".close-gallery")
        .addEventListener("click", () => (document.getElementById("gallery-modal").style.display = "none"));
    window.addEventListener("click", (event) => {
        if (event.target === document.getElementById("gallery-modal"))
            document.getElementById("gallery-modal").style.display = "none";
    });
    document.getElementById("prev-photo").addEventListener("click", () => {
        if (currentPhotoIndex > 0) {
            currentPhotoIndex--;
            displayCurrentPhoto();
        }
    });
    document.getElementById("next-photo").addEventListener("click", () => {
        if (currentPhotoIndex < currentPhotoInfo.length - 1) {
            currentPhotoIndex++;
            displayCurrentPhoto();
        }
    });

    // Collapsible stats panel
    const statsControl = document.getElementById("stats-control");
    const statsToggle = document.getElementById("minimize-stats");
    const statsHeader = document.getElementById("stats-header");

    if (statsToggle && statsControl) {
        const toggleStats = () => {
            statsControl.classList.toggle("minimized");
            statsToggle.textContent = statsControl.classList.contains("minimized") ? "+" : "−";
        };
        statsToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleStats();
        });
        if (statsHeader) {
            statsHeader.addEventListener("click", (e) => {
                if (e.target !== statsToggle) toggleStats();
            });
        }
    }

    // Stories gallery listeners
    document
        .querySelector(".close-stories")
        .addEventListener("click", () => (document.getElementById("stories-modal").style.display = "none"));
    window.addEventListener("click", (event) => {
        if (event.target === document.getElementById("stories-modal"))
            document.getElementById("stories-modal").style.display = "none";
    });
    document.getElementById("prev-story").addEventListener("click", () => {
        if (currentStoryIndex > 0) {
            currentStoryIndex--;
            displayCurrentStory();
        }
    });
    document.getElementById("next-story").addEventListener("click", () => {
        if (currentStoryIndex < currentStories.length - 1) {
            currentStoryIndex++;
            displayCurrentStory();
        }
    });

    // Business Card Modal listeners
    const businessModal = document.getElementById("business-card-modal");
    const businessClose = document.querySelector(".close-business-card");
    
    if (businessClose) {
        businessClose.addEventListener("click", function() {
            if (businessModal) businessModal.style.display = "none";
        });
    }
    if (businessModal) {
        businessModal.addEventListener("click", function(e) {
            if (e.target === businessModal) businessModal.style.display = "none";
        });
    }

});