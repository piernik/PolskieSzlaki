var AppCtrl = angular.module('polskieszlaki.controllers', []);

/**
 * Atrakcja
 */
AppCtrl.controller('atrakcjaCtrl', function($scope, App, Uzytkownik, $http, $stateParams, $state, $ionicPopup, $ionicLoading) {
  $scope.oceny = [
	{id: 5, title: 'rewelacja'},
	{id: 4, title: 'świetne'},
	{id: 3, title: 'fajne'},
	{id: 2, title: 'średnie'},
	{id: 1, title: 'kiepskie'}
  ];
  $scope.atrakcjeWPoblizu = function() {
	App.setParams({
	  x: $scope.atrakcja.x,
	  y: $scope.atrakcja.y
	});
	$state.go('ps.atrakcje');
  };
  $scope.widzialem = function() {
	if ($scope.sprawdzZalogowanie()) {
	  $scope.pokazPopupWidzialem();
	} else {
	  $scope.modalLogowanie.show();
	}
  };
  $scope.pokazPopupWidzialem = function() {
	$ionicPopup.show({
	  templateUrl: 'ocena-uzytkownika.html',
	  title: 'Oceń atrakcję',
	  scope: $scope,
	  buttons: [{
		  text: 'Anuluj',
		  type: 'button',
		  onTap: function(e) {
			$scope.ustawOcenyMiejscaUzytkownika();
			return e.preventDefault();
		  }
		}, {
		  text: 'OK',
		  type: 'button-positive',
		  onTap: function(e) {
			return $scope.atrakcja.ocenaUzytkownika;
		  }
		}]
	}).then(function(ocena) {
	  if (ocena) {
		//console.log(ocena);
		Uzytkownik.wyslijOcene($scope.atrakcja.id, ocena).then(function() {
		  $scope.ustawOcenyMiejscaUzytkownika();
		});
	  }
	});
  };
  $scope.chceWidziec = function() {
	if ($scope.sprawdzZalogowanie()) {
	  if ($scope.atrakcja.chceWidziec) {
		$scope.atrakcja.chceWidziec = false;
		Uzytkownik.wyslijChceWidziec($scope.atrakcja.id, 1).then(function() {
		  $scope.ustawOcenyMiejscaUzytkownika();
		});
	  } else {
		$scope.atrakcja.chceWidziec = true;
		Uzytkownik.wyslijChceWidziec($scope.atrakcja.id).then(function() {
		  $scope.ustawOcenyMiejscaUzytkownika();
		});
	  }
	} else {
	  $scope.modalLogowanie.show();
	}
  };
  $scope.ustawOcenyMiejscaUzytkownika = function() {
	if ($scope.atrakcja) {
	  $scope.atrakcja.ocenaUzytkownika = Uzytkownik.pobierzOcene($scope.atrakcja.id, 'atr');
	  $scope.atrakcja.chceWidziec = Uzytkownik.pobierzChceWidziec($scope.atrakcja.id, 'atr');
	}
  };
  $scope.$watch("zalogowany", function() {
	$scope.ustawOcenyMiejscaUzytkownika();
  });

  $scope.loading = $ionicLoading.show({
	content: '<i class=" ion-loading-c"></i><br>Pobieram dane atrakcji...',
	showBackdrop: false
  });
  $http({
	method: "POST",
	url: App.getPsURL() + "atrakcje.php",
	data: {id_atrakcji: $stateParams.idAtrakcji}
  }).success(function(data) {
	$scope.loading.hide();
	$scope.atrakcja = data;
	$scope.ustawOcenyMiejscaUzytkownika();
	if ($scope.atrakcja.x && $scope.atrakcja.y) {
	  App.policzDystans($scope.atrakcja.x, $scope.atrakcja.y).then(function(km) {
		$scope.atrakcja.odleglosc = km;
	  });
	  App.okreslKierunek($scope.atrakcja.x, $scope.atrakcja.y).then(function(stopnie) {
		$scope.atrakcja.stopnie = stopnie;
	  });
	}
	if (!$scope.atrakcja.zdjecie)
	  $scope.atrakcja.zdjecie = "img/brak_zdjecia.jpg";
	App.dodajOstatnioPrzegladane(data);
  });
});
/**
 * Lista atrakcji
 */
