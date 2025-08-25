let emailValidationTimer = null;

$(document).ready(function () {
    initFormValidation();
    updateFormBasedOnRole();
    setupRealTimeEmailValidation();

    $('#role').on('change', updateFormBasedOnRole);

    $('#role').closest('.form-group').addClass('role-dropdown-container');

    $('#role').on('focus click mousedown', function () {
        $(this).closest('.form-group').addClass('show');
    });

    $('#role').on('blur change', function () {
        setTimeout(() => {
            $(this).closest('.form-group').removeClass('show');
        }, 150);
    });

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
        if (!$(e.target).closest('#role').length) {
            $('.role-dropdown-container').removeClass('show');
        }
    });

    $('#Features input[type="checkbox"]').on('change', function () {
        const selectedRole = $('#role').val();
        if (selectedRole === 'Limited Administrator') {
            validateFeatureSelection();
        }
    });

    $('#SubmitBtn').on('click', function (e) {
        e.preventDefault();
        if (validateForm()) {
            submitUserForm();
        } else {
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
function setupRealTimeEmailValidation() {
    $('#emailAddress').on('input', function () {
        const email = $(this).val().trim();

        if (emailValidationTimer) {
            clearTimeout(emailValidationTimer);
        }

        $(this).removeClass('error');
        $(this).next('.error-message').remove();
        $(this).removeData('hasCustomError');

        if (email === '') {
            return;
        }

        if (!$('#addUserForm').validate().element('#emailAddress')) {
            return; 
        }

        emailValidationTimer = setTimeout(() => {
            checkEmailExistence(email);
        }, 800);
    });

    $('#emailAddress').on('blur focus', function () {
        if ($(this).data('hasCustomError')) {
            $(this).addClass('error');
        }
    });

    const originalSuccessMethod = $('#addUserForm').validate().settings.success;
    $('#addUserForm').validate().settings.success = function (label, element) {
        if ($(element).data('hasCustomError')) {
            $(element).addClass('error');
            return;
        }
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

                emailField.data('hasCustomError', true);
            } else {
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

    if (selectedRole === 'Limited Administrator') {
        const totalAvailableFeatures = $('#Features input[type="checkbox"]').length;
        const selectedFeaturesCount = $('#Features input[type="checkbox"]:checked').length;

        if (selectedFeaturesCount === totalAvailableFeatures && totalAvailableFeatures === 12) {
            features.push('All');
        } else {
            $('#Features input[type="checkbox"]:checked').each(function () {
                features.push($(this).attr('id') || $(this).val());
            });
        }
    } else if (selectedRole === 'Remote Support') {
        features.push('Remote Connect');
    } else if (selectedRole === 'Report Viewer') {
        features.push('Analytics');
    }

    let sites = [];
    let siteCount = 0;

    if (selectedRole === 'Super Administrator') {
        sites = ['Site 1', 'Site 2', 'Site 3'];
        siteCount = 3;
    } else if (selectedRole === 'Administrator') {
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
            const newUserForGrid = {
                id: user.Email,
                fullName: user.FullName,           
                email: user.Email,                
                userType: user.UserType,       
                role: user.Role,           
                siteCount: siteCount,
                sites: formatSitesForGrid(sites, selectedRole, siteCount),
                features: formatFeaturesForGrid(features, selectedRole),
                groups: formatGroupsForGrid(groups, selectedRole, groupCount),
                groupCount: groupCount,
                createdOn: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
                lastLogin: 'Never logged in',
                userManagement: allowUserManagement
            };
            addUserToLocalData(newUserForGrid);
            showCreatedToast(user.FullName);
        },
        error: function (xhr) {
            var msg = "Failed to add user.";
            if (xhr && xhr.responseText) msg = xhr.responseText;
            alert(msg);
        }
    });
}
function formatSitesForGrid(sites, role, siteCount) {
    if (role === 'Super Administrator') {
        return 'All';
    } else if (siteCount === 0) {
        return 'No Access to sites';
    } else if (siteCount === 3) {
        return 'All';
    } else {
        return sites.join(', ');
    }
}
function formatFeaturesForGrid(features, role) {
    if (role === 'Super Administrator' || role === 'Administrator') {
        return 'All';
    } else if (features.length === 0) {
        return '';
    } else if (features.includes('All')) {
        return 'All';
    } else {
        return features.join(', ');
    }
}
function formatGroupsForGrid(groups, role, groupCount) {
    if (role === 'Super Administrator') {
        return 'All';
    } else if (groupCount === 0) {
        return 'No Access to groups';
    } else if (groupCount === 3) { 
        return 'All';
    } else {
        return groups.join(', ');
    }
}
function showCreatedToast(userName) {
    const messageText = `"${userName}" added successfully. The invite email has been sent to the user.`;
    $('#userAddedMessage').text(messageText);

    const createdToastEl = document.getElementById('userAddedToast');
    if (createdToastEl) {
        const createdToast = new bootstrap.Toast(createdToastEl, { delay: 3000 });
        createdToast.show();
    }
}