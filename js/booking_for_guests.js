// TO REMOVE THE File used only in booking.html the booking the guests sees.
  
  // UI: 
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

    // 2. Get Credit Card details:
    StripeCheckout.open({
      key:         'pk_live_jiXgFnzeKzJEjIRwP9wGF6mQ',
      email: true,
      amount:      Number(booking.get("price"))*100,
      name:        booking.get("guest_name"),
      description: 'Book your room',
      panelLabel:  'Checkout',
      // 3. Set the token and send to the server to charge and book:
      token: function(token) {
        booking.set("cardToken",token.id);
        booking.save(null, {
          success: function(booking) {
            alert("Book!");
            location.reload();
          },
          error: function(booking, error) {
            alert(error.message);
          }
        });
      }
    });
    return false;
  };

  $("#place-booking").hide();
  $("#paypal-form").hide();
  
  $('#show-price').click(function(){
    var booking = convertBookingToJSON(createBookingFromInput());
    checkIfAvailable(booking, function(isAvailable){
      if(isAvailable) {
        //TODO(gutman): make it nicer:
        price = calculatePrice(booking);
        debugger;
        $("#paypal-b").val(""+ price +".00");
        $('#price').hide({duration:'slow'});
        $('#price').html("Available: " + price + "$ total");
        $('#price').show({duration:'slow'});
        
        $("#paypal-form").show();
        //$("#place-booking").show();
      } else {
        $('#price').hide({duration:'slow'});
        $('#price').html("Sorry Not available.");
        $('#price').show({duration:'slow'});
        $("#paypal-form").hide();
        //$("#place-booking").hide();
      }
    })
  })

  // TODO(gutman): temp untill fix calendar:
  $('#calendar').hide();



  // Handle Stripe:
  // This identifies your website in the createToken call below
  Stripe.setPublishableKey('pk_test_hfqcvD791OD2SqlsBxINKbPw');
 
    var stripeResponseHandler = function(status, response) {
      var $form = $('#payment-form');
 
      if (response.error) {
        // Show the errors on the form
        $form.find('.payment-errors').text(response.error.message);
        $form.find('button').prop('disabled', false);
      } else {
        // token contains id, last4, and card type
        var token = response.id;
        // Insert the token into the form so it gets submitted to the server
        $form.append($('<input type="hidden" name="stripeToken" />').val(token));
        // and re-submit
        $form.get(0).submit();
      }
    };
 
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
