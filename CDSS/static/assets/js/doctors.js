$(document).ready(function() {
  // Make an AJAX request to fetch doctors data from the backend
  $.ajax({
    url: '/get_doctors', // Endpoint URL
    type: 'GET',
    success: function(data) {
      // Initialize an empty array to store doctor cards
      var doctorCards = [];

      // Iterate through the array of doctors
      data.forEach(function(doctor) {
        // Determine the image URL based on the doctor's gender
        var doctorImage;
        if (doctor.Gender === 'male') {
          var maleImages = ["male_doctor1.jpg", "male_doctor2.jpg"]; // Add more male doctor images if needed
          doctorImage = './images/' + maleImages[Math.floor(Math.random() * maleImages.length)];
        } else if (doctor.Gender === 'female') {
          var femaleImages = ["female_doctor1.jpg", "female_doctor2.jpg"]; // Add more female doctor images if needed
          doctorImage = 'static/assets/images/' + femaleImages[Math.floor(Math.random() * femaleImages.length)];
        }

        // Create HTML elements to display doctor information
        var doctorCard = '<div class="item">'+
                            '<div class="box">'+
                              '<div class="img-box">'+
                                '<div class="profile-image-square">' + '<img src="' + doctorImage + '" alt="">' + '</div>' + 
                              '</div>'+
                              '<div class="detail-box">'+
                                '<div class="info">'+
                                  '<h5>' + doctor.DoctorName  + '</h5>'+ // Assuming DoctorName is the name of the doctor
                                  '<h6>' + doctor.Experience  + ' of experience</h6>'+ // Assuming Experience is the experience of the doctor
                                  '<h6>' + doctor.Category + '</h6>' + // Assuming Category is the category of the doctor
                                '</div>'+
                              '</div>'+
                            '</div>'+
                          '</div>';

        // Push the doctor card HTML to the array
        doctorCards.push(doctorCard);
      });
      
      // Append the doctor cards to the carousel
      $('.team_carousel').html(doctorCards.join(''));

      // Initialize the Owl Carousel after appending all doctors
      $('.team_carousel').owlCarousel({
        loop: true,
        margin: 30,
        nav: false,
        dots: true,
        responsive: {
          0: {
            items: 1 // Display one doctor on smaller screens
          },
          1000: {
            items: 4 // Display four doctors on screens wider than 1000px
          }
        }
      });
    },
    error: function(xhr, status, error) {
      console.error('Error fetching doctors:', error);
    }
  });
});
