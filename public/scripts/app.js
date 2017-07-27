var app = angular.module("goalsApp", ["ngRoute", "ngStorage", "filters.stringUtils", "angularModalService", "chart.js"]);

app.controller('mainController', function($scope, $localStorage, $sessionStorage, $http)  {
	$scope.$storage = $localStorage;
	$scope.$storage.goal = new Goal($http);
	$scope.date = new Date();

  	$scope.options = { responsive: false };

  	$scope.labels = ["Current Sales", "Difference From Goal"];

  	$scope.getCurrentProgress = function()  {
  		blockspring.runParsed("read-cell-google-sheets", { "file_id": "14HGE-3oSeE1KBPjnGv2C4p749-9mV0JFdvyTJAHRaE0", "worksheet_id": 0, "row": 1,
   			"column": 2}, { "api_key": "edd7d4672aaa5a78a6dbd85af745944a" }, function(res){
   				$scope.$storage.currentProgress = parseInt(res.params.cell);
  		});
  		blockspring.runParsed("read-cell-google-sheets", { "file_id": "14HGE-3oSeE1KBPjnGv2C4p749-9mV0JFdvyTJAHRaE0", "worksheet_id": 0, "row": 2,
   			"column": 2}, { "api_key": "edd7d4672aaa5a78a6dbd85af745944a" }, function(res){
   				$scope.$storage.projectedEnd = parseInt(res.params.cell);
  		});

  	};
	//$scope.$storage.dailyGoal = new DailyGoal($http);
	//$scope.storage.staff = '';
	$scope.openStaff = function(staff) {
		// set data
		$scope.$storage.staff = staff;
		location.href = '#!staff';
	};
	
	$scope.callUpdateGoals = function(section)  {
		var newGoal = $('#weeklyGoalInput').val();
		//console.log("Section: " + section);
		if (section == 0)  {
			$http.post("/updateGoals", 
				{
					"location": "10 Barrel Boise",
					"dailyGoal": newGoal,
					"weeklyGoal": $scope.$storage.goal.weeklyGoal
			})
			.then(function(data,status,headers,config)  {
				$scope.$storage.goal.dailyGoal = parseInt(newGoal);
				$scope.data = [$scope.$storage.currentProgress, (parseInt(newGoal) - $scope.$storage.currentProgress)];
				//$scope.dailyGoal = $storage.dailyGoal;
			}, function(data,status,headers,config)  {
				console.log("failure");
			});
		} else {
			$http.post("/updateGoals", 
				{
					"location": "10 Barrel Boise",
					"dailyGoal": $scope.$storage.goal.dailyGoal,
					"weeklyGoal": newGoal
			})
			.then(function(data,status,headers,config)  {
				$scope.$storage.goal.weekGoal = parseInt(newGoal);
				//$scope.dailyGoal = $storage.dailyGoal;
			}, function(data,status,headers,config)  {
				console.log("failure");
			});
		}
	}

	$scope.callUpdateDailyGoal = function()  {
		$http.post("/updateGoals",
		{
			"location": "10 Barrel Boise",
			"dailyGoal": $scope.$storage.goal.dailyGoal,
			"weeklyGoal": $scope.$storage.goal.weeklyGoal
		})
		.then(function(data,status,headers,config)  {
			$scope.data = [$scope.$storage.currentProgress, $scope.$storage.goal.dailyGoal - $scope.$storage.currentProgress];
		}, function(data,status,headers,config)  {
			console.log("failing");
		});
	}

	$scope.callGetGoals = function()  {
		$http.get("/goals")
		.then(function(data,status,headers,config) {
			$scope.$storage.goal.dailyGoal = parseInt(data.data[0].dailyGoal);	
			$scope.data = [$scope.$storage.currentProgress, (parseInt(data.data[0].dailyGoal) - $scope.$storage.currentProgress)];
			$scope.min = 0;
			$scope.max = parseInt(data.data[0].weeklyGoal) + 2000;
			$scope.$storage.goal.weeklyGoal = parseInt(data.data[0].weeklyGoal);
			// console.log("Weekly goal: " + $scope.$storage.goal.weeklyGoal);
			// console.log("Pulling: " + data.data[0].weeklyGoal);
		},function(data, status, headers, config)  {
			console.log('fail here');
		});
	}

	$scope.callGetTactics = function()  {
		$http.get("/tactics")
		.then(function(data,status,headers,config) {
			$scope.$storage.tactic = data.data[0].tactic;
		}, function(data, status, headers, config)  {
			console.log("fail getting tactics");
		});
	}

	$scope.callUpdateTactic = function()  {
		var newTactic = $('.tacticalGoalsInput').val();
		$http.post("/updateTactics",
		{
			"location": "10 Barrel Boise",
			"tactic": newTactic
		})
		.then(function(data,status,headers,config)  {
			$scope.$storage.tactic = newTactic;
		}, function(data,status,headers,config)  {
			console.log('failure');
		});
	}


$scope.callUpdateWeekGoals = function(section)  {
    var newGoal = $('#weekGoalInput').val();
    //console.log("Section: " + section);
      $http.post("/updateWeekGoal", 
        {
          "location": "10 Barrel Boise",
          "weekGoal": newGoal
      })
      .then(function(data,status,headers,config)  {
        $scope.$storage.goal.weekGoal = parseInt(newGoal);
        //$scope.dailyGoal = $storage.dailyGoal;
      }, function(data,status,headers,config)  {
        console.log("failure");
      });    
  }

  $scope.callGetWeekGoals = function()  {
    $http.get("/weekGoal")
    .then(function(data,status,headers,config) {
      $scope.$storage.goal.dailyGoal = parseInt(data.data[0].dailyGoal);  
      $scope.min = 0;
      $scope.max = parseInt(data.data[0].weeklyGoal) + 2000;
      $scope.$storage.goal.weeklyGoal = parseInt(data.data[0].weeklyGoal);
      // console.log("Weekly goal: " + $scope.$storage.goal.weeklyGoal);
      // console.log("Pulling: " + data.data[0].weeklyGoal);
    },function(data, status, headers, config)  {
      console.log('fail here');
    });
  }

	$scope.getCurrentProgress();
	$scope.callGetGoals();
	$scope.callGetTactics();


	$scope.switch = function (num) {
		if (num == 0)  {
			$scope.data = [$scope.$storage.currentProgress, ($scope.$storage.goal.dailyGoal - $scope.$storage.currentProgress)];
		} else {
			$scope.data = [$scope.$storage.currentProgress, ($scope.$storage.goal.weeklyGoal - $scope.$storage.currentProgress)];
		}
	}

	$scope.data = [$scope.$storage.currentProgress, ($scope.$storage.goal.dailyGoal - $scope.$storage.currentProgress)];
});

