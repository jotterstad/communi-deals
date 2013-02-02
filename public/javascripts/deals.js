   var data = "<%= deals %>";
   var newdata = data.replace(/&quot;/g,'"');
   var angdata = angular.fromJson(newdata);
   
   function dealsCtrl($scope){
	$scope.alldeals = angdata
   }