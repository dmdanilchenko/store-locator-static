/* (function($){
	'use srtict';
	
	
	
	console.log($);
	
	
	
	
})(jQuery); */

var map;
var data;
var countries = [];
var cities = [];
var markers = [];
var infoWindow;
/* var locationSelect; */
var countrySelect;
var citySelect;
var boutiqueList;

function initMap() {
	
	data = getData();	
	countries = data.countries;
	
	
	var sydney = {lat: -33.863276, lng: 151.107977};
	map = new google.maps.Map(document.getElementById('map'), {
		center: sydney,
		zoom: 11,
		mapTypeId: 'roadmap',
		mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU}
	});
	infoWindow = new google.maps.InfoWindow();

	searchButton = document.getElementById("searchButton").onclick = selectByAddress;

	/* locationSelect = document.getElementById("locationSelect"); */
	countrySelect 	= document.getElementById("country-select");
	citySelect 		= document.getElementById("city-select");
	boutiqueList 	= document.getElementById("boutique-list");
	
	/*   locationSelect.onchange = function() {
	var markerNum = locationSelect.options[locationSelect.selectedIndex].value;
	if (markerNum != "none"){
	  google.maps.event.trigger(markers[markerNum], 'click');
	}
	}; */

	$('body').on('click', '#boutique-list>li', function(){
		var markerNum = $(this).data( "id" );;
		if (markerNum != "none"){
			
			$('#boutique-list>li').each(function(){
				$(this).removeClass('active');
			});
			
			$(this).addClass('active');
			google.maps.event.trigger(markers[markerNum], 'click');
		}
	});
	
	fillCountries();
	fillTypeFilter();
	initAutocomplete();
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
	markers.length = 0;

	/* locationSelect.innerHTML = ""; */
/* 	var option = document.createElement("option");
	option.value = "none";
	option.innerHTML = "See all results:"; */
	/* locationSelect.appendChild(option); */
	
	boutiqueList.innerHTML = "";
}

function selectByAddress(){
	var addressTerm = $('#addressInput').val();
	
	
	var boutiquesByAddress = getFilteredBoutiques().filter(function(boutique){
		return boutique.address.toLowerCase().indexOf(addressTerm.toLowerCase())>=0;
	});
	
	if(boutiquesByAddress.length){
		var markerNum = boutiquesByAddress[0].id;
		if (markerNum != "none"){
			
			$('#boutique-list>li').each(function(){
				$(this).removeClass('active');
			});
			
			$('#boutique-list>li[data-id="'+markerNum+'"]').addClass('active');
			google.maps.event.trigger(markers[markerNum], 'click');
		}
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
	initAutocomplete(markerNodes);
	var bounds = new google.maps.LatLngBounds();
	
	$('.boutiques-qty .qty').html(markerNodes.length);
	
	for (var i = 0; i < markerNodes.length; i++) {
		var id = markerNodes[i].id;
		var name = markerNodes[i].name;
		var address = markerNodes[i].address;
		var distance = parseFloat(markerNodes[i].distance);
		var latlng = new google.maps.LatLng(
		parseFloat(markerNodes[i].lat),
		parseFloat(markerNodes[i].lng));

		/* createOption(name, distance, i); */
		
		createBoutiqueListItem(markerNodes[i]);
		
		createMarker(latlng, name, address);
		bounds.extend(latlng);
	}

	map.fitBounds(bounds);
	/* locationSelect.style.visibility = "visible";
	locationSelect.onchange = function() {
		var markerNum = locationSelect.options[locationSelect.selectedIndex].value;
		google.maps.event.trigger(markers[markerNum], 'click');
	}; */
}

function getData(){
	//rewrite this to get data using AJAX 
	return {
		countries:[
			{
				id: 'IT',
				name: 'Italy',
				cities: ['Rome', 'Milan']
			},
			{
				id: 'US',
				name: 'USA',
				cities: ['New York', 'Miami', 'Dallas']
			},
		],
		boutiques: [
			{id:1, country: 'US', city:'New York', type:'Etro boutique', name:'Heir Apparel',address: "Crowea Pl, Frenchs Forest NSW 2086",lat:-33.737885,lng: 151.235260,distance:52.762480400236754},
			{id:2, country: 'US', city:'New York', type:'Etro boutique', name:'BeeYourself Clothing',address: "Thalia St, Hassall Grove NSW 2761",lat:-33.729752,lng: 150.836090,distance:51.30359905145628},
			{id:3, country: 'US', city:'New York', type:'Etro outlet', name:'Dress Code',address: "Glenview Avenue, Revesby, NSW 2212",lat:-33.949448,lng: 151.008591,distance:65.60640686758967},
			{id:4, country: 'US', city:'Miami', type:'Etro boutique', name:'The Legacy',address: "Charlotte Ln, Chatswood NSW 2067",lat:-33.796669,lng: 151.183609,distance:56.05760641917},
			{id:5, country: 'US', city:'Miami', type:'Etro outlet', name:'Fashiontasia',address: "Braidwood Dr, Prestons NSW 2170",lat:-33.944489,lng: 150.854706,distance:65.79696354609702},
			{id:6, country: 'US', city:'Dallas', type:'Etro boutique', name:'Trish & Tash',address: "Lincoln St, Lane Cove West NSW 2066",lat:-33.812222,lng: 151.143707,distance:56.731386263386064},
			{id:7, country: 'IT', city:'Rome', type:'Etro outlet', name:'Perfect Fit',address: "Darley Rd, Randwick NSW 2031",lat:-33.903557,lng: 151.237732,distance:63.92017421824136},
			{id:8, country: 'IT', city:'Rome', type:'Etro boutique', name:'Buena Ropa!',address: "Brodie St, Rydalmere NSW 2116",lat:-33.815521,lng: 151.026642,distance:56.37149740204364},
			{id:9, country: 'IT', city:'Milan', type:'Etro boutique', name:'Coxcomb and Lily Boutique',address: "Ferrers Rd, Horsley Park NSW 2175",lat:-33.829525,lng: 150.873764,distance:57.77872495434665},
			{id:10, country: 'IT', city:'Milan', type:'Etro outlet', name:'Moda Couture',address: "Northcote Rd, Glebe NSW 2037",lat:-33.873882,lng: 151.177460,distance:61.243992108021324}
		]
	}
}

function getFilteredBoutiques(){
	
	var filteredBoutiques = [];
	var currentCountry 	= countrySelect.options[countrySelect.selectedIndex].value;
	var currentCity 	= citySelect.options[citySelect.selectedIndex].value;
	var selectedTypes   = [];
            $.each($("input[name='type']:checked"), function(){            
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
	});
	
	$('.filter-by-type .open').on('click', function(){
		$('.filter-by-type-popup').addClass('active');

	});
	
	$('.filter-by-type .close').on('click', function(){
		$('.filter-by-type-popup').removeClass('active');
	});
}

function initAutocomplete(filteredBoutiques){
	$( "#addressInput" ).autocomplete({
		minLength: 0,
		source: function( request, response ) {
		  // extract the last term
		  var lastTerm = request.term.toLowerCase();
		  var results = [];
		  // loop over data, seeking labels & desc
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

/* function createOption(name, distance, num) {
  var option = document.createElement("option");
  option.value = num;
  option.innerHTML = name;
  locationSelect.appendChild(option);
} */

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