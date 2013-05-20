
price = ''

// Define Globals:
  Parse.initialize("Pe2aVvOhSuUgef67pirBiesOAUdEc0evUOjOVVG2", "ef8ZawXgmHhW8n1zBlHea57RJeBqoH8EcSJePl1X");
  Booking = Parse.Object.extend("Booking");
  // Rooms and their guests capacity:
  var ROOMS_DIC = {"Private": 1, "Curatin": 2, "Shared": 18};
  var ROOMS = [["Private", 1], ["Curatin", 2], ["Shared", 18]];
  // Rooms and Prices, per day, per week, per month.
  var ROOMS_PRICES = {"Shared": [50, 300, 1000],
                      "Private": [100, 400, 1400],
                      "Curatin": [75, 350, 1200]}

  calculatePrice = function(booking) {
    var numberOfDays = moment.duration(booking.end - booking.start).asDays()+1;
    var priceType;  
    if (numberOfDays < 7) {
      priceType = [0, 1]; // price-type, unit-size
    } else if (numberOfDays < 30) {
      priceType = [1, 7];
    } else {
      priceType = [2, 30];
    }

    var pricePerUnit = ROOMS_PRICES[booking.room][priceType[0]];
    var price = pricePerUnit * (numberOfDays/priceType[1]) * booking.number_of_guests;;
    return Math.round(price);
  }

  function getFreeSapces(startDate, endDate, callback) {
    // find booking for relevant dates:
    var query = new Parse.Query(Booking);
    query.greaterThanOrEqualTo("end", startDate);
    query.lessThanOrEqualTo("start", endDate);
    query.find({success:function(bookings) {
      // Initlize freeSpace
      var freeSpace = [];
      
      for (var date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        freeSpace[date.toString()] = [];
        for (var i = 0; i < ROOMS.length; i++) {
          freeSpace[date][ROOMS[i][0]] = ROOMS[i][1];
        };
      }
      // Go over bookings, and update freeSpace.
      for (var i = 0; i < bookings.length; i++) {
        var booking = convertBookingToJSON(bookings[i]);
        for (var date = booking.start; date <= booking.end; date.setDate(date.getDate() + 1)) {
          if (freeSpace[date.toString()] != null) {
            freeSpace[date.toString()][booking.room] = freeSpace[date.toString()][booking.room] - Number(booking.number_of_guests);
          }
        }
      };
      callback(freeSpace);
    }});
  }

  createBookingFromInput = function() {
    var booking = new Booking();
    var endDate = endPicker.getLocalDate();
    endDate.setHours(0, 0, 0, 0);
    var startDate = startPicker.getLocalDate();
    startDate.setHours(0, 0, 0, 0);
    booking.set("start", startDate);
    booking.set("end", endDate);
    booking.set("price", price || 'Nan');
    booking.set("title", $('#guest-name').val() + ", " + $("#number-of-guests").val() + ", " + $("#room").val());
    booking.set("guest_name", $('#guest-name').val());
    booking.set("guest_name", $('#guest-name').val());
    booking.set("number_of_guests", $("#number-of-guests").val());
    booking.set("room", $("#room").val());
    return booking;
                    
  }
