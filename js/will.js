
$( "#header-plugin" ).load( function() {  
});

$(document).ready(function() {
  $("#customerservice-button").click(function () {
   $("#phonenumber-button").show() //how to get this to wrap
   $("#customerservice-button").hide()
    $("#smallbusiness-button").hide()
  });
  $("#smallbusiness-button").click(function () {
  $("#customerservice-button").hide()
  $("#smallbusiness-button").hide()
  $("#phonenumber-button").show()
  
  });
  $("#phonenumber-button").click(function () {
  $("#smallbusiness-button").hide()
// code to dial a number
  });
 });