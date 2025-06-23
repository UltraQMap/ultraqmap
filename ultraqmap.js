// Set up the map
var mymap = L.map("map").setView([40, -30], 3);

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
            map.setView([40, -30], 3);
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
L.control
    .scale({
        imperial: true, // Show imperial units (feet/miles)
        metric: true, // Show metric units (meters/kilometers)
        position: "bottomleft"
    })
    .addTo(mymap);


// Splash screen
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("accept-splash").addEventListener("click", function () {
        document.getElementById("splash-modal").classList.add("hidden");
        document.getElementById("map").classList.remove("inactive");
    });
});


// Map markers
var ShowIcon = L.Icon.extend({
    options: {
        iconSize: [20, 30], 
        iconAnchor: [10, 30], 
        popupAnchor: [0, -20],
    }
});

var iconMap = {
    2019: new ShowIcon({iconUrl: "MapMarkers/2019_marker2.png"}),
    2020: new ShowIcon({iconUrl: "MapMarkers/2020_marker2.png"}),
    2021: new ShowIcon({iconUrl: "MapMarkers/2021_marker2.png"}),
    2022: new ShowIcon({iconUrl: "MapMarkers/2022_marker2.png"}),
    2023: new ShowIcon({iconUrl: "MapMarkers/2023_marker2.png"}),
    2024: new ShowIcon({iconUrl: "MapMarkers/2024_marker2.png"}),
    2025: new ShowIcon({iconUrl: "MapMarkers/2025_marker2.png"})
};

// Load shows data from JSON file
function loadShowsData() {
    fetch('UQ_shows.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(show => {
                const icon = iconMap[show.Year] || iconMap[2019];
                
                const marker = L.marker([show.Latitude, show.Longitude], { icon: icon })
                    .addTo(mymap);
                
                const popupContent = `
                    <b>${show.Venue}</b><br>
                    ${show.City}, ${show.State || show.Country}<br>
                    ${show.Month} ${show.Day}, ${show.Year}
                `;
                
                marker.bindPopup(popupContent);
            });
        })
        .catch(error => console.error('Error loading shows data:', error));
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadShowsData();
    
    document.getElementById("accept-splash").addEventListener("click", function () {
        document.getElementById("splash-modal").classList.add("hidden");
        document.getElementById("map").classList.remove("inactive");
    });
});