/////-----------------------------
  // Booking methods:
  numberOfDays = function(booking) {
    if (booking.numberOfDays == null) {
      booking.numberOfDays = moment.duration(booking.end - booking.start).asDays()+1;
    }
    return booking.numberOfDays;
  }

  daysTillToday = function(booking) {
   if (booking.daysTillToday == null) {
      var endDate = new Date(Math.min(new Date(), booking.end));
      var daysPass = moment.duration(endDate - booking.start).days() + 1;
      booking.daysTillToday = Math.max(0, daysPass);
    }
    return booking.daysTillToday; 
  } 

  priceType = function(booking) {  
    if(booking.priceType == null) {
      if (numberOfDays(booking) < 7) {
        booking.priceType =  [0, 1]; // price-type, unit-size
      } else if (numberOfDays(booking) < 30) {
        booking.priceType = [1, 7];
      } else {
        booking.priceType = [2, 30];
      }
    }
    return booking.priceType;
  }

  pricePerUnit = function(booking) {
    if (booking.pricePerUnit == null) {
      booking.pricePerUnit = ROOMS_PRICES[booking.room][priceType(booking)[0]] * booking.number_of_guests;
    }
    return booking.pricePerUnit;
  }

  price = function(booking) {
    if (booking.price == null) {
      var priceDouble = pricePerUnit(booking) * (numberOfDays(booking)/priceType(booking)[1]) ;
      booking.price = Math.round(priceDouble);
    }
    return booking.price;
  }

  currentPrice = function(booking) {
    if (booking.currentPrice == null) {
      var priceDouble = pricePerUnit(booking) * (daysTillToday(booking)/priceType(booking)[1]);
      booking.currentPrice = Math.round(priceDouble);
    }
    return booking.currentPrice;
  }

  dueDate = function(booking) {
    if (booking.dueDate == null) {
      // price_per_unit/ unit_length = price_per_date.
      booking.price_per_date = pricePerUnit(booking) / priceType(booking)[1];
      // paid/price-per-date = number of diate.
      booking.days_cover = (paid(booking) + discount(booking)) / booking.price_per_date;
      // start+ number_of_days = dueDate.
      booking.dueDate = moment(booking.start).add('days',booking.days_cover).toDate();
      booking.dueDateString = moment(booking.dueDate).format('dddd DD-MM');
      if(booking.dueDate > booking.end && debt(booking) <= 0) {
        booking.dueDate = null;
        booking.dueDateString = null;
      }
    }
    return booking.dueDate;
  }

  discount = function(booking) {
    if (booking.discount == null) {
      booking.discount = 0;
    }
    return booking.discount;
  }

  paid = function(booking) {
    if (booking.paid == null) {
      booking.paid = 0;
    }
    return booking.paid;
  }

  debt = function(booking) {
    if (booking.debt == null) {
      booking.debt = price(booking) - discount(booking) - paid(booking); 
    }
    return booking.debt;
  }

  currentDebt = function(booking) {
    if (booking.currentDebt == null) {
      booking.currentDebt = Math.max(0, currentPrice(booking) - discount(booking) - paid(booking)); 
    }
    return booking.currentDebt;
  }

  washCount = function(booking) {
    if (booking.washCount == null) {
      booking.washCount = 0;
    }
    return booking.washCount;
  }

  washPrecentage = function(booking) {
    if (booking.washPrecentage == null) {
      booking.washPrecentage = washCount(booking) / daysTillToday(booking);
    }
    return booking.washPrecentage;
  }
  

  convertBookingToJSON = function(bookingObject) {
    var booking = bookingObject.toJSON();
    if (booking.start) {
      booking.start_string = moment(new Date(booking.start.iso)).format('dddd DD-MM');
      booking.start = removeTime(new Date(booking.start.iso));
    }
    if (booking.end) {
      booking.end_string = moment(new Date(booking.end.iso)).format('dddd DD-MM');
      booking.end = removeTime(new Date(booking.end.iso));
    }
    return booking;
  }

  function removeTime(date) {
    date.setHours(0,0,0,0);
    return date;
  }
/////-----------------------------
  // calendar:
  function getBookingEvents(start, end, callback) {
    var query = new Parse.Query(Booking);
    query.find({success:function(bookingObjects) {
      var bookings = bookingObjects.map(convertBookingToJSON);
      var events = [];
      for (var i = 0; i < bookings.length; i++) {
        events.push(bookings[i]);
      }
      callback(events);
    }});  
  }

  // TODO: unit-test.
  function checkIfAvailable(booking, callback) {
    getFreeSapces(booking.start, booking.end, function(freeSpace) {
      for (var date in freeSpace) {
        if (freeSpace[date.toString()][booking.room] < booking.number_of_guests) {
          callback(false);
          return;
        }
      }
      callback(true);
    });
  }

  function getFreeSapcesEvents(start, end, callback){
    getFreeSapces(removeTime(new Date(start)), removeTime(new Date(end)), function(freeSpace) {
      var events = [];
      for (var date in freeSpace) {
        for(var room in freeSpace[date.toString()]){
          events.push({start:date, title: "[" + room + ": " + freeSpace[date.toString()][room] + "]"});
        }
      }
      callback(events);
    });
  }
/// Utils:
function maxDate (d1,d2) {
  return new Date(Math.max(d1, d2));
}
function minDate (d1,d2) {
  return new Date(Math.min(d1, d2));
}




