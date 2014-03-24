var AppService = angular.module('polskieszlaki.services', []);

AppService.factory('App', function($q) {
  var geoLokalizacja = null;
  var params = null;
  var cache = {};
  var ostatnioPrzegladane = [];
  var maxOstatnioPrzegladane = 5;
  var psURL = "http://www.polskieszlaki.pl/app/and-polskieszlaki/";
  var back = false;
  var gaPlugin = null;
  return {
	init:function() {
	  gaPlugin = window.plugins.gaPlugin;
	  function successHandler() {
		console.log("ok");
	  }
	  function errorHandler() {
		console.log("error");
	  }
	  gaPlugin.init(successHandler, errorHandler, "UA-112643-37", 10);
	  gaPlugin.trackPage(successHandler, errorHandler, "index.html");
	},
	getPsURL: function() {
	  return psURL;
	},
	getGeoLokalizacja: function(odswiez) {
	  var deferred = $q.defer();
	  //geoLokalizacja = {x: 50.264892,y: 19.023781};
	  //deferred.resolve(geoLokalizacja);
	  //return deferred.promise;
	  if (geoLokalizacja === null || odswiez) {
		navigator.geolocation.getCurrentPosition(function(pos) {
		  geoLokalizacja = {x: pos.coords.latitude, y: pos.coords.longitude};
		  //console.log("mam: " + geoLokalizacja);
		  deferred.resolve(geoLokalizacja);
		}, function(error) {
		  //console.log("błąd", error);
		  deferred.reject("Nie potrafię określić Twojej lokalizacji")
		}, {timeout: 5000});
	  } else {
		deferred.resolve(geoLokalizacja);
	  }
	  return deferred.promise;
	},
	setCache: function(zm, wart) {
	  cache[zm] = wart;
	},
	getCache: function(zm) {
	  return cache[zm];
	},
	setParams: function(p) {
	  params = p;
	},
	getParams: function() {
	  return params;
	},
	clearParams: function() {
	  params = null;
	},
	setBack: function(state) {
	  console.log(state);
	  back = state;
	  console.log(back);
	},
	getBack: function() {
	  return back;
	},
	dodajOstatnioPrzegladane: function(atrakcja) {
	  var doSesji = {
		'id': atrakcja.id,
		"tytul": atrakcja.tytul,
	  };
	  for (var i in ostatnioPrzegladane) {
		if (ostatnioPrzegladane[i].id == atrakcja.id) {
		  ostatnioPrzegladane.splice(i, 1);
		}
	  }
	  if (ostatnioPrzegladane.length > maxOstatnioPrzegladane - 1) {
		ostatnioPrzegladane.splice(maxOstatnioPrzegladane - 1, (ostatnioPrzegladane.length - maxOstatnioPrzegladane + 1));
	  }
	  ostatnioPrzegladane.unshift(doSesji);
	  window.localStorage.ostatnioPrzegladane = angular.toJson(ostatnioPrzegladane);
	  //console.log(window.localStorage.ostatnioPrzegladane);
	},
	getOstatnioPrzegladane: function() {
	  if (ostatnioPrzegladane.length == 0)
		this.LSGetOstatnioPrzegladane();
	  return ostatnioPrzegladane;
	},
	LSGetOstatnioPrzegladane: function() {
	  if (window.localStorage.ostatnioPrzegladane)
		ostatnioPrzegladane = angular.fromJson(window.localStorage.ostatnioPrzegladane);
	  //console.log(ostatnioPrzegladane);
	},
	policzDystans: function(x, y, x2, y2) {
	  //console.log("liczę Dystans");
	  if (!x || !y)
		return false;
	  var p1 = new LatLon(x, y);
	  if (!x2 && !y2) {
		var deferred = $q.defer();
		this.getGeoLokalizacja().then(function(geo) {
		  var p2 = new LatLon(geo.x, geo.y);
		  var km = p1.distanceTo(p2);
		  km = (Math.round(km * 10) / 10);
		  deferred.resolve(km);
		}, function() {
		  deferred.reject("Nie potrafię określić Twojej lokalizacji");
		});
		return deferred.promise;
	  } else {
		var p2 = new LatLon(x2, y2);
		var km = p1.distanceTo(p2);
		km = (Math.round(km * 10) / 10);
		return km;
	  }
	},
	okreslKierunek: function(x, y, x2, y2) {
	  if (!x || !y)
		return false;
	  var p1 = new LatLon(x, y);
	  if (!x2 && !y2) {
		var deferred = $q.defer();
		this.getGeoLokalizacja().then(function(geo) {
		  var p2 = new LatLon(geo.x, geo.y);
		  var stopnie = p2.bearingTo(p1);
		  deferred.resolve(stopnie);
		}, function() {
		  deferred.reject("Nie potrafię określić Twojej lokalizacji");
		});
		return deferred.promise;
	  } else {
		var p2 = new LatLon(x2, y2);
		var stopnie = p2.bearingTo(p1);
		return stopnie;
	  }
	}
  };
});

