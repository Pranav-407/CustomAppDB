$(document).ready(function () {
    initCloneFormValidation();
    updateCloneFormBasedOnRole();
    setupRealTimeCloneEmailValidation();
    $('#cloneRole').on('change', updateCloneFormBasedOnRole);

    // Add class to role dropdown container for easier targeting (matching addUser)
    $('#cloneRole').closest('.form-group').addClass('clone-role-dropdown-container');

    // Handle role dropdown click/focus for rotation (matching addUser)
    $('#cloneRole').on('focus click mousedown', function () {
        $(this).closest('.form-group').addClass('show');
    });

    $('#cloneRole').on('blur change', function () {
        // Small delay to allow for option selection
        setTimeout(() => {
            $(this).closest('.form-group').removeClass('show');
        }, 150);
    });

    $(document).on('click', 'a.dropdown-item:contains("Clone User")', function (e) {
        e.preventDefault();
        handleCloneUserClick();
    });

    // NEW: Handle clone button click from within Edit User modal
    $(document).on('click', '#cloneUserBtn', function (e) {
        e.preventDefault();
        e.stopPropagation();
        handleCloneFromEditModal();
    });

    // Site and Group dropdown handlers
    $('#cloneSiteGroupDropdown .dropdown-btn').on('click', function (e) {
        e.stopPropagation();
        $('#cloneSiteGroupDropdown').toggleClass('show');
    });

    $('#cloneSiteGroupDropdown .dropdown-content').on('click', function (e) {
        e.stopPropagation();
    });

    $('#cloneSiteGroupDropdown input[type="checkbox"]').on('change', function () {
        updateCloneCounts();
    });

    // Site Only dropdown handlers
    $('#cloneSiteOnlyDropdown .dropdown-btn').on('click', function (e) {
        e.stopPropagation();
        $('#cloneSiteOnlyDropdown').toggleClass('show');
    });

    $('#cloneSiteOnlyDropdown .dropdown-content').on('click', function (e) {
        e.stopPropagation();
    });

    $('#cloneSiteOnlyDropdown input[type="checkbox"]').on('change', function () {
        updateCloneSiteOnlyCounts();
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#cloneSiteGroupDropdown').length) {
            $('#cloneSiteGroupDropdown').removeClass('show');
        }
        if (!$(e.target).closest('#cloneSiteOnlyDropdown').length) {
            $('#cloneSiteOnlyDropdown').removeClass('show');
        }
        // Close role dropdown when clicking outside (matching addUser)
        if (!$(e.target).closest('#cloneRole').length) {
            $('.clone-role-dropdown-container').removeClass('show');
        }
    });

    // Replace this event handler:
    $('#cloneFeatures input[type="checkbox"]').on('change', function () {
        const selectedRole = $('#cloneRole').val();
        if (selectedRole === 'Limited Administrator') {
            validateCloneFeatureSelection(); // Call validation on every change
        }
    });

    $('#cloneSubmitBtn').on('click', function (e) {
        e.preventDefault();
        if (validateCloneForm()) {
            submitCloneUserForm();
        } else {
            // Reapply error styling if email exists error is present
            const hasEmailExistenceError = $('#cloneEmailAddress').next('.error-message').length > 0 &&
                $('#cloneEmailAddress').next('.error-message').text().includes('already exists');
            if (hasEmailExistenceError) {
                $('#cloneEmailAddress').addClass('error');
            }
        }
    });

    updateCloneCounts();
    updateCloneSiteOnlyCounts();
    setupCloneModalCloseHandlers();
});