AppCtrl.controller('atrakcjeCtrl', function($scope, App, MapaLista, Uzytkownik, $http, $ionicLoading, $timeout, $ionicPopup) {
  var params = App.getParams();
  $scope.rodzaje = [
	{id: 0, nazwa: "Wszystkie rodzaje"},
	{id: 1, nazwa: "Zamki i twierdze"},
	{id: 2, nazwa: "Mury miejskie"},
	{id: 3, nazwa: "Pałace i dworki"},
	{id: 4, nazwa: "Obiekty sakralne i cmentarze"},
	{id: 5, nazwa: "Ratusze"},
	{id: 6, nazwa: "Inne obiekty"},
	{id: 24, nazwa: "Pomniki, rzeźby i ławeczki"},
	{id: 7, nazwa: "Muzea i skanseny"},
	{id: 8, nazwa: "Rynki, place i deptaki"},
	{id: 9, nazwa: "Jaskinie i podziemia"},
	{id: 10, nazwa: "Parki miejskie"},
	{id: 11, nazwa: "Parki Narodowe i rezerwaty"},
	{id: 12, nazwa: "Skałki"},
	{id: 13, nazwa: "Szlaki turystyczne"},
	{id: 23, nazwa: "Schroniska turystyczne"},
	{id: 14, nazwa: "Doliny i wąwozy"},
	{id: 15, nazwa: "Szczyty i punkty widokowe"},
	{id: 16, nazwa: "Narciarstwo"},
	{id: 17, nazwa: "Jeziora, wodospady i rzeki"},
	{id: 18, nazwa: "Parki rozrywki i zoo"},
	{id: 19, nazwa: "Rekreacja"},
	{id: 20, nazwa: "Centra nauki"},
	{id: 21, nazwa: "Imprezy"}
  ];
  $scope.sortowanie = [
	{id: "odleglosci", nazwa: "Blisko Ciebie"},
	{id: "odslon", nazwa: "Popularność"},
	{id: "data", nazwa: "Data dodania"}
  ];
  $scope.klasy = {
	nawigacja: "nawigacja"
  };
  $scope.filtry = {};
  $scope.mapa = false;
  $scope.marker = null;
  $scope.koniecAtrakcji = true;
  $scope.atrakcje = [];

  $scope.zmianaFiltrow = function() {
	$scope.filtry.strona = 0;
	$scope.atrakcje = [];
	$scope.pobierzAtrakcje();
  };
  $scope.zmianaFiltruSortuj = function() {
	if ($scope.filtry.sortuj == "odslon") {
	  $scope.filtry.w_promieniu = 25;
	} else if ($scope.filtry.sortuj == "odleglosci") {
	  $scope.filtry.w_promieniu = 700;
	}
  };
  $scope.zmienStrone = function(oIle) {
	if (oIle === 0) {
	  $scope.filtry.strona = 0;
	} else {
	  $scope.filtry.strona += oIle;
	}
	$scope.pobierzAtrakcje();
  };
  $scope.pokazMape = function() {
	if ($scope.mapa) {
	  $scope.mapa = false;
	} else {
	  $scope.mapa = true;
	  if (!MapaLista.mapa) {
		MapaLista.init();
	  }
	  $timeout(function() {
		MapaLista.odswiezWidok();
		MapaLista.pokazAtrakcjeNaMapie($scope.atrakcje);
		if (!params.bliskoCiebie) {
		  MapaLista.zaznaczPunkt($scope.filtry.x, $scope.filtry.y);
		}
	  }, 10);
	}
  };
  $scope.pobierzAtrakcje = function() {
	$scope.scrollToAnchor("lista_atrakcji");
	//$scope.$ionicScrollController.scrollTop(true);
	$scope.koniecAtrakcji = false;
	$scope.loading = $ionicLoading.show({
	  content: '<i class=" ion-loading-c"></i><br>Pobieram atrakcje...',
	  showBackdrop: false
	});
	console.log('Loading more!');
	$http({
	  method: "POST",
	  url: App.getPsURL() + "atrakcje.php",
	  data: this.filtry
	}).success(function(data) {
	  if (data.length === 0) {
		$scope.filtry.strona--;
		$scope.loading.hide();
		$ionicPopup.alert({
		  title: 'Brak atrakcji',
		  content: "Nie znalazłem atrakcji spełniających Twoje kryteria.<br>Zmień kryteria np. powiększając promień"
		}).then(function(res) {
		  //console.log('Thank you for not eating my delicious ice cream cone');
		});
	  } else {
		$scope.atrakcje = data;
		if (data) {
		  $scope.atrakcje = data;
		  for (var a in $scope.atrakcje) {
			//console.log($scope.atrakcje[a]);
			$scope.atrakcje[a].ocenaUzytkownika = Uzytkownik.pobierzOcene($scope.atrakcje[a].id, 'atr');
			$scope.atrakcje[a].chceWidziec = Uzytkownik.pobierzChceWidziec($scope.atrakcje[a].id, 'atr');
			if ($scope.atrakcje[a].x && $scope.atrakcje[a].y) {
			  (function(index) {
				App.policzDystans($scope.atrakcje[index].x, $scope.atrakcje[index].y).then(function(km) {
				  $scope.atrakcje[index].odleglosc = km;
				});
				App.okreslKierunek($scope.atrakcje[index].x, $scope.atrakcje[index].y).then(function(stopnie) {
				  $scope.atrakcje[index].stopnie = stopnie;
				});
			  })(a);
			  if ($scope.marker) {
				(function(index) {
				  $scope.atrakcje[index].odlegloscMarker = App.policzDystans($scope.atrakcje[index].x, $scope.atrakcje[index].y, $scope.marker.x, $scope.marker.y);
				  $scope.atrakcje[index].stopnieMarker = App.okreslKierunek($scope.atrakcje[index].x, $scope.atrakcje[index].y, $scope.marker.x, $scope.marker.y);
				})(a);
			  }
			}
			if (!$scope.atrakcje[a].zdjecia.mapa)
			  $scope.atrakcje[a].zdjecia.mapa = "img/brak_zdjecia_50.jpg";
			if (!$scope.atrakcje[a].zdjecia.lista)
			  $scope.atrakcje[a].zdjecia.lista = "img/brak_zdjecia_300.jpg";
		  }
		}
		if ($scope.mapa) {
		  MapaLista.pokazAtrakcjeNaMapie(data);
		}
		$scope.loading.hide();
	  }
	});
  };
  $scope.$watch("zalogowany", function() {
	if ($scope.atrakcje) {
	  for (var a in $scope.atrakcje) {
		$scope.atrakcje[a].ocenaUzytkownika = Uzytkownik.pobierzOcene($scope.atrakcje[a].id, 'atr');
		$scope.atrakcje[a].chceWidziec = Uzytkownik.pobierzChceWidziec($scope.atrakcje[a].id, 'atr');
	  }
	}
  });

  //if ($scope.ustawienia.pokazujMapeListyAtrakcji) {
  //$timeout(function() {
  //MapaLista.init();
  //}, 10);
  //}
  //params = {};
  //params.x = 50.264891999999996;
  //params.y = 19.023781;
  if (!params)
	params = {bliskoCiebie: 1};
  //console.log(params);
  $scope.filtry.rodzaj = 0;
  $scope.filtry.sortuj = 'odleglosci';
  $scope.filtry.w_promieniu = 700;
  $scope.filtry.strona = 0;
  if (params.bliskoCiebie) {
	$scope.loading = $ionicLoading.show({
	  content: '<i class=" ion-loading-c"></i><br>Pobieram położenie...',
	  showBackdrop: false
	});
	App.getGeoLokalizacja().then(function(geoLokalizacja) {
	  $scope.filtry.x = geoLokalizacja.x;
	  $scope.filtry.y = geoLokalizacja.y;
	  $scope.loading.hide();
	  $scope.pobierzAtrakcje();
	}, function(err) {
	  $ionicPopup.alert({
		title: 'Błąd pobierania lokalizacji',
		content: "Nie potrafię określić Twojej lokalizacji.<br>Pobieram najpopularniejsze atrakcje"
	  }).then(function(res) {
		//console.log('Thank you for not eating my delicious ice cream cone');
	  });
	  $scope.filtry.sortuj = 'odslon';
	  $scope.pobierzAtrakcje();
	  //$scope.loading.hide();
	});
  } else {
	if (params.x && params.y) {
	  $scope.filtry.x = params.x;
	  $scope.filtry.y = params.y;
	  $scope.marker = {
		x: params.x,
		y: params.y
	  };
	  $scope.sortowanie[0].nazwa = "Blisko markera";
	}
	$scope.pobierzAtrakcje();
  }

  var rangeTimeoutId = 'start';

  $scope.$watch('filtry.w_promieniu', function() {
	//console.log('Has changed');
	if (rangeTimeoutId !== null) {
	  //console.log('Ignoring this movement');
	  if (rangeTimeoutId == 'start')
		rangeTimeoutId = null;
	  return;
	}
	//console.log('Not going to ignore this one');
	rangeTimeoutId = $timeout(function() {
	  //console.log('It changed recently!');
	  console.log("Zmiana range");
	  $scope.zmianaFiltrow();
	  $timeout.cancel(rangeTimeoutId);
	  rangeTimeoutId = null;
	  // Now load data from server 
	}, 1000);
  });
});

