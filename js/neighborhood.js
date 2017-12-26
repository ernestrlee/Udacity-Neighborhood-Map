// Neighborhood map javascript file

// Create a location class with properties
var Location = function (id, name, address, latitude, longitude, locationType, info) {
    var self = this;
    self.id = id;
    self.name = name;
    self.address = address;
    self.lat = latitude;
    self.lng = longitude;
    self.type = locationType;
    self.info = info;
    // function that returns an object with both lat and lng
    self.getPosition = function () {
        return { lat: self.lat, lng: self.lng };
    };
};

// This function contains view model information and utilizes knockout.js
var NeighborhoodViewModel = function () {
    var self = this;

    // Create an array of locations with POI information
    self.pointsOfInterest = [
        new Location(0, "i-Tea", "20666 Redwood Rd, Castro Valley, CA 94546", 37.6959095, -122.0729139, "drink", "A nice place to get boba."),
        new Location(1, "Trader Joe's", "22224 Redwood Rd, Castro Valley, CA 94546", 37.68538059999999, -122.0730184, "shopping", "Shopping for groceries."),
        new Location(2, "Golden Tee Golfland", "2533 Castro Valley Blvd, Castro Valley, CA 94546", 37.6926303, -122.0876865, "entertainment", "Amusement for people of all ages."),
        new Location(3, "Rita's Italian Ice", "3200 Castro Valley Blvd, Castro Valley, CA 94546", 37.6958653, -122.079708, "food", "Nice treats for a hot day."),
        new Location(4, "Dampa Filipino Food", "2960 Castro Valley Blvd, Castro Valley, CA 94546", 37.6961902, -122.08274, "food", "This place serves lumpia, need I say more?"),
        new Location(5, "Lake Chabot", "17600 Lake Chabot Rd, Castro Valley, CA 94546", 37.7172851, -122.1043496, "park", "A place to go fishing and hiking."),
        new Location(6, "BART Castro Valley Station", "3348 Norbridge Ave, Castro Valley, CA 94546", 37.6925991, -122.0756993, "transportation", "Public transportation that takes all across the bay area.")
    ];

    // Create an empty array to hold marker information.
    self.markers = [];
    
    //Create a marker for each POI, and put them into the markers array.
    for (var i = 0; i < self.pointsOfInterest.length; i++) {
        var marker = {
            position: self.pointsOfInterest[i].getPosition(),
            title: self.pointsOfInterest[i].name,
            id: self.pointsOfInterest[i].id
        };
        // Populate the markers array in the view model.
        self.markers.push(marker);                
    }
    
    // Set an observable to keep track of the filter text
    self.filter = ko.observable("");

    // The code found at https://codepen.io/blakewatson/pen/ZQXNmK was
    // used as reference when writing the function below
    // This function updates the POI list and the map markers based
    // on the the filter criteria entered into the filter text input
    self.filteredList = ko.computed(function () {
        // If the filter input is empty, display all the POIs
        if (self.filter() == "") {
            // The code below checks to see if google APIs have been loaded before trying
            // to show all the markers.  The code snippet for checking if google APIs have been
            // loaded was found at: https://stackoverflow.com/questions/9228958/how-to-check-if-google-maps-api-is-loaded
            if (typeof google === 'object' && typeof google.maps === 'object') {
                var poiIds = [];
                for (var i = 0; i < self.pointsOfInterest.length; i++) {
                    poiIds.push(self.pointsOfInterest[i].id);
                }
                refreshMarkers(poiIds);
            }

            return self.pointsOfInterest;
        }

        // If there is text in the filter search box, create a list
        // that matches with the text and the names of the POIs
        // using a case insensitive match
        else {
            var updatedList = [];
            var updatedMarkerIds = [];
            for (var i = 0; i < self.pointsOfInterest.length; i++) {
                if (self.pointsOfInterest[i].name.toUpperCase().includes(self.filter().toUpperCase())) {
                    updatedList.push(self.pointsOfInterest[i]);
                    updatedMarkerIds.push(self.pointsOfInterest[i].id);
                }
            }
            
            refreshMarkers(updatedMarkerIds);
            return updatedList;
        }
    });

    // Set an observable on the selected location to highlight it
    // when selected.
    self.selectedLocation = ko.observable();
    self.selectLocation = function (location) {
        var marker = self.markers[location.id];
        self.selectedLocation(location);
        google.maps.event.trigger(marker, 'click');
    };            
}

