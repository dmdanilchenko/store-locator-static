var map;
var directions;
var data;
var countries = [];
var cities = [];
var markers = [];
var infoWindow;
var countrySelect;
var citySelect;
var boutiqueList;

function initMap() {
	
	data = getData();	
	countries = data.countries;
	
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 11,
		mapTypeId: 'roadmap',
		mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU}
	});
	infoWindow = new google.maps.InfoWindow();
	
	searchButton = document.getElementById("searchButton").onclick = selectByAddress;
	countrySelect 	= document.getElementById("country-select");
	citySelect 		= document.getElementById("city-select");
	boutiqueList 	= document.getElementById("boutique-list");

	$('body').on('click', '#boutique-list>li', function(){
		var markerId = $(this).data( "id" );
		if (markerId != "none"){
			
			var foundMarkers = markers.filter(function(marker){
				return marker.id === markerId;
			});
			
			if(foundMarkers.length){
				google.maps.event.trigger(foundMarkers[0], 'click');
			}

		}
	});
	
	fillCountries();
	fillTypeFilter();
	initAddressAutocomplete();
	
	$('.build-route').on('click', function(){
		directionTo($('#popup-content .address').html());
	});
	
	$('#navigatorButton').on('click', function(){
		directionTo($('#addressInput').val());
	});
	
	directions = new AutocompleteDirectionsHandler(map);
}

function searchLocations() {
	var address = document.getElementById("addressInput").value;
	var geocoder = new google.maps.Geocoder();
	
	geocoder.geocode({address: address}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			searchLocationsNear(results[0].geometry.location);
		} else {
			searchLocationsNear();
		}
	});
}

function clearLocations() {
	infoWindow.close();
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
	directions.directionsDisplay.set('directions', null);
	markers.length = 0;
	boutiqueList.innerHTML = "";
	$('#popup-content').removeClass('active');
}

function selectByAddress(){
	var addressTerm = $('#addressInput').val();
	var boutiquesByAddress = getFilteredBoutiques().filter(function(boutique){
		return boutique.address.toLowerCase().indexOf(addressTerm.toLowerCase())>=0;
	});
	
	if(boutiquesByAddress.length){
		var markerId = boutiquesByAddress[0].id;
		if (markerId != "none"){

			var foundMarkers = markers.filter(function(marker){
				return marker.id === markerId;
			});
			
			if(foundMarkers.length){
				google.maps.event.trigger(foundMarkers[0], 'click');
			}
		}
	}
}

function fillPopup(id){
	
	var currentBoutique = data.boutiques.filter(function(boutique){
		return boutique.id === id;
	});
	
	if(currentBoutique.length){
		$('#popup-content .name').html(currentBoutique[0].name);
		$('#popup-content .address').html(currentBoutique[0].address);
		$('#popup-content .contacts p').html(currentBoutique[0].contacts);
		$('#popup-content .opening-time p').html(currentBoutique[0].openingTime);
		$('#popup-content .available-collections p').html(currentBoutique[0].availableCollections);
		$('#popup-content').addClass('active');
	}
}

function directionTo(destination){
	
	directions.directionsDisplay.set('directions', null);
	
	$('#map .controls').addClass('visible');
	
	$('#map #destination-input').val(destination);

	if($('#map #origin-input').val()===''){
		
		// Try HTML5 geolocation.
		if (navigator.geolocation) {
		  navigator.geolocation.getCurrentPosition(function(position) {
			var pos = {
			  lat: position.coords.latitude,
			  lng: position.coords.longitude
			};

			var latlng = {lat: position.coords.latitude, lng: position.coords.longitude};
			var geocoder = new google.maps.Geocoder();
			
			geocoder.geocode({'location': latlng}, function(results, status) {
			  if (status === 'OK') {
				if (results[0]) {
				  var marker = new google.maps.Marker({
					position: latlng,
					map: map
				  });
				  $('#map #origin-input').val(results[0].formatted_address);
				  directions.route();
				  
				} else {
				  window.alert('No results found');
				}
			  } else {
				window.alert('Geocoder failed due to: ' + status);
			  }
			});
			
			
		  }, function() {
			handleLocationError(true, infoWindow, map.getCenter());
		  });
		} else {
		  // Browser doesn't support Geolocation
		  handleLocationError(false, infoWindow, map.getCenter());
		}
		
	}else{
		directions.route();
	}
	

}

/* function searchLocationsNearPHP(center) {
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
} */