/**
 * Strona główna
 */
AppCtrl.controller('indexCtrl', function($scope, App, MapaIndex, $state, $http) {
  //console.log(App.getBack());
  $scope.formMapa = {};
  $scope.wyszukajNaMapie = function() {
	MapaIndex.wyszukajNaMapie($scope.formMapa.miasto);
  };
  $scope.pokazAtrakcjeBliskoCiebie = function() {
	App.setParams({bliskoCiebie: true});
	$state.go('ps.atrakcje');
  };
  $scope.pobierzPolecamy = function() {
	$http({
	  method: "POST",
	  url: App.getPsURL() + "atrakcje.php",
	  data: {"polecamy": 1}
	}).success(function(data) {
	  $scope.polecamy = data;
	  //console.log(data);
	  for (var a in $scope.polecamy) {
		if ($scope.polecamy[a].x && $scope.polecamy[a].y) {
		  (function(index) {
			App.policzDystans($scope.polecamy[index].x, $scope.polecamy[index].y).then(function(km) {
			  $scope.polecamy[index].odleglosc = km;
			});
			App.okreslKierunek($scope.polecamy[index].x, $scope.polecamy[index].y).then(function(stopnie) {
			  $scope.polecamy[index].stopnie = stopnie;
			});
			App.setCache("polecamy", $scope.polecamy);
		  })(a);
		}
	  }
	  App.setCache("polecamy", $scope.polecamy);
	  //$scope.$ionicSlideBoxController.update();
	});
  };
  //$scope.pobierzPolecamy();
  if (App.getCache("polecamy")) {
	$scope.polecamy = App.getCache("polecamy");
	//$ionicSlideBoxDelegate.update();
  } else {
	$scope.pobierzPolecamy();
  }
});

