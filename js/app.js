angular.module('polskieszlaki', ['ionic', 'polskieszlaki.services', 'polskieszlaki.controllers', 'ui.bootstrap'], function($httpProvider)
{
  // Use x-www-form-urlencoded Content-Type
  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
  // Override $http service's default transformRequest
  $httpProvider.defaults.transformRequest = [function(data)
	{
	  /**
	   * The workhorse; converts an object to x-www-form-urlencoded serialization.
	   * @param {Object} obj
	   * @return {String}
	   */
	  var param = function(obj)
	  {
		var query = '';
		var name, value, fullSubName, subName, subValue, innerObj, i;
		for (name in obj)
		{
		  value = obj[name];
		  if (value instanceof Array)
		  {
			for (i = 0; i < value.length; ++i)
			{
			  subValue = value[i];
			  fullSubName = name + '[' + i + ']';
			  innerObj = {};
			  innerObj[fullSubName] = subValue;
			  query += param(innerObj) + '&';
			}
		  }
		  else if (value instanceof Object)
		  {
			for (subName in value)
			{
			  subValue = value[subName];
			  fullSubName = name + '[' + subName + ']';
			  innerObj = {};
			  innerObj[fullSubName] = subValue;
			  query += param(innerObj) + '&';
			}
		  }
		  else if (value !== undefined && value !== null)
		  {
			query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
		  }
		}

		return query.length ? query.substr(0, query.length - 1) : query;
	  };
	  return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
	}];
})

		.filter('stripATags', function() {
		  return function(text) {
			return String(text).replace(/<a\b[^>]*>(.*?)<\/a>/gm, "\$1");
		  };
		})

		.filter('ocenaSlownie', function() {
		  return function(text, $scope) {
			if (!text)
			  return "";
			for (var a in $scope.oceny) {
			  if ($scope.oceny[a].id == text) {
				text = $scope.oceny[a].title;
				break;
			  }
			}
			return " - " + text;
		  };
		})
		/*
		 .directive("odleglosc", function(App) {
		 return {
		 restrict: "E",
		 replace: true,
		 scope: {
		 x: "@",
		 y: "@"
		 },
		 link: function(scope, element, attrs, odlegloscCtrl) {
		 scope.$watch("x", function(value) {
		 scope.km = App.policzDystans(scope.x, scope.y);
		 console.log(scope.km);
		 });
		 },
		 template: "<div>{{km}} {{x}} {{y}}</div>",
		 };
		 })
		 */
		.directive('ngEnter', function() {
		  return function(scope, element, attrs) {
			element.bind("keydown keypress", function(event) {
			  if (event.which === 13) {
				scope.$apply(function() {
				  scope.$eval(attrs.ngEnter);
				});
				event.preventDefault();
			  }
			});
		  };
		})

		.directive('backImg', function() {
		  return function(scope, element, attrs) {
			attrs.$observe('backImg', function(value) {
			  element.css({
				'background-image': 'url(' + value + ')'
			  });
			});
		  };
		})

		.config(function($stateProvider, $urlRouterProvider, $compileProvider) {
		  $stateProvider
				  // setup an abstract state for the tabs directive
				  .state('ps', {
					url: "/ps",
					abstract: true,
					templateUrl: "templates/polskieszlaki.html"
				  })

				  .state('ps.index', {
					url: '/index',
					views: {
					  "mainView": {
						templateUrl: 'templates/index.html',
						controller: 'indexCtrl'
					  }
					}
				  })

				  .state('ps.atrakcje', {
					url: '/atrakcje',
					views: {
					  "mainView": {
						templateUrl: 'templates/lista-atrakcji.html',
						controller: 'atrakcjeCtrl'
					  }
					}
				  })


				  .state('ps.atrakcja', {
					url: '/atrakcja/:idAtrakcji',
					views: {
					  'mainView': {
						templateUrl: 'templates/atrakcja.html',
						controller: 'atrakcjaCtrl'
					  }
					}
				  })

				  .state('ps.wyszukiwarka', {
					url: '/wyszukiwarka',
					views: {
					  'mainView': {
						templateUrl: 'templates/wyszukiwarka.html',
						controller: 'wyszukiwarkaCtrl'
					  }
					}
				  });
		  // if none of the above states are matched, use this as the fallback
		  $urlRouterProvider.otherwise('/ps/index');
		  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|geo|mailto|file):/);
		});