function searchLocationsNear(center) {
	clearLocations();
	
	var markerNodes = getFilteredBoutiques();
	initAddressAutocomplete(markerNodes);
	var bounds = new google.maps.LatLngBounds();
	
	$('.boutiques-qty .qty').html(markerNodes.length);
	
	for (var i = 0; i < markerNodes.length; i++) {
		var id = markerNodes[i].id;
		var name = markerNodes[i].name;
		var address = markerNodes[i].address;
		var latlng = new google.maps.LatLng(
		parseFloat(markerNodes[i].lat),
		parseFloat(markerNodes[i].lng));
		
		createBoutiqueListItem(markerNodes[i]);
		
		createMarker(latlng, markerNodes[i]);
		bounds.extend(latlng);
	}

	map.fitBounds(bounds);
}

function getData(){
	//rewrite this to get data using AJAX 
	return {
		countries:[
			{
				id: 'IT',
				name: 'Italy',
				cities: ['Rome', 'Milan', 'Verona']
			},
			{
				id: 'AU',
				name: 'Australia',
				cities: ['Sydney']
			},
		],
		boutiques: [
			{id:1, country: 'AU', city:'Sydney', type:'Etro boutique', name:'Heir Apparel',address: "Crowea Pl, Frenchs Forest NSW 2086", contacts: '+3 999 1234567',openingTime:'Lun-Dom 10:00 - 19:00',availableCollections:'Collezione Donna<br>Collezione Uomo<br>Accessori', lat:-33.737885,lng: 151.235260},
			{id:2, country: 'AU', city:'Sydney', type:'Etro boutique', name:'BeeYourself Clothing',address: "Thalia St, Hassall Grove NSW 2761",contacts: '+3 999 1234567',openingTime:'Lun-Dom 10:00 - 18:00',availableCollections:'Collezione Donna<br>Collezione Uomo1<br>Accessori',lat:-33.729752,lng: 150.836090},
			{id:3, country: 'AU', city:'Sydney', type:'Etro outlet', name:'Dress Code',address: "Glenview Avenue, Revesby, NSW 2212",contacts: '+3 099 1234567',openingTime:'Lun-Dom 10:00 - 17:00',availableCollections:'Collezione Donna<br>Collezione Uomo2<br>Accessori',lat:-33.949448,lng: 151.008591},
			{id:4, country: 'AU', city:'Sydney', type:'Etro boutique', name:'The Legacy',address: "Charlotte Ln, Chatswood NSW 2067",contacts: '+3 222 1233321',openingTime:'Lun-Dom 10:00 - 16:00',availableCollections:'Collezione Donna<br>Collezione Uomo3<br>Accessori',lat:-33.796669,lng: 151.183609},
			{id:5, country: 'AU', city:'Sydney', type:'Etro outlet', name:'Fashiontasia',address: "Braidwood Dr, Prestons NSW 2170",contacts: '+3 999 999999',openingTime:'Lun-Dom 10:00 - 15:00',availableCollections:'Collezione Donna<br>Collezione Uomo4<br>Accessori',lat:-33.944489,lng: 150.854706},
			{id:6, country: 'AU', city:'Sydney', type:'Etro boutique', name:'Trish & Tash',address: "Lincoln St, Lane Cove West NSW 2066",contacts: '+3 888 8888888',openingTime:'Lun-Dom 11:00 - 19:00',availableCollections:'Collezione Donna<br>Collezione Uomo5<br>Accessori',lat:-33.812222,lng: 151.143707},
			{id:7, country: 'IT', city:'Verona', type:'Etro boutique', name:'Etro Boutique',address: "Corso Porta Borsari 49",contacts: '+3 778 77777777',openingTime:'Lun-Dom 12:00 - 19:00',availableCollections:'Collezione Donna<br>Collezione Uomo6<br>Accessori',lat:45.4421667,lng: 10.9919822},
			{id:8, country: 'IT', city:'Rome', type:'Etro boutique', name:'Etro Boutique',address: "Via del Babuino 102",contacts: '+2 234 23423423',openingTime:'Lun-Dom 13:00 - 19:00',availableCollections:'Collezione Donna<br>Collezione Uomo7<br>Accessori',lat:41.9066435,lng: 12.4783199},
			{id:9, country: 'IT', city:'Rome', type:'Etro boutique', name:'Test store',address: "Rione III Colonna",contacts: '+1 111 4567890',openingTime:'Lun-Dom 14:00 - 19:00',availableCollections:'Collezione Donna<br>Collezione Uomo8<br>Accessori',lat:41.890251,lng: 12.492373},
			{id:10, country: 'IT', city:'Milan', type:'Etro boutique', name:'Etro Boutique',address: "Via Monte Napoleone 5",contacts: '+9 234 2342344',openingTime:'Lun-Dom 8:00 - 22:00',availableCollections:'Collezione Donna<br>Collezione Uomo12<br>Accessori',lat:45.4676552,lng: 9.1932949},
			{id:11, country: 'IT', city:'Milan', type:'Etro boutique', name:'Etro Boutique',address: "Aeroporto Malpensa 2000, T1",contacts: '+8 666 4444444',openingTime:'Lun-Dom 9:00 - 23:00',availableCollections:'Collezione Donna<br>Collezione Uomo15<br>Accessori',lat:45.6364481,lng: 8.7083114}
		]
	}
}