let cloneEmailValidationTimer = null;
function setupRealTimeCloneEmailValidation() {
    $('#cloneEmailAddress').on('input', function () {
        const email = $(this).val().trim();

        // Clear previous timer
        if (cloneEmailValidationTimer) {
            clearTimeout(cloneEmailValidationTimer);
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
        if (!$('#cloneUserForm').validate().element('#cloneEmailAddress')) {
            return; // Don't check existence if format is invalid
        }

        // Set new timer for debounced validation
        cloneEmailValidationTimer = setTimeout(() => {
            checkCloneEmailExistence(email);
        }, 800); // 800ms delay after user stops typing
    });

    // Prevent error styling from being removed on blur or form validation
    $('#cloneEmailAddress').on('blur focus', function () {
        // If there's a custom email existence error, keep the error styling
        if ($(this).data('hasCustomError')) {
            $(this).addClass('error');
        }
    });

    // Override jQuery validation's success method for this field
    const originalSuccessMethod = $('#cloneUserForm').validate().settings.success;
    $('#cloneUserForm').validate().settings.success = function (label, element) {
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
function checkCloneEmailExistence(email) {
    const emailField = $('#cloneEmailAddress');

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
function setupCloneModalCloseHandlers() {
    $('#CloneUserModal').on('hidden.bs.modal', function () {
        resetCloneModalForm();
    });
    $('.cancel-btn').on('click', function () {
        resetCloneModalForm();
    });
}
function handleCloneFromEditModal() {
    // Get data from the Edit modal form instead of grid
    const userData = {
        email: $('#editOriginalEmail').val(),
        fullName: $('#editFullName').val(),
        role: $('#editRole').val(),
        sites: getEditModalSitesString(),
        groups: getEditModalGroupsString(),
        features: getEditModalFeaturesString(),
        userManagement: $('#editAllowUserManagement').is(':checked')
    };

    populateCloneForm(userData);
    $('#CloneUserModal').modal('show');
}
function getEditModalSitesString() {
    const role = $('#editRole').val();
    if (role === 'Super Administrator') {
        return 'All';
    } else if (role === 'Administrator') {
        // For Administrator, get sites from site-only dropdown
        const selectedSites = [];
        $('#editSiteOnlyDropdown input.site-only:checked').each(function () {
            selectedSites.push($(this).parent().text().trim());
        });
        return selectedSites.length > 0 ? selectedSites.join(', ') : 'No Access to sites';
    } else {
        // For other roles, get sites from site-group dropdown
        const selectedSites = [];
        $('#editSiteGroupDropdown input.site:checked').each(function () {
            selectedSites.push($(this).val());
        });
        return selectedSites.length > 0 ? selectedSites.join(', ') : 'No Access to sites';
    }
}
function getEditModalGroupsString() {
    const role = $('#editRole').val();
    if (role === 'Super Administrator') {
        return 'All';
    } else if (role === 'Administrator') {
        // Administrator gets all groups for selected sites
        return 'All';
    } else {
        // For other roles, get groups from site-group dropdown
        const selectedGroups = [];
        $('#editSiteGroupDropdown input.group:checked').each(function () {
            selectedGroups.push($(this).val());
        });
        return selectedGroups.length > 0 ? selectedGroups.join(', ') : 'No Access to groups';
    }
}
function getEditModalFeaturesString() {
    const role = $('#editRole').val();

    if (role === 'Super Administrator') {
        return 'All';
    } else if (role === 'Administrator') {
        return 'All'; // Administrators typically have access to all features
    } else if (role === 'Remote Support') {
        return 'Remote Connect';
    } else if (role === 'Report Viewer') {
        return 'Analytics';
    } else if (role === 'Limited Administrator') {
        const selectedFeatures = [];
        const featureMapping = {
            'editApplications': 'Applications',
            'editOSDeployment': 'OS Deployment',
            'editDownloadAgent': 'Download Agent',
            'editTaskHistory': 'Task History',
            'editInventory': 'Inventory',
            'editTicketing': 'Ticketing',
            'editAntiVirus': 'Anti-Virus',
            'editMDM': 'MDM',
            'editWindowsUpdates': 'Windows Updates',
            'editPolicies': 'Policies',
            'editRemoteConnect': 'Remote Connect',
            'editComputers': 'Computers'
        };

        $('#editFeatures input[type="checkbox"]:checked').each(function () {
            const featureName = featureMapping[$(this).attr('id')];
            if (featureName) {
                selectedFeatures.push(featureName);
            }
        });

        return selectedFeatures.join(', ');
    }

    return '';
}
function handleCloneUserClick() {
    if (!selectedDeviceKey) {
        showNoUserSelectedToast()
        return;
    }

    const grid = $("#userGrid").dxDataGrid("instance");
    const selectedRowData = grid.getSelectedRowsData();

    if (!selectedRowData || selectedRowData.length === 0) {
        showNoUserSelectedToast()
        return;
    }

    const userData = selectedRowData[0];
    populateCloneForm(userData);
    $('#CloneUserModal').modal('show');
}
function populateCloneForm(userData) {
    $('#cloneOriginalEmail').val(userData.email);

    $('#cloneFullName').val('');
    $('#cloneEmailAddress').val('');

    $('#cloneRole').val(userData.role);

    resetCloneAllCheckboxes();
    updateCloneFormBasedOnRole();

    // Handle sites based on role
    if (userData.role === 'Administrator') {
        // For Administrator, populate site-only dropdown
        if (userData.sites && userData.sites !== 'All' && userData.sites !== 'No Access to sites') {
            const sites = userData.sites.split(',').map(s => s.trim());
            $('#cloneSiteOnlyDropdown input.site-only').each(function () {
                const siteText = $(this).parent().text().trim();
                if (sites.includes(siteText)) {
                    $(this).prop('checked', true);
                }
            });
        } else if (userData.sites === 'All') {
            $('#cloneSiteOnlyDropdown input.site-only').prop('checked', true);
        }
    } else {
        // For other roles, populate site-group dropdown
        if (userData.sites && userData.sites !== 'All' && userData.sites !== 'No Access to sites') {
            const sites = userData.sites.split(',').map(s => s.trim());
            $('#cloneSiteGroupDropdown input.site').each(function () {
                const siteValue = $(this).val();
                if (sites.includes(siteValue)) {
                    $(this).prop('checked', true);
                }
            });
        } else if (userData.sites === 'All') {
            $('#cloneSiteGroupDropdown input.site').prop('checked', true);
        }
    }

    // Handle groups (only for non-Administrator roles)
    if (userData.role !== 'Administrator') {
        if (userData.groups && userData.groups !== 'All' && userData.groups !== 'No Access to groups') {
            const groups = userData.groups.split(',').map(g => g.trim());
            $('#cloneSiteGroupDropdown input.group').each(function () {
                const groupValue = $(this).val();
                if (groups.includes(groupValue)) {
                    $(this).prop('checked', true);
                }
            });
        } else if (userData.groups === 'All') {
            $('#cloneSiteGroupDropdown input.group').prop('checked', true);
        }
    }

    if (userData.features && userData.features !== 'All') {
        const features = userData.features.split(',').map(f => f.trim());

        const featureMapping = {
            'Applications': 'cloneApplications',
            'OS Deployment': 'cloneOSDeployment',
            'Download Agent': 'cloneDownloadAgent',
            'Task History': 'cloneTaskHistory',
            'Inventory': 'cloneInventory',
            'Ticketing': 'cloneTicketing',
            'Anti-Virus': 'cloneAntiVirus',
            'MDM': 'cloneMDM',
            'Windows Updates': 'cloneWindowsUpdates',
            'Policies': 'clonePolicies',
            'Remote Connect': 'cloneRemoteConnect',
            'Computers': 'cloneComputers'
        };

        features.forEach(function (feature) {
            const checkboxId = featureMapping[feature];
            if (checkboxId) {
                $('#' + checkboxId).prop('checked', true);
            }
        });
    } else if (userData.features === 'All') {
        // If features is "All", select all feature checkboxes
        $('#cloneFeatures input[type="checkbox"]').prop('checked', true);
    }

    if (userData.role === 'Administrator' && userData.userManagement) {
        $('#cloneAllowUserManagement').prop('checked', userData.userManagement === 'True' || userData.userManagement === true);
    }

    updateCloneCounts();
    updateCloneSiteOnlyCounts();
}
function resetCloneModalForm() {
    // Clear email validation timer
    if (cloneEmailValidationTimer) {
        clearTimeout(cloneEmailValidationTimer);
        cloneEmailValidationTimer = null;
    }

    if ($('#cloneUserForm').data('validator')) {
        $('#cloneUserForm').validate().resetForm();
        $('#cloneUserForm')
            .find('.form-control')
            .removeClass('error')
            .removeAttr('aria-invalid')
            .removeData('hasCustomError');
    }
    $('#cloneUserForm')[0].reset();
    $('#cloneRole').val('Super Administrator');
    resetCloneAllCheckboxes();
    $('#cloneFeaturesSubtitle').hide();
    updateCloneFormBasedOnRole();

    $('#cloneEmailAddress').removeClass('error');
    $('#cloneEmailAddress').next('.error-message').remove();
    $('#cloneEmailAddress').removeData('hasCustomError');

    // Reset role dropdown rotation (matching addUser)
    $('.clone-role-dropdown-container').removeClass('show');
}
function updateCloneCounts() {
    const siteCount = $('#cloneSiteGroupDropdown input.site:checked').length;
    const groupCount = $('#cloneSiteGroupDropdown input.group:checked').length;
    $('#cloneSiteCount').text(siteCount);
    $('#cloneGroupCount').text(groupCount);
}
function updateCloneSiteOnlyCounts() {
    const siteOnlyCount = $('#cloneSiteOnlyDropdown input.site-only:checked').length;
    $('#cloneSiteOnlyCount').text(siteOnlyCount);
}
function resetCloneAllCheckboxes() {
    $('#cloneSiteGroupDropdown input[type="checkbox"]').prop('checked', false);
    $('#cloneSiteOnlyDropdown input[type="checkbox"]').prop('checked', false);
    $('#cloneAdministratorFeatures input[type="checkbox"]').prop('checked', false);
    $('#cloneFeatures input[type="checkbox"]').prop('checked', false);
    updateCloneCounts();
    updateCloneSiteOnlyCounts();
    validateCloneFeatureSelection();
}
function initCloneFormValidation() {
    $('#cloneUserForm').validate({
        errorClass: 'error',
        rules: getCloneFormValidationRules(),
        messages: getCloneFormValidationMessages(),
        errorPlacement: function (error, element) {
            error.insertAfter(element);
        },
    });
}
function getCloneFormValidationRules() {
    return {
        FullName: { required: true },
        EmailAddress: { required: true, email: true }
    };
}
function getCloneFormValidationMessages() {
    return {
        FullName: { required: "Required" },
        EmailAddress: { required: "Required", email: "Please enter a valid email address" }
    };
}
function validateCloneForm() {
    const isFormValid = $('#cloneUserForm').valid();

    // Check if email has an existence error
    const hasEmailExistenceError = $('#cloneEmailAddress').next('.error-message').length > 0 &&
        $('#cloneEmailAddress').next('.error-message').text().includes('already exists');

    const isEmailValid = !hasEmailExistenceError;

    // Only validate features if basic form validation passes
    if (!isFormValid || !isEmailValid) {
        // Hide feature validation message when basic form fields are invalid
        $('#cloneFeaturesSubtitle').hide();
        return false;
    }

    // Now validate features since basic form is valid
    const isFeaturesValid = validateCloneFeatureSelection();

    return isFormValid && isFeaturesValid && isEmailValid;
}
function validateCloneFeatureSelection() {
    const selectedRole = $('#cloneRole').val();
    const featuresSubtitle = $('#cloneFeaturesSubtitle');

    // Only Limited Administrator needs feature selection validation
    if (selectedRole === 'Limited Administrator') {
        const checkedFeatures = $('#cloneFeatures input[type="checkbox"]:checked').length;
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
function updateCloneFormBasedOnRole() {
    const selectedRole = $('#cloneRole').val();

    resetCloneAllCheckboxes();
    $('#cloneSiteAccessContainer').hide();
    $('#cloneSiteOnlyAccessContainer').hide();
    $('#cloneFeaturesSection').hide();
    $('#cloneAdministratorFeatures').hide();
    $('#cloneFeatures').hide();
    $('#cloneLimitedAdminFeatures').hide();
    $('#cloneSiteAccessInfo').hide();
    $('#cloneFeaturesSubtitle').hide();
    $('#cloneRoleInfo').hide();

    switch (selectedRole) {
        case 'Super Administrator':
            $('#cloneRoleInfo').text('A Super Administrator will have access to all Sites, Computer Groups and Features.');
            $('#cloneRoleInfo').show();
            break;
        case 'Administrator':
            $('#cloneSiteOnlyAccessContainer').show();
            $('#cloneFeaturesSection').show();
            $('#cloneAdministratorFeatures').show();
            $('#cloneRoleInfo').text('An Administrator will have access to all Computer Groups of any Sites they have been assigned control of.');
            $('#cloneRoleInfo').show();
            break;
        case 'Limited Administrator':
            $('#cloneSiteAccessContainer').show();
            $('#cloneFeaturesSection').show();
            $('#cloneFeatures').show();
            $('#cloneRoleInfo').text('A Limited Administrator will only have access to certain Sites, Computer Groups and Features as specified.');
            $('#cloneRoleInfo').show();
            break;
        case 'Remote Support':
            $('#cloneSiteAccessContainer').show();
            $('#cloneRoleInfo').text('A Remote Support user will only have access to specified sites and Computer Groups with Remote Connect functionality.');
            $('#cloneRoleInfo').show();
            break;
        case 'Report Viewer':
            $('#cloneSiteAccessContainer').show();
            $('#cloneRoleInfo').text('A Report Viewer will only have access to specified sites and Computer Groups with Analytics functionality.');
            $('#cloneRoleInfo').show();
            break;
    }
}
function submitCloneUserForm() {
    const selectedRole = $('#cloneRole').val();

    let features = [];

    // Handle features based on role
    if (selectedRole === 'Limited Administrator') {
        // Count total available features for Limited Administrator
        const totalAvailableFeatures = $('#cloneFeatures input[type="checkbox"]').length;
        const selectedFeaturesCount = $('#cloneFeatures input[type="checkbox"]:checked').length;

        // If all 12 features are selected, store "All"
        if (selectedFeaturesCount === totalAvailableFeatures && totalAvailableFeatures === 12) {
            features.push('All');
        } else {
            // Otherwise, store individual feature names
            $('#cloneFeatures input[type="checkbox"]:checked').each(function () {
                const label = $('label[for="' + $(this).attr('id') + '"]').text().trim();
                features.push(label);
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
        $('#cloneSiteOnlyDropdown input.site-only:checked').each(function () {
            sites.push($(this).parent().text().trim());
        });
        siteCount = sites.length;
    } else {
        // For other roles, get sites from site-group dropdown
        $('#cloneSiteGroupDropdown input.site:checked').each(function () {
            sites.push($(this).val());
        });
        siteCount = sites.length;
    }

    let groups = [];
    let groupCount = 0;

    if (selectedRole === 'Super Administrator') {
        groups = ['Group 1', 'Group 2', 'Group 3'];
        groupCount = 3;
    } else if (selectedRole === 'Administrator') {
        // Administrator gets all groups for selected sites
        groups = ['Group 1', 'Group 2', 'Group 3'];
        groupCount = 3;
    } else {
        // For other roles, get groups from site-group dropdown
        $('#cloneSiteGroupDropdown input.group:checked').each(function () {
            groups.push($(this).val());
        });
        groupCount = groups.length;
    }

    let allowUserManagement = false;
    if (selectedRole === 'Super Administrator') {
        allowUserManagement = true;
    } else if (selectedRole === 'Administrator') {
        allowUserManagement = $('#cloneAllowUserManagement').is(':checked');
    }

    let user = {
        FullName: $('#cloneFullName').val(),
        Email: $('#cloneEmailAddress').val(),
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
            $('#CloneUserModal').modal('hide');

            // NEW: Close Edit User modal if it's open
            if ($('#EditUserModal').hasClass('show')) {
                $('#EditUserModal').modal('hide');
            }
            showClonedToast(user.FullName);

            if (typeof clearGridSelection === 'function') {
                clearGridSelection();
            }

            if (typeof refreshUsersGrid === 'function') {
                refreshUsersGrid();
            }
        },
        error: function (xhr) {
            var msg = "Failed to clone user.";
            if (xhr && xhr.responseText) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    msg = response.message || xhr.responseText;
                } catch (e) {
                    msg = xhr.responseText;
                }
            }
            alert(msg);
        }
    });
}
function showClonedToast(userName) {
    const messageText = `"${userName}" cloned successfully. The invite email has been sent to the user.`;
    $('#userClonedMessage').text(messageText);

    const clonedToastEl = document.getElementById('userClonedToast');
    if (clonedToastEl) {
        const clonedToast = new bootstrap.Toast(clonedToastEl, { delay: 4000 }); // Increased delay for longer message
        clonedToast.show();
    }
}