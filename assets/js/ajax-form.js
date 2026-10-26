$(function() {

    // Get the form.
    var form = $('#contact-form');

    // Get the messages div.
    var formMessages = $('.ajax-response');

    // Set up an event listener for the contact form.
    $(form).submit(function(e) {
        // Stop the browser from submitting the form.
        e.preventDefault();

        // Serialize the form data.
        var formData = $(form).serialize();

        // Submit the form using AJAX.
        $.ajax({
            type: 'POST',
            url: $(form).attr('action'),
            data: formData,
            dataType: 'json',
            headers: { 'Accept': 'application/json' },

            beforeSend: function() {
                // Show waiting message before sending
                $(formMessages).removeClass('success error');
                $(formMessages).addClass('info');
                $(formMessages).text('Please wait, mail is sending...');
            }
        })
        .done(function(response) {
            if (response && response.ok === false) {
                $(formMessages).removeClass('success info').addClass('error');
                $(formMessages).text(response.error || 'Oops! Your message could not be sent. Please email us at weanadgltd@hotmail.com.');
                return;
            }
            // Success
            $(formMessages).removeClass('error info');
            $(formMessages).addClass('success');
            $(formMessages).text('Thank you! Your message has been sent. We will get back to you shortly.');

            // Clear the form
            $('#contact-form input:not([type=hidden]),#contact-form textarea').val('');
        })
        .fail(function(data) {
            // Error
            $(formMessages).removeClass('success info');
            $(formMessages).addClass('error');

            $(formMessages).text('Oops! Your message could not be sent. Please email us at weanadgltd@hotmail.com.');
        });
    });

});
