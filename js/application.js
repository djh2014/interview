      

// Copy the query string and add them to the links.
// Probobly there some nicer session html5 way to do that.
$(document).ready(function() {
  interviewType = getParameterByName("type") || "finance";
  firstName = getParameterByName("fname") || "Danny";
  $(".nav a").each(function(i, e){$(this).attr("href", $(this).attr("href")+"?type="+interviewType+"&fname="+firstName)})
});