// Create a variable for the view model for referencing
var vm = new NeighborhoodViewModel();

// Apply the bindings to the view model
ko.applyBindings(vm);

// Create a map variable for the Google Map
var map;

// Initialize the map with a location and markers
function initMap() {
    // Set the neighborhood location using latitude and
    // longitude coordinates
    var neighborhood = { lat: 37.696401, lng: -122.086353 };

    // Create the map 
    map = new google.maps.Map(document.getElementById('map'), {
        center: neighborhood,
        zoom: 14,
        mapTypeControl: false
    });

    var defaultIcon = makeMarkerIcon('7b347b');
    var highlightedIcon = makeMarkerIcon('2b0e2b');

    // This code snippet below is a modified version of the code found
    // from the Udacity course ud864

    var largeInfowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();

    vm.markers = [];

    // The following code uses the POI array from the view model to create
    // an array of markers when the map is first initialized.
    for (var i = 0; i < vm.pointsOfInterest.length; i++) {
        
        //Create a marker for each POI, and put them into the markers array.
        var marker = new google.maps.Marker({
            map: map,
            position: vm.pointsOfInterest[i].getPosition(),
            title: vm.pointsOfInterest[i].name,
            icon: defaultIcon,
            animation: google.maps.Animation.DROP,
            id: vm.pointsOfInterest[i].id
        });
        // Populate the markers array in the view model.
        vm.markers.push(marker);

        // Create an onclick event to open an infowindow at each marker.
        marker.addListener('click', function () {
            populateInfoWindow(this, largeInfowindow);
            showMarker(this);
        });
        // Create mouse over and mouse out listeners to change the color of the icons
        marker.addListener('mouseover', function () {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function () {
            this.setIcon(defaultIcon);
        });

        bounds.extend(vm.markers[i].position);
    }
    // Extend the boundaries of the map for each marker
    map.fitBounds(bounds);
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        var poi = vm.pointsOfInterest[marker.id];
        var infoWindowContent = "<div class='infoWindow'>" 
            + "<h3>" + marker.title + "</h3>"
            + commasToLines(poi.address) + "<br><br>" 
            + "Description:" + "<br>"
            + poi.info + "<br><br>"
            + "lat: " + marker.position.lat() + "<br>"
            + "lng: " + marker.position.lng() + "<br>"
            + "</div>";
        //infowindow.setContent('<div>' + marker.title + "<br>" + marker.position + '</div>');
        infowindow.setContent(infoWindowContent);
        infowindow.open(map, marker);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function () {
            infowindow.marker = null;
            marker.setAnimation(null);
        });
    }
}

// This function will loop through and display the updated markers
// on the map.  The function takes in an array of marker ids to show
function refreshMarkers(markerIds) {
    // Clear all the markers from the map
    clearMarkers();

    for (var i = 0; i < markerIds.length; i++) {
        console.log(markerIds[i]);
        vm.markers[markerIds[i]].setMap(map);
    }
}

// This function will clear all markers on the map
function clearMarkers() {
    for (var i = 0; i < vm.markers.length; i++) {
        vm.markers[i].setMap(null);
    }
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

// This function will make a selected marker bounce
function showMarker(marker) {
    // Stop all the markers from moving
    for (var i = 0; i < vm.markers.length; i++) {
        if (vm.markers[i].getAnimation() !== null) {
            vm.markers[i].setAnimation(null);
        }
    }
    marker.setAnimation(google.maps.Animation.BOUNCE);
}

// This function will toggle the bounce animation of the marker
function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

// This function will replace all commas with an HTML line break
function commasToLines(str) {
    return str.replace(/,/g, "<br>");
}

function googleMapsSuccess() {
    vm.initMap();
}

function googleMapsError() {
    var div = document.getElementById("map");
    div.innerHTML = "There was an error loading Google maps.";
}
