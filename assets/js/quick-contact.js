// Quick email boxes (footer and home page call-to-action): POST the address to /api/callback.
$(function () {
    $('.js-quick-contact').on('submit', function (e) {
        e.preventDefault();

        var form = $(this);
        var input = form.find('input[name="email"]');
        var button = form.find('button');
        var original = input.attr('placeholder');
        var email = $.trim(input.val());

        if (!email) { input.focus(); return; }

        button.prop('disabled', true);

        $.ajax({
            type: 'POST',
            url: form.attr('action'),
            data: form.serialize() + '&page=' + encodeURIComponent(location.pathname),
            dataType: 'json'
        })
        .done(function (res) {
            if (res && res.ok === false) { return fail(res.error); }
            input.val('').attr('placeholder', 'Thank you! We will be in touch.');
        })
        .fail(function (xhr) {
            fail(xhr.responseJSON && xhr.responseJSON.error);
        })
        .always(function () {
            button.prop('disabled', false);
            setTimeout(function () { input.attr('placeholder', original); }, 6000);
        });

        function fail(msg) {
            input.attr('placeholder', msg || 'Could not send. Please email weanadgltd@hotmail.com');
        }
    });
});
