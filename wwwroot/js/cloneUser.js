let cloneEmailValidationTimer = null;

$(document).ready(function () {
    initCloneFormValidation();
    updateCloneFormBasedOnRole();
    setupRealTimeCloneEmailValidation();
    $('#cloneRole').on('change', updateCloneFormBasedOnRole);

    $('#cloneRole').closest('.form-group').addClass('clone-role-dropdown-container');

    $('#cloneRole').on('focus click mousedown', function () {
        $(this).closest('.form-group').addClass('show');
    });

    $('#cloneRole').on('blur change', function () {
        setTimeout(() => {
            $(this).closest('.form-group').removeClass('show');
        }, 150);
    });

    $(document).on('click', 'a.dropdown-item:contains("Clone User")', function (e) {
        e.preventDefault();
        handleCloneUserClick();
    });

    $(document).on('click', '#cloneUserBtn', function (e) {
        e.preventDefault();
        e.stopPropagation();
        handleCloneFromEditModal();
    });

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
        if (!$(e.target).closest('#cloneRole').length) {
            $('.clone-role-dropdown-container').removeClass('show');
        }
    });

    $('#cloneFeatures input[type="checkbox"]').on('change', function () {
        const selectedRole = $('#cloneRole').val();
        if (selectedRole === 'Limited Administrator') {
            validateCloneFeatureSelection();
        }
    });

    $('#cloneSubmitBtn').on('click', function (e) {
        e.preventDefault();
        if (validateCloneForm()) {
            submitCloneUserForm();
        } else {
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
function setupRealTimeCloneEmailValidation() {
    $('#cloneEmailAddress').on('input', function () {
        const email = $(this).val().trim();

        if (cloneEmailValidationTimer) {
            clearTimeout(cloneEmailValidationTimer);
        }

        $(this).removeClass('error');
        $(this).next('.error-message').remove();
        $(this).removeData('hasCustomError');

        if (email === '') {
            return;
        }

        if (!$('#cloneUserForm').validate().element('#cloneEmailAddress')) {
            return;
        }

        cloneEmailValidationTimer = setTimeout(() => {
            checkCloneEmailExistence(email);
        }, 800);
    });

    $('#cloneEmailAddress').on('blur focus', function () {
        if ($(this).data('hasCustomError')) {
            $(this).addClass('error');
        }
    });

    const originalSuccessMethod = $('#cloneUserForm').validate().settings.success;
    $('#cloneUserForm').validate().settings.success = function (label, element) {
        if ($(element).data('hasCustomError')) {
            $(element).addClass('error');
            return;
        }
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
function setupCloneModalCloseHandlers() {
    $('#CloneUserModal').on('hidden.bs.modal', function () {
        resetCloneModalForm();
    });
    $('.cancel-btn').on('click', function () {
        resetCloneModalForm();
    });
}
function handleCloneFromEditModal() {
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
        const selectedSites = [];
        $('#editSiteOnlyDropdown input.site-only:checked').each(function () {
            selectedSites.push($(this).parent().text().trim());
        });
        return selectedSites.length > 0 ? selectedSites.join(', ') : 'No Access to sites';
    } else {
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
        return 'All';
    } else {
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
        return 'All';
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

    if (userData.role === 'Administrator') {
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
        $('#cloneFeatures input[type="checkbox"]').prop('checked', true);
    }

    if (userData.role === 'Administrator' && userData.userManagement) {
        $('#cloneAllowUserManagement').prop('checked', userData.userManagement === 'True' || userData.userManagement === true);
    }

    updateCloneCounts();
    updateCloneSiteOnlyCounts();
}
function resetCloneModalForm() {
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

    const hasEmailExistenceError = $('#cloneEmailAddress').next('.error-message').length > 0 &&
        $('#cloneEmailAddress').next('.error-message').text().includes('already exists');

    const isEmailValid = !hasEmailExistenceError;

    if (!isFormValid || !isEmailValid) {
        $('#cloneFeaturesSubtitle').hide();
        return false;
    }

    const isFeaturesValid = validateCloneFeatureSelection();

    return isFormValid && isFeaturesValid && isEmailValid;
}
function validateCloneFeatureSelection() {
    const selectedRole = $('#cloneRole').val();
    const featuresSubtitle = $('#cloneFeaturesSubtitle');

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

    if (selectedRole === 'Limited Administrator') {
        const totalAvailableFeatures = $('#cloneFeatures input[type="checkbox"]').length;
        const selectedFeaturesCount = $('#cloneFeatures input[type="checkbox"]:checked').length;

        if (selectedFeaturesCount === totalAvailableFeatures && totalAvailableFeatures === 12) {
            features.push('All');
        } else {
            $('#cloneFeatures input[type="checkbox"]:checked').each(function () {
                const label = $('label[for="' + $(this).attr('id') + '"]').text().trim();
                features.push(label);
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
        $('#cloneSiteOnlyDropdown input.site-only:checked').each(function () {
            sites.push($(this).parent().text().trim());
        });
        siteCount = sites.length;
    } else {
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
        groups = ['Group 1', 'Group 2', 'Group 3'];
        groupCount = 3;
    } else {
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

            if ($('#EditUserModal').hasClass('show')) {
                $('#EditUserModal').modal('hide');
            }

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

            showClonedToast(user.FullName);

            if (typeof clearGridSelection === 'function') {
                clearGridSelection();
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
        const clonedToast = new bootstrap.Toast(clonedToastEl, { delay: 3000 });
        clonedToast.show();
    }
}