AppService.factory('Uzytkownik', function(App, $http, $q) {
  daneUzytkownika = null;
  return {
	zalogowany: function() {
	  //console.log(this.daneUzytkownika.id_uzytkownika);
	  if (this.daneUzytkownika && this.daneUzytkownika.id_uzytkownika)
		return true;
	  else
		return false;
	},
	initSprawdzZalogowanie: function() {
	  if (window.localStorage.uzytkownik)
		this.daneUzytkownika = angular.fromJson(window.localStorage.uzytkownik);
	},
	zapiszUzytkownika: function(dane) {
	  this.daneUzytkownika = dane;
	  window.localStorage.uzytkownik = angular.toJson(this.daneUzytkownika);
	},
	wylogujUzytkownika: function() {
	  this.daneUzytkownika = null;
	  window.localStorage.removeItem('uzytkownik');
	},
	tokenDoSerwera: function() {
	  if (this.zalogowany()) {
		return {id_uzytkownika: this.daneUzytkownika.id_uzytkownika, haslo_md5: this.daneUzytkownika.haslo_md5};
	  } else
		return false;
	},
	pobierzOcene: function(id, rodzaj) {
	  if (this.zalogowany()) {
		if (this.daneUzytkownika.oceny && this.daneUzytkownika.oceny[rodzaj] && this.daneUzytkownika.oceny[rodzaj][id])
		  return this.daneUzytkownika.oceny[rodzaj][id].ocena;
		else
		  return false;
	  } else
		return false;
	},
	wyslijOcene: function(id, ocena) {
	  if (this.zalogowany()) {
		var dane = this.tokenDoSerwera();
		dane.func = "ocena";
		dane.id = id;
		dane.rodzaj = "atr";
		dane.ocena = ocena;
		return this.wyslijFuncUzytkownika(dane);
	  }
	},
	pobierzChceWidziec: function(id, rodzaj) {
	  if (this.zalogowany()) {
		if (this.daneUzytkownika.miejsca && this.daneUzytkownika.miejsca[rodzaj] && this.daneUzytkownika.miejsca[rodzaj].do_odwiedzenia[id])
		  return true;
		else
		  return false;
	  } else
		return false;
	},
	wyslijChceWidziec: function(id, usun) {
	  if (this.zalogowany()) {
		var dane = this.tokenDoSerwera();
		dane.func = "miejsce";
		dane.id = id;
		dane.rodzaj = "atr";
		dane.typ = 3;
		dane.usun = usun;
		return this.wyslijFuncUzytkownika(dane);
	  }
	},
	wyslijFuncUzytkownika: function(dane) {
	  var obj = this;
	  var deferred = $q.defer();
	  $http({
		method: "POST",
		url: App.getPsURL() + "uzytkownik.php",
		data: dane
	  }).success(function(data) {
		if (data.oceny)
		  obj.daneUzytkownika.oceny = data.oceny;
		if (data.miejsca)
		  obj.daneUzytkownika.miejsca = data.miejsca;
		obj.zapiszUzytkownika(obj.daneUzytkownika);
		deferred.resolve(data);
	  }).error(function() {
		deferred.reject("Nie potrafię określić Twojej lokalizacji");
	  });
	  return deferred.promise;
	}
  };
});

