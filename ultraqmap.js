// Set up the map
var mymap = L.map("map").setView([38, -40], 3);

// Add basemaps
var streets = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
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
var miniMap = new L.Control.MiniMap(
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"),
    {
        toggleDisplay: true,
        position: "bottomright",
        zoomLevelOffset: -5
    }
).addTo(mymap);

// Add a scale bar to the map
L.control.scale({
    imperial: true,
    metric: true,
    position: "bottomleft"
}).addTo(mymap);

// Splash screen
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("accept-splash").addEventListener("click", function () {
        document.getElementById("splash-modal").classList.add("hidden");
        
        // Add a small timeout to ensure CSS transitions complete
        setTimeout(() => {
            // Force a map resize to fix rendering issues
            mymap.invalidateSize();
        }, 300);
    });
});

// ========== GLOBAL VARIABLES ========== //
var markersByYear = {};
var visibleYears = new Set();

const yearColors = {
    '2019': '#23bdb4ff',
    '2020': '#23bd66ff',
    '2021': '#bdb423ff',
    '2022': '#bd237aff',
    '2023': '#bd232dff',
    '2024': '#bd6623ff',
    '2025': '#237abdff'
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
    2025: new ShowIcon({ iconUrl: "MapMarkers/2025_marker2.png" })
};

// Create a custom cluster icon function
function createClusterIcon(cluster) {
    var markers = cluster.getAllChildMarkers();
    var years = {};
    var uniqueYears = new Set();
    
    // Count markers by year
    markers.forEach(function(marker) {
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
    svg += `<circle cx="${radius}" cy="${radius}" r="${radius - weight/2}" fill="#f1d357" fill-opacity="0.7"/>`;
    
    // Color scheme for years
    var colors = {
        '2019': '#23bdb4ff',
        '2020': '#23bd66ff',
        '2021': '#bdb423ff',
        '2022': '#bd237aff',
        '2023': '#bd232dff',
        '2024': '#bd6623ff',
        '2025': '#237abdff'
    };
    
    // Check if all markers are from the same year
    if (uniqueYears.size === 1) {
        const year = uniqueYears.values().next().value;
        const color = colors[year] || '#555';
        
        // Draw a full circle for single-year clusters
        svg += `<circle cx="${radius}" cy="${radius}" r="${radius - weight/2}" 
                    stroke="${color}" stroke-width="${weight}" fill="none" />`;
    } 
    else {
        // Draw segments for multi-year clusters
        var total = markers.length;
        var startAngle = -Math.PI / 2;
        
        Object.keys(years).forEach(function(year) {
            var percentage = years[year] / total;
            var endAngle = startAngle + percentage * Math.PI * 2;
            
            // Calculate coordinates
            var x1 = radius + Math.cos(startAngle) * (radius - weight/2);
            var y1 = radius + Math.sin(startAngle) * (radius - weight/2);
            var x2 = radius + Math.cos(endAngle) * (radius - weight/2);
            var y2 = radius + Math.sin(endAngle) * (radius - weight/2);
            
            // Large arc flag if angle > 180 degrees
            var largeArc = percentage > 0.5 ? 1 : 0;
            
            svg += `<path d="M ${x1} ${y1} A ${radius - weight/2} ${radius - weight/2} 0 ${largeArc} 1 ${x2} ${y2}" 
                       stroke="${colors[year]}" stroke-width="${weight}" fill="none" />`;
            
            startAngle = endAngle;
        });
    }
    
    // Add count text
    svg += `<text x="${radius}" y="${radius}" text-anchor="middle" dominant-baseline="middle" 
                font-size="14" font-weight="bold" fill="black">${markers.length}</text>`;
    
    svg += '</svg>';
    
    return L.divIcon({
        html: svg,
        className: 'donut-cluster',
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
    Object.keys(iconMap).forEach(year => {
        markersByYear[year] = [];
    });

    fetch('UQ_shows.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(show => {
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
                    <b>${show.Venue}</b><br>
                    ${show.City}, ${show.State || show.Country}<br>
                    ${show.Month} ${show.Day}, ${show.Year}
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
        .catch(error => console.error('Error loading shows data:', error));
}

// Create year filter control
function createYearControl() {
    const container = document.getElementById('year-control');
    container.innerHTML = '<strong>Year & Show Count</strong>';
    
    Object.keys(markersByYear)
        .sort()
        .forEach(year => {
            if (markersByYear[year].length > 0) {
                const label = document.createElement('label');
                
                // Create checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = true;
                checkbox.value = year;
                
                // Create color indicator
                const colorIndicator = document.createElement('span');
                colorIndicator.className = `year-color year-${year}`;
                colorIndicator.style.backgroundColor = yearColors[year];
                
                // Create text
                const text = document.createTextNode(`${year} (${markersByYear[year].length})`);
                
                checkbox.addEventListener('change', function() {
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
    Object.keys(markersByYear).forEach(year => {
        if (visibleYears.has(year)) {
            markersByYear[year].forEach(marker => {
                markerClusterGroup.addLayer(marker);
            });
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    loadShowsData();

    document.getElementById("accept-splash").addEventListener("click", function () {
        document.getElementById("splash-modal").classList.add("hidden");
        document.getElementById("map").classList.remove("inactive");
    });
});