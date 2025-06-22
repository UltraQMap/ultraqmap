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