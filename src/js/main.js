/* (function($){
	'use srtict';
	
	
	
	console.log($);
	
	
	
	
})(jQuery); */

var map;
var markers = [];
var infoWindow;
var locationSelect;

function initMap() {
  var sydney = {lat: -33.863276, lng: 151.107977};
  map = new google.maps.Map(document.getElementById('map'), {
	center: sydney,
	zoom: 11,
	mapTypeId: 'roadmap',
	mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU}
  });
  infoWindow = new google.maps.InfoWindow();

  searchButton = document.getElementById("searchButton").onclick = searchLocations;

  locationSelect = document.getElementById("locationSelect");
  locationSelect.onchange = function() {
	var markerNum = locationSelect.options[locationSelect.selectedIndex].value;
	if (markerNum != "none"){
	  google.maps.event.trigger(markers[markerNum], 'click');
	}
  };
}

function searchLocations() {
 var address = document.getElementById("addressInput").value;
 var geocoder = new google.maps.Geocoder();
 geocoder.geocode({address: address}, function(results, status) {
   if (status == google.maps.GeocoderStatus.OK) {
	searchLocationsNear(results[0].geometry.location);
   } else {
	 alert(address + ' not found');
   }
 });
}

function clearLocations() {
 infoWindow.close();
 for (var i = 0; i < markers.length; i++) {
   markers[i].setMap(null);
 }
 markers.length = 0;

 locationSelect.innerHTML = "";
 var option = document.createElement("option");
 option.value = "none";
 option.innerHTML = "See all results:";
 locationSelect.appendChild(option);
}

function searchLocationsNearPHP(center) {
	clearLocations();

	var radius = document.getElementById('radiusSelect').value;
	var searchUrl = 'storelocator.php?lat=' + center.lat() + '&lng=' + center.lng() + '&radius=' + radius;
	downloadUrl(searchUrl, function(data) {
		var xml = parseXml(data);
		var markerNodes = xml.documentElement.getElementsByTagName("marker");
		var bounds = new google.maps.LatLngBounds();
		for (var i = 0; i < markerNodes.length; i++) {
			var id = markerNodes[i].getAttribute("id");
			var name = markerNodes[i].getAttribute("name");
			var address = markerNodes[i].getAttribute("address");
			var distance = parseFloat(markerNodes[i].getAttribute("distance"));
			var latlng = new google.maps.LatLng(
			parseFloat(markerNodes[i].getAttribute("lat")),
			parseFloat(markerNodes[i].getAttribute("lng")));

			createOption(name, distance, i);
			createMarker(latlng, name, address);
			bounds.extend(latlng);
		}
		map.fitBounds(bounds);
		locationSelect.style.visibility = "visible";
		locationSelect.onchange = function() {
			var markerNum = locationSelect.options[locationSelect.selectedIndex].value;
			google.maps.event.trigger(markers[markerNum], 'click');
		};
	});
}

function searchLocationsNear(center) {
	clearLocations();
	
	var markerNodes = getMarkers();
	var bounds = new google.maps.LatLngBounds();
	for (var i = 0; i < markerNodes.length; i++) {
		var id = markerNodes[i].id;
		var name = markerNodes[i].name;
		var address = markerNodes[i].address;
		var distance = parseFloat(markerNodes[i].distance);
		var latlng = new google.maps.LatLng(
		parseFloat(markerNodes[i].lat),
		parseFloat(markerNodes[i].lng));

		createOption(name, distance, i);
		createMarker(latlng, name, address);
		bounds.extend(latlng);
	}
	map.fitBounds(bounds);
	locationSelect.style.visibility = "visible";
	locationSelect.onchange = function() {
		var markerNum = locationSelect.options[locationSelect.selectedIndex].value;
		google.maps.event.trigger(markers[markerNum], 'click');
	};
}

function getMarkers(){
	return [
	{id:1, name:'Heir Apparel',address: "Crowea Pl, Frenchs Forest NSW 2086",lat:-33.737885,lng: 151.235260,distance:52.762480400236754},
	{id:2, name:'BeeYourself Clothing',address: "Thalia St, Hassall Grove NSW 2761",lat:-33.729752,lng: 150.836090,distance:51.30359905145628},
	{id:3, name:'Dress Code',address: "Glenview Avenue, Revesby, NSW 2212",lat:-33.949448,lng: 151.008591,distance:65.60640686758967},
	{id:4, name:'The Legacy',address: "Charlotte Ln, Chatswood NSW 2067",lat:-33.796669,lng: 151.183609,distance:56.05760641917},
	{id:5, name:'Fashiontasia',address: "Braidwood Dr, Prestons NSW 2170",lat:-33.944489,lng: 150.854706,distance:65.79696354609702},
	{id:6, name:'Trish & Tash',address: "Lincoln St, Lane Cove West NSW 2066",lat:-33.812222,lng: 151.143707,distance:56.731386263386064},
	{id:7, name:'Perfect Fit',address: "Darley Rd, Randwick NSW 2031",lat:-33.903557,lng: 151.237732,distance:63.92017421824136},
	{id:8, name:'Buena Ropa!',address: "Brodie St, Rydalmere NSW 2116",lat:-33.815521,lng: 151.026642,distance:56.37149740204364},
	{id:9, name:'Coxcomb and Lily Boutique',address: "Ferrers Rd, Horsley Park NSW 2175",lat:-33.829525,lng: 150.873764,distance:57.77872495434665},
	{id:10, name:'Moda Couture',address: "Northcote Rd, Glebe NSW 2037",lat:-33.873882,lng: 151.177460,distance:61.243992108021324}
	];	
}

function createMarker(latlng, name, address) {
  var html = "<b>" + name + "</b> <br/>" + address;
  var marker = new google.maps.Marker({
	map: map,
	position: latlng
  });
  google.maps.event.addListener(marker, 'click', function() {
	infoWindow.setContent(html);
	infoWindow.open(map, marker);
  });
  markers.push(marker);
}

function createOption(name, distance, num) {
  var option = document.createElement("option");
  option.value = num;
  option.innerHTML = name;
  locationSelect.appendChild(option);
}

function downloadUrl(url, callback) {
  var request = window.ActiveXObject ?
	  new ActiveXObject('Microsoft.XMLHTTP') :
	  new XMLHttpRequest;

  request.onreadystatechange = function() {
	if (request.readyState == 4) {
	  request.onreadystatechange = doNothing;
	  callback(request.responseText, request.status);
	}
  };

  request.open('GET', url, true);
  request.send(null);
}

function parseXml(str) {
  if (window.ActiveXObject) {
	var doc = new ActiveXObject('Microsoft.XMLDOM');
	doc.loadXML(str);
	return doc;
  } else if (window.DOMParser) {
	return (new DOMParser).parseFromString(str, 'text/xml');
  }
}


	

function doNothing() {}