/**
 * Modal Wyszukiwarka
 */
AppCtrl.controller('wyszukiwarkaCtrl', function($scope, App, $http, Uzytkownik) {
  $scope.formSzukaj = {
	szukam: 0
  };
  $scope.atrakcje = [];
  $scope.wyszukaj = function() {
	if ($scope.formSzukaj.fraza.length <= 2) {
	  return;
	}
	$scope.formSzukaj.szukam = 1;
	$http({
	  method: "POST",
	  url: App.getPsURL() + "autocomplete.php",
	  data: $scope.formSzukaj
	}).success(function(data) {
	  $scope.formSzukaj.szukam = 0;
	  if (data) {
		$scope.atrakcje = data;
		for (var a in $scope.atrakcje) {
		  //console.log($scope.atrakcje[a]);
		  if (!$scope.atrakcje[a].zdjecie)
			$scope.atrakcje[a].zdjecie = "img/brak_zdjecia.jpg";
		  if ($scope.atrakcje[a].x && $scope.atrakcje[a].y) {
			(function(index) {
			  $scope.atrakcje[a].ocenaUzytkownika = Uzytkownik.pobierzOcene($scope.atrakcje[a].id, 'atr');
			  $scope.atrakcje[a].chceWidziec = Uzytkownik.pobierzChceWidziec($scope.atrakcje[a].id, 'atr');
			  App.policzDystans($scope.atrakcje[index].x, $scope.atrakcje[index].y).then(function(km) {
				$scope.atrakcje[index].odleglosc = km;
			  });
			  App.okreslKierunek($scope.atrakcje[index].x, $scope.atrakcje[index].y).then(function(stopnie) {
				$scope.atrakcje[index].stopnie = stopnie;
			  });
			})(a);
		  }
		}
	  }
	});
  };
  $scope.zamknijWyszukiwarke = function() {
	var iF = document.getElementById("fraza");
	iF.blur();
	$scope.modalWyszukiwarka.hide();
  };
});

