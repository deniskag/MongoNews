

populateArticles();

$(document).on("click", "#scrape", function() {
  $.get("/scrape")
  .then(function(data){
    console.log(data);
    populateArticles();
  })
})
// Grab the articles as a json
function populateArticles() {
$.getJSON("/articles", function(data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
  // Display the apropos information on the page
    $("#articles").append('<h4 data-id='+ data[i]._id + '><span class="dataTitle">'+ data[i].title +'</span></h4>'+
      '<h5>'+ data[i].summary +'</h5>'
    + '<p data-id='+ data[i]._id + '><a target="_blank" href="'+ data[i].link + '"><span class="dataLink">Go to article</span></a></p>');
  }
})
}
// Whenever someone clicks a p tag
$(document).on("click", "h4", function() {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");
  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .done(function(data) {
      console.log(data);
      // The title of the article
      $("#notes").append("<h2>" + data.title + "</h2>");
      // // An input to enter a new title
      // $("#notes").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Comment</button>");
      // If there's a note in the article
      console.log(data.note);
        // a button to delete the notes on the article
      $('#notes').append('<button data-id="' + data.note._id + '" id="clearall">Delete Comment</button>');
        // place the body of the note in the body textarea
        $('#bodyinput').val(data.note.body);
      })
    });
// When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");
  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .done(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });
  // Also, remove the values entered in the inputarea for note entry
  $("#bodyinput").val("");
});

// when you click the clearall button
$(document).on('click', '#clearall', function(){
  // grab the id associated with the article from the submit button

  var thisId = $(this).attr('data-id');
  console.log(thisId);
  // run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/clearall/" + thisId,
    data: {
      body: $('#bodyinput').val() // value taken from note textarea
}
  })
    // with that done
    .done(function() {
      // log the response
      // empty the notes section
      $('#notes').empty();
        $('#bodyinput').val("");
    });
  });