AppService.factory('MapaIndex', function(App, $state, $ionicPopup) {
  //var map = null;
  //var poczX = 51.9874;
  //var poczY = 19.0162;
  //var poczZoom = 5;
  //var markerDom = null;
  var geocoder = null;

  return {
	/*
	 init: function() {
	 var mapOptions = {
	 center: new google.maps.LatLng(poczX, poczY),
	 zoom: poczZoom,
	 mapTypeId: google.maps.MapTypeId.ROADMAP,
	 mapTypeControl: false,
	 streetViewControl: false
	 };
	 map = new google.maps.Map(document.getElementById("google_map"), mapOptions);
	 
	 // Stop the side bar from dragging when mousedown/tapdown on the map
	 google.maps.event.addDomListener(document.getElementById("google_map"), 'mousedown', function(e) {
	 e.preventDefault();
	 return false;
	 });
	 google.maps.event.addListener(map, 'click', function(event) {
	 App.setParams({
	 "x": event.latLng.lat(),
	 "y": event.latLng.lng()
	 });
	 $state.go('ps.atrakcje');
	 });
	 
	 this.zaznaczDom();
	 },
	 zaznaczDom: function() {
	 App.getGeoLokalizacja().then(function(pos) {
	 console.log(pos);
	 var point = new google.maps.LatLng(pos.x, pos.y);
	 var image = new google.maps.MarkerImage(
	 'img/red-dot.png',
	 null, // size
	 null, // origin
	 new google.maps.Point(8, 8), // anchor (move to center of marker)
	 new google.maps.Size(16, 16) // scaled size (required for Retina display icon)
	 );
	 markerDom = new google.maps.Marker({
	 flat: true,
	 icon: image,
	 map: map,
	 optimized: false,
	 position: point,
	 title: 'dom',
	 visible: true
	 });
	 });
	 },
	 */
	wyszukajNaMapie: function(miejsce) {
	  geocoder = new google.maps.Geocoder();
	  var adres = miejsce + ", pl";
	  geocoder.geocode({
		'address': adres
	  }, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
		  App.setParams({
			"x": results[0].geometry.location.lat(),
			"y": results[0].geometry.location.lng()
		  });
		  $state.go('ps.atrakcje');
		} else {
		  //alert("Nie znaleziono takiego miejsca");
		  $ionicPopup.alert({
			title: 'Nie znalazłem takiego miejsca',
			content: 'Wpisz nazwę innej miejscowości np. większego miasta w pobliżu'
		  });
		}
	  });
	}
  };
});

