//TODO(gutman): temp:
globalPrice = ''

  function checkIfAvailable(booking, callback) {
    getABed(booking, function(booking) {
      // DO NOT SUBMIT:
      var hasFreeBed = booking.bed != null;
      callback(booking.bed != null);
    });
  }

  // Creats new booking from the input:
  createBookingFromInput = function() {
    var booking = new Booking();
    var endDate = endPicker.getLocalDate();
    endDate.setHours(0, 0, 0, 0);
    var startDate = startPicker.getLocalDate();
    startDate.setHours(0, 0, 0, 0);
    booking.set("start", startDate);
    booking.set("end", endDate);
    booking.set("price", globalPrice || 'Nan');
    booking.set("title", $('#guest-name').val() + ", " + $("#number-of-guests").val() + ", " + $("#room").val());
    booking.set("guest_name", $('#guest-name').val());
    booking.set("guest_name", $('#guest-name').val());
    booking.set("number_of_guests", $("#number-of-guests").val());
    booking.set("room", $("#room").val());

    return booking;
                    
  }

  /// Edit methods:
  function getBookings(cb) {
    var query = new Parse.Query(Booking).ascending("guest_name");
    query.find({
      success: function(bookingObjects) {
        var bookings = bookingObjects.map(convertBookingToJSON);
        cb(bookings);
      }
    })
  }

// TEMP:
var currentBookingObject = null;
  function getBookingByGuest(guest_name, cb) {
    var query = new Parse.Query(Booking).equalTo("guest_name", guest_name);
    query.first({
      success: function(bookingObject) {
        currentBookingObject = bookingObject;
        var booking = convertBookingToJSON(bookingObject);
        cb(booking);
      }
    });
  }

  // UI: 
  // Edit UI:
  $(function() {
    getBookings(function(bookings) {
      bookings.forEach(function(booking) {
        $('#guests').append("<option>"+booking.guest_name+"</option>");
      });
    });


    // Display booking in edit mode.
    $("#guests").change(function(event) {
      var guest = $("#guests option:selected").text();
      getBookingByGuest(guest, function(booking) {
        $('#ends-edit').val(moment(booking.end).format("MM/DD/YYYY"));
        $('#starts-edit').val(moment(booking.start).format("MM/DD/YYYY"));
        $('#room-edit').val(booking.room);
        $('#paid-edit').val(booking.paid);
        $('#email-edit').val(booking.email);
        $('#phone-edit').val(booking.phone);
        $('#bed-edit').val(booking.bed);
      })
    })

    $("#find-bed-button-edit").click(function(event) {
        var booking = convertBookingToJSON(currentBookingObject);
        booking.bed = null;
        if(booking.bed == null) {
          getABed(booking, function(booking) {
            $('#bed-edit').val(booking.bed);  
          });
        }
    });

    // Save booking from edit mode.
    $("#save-edit").click(function(event) {
        currentBookingObject.save({
          end: moment($('#ends-edit').val(), "MM/DD/YYYY").toDate(),
          start: moment($('#starts-edit').val(), "MM/DD/YYYY").toDate(),
          room: $('#room-edit').val(),
          paid: Number($('#paid-edit').val()),
          email: $('#email-edit').val(),
          phone: $('#phone-edit').val(),
          bed: $('#bed-edit').val(),
        }, 
        {success: function(message) {
          alert("saved changes");
          location.reload();
        },
         error: function(message) {
          alert("Nope error." + message);
        }
        });
      //});
    });
  });
  
  // Set Rooms in Select.
  for (var i = 0; i < ROOMS.length; i++) {
    $('#room').append("<option>"+ROOMS[i][0]+"</option>");
  };
  
  // Setup Date pickers:
  $('#datetimepickerStart').datetimepicker({
      language: 'en'
  });

  var startPicker = $('#datetimepickerStart').data('datetimepicker');
  startPicker.setLocalDate(new Date());
  $('#datetimepickerEnd').datetimepicker({
      language: 'en'
  });
  var endPicker = $('#datetimepickerEnd').data('datetimepicker');
  endPicker.setLocalDate(new Date());

  // Save new booking event
  $("#place-booking").click(placeBooking);
  function placeBooking(event){
    // 1. Create the booking from the input:
    var booking = createBookingFromInput();
    getABed(convertBookingToJSON(booking), function(bookingJSON) {
      booking.save(bookingJSON, {
        success: function(booking) {
          alert("Booked!");
          location.reload();
        },
        error: function(booking, error) {
          alert(error.message);
        }
      });  
    }); 
    return false;
  };

  $("#place-booking").hide();
  $('#show-price').click(function(){
    var booking = convertBookingToJSON(createBookingFromInput());
    checkIfAvailable(booking, function(isAvailable){
      if(isAvailable) {
        //TODO(gutman): make it nicer:
        globalPrice = price(booking);
        $('#price').hide({duration:'slow'});
        $('#price').html("Available: " + globalPrice + "$ total");
        $('#price').show({duration:'slow'});
        $("#place-booking").show();
      } else {
        $('#price').hide({duration:'slow'});
        $('#price').html("Sorry Not available.");
        $('#price').show({duration:'slow'});
        $("#place-booking").hide();
      }
    })
  })
 
    jQuery(function($) {
      $('#payment-form').submit(function(e) {
        var $form = $(this);
 
        // Disable the submit button to prevent repeated clicks
        $form.find('button').prop('disabled', true);
 
        Stripe.createToken($form, stripeResponseHandler);
 
        // Prevent the form from submitting with the default action
        return false;
      });
    });