function getFilteredBoutiques(){
	
	var filteredBoutiques = [];
	var currentCountry 	= countrySelect.options[countrySelect.selectedIndex].value;
	var currentCity 	= citySelect.options[citySelect.selectedIndex].value;
	var selectedTypes   = [];
            $.each($(".filter-by-type input[name='type']:checked"), function(){            
                selectedTypes.push($(this).val());
            });
	

	if(selectedTypes.length){
		
		if(currentCountry === 'all'&&currentCity === 'all'){
			filteredBoutiques = data.boutiques.filter(function(boutique){
				return selectedTypes.indexOf(boutique.type)>=0;
			});
		}else if(currentCity === 'all'){
			filteredBoutiques = data.boutiques.filter(function(boutique){
				return boutique.country === currentCountry && selectedTypes.indexOf(boutique.type)>=0;
			});
		}else{	
			filteredBoutiques = data.boutiques.filter(function(boutique){
				return boutique.country === currentCountry && boutique.city === currentCity && selectedTypes.indexOf(boutique.type)>=0;
			});
		}
		
	}else{	
	
		if(currentCountry === 'all'&&currentCity === 'all'){
			filteredBoutiques = data.boutiques.filter(function(boutique){
				return true;
			});
		}else if(currentCity === 'all'){
			filteredBoutiques = data.boutiques.filter(function(boutique){
				return boutique.country === currentCountry;
			});
		}else{	
			filteredBoutiques = data.boutiques.filter(function(boutique){
				return boutique.country === currentCountry&&boutique.city === currentCity;
			});
		}
	}
	
	return filteredBoutiques;
}

function fillCountries(){
	
	var option = document.createElement("option");
	option.value = 'all';
	option.innerHTML = 'Select your Country';
	countrySelect.appendChild(option); 
	
	for(var i = 0; i < countries.length; i++){
		
		  var option = document.createElement("option");
		  option.value = countries[i].id;
		  option.innerHTML = countries[i].name;
		  countrySelect.appendChild(option);
	}
	
	fillCities(countrySelect.options[countrySelect.selectedIndex].value);
	
	$('#country-select').on('change', function(){
		fillCities(countrySelect.options[countrySelect.selectedIndex].value);
	});
	
}

function fillCities(countryId){
	
	citySelect.innerHTML = "";
	
	var option = document.createElement("option");
	option.value = 'all';
	option.innerHTML = 'Select your City';
	citySelect.appendChild(option);
	
	var currentCountry = countries.filter(function(country){
		return country.id === countryId;
	});
		
	if(currentCountry.length){
		
		for(var i = 0; i < currentCountry[0].cities.length; i++){
			option = document.createElement("option");
			option.value = currentCountry[0].cities[i];
			option.innerHTML = currentCountry[0].cities[i];
			citySelect.appendChild(option);
		}
	}
	
	searchLocations();
	
	$('#city-select').on('change', function(){
		searchLocations();
	});
}

function fillTypeFilter(){
	
	var types = [];
	for(var i=0; i<data.boutiques.length; i++){
		types.push(data.boutiques[i].type);
	}
	var uniqueTypes = types.filter(function(item, j, ar){ return ar.indexOf(item) === j; });
	
	for(var k=0; k<uniqueTypes.length; k++){
		var li = document.createElement("li");
		li.innerHTML = '<label><input type="checkbox" name="type" value="'+uniqueTypes[k]+'">'+uniqueTypes[k]+'</label>';
		$('.filter-by-type ul').append(li);
	}

	$('.filter-by-type .apply').on('click', function(){
		searchLocations();
		$('.filter-by-type-popup').removeClass('active');
		$('.search-result-box').removeClass('overlay');
	});
	
	$('.filter-by-type .open').on('click', function(){
		$('.filter-by-type-popup').toggleClass('active');
		$('.search-result-box').toggleClass('overlay');
        document.getElementById('tab-list').click();
	});
	
	$('.filter-by-type .close').on('click', function(){
		$('.filter-by-type-popup').removeClass('active');
		$('.search-result-box').removeClass('overlay');
	});
}

function initAddressAutocomplete(filteredBoutiques){
	$( "#addressInput" ).autocomplete({
		minLength: 0,
		source: function( request, response ) {
		  var lastTerm = request.term.toLowerCase();
		  var results = [];
		  $.each(filteredBoutiques, function(k, v){
			if(v.address.toLowerCase().indexOf(lastTerm) >= 0){
			  results.push(v);
			}
		  });
		  response(results);
		},
		select: function( event, ui ) {
			$( "#addressInput" ).val( ui.item.address );
			selectByAddress();
			return false;
		}
    })
    .autocomplete( "instance" )._renderItem = function( ul, item ) {
		return $( "<li>" )
			.append( "<div>" + item.name + "<br>" + item.address + "</div>" )
			.appendTo( ul );
    };
}

