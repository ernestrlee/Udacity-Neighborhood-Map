// Neighborhood map javascript file

// Create a location class with properties
/**
* @description Represents a location
* @constructor
* @param {number} id - The id for the location
* @param {string} name - The name of the location
* @param {string} address - The address of the location
* @param {number} latitude - The latitude coordinate of the location
* @param {number} longitude - The longitude coordinate of the location
* @param {string} locationType - The type of location
* @param {string} info - Brief information about the location
*/
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
        new Location(0, "i-Tea", "20666 Redwood Rd, Castro Valley, CA 94546", 37.6959095, -122.0729139, "Drink", "A nice place to get boba."),
        new Location(1, "Trader Joe's", "22224 Redwood Rd, Castro Valley, CA 94546", 37.68538059999999, -122.0730184, "Shopping", "Shopping for groceries."),
        new Location(2, "Golden Tee Golfland", "2533 Castro Valley Blvd, Castro Valley, CA 94546", 37.6926303, -122.0876865, "Entertainment", "Amusement for people of all ages."),
        new Location(3, "Rita's Italian Ice", "3200 Castro Valley Blvd, Castro Valley, CA 94546", 37.6958653, -122.079708, "Food", "Nice treats for a hot day."),
        new Location(4, "Dampa Filipino Food", "2960 Castro Valley Blvd, Castro Valley, CA 94546", 37.6961902, -122.08274, "Food", "This place serves lumpia, need I say more?"),
        new Location(5, "Lake Chabot", "17600 Lake Chabot Rd, Castro Valley, CA 94546", 37.7172851, -122.1043496, "Park", "A place to go fishing and hiking."),
        new Location(6, "BART Castro Valley Station", "3348 Norbridge Ave, Castro Valley, CA 94546", 37.6925991, -122.0756993, "Transportation", "Public transportation that takes all across the bay area.")
    ];

    // Create an empty array to hold marker information.
    self.markers = [];

    //Create an initial list of markers for each POI, and put them into the markers array.
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
    self.filter = ko.observable('');

    // The code found at https://codepen.io/blakewatson/pen/ZQXNmK was
    // used as reference when writing the function below
    // This function updates the POI list and the map markers based
    // on the the filter criteria entered into the filter text input
    self.filteredList = ko.computed(function () {
        // If the filter input is empty, display all the POIs
        if (self.filter() == '') {
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

        // If there is text in the filter search box, create and return a list
        // that matches with the text and the names of the POIs using a case insensitive match
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

    // Set an observable on the selected location to highlight it when selected.
    self.selectedLocation = ko.observable();
    self.selectLocation = function (location) {
        var marker = self.markers[location.id];
        // Highlight the POI on the list
        self.selectedLocation(location);
        // Trigger a click event on the Google map marker to display the infowindow
        google.maps.event.trigger(marker, 'click');
    };

    // Set an observable to display the menu panel
    self.displayMenu = ko.observable(true);
    // Toggle the menu to open or close
    self.toggleMenu = function () {
        if (self.displayMenu()) {
            //closeMenu();
            self.displayMenu(false);
            google.maps.event.trigger(map, 'resize')
        }
        else {
            //showMenu();
            self.displayMenu(true);
            google.maps.event.trigger(map, 'resize')
        }
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

    var defaultIcon = makeMarkerIcon('f65858');
    var highlightedIcon = makeMarkerIcon('9b2929');

    // This code snippet below is a modified version of the code found
    // from the Udacity course ud864 and can be found at the link
    // https://github.com/udacity/ud864/blob/master/Project_Code_5_BeingStylish.html

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
            map.fitBounds(bounds);
            map.panTo(this.position);
            // Update the highlighted location on the list
            vm.selectedLocation(vm.pointsOfInterest[this.id]);
        });
        // Create mouse over and mouse out listeners to change the color of the icons
        marker.addListener('mouseover', function () {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function () {
            this.setIcon(defaultIcon);
        });
        // Extend the bounds to fit the markers
        bounds.extend(vm.markers[i].position);
    }
    
    // Add a listener that resizes the map whenever the window size changes
    // This tip was provided by a Udacity review
    google.maps.event.addDomListener(window, 'resize', function () {
        map.fitBounds(bounds);
    });
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        var poi = vm.pointsOfInterest[marker.id];
        
        var infoContent = '<h3>' + marker.title + '</h3>'
            + 'Description: ' + poi.info + '<br><br>'
            + 'Address:<br>' + commasToLines(poi.address) + '<br><br>'
            + 'Wikipedia information around this area:<br>';
        infowindow.setContent('<div class="infoWindow">' + infoContent + '</div>');
        infowindow.open(map, marker);

        // Perform a Wikipedia AJAX request with JSONP using geosearch, searching within 3000 meters
        // of given POI coordinates
        var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gsradius=3000&gscoord='
            + poi.lat + '%7C' + poi.lng + '&format=json&gslimit=5';

        $(document).ready(function () {
            var wikiInfo;
            
            // Set up the AJAX request to obtain and display parts of the response
            $.ajax({
                url: wikiUrl,
                dataType: 'jsonp',
                success: function (response) {
                    // Get a list of articles from the response
                    var articleList = response.query.geosearch;
                    // If there are no articles, display an error message
                    if (articleList.length == 0) {
                        wikiInfo = 'No information was found on Wikipedia around this location.';
                    }
                    else {
                        wikiInfo = '';
                        for (var i = 0; i < articleList.length; i++) {
                            var articleId = articleList[i].pageid;
                            var articleTitle = articleList[i].title;
                            var url = 'http://en.wikipedia.org/wiki/?curid=' + articleId;

                            // Display a listed link to a Wikipedia article
                            wikiInfo += '<li><a href="' + url + '">' + articleTitle + '</a></li>';
                        };
                    }

                    infowindow.setContent('<div class="infoWindow">' + infoContent + wikiInfo + '</div>');
                    infowindow.open(map, marker);
                },
                error: function () {
                    infowindow.setContent('<div class="infoWindow">' + infoContent + '-Error loading Wikipedia information.' + '</div>');
                    infowindow.open(map, marker);
                }
            });
        });

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
    return str.replace(/,/g, '<br>');
}

// This function displays an error when Google maps cannot be loaded
function googleMapsError() {
    var div = document.getElementById('map');
    alert('There was an error loading Google maps.');
}
