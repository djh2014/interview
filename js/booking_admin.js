function findBed(booking, otherBookings) {
  if (booking.bed == null) {
    // Get relevant room beds.
    var roomBeds = createBEDS(ROOMS.filter(function(room) {return booking.room == room[0]} ));
    // Get the relevant bookings:
    var releventBookings = otherBookings.filter(function(b) { return b.start <= booking.end && b.end >= booking.start});
    // Remove the taken beds
    releventBookings.forEach(function(otherBooking) {
      var bedIndex = roomBeds.indexOf(otherBooking.bed)
      if (bedIndex != -1) {
        roomBeds.splice(bedIndex,1);
      }
    });
    // Set the remining bed:
    if (roomBeds.length > 0) {
      booking.bed = roomBeds[0];
    }
  }
 }



// Create Beds from the rooms.
function createBEDS(rooms) {
  var beds = []
  rooms.forEach(function(room) {
    for (var i = 1; i <= room[1]; i++) {
      beds.push(room[0][0] +i);   
    }
  });
  return beds;
}
var BEDS = createBEDS(ROOMS);


// Retrive all the beds, and find a bed for the new booking.
function getABed(booking, cb) {
  // Get all bookings:
  var query = new Parse.Query(Booking);
  query.find({success:function(bookingObjects) {
    var bookings = bookingObjects.map(convertBookingToJSON);
    // sort by dates.
    bookings.sort(function(b1, b2) {return b1.start - b2.start;});
    // Foreach booking find bed and save.    
    findBed(booking, bookings);
    cb(booking);
    //bookings = bookings.filter(function(b) { return b.start <= end && b.end >= start});
  }});
} 

// DB: retrive all the bookings.
function fetchAllBookingJSON(cb) {
  var query = new Parse.Query(Booking);
  query.find({success:cb});
}

// TODO(guti): bug it need to save before go to the next!
// fills all booking without bed with one.
function initBookingWithoutBeds() {
  fetchAllBookingJSON(function(bookingObjects) {
    bookingObjects.forEach(function(booking) {
      getABed(convertBookingToJSON(booking), function(bookingJSON) {
        booking.save(bookingJSON, {
          success: function(booking) {
            //location.reload();
          },
          error: function(booking, error) {
            //debugger;
          }
        });  
      });
    });
  });
}
initBookingWithoutBeds();

//// PRESERNT CALENDAR:
  
  // Get the booking for the bed. 
  function getBookingByBed(bed, cb) {
      var query = new Parse.Query(Booking).equalTo("bed",bed);
      query.find({success:function(bookingObjects) {
        var bookings = bookingObjects.map(convertBookingToJSON);
        cb(bookings, bed);
      }});
  }

  function fixTextSizeForCalendarUI(text) {
    return text.substr(0,14);
  }
  
  // Fix the problem of ordering the event with FullCalendar, break to single days.
  function pushBreakEvent(counterBed, events, b) {
     var currentDate = moment(new Date(b.start)).add('hours', counterBed + 1).toDate();
     var newEnd = moment(new Date(b.end)).add('hours', counterBed + 1).toDate();
     
     while (currentDate <= newEnd) {
      events.push({
        start: currentDate,
        end: currentDate,
        title: fixTextSizeForCalendarUI(b.title),
        color: b.color,
        bed: BEDS[counterBed],
        allDay: false
      })
      b.color = b.second_color;
      currentDate = moment(currentDate).add('days', 1).toDate();
    }
  }

  function getBookingEvents(start, end, callback) {
    var events = [];
    var counterBed = 0;
    // function n(bookings) {
    BEDS.forEach(function(bed) {
      getBookingByBed(bed, function(bookings, bed) {
        // sort and filter by dates.
        bookings.sort(function(b1, b2) {return b1.start - b2.start;});
        bookings = bookings.filter(function(b) { return b.start <= end && b.end >= start});
        
        var lastBooked = moment(start).subtract('days',1);
        bookings.forEach(function(b) {
          // Push Empty event:
          if (lastBooked < b.start) {
            pushBreakEvent(BEDS.indexOf(bed), events,
              {start:lastBooked,
              end:moment(b.start).subtract('days', 1).toDate(),
              title: bed,// + " empty",
              color:'pink',
              second_color: "red"});
          }
          // Push event and update lastBooked.
          b.title = bed + " " + b.guest_name;
          b.color = "#00FF00";
          b.second_color = "green";
          pushBreakEvent(BEDS.indexOf(bed), events, b);
          //events.push(b);
          lastBooked = moment(b.end).add('days', 1).toDate();//+1
        });
        pushBreakEvent(BEDS.indexOf(bed), events,
          {start:lastBooked,
          end:moment(end).subtract('days', 1).toDate(),
          title: bed,// + " empty",
          color:'pink',
          second_color: "red"});
        
        counterBed = counterBed + 1;
        if(counterBed == BEDS.length){
          // sort events.
          events = events.sort(function(e1,e2) {
            return BEDS.indexOf(e1.bed) - BEDS.indexOf(e2.bed);
          });
          callback(events);  
        }
      });
    });
  }


  // UI: 
  // // Set Calendar.
  $('#calendar').fullCalendar({header: {left: 'prev,next today',center: 'title', right: 'month,basicWeek,basicDay'},
                                defaultView: 'basicWeek',
                                 editable: true,
                                 eventSources: [
                                  {events:getBookingEvents, color: 'yellow', textColor: 'black'}]}); 

 