function createMarker(latlng, markerNode) {
	var html = "<b>" + markerNode.name + "</b> <br/>" + markerNode.address;
	var marker = new google.maps.Marker({
		map: map,
		position: latlng,
		icon: 'src/icons/marker-'+markerNode.type.toLowerCase().replace(' ', '-')+'.png',
		type: markerNode.type.toLowerCase().replace(' ', '-'),
		id: markerNode.id
	});
	google.maps.event.addListener(marker, 'click', function() {
		infoWindow.setContent(html);
		infoWindow.open(map, marker);
		
		for(var i=0;i<markers.length;i++){
			markers[i].setIcon('src/icons/marker-'+markers[i].type+'.png'); 
		}
		
		marker.setIcon('src/icons/marker-'+markerNode.type.toLowerCase().replace(' ', '-')+'-active.png'); 
		
		var markerId = markerNode.id;
		if (markerId != "none"){
			
			$('#boutique-list>li').each(function(){
				$(this).removeClass('active');
			});
			$('#boutique-list>li[data-id="'+markerId+'"]').addClass('active');
			$(this).addClass('active');
			
			fillPopup(markerId);
		}
	});
	markers.push(marker);
}

function createBoutiqueListItem(markerNode){
	
	var li = document.createElement("li");
	li.innerHTML = '<a href="#">'+
						'<div class="name">'+markerNode.name+'</div>'+
						'<div class="address">'+markerNode.address+'</div>'+
					'</a>';
									
	li.classList.add(markerNode.type.toLowerCase().replace(' ', '-'));				
	li.dataset.id = markerNode.id;
	boutiqueList.appendChild(li);
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


/**
 * @constructor
 */
function AutocompleteDirectionsHandler(map) {
	this.map = map;
	this.originPlaceId = null;
	this.destinationPlaceId = null;
	this.travelMode = 'WALKING';
	this.directionsService = new google.maps.DirectionsService;
	this.directionsDisplay = new google.maps.DirectionsRenderer;
	this.directionsDisplay.setMap(map);

	var originInput = document.getElementById('origin-input');
	var destinationInput = document.getElementById('destination-input');
	var modeSelector = document.getElementById('mode-selector');

	var originAutocomplete = new google.maps.places.Autocomplete(originInput);
	// Specify just the place data fields that you need.
	originAutocomplete.setFields(['place_id']);

	var destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput);
	// Specify just the place data fields that you need.
	destinationAutocomplete.setFields(['place_id']);

	this.setupClickListener('changemode-walking', 'WALKING');
	this.setupClickListener('changemode-transit', 'TRANSIT');
	this.setupClickListener('changemode-driving', 'DRIVING');

	this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
	this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');

	this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
	this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(
	  destinationInput);
	this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(modeSelector);
}

// Sets a listener on a radio button to change the filter type on Places
// Autocomplete.
AutocompleteDirectionsHandler.prototype.setupClickListener = function(id, mode) {
	var radioButton = document.getElementById(id);
	var me = this;

	radioButton.addEventListener('click', function() {
		me.travelMode = mode;
		me.route();
	});
};

AutocompleteDirectionsHandler.prototype.setupPlaceChangedListener = function(autocomplete, mode) {
  var me = this;
  autocomplete.bindTo('bounds', this.map);

  autocomplete.addListener('place_changed', function() {
    var place = autocomplete.getPlace();

    if (!place.place_id) {
      window.alert('Please select an option from the dropdown list.');
      return;
    }
    if (mode === 'ORIG') {
      me.originPlaceId = place.place_id;
    } else {
      me.destinationPlaceId = place.place_id;
    }
    me.route();
  });
};

AutocompleteDirectionsHandler.prototype.route = function() {
  if (!this.originPlaceId || !this.destinationPlaceId) {
    this.routeUsingStrings($('#map #origin-input').val(), $('#map #destination-input').val());
	return;
  }
  var me = this;

  this.directionsService.route(
      {
        origin: {'placeId': this.originPlaceId},
        destination: {'placeId': this.destinationPlaceId},
        travelMode: this.travelMode
      },
      function(response, status) {
        if (status === 'OK') {
          me.directionsDisplay.setDirections(response);
        } else {
          window.alert('Directions request failed due to ' + status);
        }
      });
};

AutocompleteDirectionsHandler.prototype.routeUsingStrings = function(origin, destination) {
  if (!origin || !destination) {
    return;
  }
  var me = this;

  this.directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: this.travelMode
      },
      function(response, status) {
        if (status === 'OK') {
          me.directionsDisplay.setDirections(response);
        } else {
          window.alert('Directions request failed due to ' + status);
        }
      });
};

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}