AppService.factory('MapaLista', function(App, $state) {
  var map = null;
  var poczX = 51.9874;
  var poczY = 19.0162;
  var poczZoom = 5;
  var markery = [];
  var granice = null;
  var chmurka = null;
  var maksymalna = false;

  return {
	init: function() {
	  var mapOptions = {
		center: new google.maps.LatLng(poczX, poczY),
		zoom: poczZoom,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		mapTypeControl: false,
		zoomControl: false,
		panControl: false,
		streetViewControl: false
	  };
	  map = new google.maps.Map(document.getElementById("lista_google_map"), mapOptions);
//	  var controlDiv = document.createElement('div');
//	  controlDiv.innerHTML = '<button id="lista_google_map_max_min" class="button icon ion-arrow-expand"></button>';
//
//	  google.maps.event.addDomListener(controlDiv, 'click', function() {
//		var m = document.getElementById("lista_google_map");
//		var b = document.getElementById("lista_google_map_max_min");
//		var ls = document.getElementById("lista_atrakcji");
//		if (!maksymalna) {
//		  //document.getElement("scroll").style["height"]="100%";
//		  ls.style['display'] = "none";
//		  b.classList.add('ion-arrow-shrink');
//		  m.classList.add('caly_ekran');
//		  m.style['position'] = "absolute";
//		  maksymalna = true;
//		} else {
//		  //document.getElementsByClassName("scroll").style["height"]="auto";
//		  ls.style['display'] = "block";
//		  b.classList.remove('ion-arrow-shrink')
//		  m.classList.remove('caly_ekran');
//		  m.style['position'] = "relative";
//		  maksymalna = false;
//		}
//		google.maps.event.trigger(map, 'resize');
//		if (granice) {
//		  map.fitBounds(granice);
//		}
//	  });
//	  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
	  var plusZoomDiv = document.createElement('div');
	  plusZoomDiv.innerHTML = '<button class="button icon ion-plus-round"></button>';
	  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(plusZoomDiv);
	  google.maps.event.addDomListener(plusZoomDiv, 'click', function() {
		map.setZoom(map.getZoom() + 1);
	  });
	  var minusZoomDiv = document.createElement('div');
	  minusZoomDiv.innerHTML = '<button class="button icon ion-minus-round"></button>';
	  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(minusZoomDiv);
	  google.maps.event.addDomListener(minusZoomDiv, 'click', function() {
		map.setZoom(map.getZoom() - 1);
	  });

	  // Stop the side bar from dragging when mousedown/tapdown on the map
	  google.maps.event.addDomListener(document.getElementById("lista_google_map"), 'mousedown', function(e) {
		e.preventDefault();
		return false;
	  });

	  this.zaznaczDom();
	  //this.odswiezWidok();
	},
	odswiezWidok: function() {
	  google.maps.event.trigger(map, 'resize');
	},
	zaznaczDom: function() {
	  App.getGeoLokalizacja().then(function(pos) {
		var point = new google.maps.LatLng(pos.x, pos.y);
		var image = new google.maps.MarkerImage(
				'img/pin-gps.png',
				null, // size
				null, // origin
				new google.maps.Point(15, 15), // anchor (move to center of marker)
				new google.maps.Size(30, 30) // scaled size (required for Retina display icon)
				);
		var markerDom = new google.maps.Marker({
		  flat: true,
		  icon: image,
		  map: map,
		  optimized: false,
		  position: point,
		  title: 'GPS',
		  visible: true,
		  zIndex: 200,
		});
		google.maps.event.addListener(markerDom, 'click', function() {
		  console.log("Dom");
		});
	  });
	},
	zaznaczPunkt: function(x, y) {
	  var point = new google.maps.LatLng(x, y);
	  var image = new google.maps.MarkerImage(
			  'img/pin-blue.png',
			  null, // size
			  null, // origin
			  new google.maps.Point(12, 38), // anchor (move to center of marker)
			  new google.maps.Size(24, 38) // scaled size (required for Retina display icon)
			  );
	  var marker = new google.maps.Marker({
		flat: true,
		icon: image,
		map: map,
		optimized: false,
		position: point,
		title: 'Marker',
		visible: true,
		zIndex: 300,
	  });
	},
	pokazAtrakcjeNaMapie: function(atrakcje) {
	  if (markery) {
		for (var i in markery) {
		  markery[i].setMap(null);
		}
		markery = [];
	  }
	  chmurka = new google.maps.InfoWindow();
	  //console.log("Atrakcje",atrakcje);
	  if (atrakcje) {
		granice = new google.maps.LatLngBounds();
		for (a in atrakcje) {
		  var atrakcja = atrakcje[a];
		  if (atrakcja.x && atrakcja.y) {
			var point = new google.maps.LatLng(atrakcja.x, atrakcja.y);
			var chmurkaText = '<a href="#/ps/atrakcja/' + atrakcja.id + '" class="mapa_chmurka">' + atrakcja.tytul + '</a>';
			var div = document.createElement('div');
			div.className = "moj-marker";
			var s = '<img src="' + atrakcja.zdjecia.mapa + '">';
			div.innerHTML = s;

			var image = {
			  url: "img/marker.png",
			  anchor: new google.maps.Point(28, 28),
			};
			var marker = new MarkerWithLabel({
			  position: point,
			  map: map,
			  icon: image,
			  draggable: false,
			  labelContent: div,
			  labelAnchor: new google.maps.Point(28, 28),
			  labelClass: "marker-label", // the CSS class for the label
			  chmurka: chmurkaText,
			  zIndex: 10,
			});
			//console.log(marker);
			google.maps.event.addListener(marker, 'click', function() {
			  //console.log("marker");
			  chmurka.setContent(this.chmurka);
			  chmurka.open(map, this);
			});
			granice.extend(point);
		  }
		  markery.push(marker);
		}
		if (granice)
		  map.fitBounds(granice);
	  }
	}
  };
});
