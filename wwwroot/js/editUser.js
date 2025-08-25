$(document).ready(function () {
    initEditFormValidation();
    updateEditFormBasedOnRole();
    $('#editRole').on('change', updateEditFormBasedOnRole);

    $(document).on('click', 'a.dropdown-item:contains("Edit User")', function (e) {
        e.preventDefault();
        handleEditUserClick();
    });

    $('#editRole').closest('.form-group').addClass('edit-role-dropdown-container');

    $('#editRole').on('focus click mousedown', function () {
        $(this).closest('.form-group').addClass('show');
    });

    $('#editRole').on('blur change', function () {
        setTimeout(() => {
            $(this).closest('.form-group').removeClass('show');
        }, 150);
    });

    $('#editSiteGroupDropdown .dropdown-btn').on('click', function (e) {
        e.stopPropagation();
        $('#editSiteGroupDropdown').toggleClass('show');
    });

    $('#editSiteGroupDropdown .dropdown-content').on('click', function (e) {
        e.stopPropagation();
    });

    $('#editSiteGroupDropdown input[type="checkbox"]').on('change', function () {
        updateEditCounts();
    });

    $('#editSiteOnlyDropdown .dropdown-btn').on('click', function (e) {
        e.stopPropagation();
        $('#editSiteOnlyDropdown').toggleClass('show');
    });

    $('#editSiteOnlyDropdown .dropdown-content').on('click', function (e) {
        e.stopPropagation();
    });

    $('#editSiteOnlyDropdown input[type="checkbox"]').on('change', function () {
        updateEditSiteOnlyCounts();
    });

    $('#sendInviteEmailBtn').on('click', function (e) {
        e.stopPropagation();
        showSendInviteEmailToast();
    });

    $('#sendPasswordResetBtn').on('click', function (e) {
        e.stopPropagation();
        showPasswordResetEmailToast();
    });

    $('#cloneUserBtn').on('click', function (e) {
        $('#CloneUserModal').modal('show');
    });

    $('#deleteUserBtn').on('click', function (e) {
        $('#deleteConfirmationModal').modal('show');
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#editSiteGroupDropdown').length) {
            $('#editSiteGroupDropdown').removeClass('show');
        }
        if (!$(e.target).closest('#editSiteOnlyDropdown').length) {
            $('#editSiteOnlyDropdown').removeClass('show');
        }
        if (!$(e.target).closest('#editRole').length) {
            $('.edit-role-dropdown-container').removeClass('show');
        }
    });;

    $('#editFeatures input[type="checkbox"]').on('change', function () {
        const selectedRole = $('#editRole').val();
        if (selectedRole === 'Limited Administrator') {
            validateEditFeatureSelection();
        }
    });

    $('#editSubmitBtn').on('click', function (e) {
        e.preventDefault();
        if (validateEditForm()) {
            checkEditEmailAndSubmit();
        }
    });

    updateEditCounts();
    updateEditSiteOnlyCounts();
    setupEditModalCloseHandlers();
});