/**
 * Modal Logowanie
 */
AppCtrl.controller('logowanieCtrl', function($scope, App, Uzytkownik, $ionicLoading, $ionicPopup, $http) {
  $scope.formLogowanie = {
	func: "zaloguj"
  };
  $scope.zamknijLogowanie = function() {
	$scope.modalLogowanie.hide();
  };
  $scope.zalogujSie = function() {
	//console.log($scope.formLogowanie);
	$scope.loading = $ionicLoading.show({
	  content: '<i class=" ion-loading-c"></i><br>Loguję się...',
	  showBackdrop: false
	});
	$http({
	  method: "POST",
	  url: App.getPsURL() + "uzytkownik.php",
	  data: $scope.formLogowanie
	}).success(function(data) {
	  //console.log(data);
	  $scope.loading.hide();
	  if (data.status == 'error') {
		$ionicPopup.alert({
		  title: 'Błąd logowania',
		  content: data.komunikat
		}).then(function(res) {
		});
	  } else {
		Uzytkownik.zapiszUzytkownika(data.dane_uzytkownika);
		$scope.zamknijLogowanie();
		$scope.sprawdzZalogowanie();
	  }
	});
  };
});

/**
 * Aplikacja
 */
AppCtrl.controller('polskieszlakiCtrl', function($scope, App, Uzytkownik, $ionicModal, $location) {
  //App.init();
  $scope.zalogowany = null;
  $scope.ustawienia = {
	pokazujMapeListyAtrakcji: false
  };
  $scope.ostatnioPrzegladane = App.getOstatnioPrzegladane();
  $scope.scrollToAnchor = function(anchor) {
	$location.hash(anchor);
	$scope.$broadcast('scroll.anchorScroll', true);
  };
  $scope.wylogujSie = function() {
	Uzytkownik.wylogujUzytkownika();
	$scope.zalogowany = Uzytkownik.zalogowany();
  };
  $scope.sprawdzZalogowanie = function() {
	$scope.zalogowany = Uzytkownik.zalogowany();
	return $scope.zalogowany;
  };

  Uzytkownik.initSprawdzZalogowanie();
  $scope.zalogowany = Uzytkownik.zalogowany();

  $ionicModal.fromTemplateUrl('templates/modal/wyszukiwarka.html', function(modal) {
	$scope.modalWyszukiwarka = modal;
  }, {
	scope: $scope,
	animation: 'slide-in-up'
  });
  $ionicModal.fromTemplateUrl('templates/modal/logowanie.html', function(modal) {
	$scope.modalLogowanie = modal;
  }, {
	scope: $scope,
	animation: 'slide-in-up'
  });
//  $scope.leftButtons = [{
//	  content: '<i class="button back-button button-icon icon ion-arrow-left-c no-padding"></i>',
//	  tap: function(e) {
//		console.log("back");
//		App.setBack(true);
//	  }
//	}];
//
//  $scope.rightButtons = [{
//	  type: 'button-icon ion-android-search',
//	  tap: function(e) {
//		//$state.go("ps.wyszukiwarka");
//		$scope.modalWyszukiwarka.show();
//		$timeout(function() {
//		  var iF = document.getElementById("fraza");
//		  iF.focus();
//		}, 500);
//	  }
//	}, {
//	  type: 'button-icon ion-navicon-round',
//	  tap: function(e) {
//		$ionicSideMenuDelegate.toggleRight($scope.$$childHead);
//	  }
//	}];
});


