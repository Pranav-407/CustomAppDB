$(document).ready(function () {
    initFormValidation();
    updateFormBasedOnRole();
    setupRealTimeEmailValidation(); // Add this line
    $('#role').on('change', updateFormBasedOnRole);

    // Add class to role dropdown container for easier targeting
    $('#role').closest('.form-group').addClass('role-dropdown-container');

    // Handle role dropdown click/focus for rotation
    $('#role').on('focus click mousedown', function () {
        $(this).closest('.form-group').addClass('show');
    });

    $('#role').on('blur change', function () {
        // Small delay to allow for option selection
        setTimeout(() => {
            $(this).closest('.form-group').removeClass('show');
        }, 150);
    });

    // Site and Group dropdown handlers
    $('#siteGroupDropdown .dropdown-btn').on('click', function (e) {
        e.stopPropagation();
        $('#siteGroupDropdown').toggleClass('show');
    });
    $('#siteGroupDropdown .dropdown-content').on('click', function (e) {
        e.stopPropagation();
    });

    $('#siteGroupDropdown input[type="checkbox"]').on('change', function () {
        updateCounts();
    });

    // Site Only dropdown handlers
    $('#siteOnlyDropdown .dropdown-btn').on('click', function (e) {
        e.stopPropagation();
        $('#siteOnlyDropdown').toggleClass('show');
    });
    $('#siteOnlyDropdown .dropdown-content').on('click', function (e) {
        e.stopPropagation();
    });

    $('#siteOnlyDropdown input[type="checkbox"]').on('change', function () {
        updateSiteOnlyCounts();
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#siteGroupDropdown').length) {
            $('#siteGroupDropdown').removeClass('show');
        }
        if (!$(e.target).closest('#siteOnlyDropdown').length) {
            $('#siteOnlyDropdown').removeClass('show');
        }
        // Close role dropdown when clicking outside
        if (!$(e.target).closest('#role').length) {
            $('.role-dropdown-container').removeClass('show');
        }
    });

    // Replace this event handler:
    $('#Features input[type="checkbox"]').on('change', function () {
        const selectedRole = $('#role').val();
        if (selectedRole === 'Limited Administrator') {
            validateFeatureSelection(); // Call validation on every change
        }
    });

    $('#SubmitBtn').on('click', function (e) {
        e.preventDefault();
        if (validateForm()) {
            submitUserForm();
        } else {
            // Reapply error styling if email exists error is present
            const hasEmailExistenceError = $('#emailAddress').next('.error-message').length > 0 &&
                $('#emailAddress').next('.error-message').text().includes('already exists');
            if (hasEmailExistenceError) {
                $('#emailAddress').addClass('error');
            }
        }
    });

    updateCounts();
    updateSiteOnlyCounts();
    setupModalCloseHandlers();
});