function setupEditModalCloseHandlers() {
    $('#EditUserModal').on('hidden.bs.modal', function () {
        resetEditModalForm();
    });
    $('.cancel-btn').on('click', function () {
        resetEditModalForm();
    });
}
function handleEditUserClick() {
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
    populateEditForm(userData);
    $('#EditUserModal').modal('show');
}
function populateEditForm(userData) {
    $('#editOriginalEmail').val(userData.email);

    $('#displayUserEmail').text(userData.email);

    $('#editFullName').val(userData.fullName);
    $('#editRole').val(userData.role);

    resetEditAllCheckboxes();
    updateEditFormBasedOnRole();

    if (userData.role === 'Administrator') {
        if (userData.sites && userData.sites !== 'All' && userData.sites !== 'No Access to sites') {
            const sites = userData.sites.split(',').map(s => s.trim());
            $('#editSiteOnlyDropdown input.site-only').each(function () {
                const siteText = $(this).parent().text().trim();
                if (sites.includes(siteText)) {
                    $(this).prop('checked', true);
                }
            });
        } else if (userData.sites === 'All') {
            $('#editSiteOnlyDropdown input.site-only').prop('checked', true);
        }
    } else {
        if (userData.sites && userData.sites !== 'All' && userData.sites !== 'No Access to sites') {
            const sites = userData.sites.split(',').map(s => s.trim());
            $('#editSiteGroupDropdown input.site').each(function () {
                const siteValue = $(this).val();
                if (sites.includes(siteValue)) {
                    $(this).prop('checked', true);
                }
            });
        } else if (userData.sites === 'All') {
            $('#editSiteGroupDropdown input.site').prop('checked', true);
        }
    }

    if (userData.role !== 'Administrator') {
        if (userData.groups && userData.groups !== 'All' && userData.groups !== 'No Access to groups') {
            const groups = userData.groups.split(',').map(g => g.trim());
            $('#editSiteGroupDropdown input.group').each(function () {
                const groupValue = $(this).val();
                if (groups.includes(groupValue)) {
                    $(this).prop('checked', true);
                }
            });
        } else if (userData.groups === 'All') {
            $('#editSiteGroupDropdown input.group').prop('checked', true);
        }
    }

    if (userData.features && userData.features !== 'All') {
        const features = userData.features.split(',').map(f => f.trim());

        const featureMapping = {
            'Applications': 'editApplications',
            'OS Deployment': 'editOSDeployment',
            'Download Agent': 'editDownloadAgent',
            'Task History': 'editTaskHistory',
            'Inventory': 'editInventory',
            'Ticketing': 'editTicketing',
            'Anti-Virus': 'editAntiVirus',
            'MDM': 'editMDM',
            'Windows Updates': 'editWindowsUpdates',
            'Policies': 'editPolicies',
            'Remote Connect': 'editRemoteConnect',
            'Computers': 'editComputers'
        };

        features.forEach(function (feature) {
            const checkboxId = featureMapping[feature];
            if (checkboxId) {
                $('#' + checkboxId).prop('checked', true);
            }
        });
    } else if (userData.features === 'All') {
        $('#editFeatures input[type="checkbox"]').prop('checked', true);
    }

    if (userData.role === 'Administrator' && userData.userManagement) {
        $('#editAllowUserManagement').prop('checked', userData.userManagement === 'True' || userData.userManagement === true);
    }

    updateEditCounts();
    updateEditSiteOnlyCounts();
}
function resetEditModalForm() {
    if ($('#editUserForm').data('validator')) {
        $('#editUserForm').validate().resetForm();
        $('#editUserForm')
            .find('.form-control')
            .removeClass('error')
            .removeAttr('aria-invalid');
    }
    $('#editUserForm')[0].reset();
    $('#editRole').val('Super Administrator');
    resetEditAllCheckboxes();
    $('.edit-role-dropdown-container').removeClass('show');
    $('#editFeaturesSubtitle').hide();
    updateEditFormBasedOnRole();

    $('#displayUserEmail').text('');
}
function updateEditCounts() {
    const siteCount = $('#editSiteGroupDropdown input.site:checked').length;
    const groupCount = $('#editSiteGroupDropdown input.group:checked').length;
    $('#editSiteCount').text(siteCount);
    $('#editGroupCount').text(groupCount);
}
function updateEditSiteOnlyCounts() {
    const siteOnlyCount = $('#editSiteOnlyDropdown input.site-only:checked').length;
    $('#editSiteOnlyCount').text(siteOnlyCount);
}
function resetEditAllCheckboxes() {
    $('#editSiteGroupDropdown input[type="checkbox"]').prop('checked', false);
    $('#editSiteOnlyDropdown input[type="checkbox"]').prop('checked', false);
    $('#editAdministratorFeatures input[type="checkbox"]').prop('checked', false);
    $('#editFeatures input[type="checkbox"]').prop('checked', false);
    updateEditCounts();
    updateEditSiteOnlyCounts();
    validateEditFeatureSelection();
}
function initEditFormValidation() {
    $('#editUserForm').validate({
        errorClass: 'error',
        rules: getEditFormValidationRules(),
        messages: getEditFormValidationMessages(),
        errorPlacement: function (error, element) {
            error.insertAfter(element);
        },
    });
}
function getEditFormValidationRules() {
    return {
        FullName: { required: true }
    };
}
function getEditFormValidationMessages() {
    return {
        FullName: { required: "This field is required" }
    };
}
function validateEditForm() {

    const isFormValid = $('#editUserForm').valid();
    const selectedRole = $('#editRole').val();

    let isFeaturesValid = true;
    if (selectedRole === 'Limited Administrator') {
        isFeaturesValid = validateEditFeatureSelection();
    } else {
        $('#editFeaturesSubtitle').hide();
    }
    const allValid = isFormValid && isFeaturesValid;

    return allValid;
}
function validateEditFeatureSelection() {
    const selectedRole = $('#editRole').val();
    const featuresSubtitle = $('#editFeaturesSubtitle');
    if (selectedRole === 'Limited Administrator') {
        const checkedFeatures = $('#editFeatures input[type="checkbox"]:checked').length;

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
function updateEditFormBasedOnRole() {
    const selectedRole = $('#editRole').val();

    $('#editSiteAccessContainer').hide();
    $('#editSiteOnlyAccessContainer').hide();
    $('#editFeaturesSection').hide();
    $('#editAdministratorFeatures').hide();
    $('#editFeatures').hide();
    $('#editLimitedAdminFeatures').hide();
    $('#editSiteAccessInfo').hide();
    $('#editFeaturesSubtitle').hide();
    $('#editRoleInfo').hide();

    switch (selectedRole) {
        case 'Super Administrator':
            $('#editRoleInfo').text('A Super Administrator will have access to all Sites, Computer Groups and Features');
            $('#editRoleInfo').show();
            break;
        case 'Administrator':
            $('#editSiteOnlyAccessContainer').show();
            $('#editFeaturesSection').show();
            $('#editAdministratorFeatures').show();
            $('#editRoleInfo').text('An Administrator will have access to all Computer Groups of any sites they have been assigned control of');
            $('#editRoleInfo').show();
            break;
        case 'Limited Administrator':
            $('#editSiteAccessContainer').show();
            $('#editFeaturesSection').show();
            $('#editFeatures').show();
            $('#editRoleInfo').text('A Limited Administrator will have access to certain sites, Computer Groups and Features as specified.');
            $('#editRoleInfo').show();
            break;
        case 'Remote Support':
            $('#editSiteAccessContainer').show();
            $('#editRoleInfo').text('A Remote Support user will have access to specified sites and Computer Groups with Remote Connect functionality.');
            $('#editRoleInfo').show();
            break;
        case 'Report Viewer':
            $('#editSiteAccessContainer').show();
            $('#editRoleInfo').text('A Report Viewer will have access to specified sites and Computer Groups with Analytics functionality.');
            $('#editRoleInfo').show();
            break;
    }
}
function checkEditEmailAndSubmit() {
    submitEditUserForm();
}
function submitEditUserForm() {
    const selectedRole = $('#editRole').val();

    let features = [];

    if (selectedRole === 'Limited Administrator') {
        const totalAvailableFeatures = $('#editFeatures input[type="checkbox"]').length;
        const selectedFeaturesCount = $('#editFeatures input[type="checkbox"]:checked').length;

        if (selectedFeaturesCount === totalAvailableFeatures && totalAvailableFeatures === 12) {
            features.push('All');
        } else {
            $('#editFeatures input[type="checkbox"]:checked').each(function () {
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
        $('#editSiteOnlyDropdown input.site-only:checked').each(function () {
            sites.push($(this).parent().text().trim());
        });
        siteCount = sites.length;
    } else {
        $('#editSiteGroupDropdown input.site:checked').each(function () {
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
        $('#editSiteGroupDropdown input.group:checked').each(function () {
            groups.push($(this).val());
        });
        groupCount = groups.length;
    }

    let allowUserManagement = false;
    if (selectedRole === 'Super Administrator') {
        allowUserManagement = true;
    } else if (selectedRole === 'Administrator') {
        allowUserManagement = $('#editAllowUserManagement').is(':checked');
    }

    let user = {
        OriginalEmail: $('#editOriginalEmail').val(),
        FullName: $('#editFullName').val(),
        Email: $('#editOriginalEmail').val(),
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
        url: '/User/UpdateUser',
        type: 'PUT',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(user),
        success: function (response) {
            $('#EditUserModal').modal('hide');

            const updatedUserForGrid = {
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
                userManagement: allowUserManagement,
                originalEmail: user.OriginalEmail
            };

            updateUserInLocalData(updatedUserForGrid);
            showUpdatedToast();
            clearGridSelection();
        },
        error: function (xhr) {
            var msg = "Failed to update user.";
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
function showUpdatedToast() {
    const updatedToastEl = document.getElementById('userUpdatedToast');
    if (updatedToastEl) {
        const updatedToast = new bootstrap.Toast(updatedToastEl, { delay: 3000 });
        updatedToast.show();
    }
}