function Goal($http)  {
	var dailyGoal = 2000;
	var weeklyGoal = 10000;

	$http.get("/goals")
	.then(function(data, status, headers, config)  {
		dailyGoal = parseInt(data.data[0].dailyGoal);
		weeklyGoal = parseInt(data.data[0].weeklyGoal);
	},function(data,status,headers,config)  {
		console.log('fail hur');
	});

	this.__defineGetter__("dailyGoal", function () {
        return dailyGoal;
    });

    this.__defineSetter__("dailyGoal", function (val) {        
        val = parseInt(val);
        dailyGoal = val;
    });

    this.__defineGetter__("weeklyGoal", function () {
        return weeklyGoal;
    });

    this.__defineSetter__("weeklyGoal", function (val) {        
        val = parseInt(val);
        weeklyGoal = val;
    });
}

app.config(function($routeProvider) {
  $routeProvider
  .when("/", {
  	templateUrl : "partials/home.html"
  })
  .when("/history", {
      templateUrl : "partials/history.html"
  })
  .when("/insights", {
      templateUrl : "partials/insights.html"
  })
  .when("/staff", {
  	templateUrl : "partials/staff.html"
  })
  .when("/yesterday", {
  	templateUrl : "partials/yesterday.html"
  })
  .when("/yesterdayTab", {
  	templateUrl : "partials/yesterdayTab.html"
  })
  .when("/setGoal", {
  	templateUrl : "partials/setGoal.html"
  })
  .when("/adjustStaffGoals", {
    templateUrl : "partials/adjustStaffGoals.html"
  })
  .when("/weeklyGoals", {
  	templateUrl : "partials/setWeeklyGoals.html"
  })
  .when("/weeklyGoalsTab", {
  	templateUrl : "partials/weeklyGoalsTab.html"
  })
  .when("/daily", {
    templateUrl : "partials/setDailyGoals.html"
  })
  .when("/tips", {
  	templateUrl : "partials/tips.html"
  })
    .when("/lastWeek", {
    templateUrl : "partials/lastWeek.html"
  });
});

app.run(function ($rootScope, $location, $localStorage) {

    var history = [];

    $localStorage.history = history;

    $rootScope.$on('$routeChangeSuccess', function() {
        //history.push($location.$$path);
        $localStorage.history.push($location.$$path);

    });

    $rootScope.back = function () {
    	var prevUrl = $localStorage.history.length > 1 ? $localStorage.history.splice(-2)[0] : "/";
        //var prevUrl = history.length > 1 ? history.splice(-2)[0] : "/";
        $location.path(prevUrl);
    };

});

angular.module('filters.stringUtils', [])

.filter('removeSpaces', [function() {
    return function(string) {
        if (!angular.isString(string)) {
            return string;
        }
        return string.replace(/[\s]/g, '');
    };
}]);

$(app).ready(function(){
    $("pp").click(function(){
        $(this).hide();
    });
});


function enableInput()  {
	$('.tacticalGoalsInput').prop("disabled", function(i, v) { return !v; });
}

$( "#clickme" ).click(function() {
      $( "#book" ).toggle( {
        
      });
    $(this).text(function(i, text){
    return text === "Add" ? "Remove" : "Add";
    })
});





// app.service("Contacts", function($http) {
//   this.getContacts = function() {
//     return $http.get("/contacts").
//       then(function(response) {
//         return response;
//       }, function(response) {
//         alert("Error retrieving contacts.");
//       });
//   }
// });