let emailValidationTimer = null;
function setupRealTimeEmailValidation() {
    $('#emailAddress').on('input', function () {
        const email = $(this).val().trim();

        // Clear previous timer
        if (emailValidationTimer) {
            clearTimeout(emailValidationTimer);
        }

        // Clear previous validation states
        $(this).removeClass('error');
        $(this).next('.error-message').remove();
        $(this).removeData('hasCustomError');

        // If email is empty, don't validate
        if (email === '') {
            return;
        }

        // Let jQuery validation handle format validation first
        if (!$('#addUserForm').validate().element('#emailAddress')) {
            return; // Don't check existence if format is invalid
        }

        // Set new timer for debounced validation
        emailValidationTimer = setTimeout(() => {
            checkEmailExistence(email);
        }, 800); // 800ms delay after user stops typing
    });

    // Prevent error styling from being removed on blur or form validation
    $('#emailAddress').on('blur focus', function () {
        // If there's a custom email existence error, keep the error styling
        if ($(this).data('hasCustomError')) {
            $(this).addClass('error');
        }
    });

    // Override jQuery validation's success method for this field
    const originalSuccessMethod = $('#addUserForm').validate().settings.success;
    $('#addUserForm').validate().settings.success = function (label, element) {
        // Don't remove error class if we have a custom error
        if ($(element).data('hasCustomError')) {
            $(element).addClass('error');
            return;
        }
        // Call original success method for other fields
        if (originalSuccessMethod) {
            originalSuccessMethod.call(this, label, element);
        }
    };
}
function checkEmailExistence(email) {
    const emailField = $('#emailAddress');

    $.ajax({
        url: '/User/CheckEmailExists',
        type: 'GET',
        data: { email: email },
        success: function (exists) {
            if (exists === true || exists === "true") {
                emailField.addClass('error');
                emailField.after('<div class="error-message">Email already exists.</div>');

                // Mark field as having custom error to prevent jQuery validation from removing styling
                emailField.data('hasCustomError', true);
            } else {
                // Remove custom error flag when email is available
                emailField.removeData('hasCustomError');
            }
        },
        error: function () {
            emailField.addClass('error');
            emailField.after('<div class="error-message">Unable to verify email. Please try again.</div>');
            emailField.data('hasCustomError', true);
        }
    });
}
function setupModalCloseHandlers() {
    $('#AddUserModal').on('hidden.bs.modal', function () {
        resetModalForm();
    });
    $('.cancel-btn').on('click', function () {
        resetModalForm();
    });
}
function resetModalForm() {
    // Clear email validation timer
    if (emailValidationTimer) {
        clearTimeout(emailValidationTimer);
        emailValidationTimer = null;
    }

    if ($('#addUserForm').data('validator')) {
        $('#addUserForm').validate().resetForm();
        $('#addUserForm')
            .find('.form-control')
            .removeClass('error')
            .removeAttr('aria-invalid')
            .removeData('hasCustomError');
    }
    $('#addUserForm')[0].reset();
    $('#role').val('Super Administrator');
    resetAllCheckboxes();
    $('#featuresSubtitle').hide();
    updateFormBasedOnRole();

    $('#emailAddress').removeClass('error');
    $('#emailAddress').next('.error-message').remove();
    $('#emailAddress').removeData('hasCustomError');

    // Reset role dropdown rotation
    $('.role-dropdown-container').removeClass('show');
}
function updateCounts() {
    const siteCount = $('#siteGroupDropdown input.site:checked').length;
    const groupCount = $('#siteGroupDropdown input.group:checked').length;
    $('#siteCount').text(siteCount);
    $('#groupCount').text(groupCount);
}
function updateSiteOnlyCounts() {
    const siteOnlyCount = $('#siteOnlyDropdown input.site-only:checked').length;
    $('#siteOnlyCount').text(siteOnlyCount);
}
function resetAllCheckboxes() {
    $('#siteGroupDropdown input[type="checkbox"]').prop('checked', false);
    $('#siteOnlyDropdown input[type="checkbox"]').prop('checked', false);
    $('#administratorFeatures input[type="checkbox"]').prop('checked', false);
    $('#Features input[type="checkbox"]').prop('checked', false);
    updateCounts();
    updateSiteOnlyCounts();
    validateFeatureSelection();
}
function initFormValidation() {
    $('#addUserForm').validate({
        errorClass: 'error',
        rules: getFormValidationRules(),
        messages: getFormValidationMessages(),
        errorPlacement: function (error, element) {
            error.insertAfter(element);
        },
    });
}
function getFormValidationRules() {
    return {
        FullName: { required: true },
        EmailAddress: { required: true, email: true }
    };
}
function getFormValidationMessages() {
    return {
        FullName: { required: "Required" },
        EmailAddress: { required: "Required", email: "Please enter a valid email address" }
    };
}
function validateForm() {

    const isFormValid = $('#addUserForm').valid();

    const hasEmailExistenceError = $('#emailAddress').next('.error-message').length > 0 &&
        $('#emailAddress').next('.error-message').text().includes('already exists');

    const isEmailValid = !hasEmailExistenceError;
    const selectedRole = $('#role').val();

    let isFeaturesValid = true;
    if (selectedRole === 'Limited Administrator') {
        isFeaturesValid = validateFeatureSelection();
    } else {
        $('#featuresSubtitle').hide();
    }

    const allValid = isFormValid && isFeaturesValid && isEmailValid;

    return allValid;
}
function validateFeatureSelection() {

    const selectedRole = $('#role').val();
    const featuresSubtitle = $('#featuresSubtitle');


    if (selectedRole === 'Limited Administrator') {
        const checkedFeatures = $('#Features input[type="checkbox"]:checked').length;

        if (checkedFeatures === 0) {
            featuresSubtitle.text('(Please Select at least one feature)').show().css('color', '#dc3545');
            return false;
        } else {
            featuresSubtitle.hide();
            return true;
        }
    } else {
        featuresSubtitle.hide();
        return true;
    }
}
function updateFormBasedOnRole() {
    const selectedRole = $('#role').val();

    resetAllCheckboxes();
    $('#siteAccessContainer').hide();
    $('#siteOnlyAccessContainer').hide();
    $('#featuresSection').hide();
    $('#administratorFeatures').hide();
    $('#Features').hide();
    $('#limitedAdminFeatures').hide();
    $('#siteAccessInfo').hide();
    $('#featuresSubtitle').hide();
    $('#roleInfo').hide();

    switch (selectedRole) {
        case 'Super Administrator':
            $('#roleInfo').text('A Super Administrator will have access to all Sites, Computer Groups and Features.');
            $('#roleInfo').show();
            break;
        case 'Administrator':
            $('#siteOnlyAccessContainer').show();
            $('#featuresSection').show();
            $('#administratorFeatures').show();
            $('#roleInfo').text('An Administrator will have access to all Computer Groups of any Sites they have been assigned control of.');
            $('#roleInfo').show();
            break;
        case 'Limited Administrator':
            $('#siteAccessContainer').show();
            $('#featuresSection').show();
            $('#Features').show();
            $('#roleInfo').text('A Limited Administrator will only have access to certain Sites, Computer Groups and Features as specified.');
            $('#roleInfo').show();
            break;
        case 'Remote Support':
            $('#siteAccessContainer').show();
            $('#roleInfo').text('A Remote Support user will only have access to specified sites and Computer Groups with Remote Connect functionality.');
            $('#roleInfo').show();
            break;
        case 'Report Viewer':
            $('#siteAccessContainer').show();
            $('#roleInfo').text('A Report Viewer will only have access to specified sites and Computer Groups with Analytics functionality.');
            $('#roleInfo').show();
            break;
    }
}
function submitUserForm() {
    const selectedRole = $('#role').val();

    let features = [];

    // Handle features based on role
    if (selectedRole === 'Limited Administrator') {
        // Count total available features for Limited Administrator
        const totalAvailableFeatures = $('#Features input[type="checkbox"]').length;
        const selectedFeaturesCount = $('#Features input[type="checkbox"]:checked').length;

        // If all 12 features are selected, store "All"
        if (selectedFeaturesCount === totalAvailableFeatures && totalAvailableFeatures === 12) {
            features.push('All');
        } else {
            // Otherwise, store individual feature names
            $('#Features input[type="checkbox"]:checked').each(function () {
                features.push($(this).attr('id') || $(this).val());
            });
        }
    } else if (selectedRole === 'Remote Support') {
        // For Remote Support, automatically add Remote Connect
        features.push('Remote Connect');
    } else if (selectedRole === 'Report Viewer') {
        // For Report Viewer, automatically add Analytics
        features.push('Analytics');
    }
    // For Super Administrator and Administrator, features array remains empty or is handled differently

    let sites = [];
    let siteCount = 0;

    if (selectedRole === 'Super Administrator') {
        sites = ['Site 1', 'Site 2', 'Site 3'];
        siteCount = 3;
    } else if (selectedRole === 'Administrator') {
        // For Administrator, get sites from site-only dropdown
        $('#siteOnlyDropdown input.site-only:checked').each(function () {
            sites.push($(this).parent().text().trim());
        });
        siteCount = sites.length;
    } else {
        $('#siteGroupDropdown input.site:checked').each(function () {
            sites.push($(this).parent().text().trim());
        });
        siteCount = sites.length;
    }

    let groups = [];
    let groupCount = 0;

    if (selectedRole === 'Super Administrator') {
        groups = ['Group 1', 'Group 2', 'Group 3'];
        groupCount = 3;
    } else if (selectedRole === 'Administrator') {
        groups = ['Group 1', 'Group 2', 'Group 3'];
        groupCount = 3;
    } else {
        $('#siteGroupDropdown input.group:checked').each(function () {
            groups.push($(this).parent().text().trim());
        });
        groupCount = groups.length;
    }

    let allowUserManagement = false;
    if (selectedRole === 'Super Administrator') {
        allowUserManagement = true;
    } else if (selectedRole === 'Administrator') {
        allowUserManagement = $('#allowUserManagement').is(':checked');
    }

    let user = {
        FullName: $('#fullName').val() || $('#fullName').text(),
        Email: $('#emailAddress').val(),
        Password: "1234",
        Role: selectedRole,
        UserType: 'Deploy user',
        Features: features,
        Sites: sites,
        Groups: groups,
        AllowUserManagement: allowUserManagement,
        SiteCount: siteCount,
        GroupCount: groupCount
    };

    $.ajax({
        url: '/User/AddUser',
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(user),
        success: function (response) {
            $('#AddUserModal').modal('hide');

            showCreatedToast(user.FullName);

            if (typeof refreshUsersGrid === 'function') {
                refreshUsersGrid();
            }
        },
        error: function (xhr) {
            var msg = "Failed to add user.";
            if (xhr && xhr.responseText) msg = xhr.responseText;
            alert(msg);
        }
    });
}
function showCreatedToast(userName) {
    const messageText = `"${userName}" added successfully. The invite email has been sent to the user.`;
    $('#userAddedMessage').text(messageText);

    const createdToastEl = document.getElementById('userAddedToast');
    if (createdToastEl) {
        const createdToast = new bootstrap.Toast(createdToastEl, { delay: 4000 }); // Increased delay for longer message
        createdToast.show();
    }
}