let selectedAppData = null;
let customAppGrid = null;
let checkEditURLAndToggleCheckbox;

let customAppsData = [];


$(document).ready(function () {
    initEditFormValidation();
    initializeCustomAppGrid();
    handleEditURLCheckboxVisibility();

    $('#appRunAs').on('change', function () {
        const show = $(this).val() === 'User';

        $('#userLoginId').val("");
        $('#userPassword').val("");
        $('#userDomain').val("");

        $('#userCredentialsFields').toggle(show);
    });

    $('#editAppBtn').on('click', function () {
        if (!selectedAppData) return;

        $('#appModalTitle').text("Edit Custom App");
        $('#appPackageName').val(selectedAppData.PackageName);
        $('#appURL').val(selectedAppData.URL);
        $('#appArchitecture').val(selectedAppData.Architecture);
        $('#appInstallCmd').val(selectedAppData.InstallCommandLine);
        $('#appUninstallCmd').val(selectedAppData.UninstallCommand);
        $('#appRestart').val(selectedAppData.Restart);
        $('#appTimeout').val(selectedAppData.InstallTimeout);
        $('#appRunAs').val(selectedAppData.RunAs);
        $('#userLoginId').val(selectedAppData.LoginId);
        $('#userPassword').val(selectedAppData.Password);
        $('#userDomain').val(selectedAppData.Domain);
        $('#extractCheckbox').prop('checked', selectedAppData.Extract);

        if (selectedAppData.RunAs === 'User') {
            $('#userCredentialsFields').show();
        } else {
            $('#userCredentialsFields').hide();
        }

        // FIXED: Now this function is available in global scope
        if (typeof checkEditURLAndToggleCheckbox === 'function') {
            checkEditURLAndToggleCheckbox();
        }

        new bootstrap.Modal(document.getElementById('EditAppModal')).show();
    });

    $('#saveAppBtn').on('click', function () {
        if (!selectedAppData) return;
        if (!$('#EditAppForm').valid()) return;

        const appData = {
            ID: selectedAppData.ID,
            PackageName: $('#appPackageName').val(),
            URL: $('#appURL').val(),
            Architecture: $('#appArchitecture').val(),
            InstallCommandLine: $('#appInstallCmd').val(),
            UninstallCommand: $('#appUninstallCmd').val(),
            Restart: $('#appRestart').val(),
            InstallTimeout: parseInt($('#appTimeout').val(), 10) || 0,
            RunAs: $('#appRunAs').val(),
            LoginId: $('#userLoginId').val() || '',
            Password: $('#userPassword').val() || '',
            Domain: $('#userDomain').val() || '',
            Extract: $('#extractCheckbox').is(':checked')
        };

        $.ajax({
            url: `/custom-apps/update/${selectedAppData.ID}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(appData),
            success: function (response) {
                // Close modal first
                bootstrap.Modal.getInstance(document.getElementById('EditAppModal')).hide();

                // Show success toast
                const updatedToastEl = document.getElementById('appUpdatedToast');
                if (updatedToastEl) {
                    const updatedToast = new bootstrap.Toast(updatedToastEl, {
                        delay: 2500
                    });
                    updatedToast.show();
                }

                // Update local data and refresh grid
                const index = customAppsData.findIndex(app => app.ID === selectedAppData.ID);
                if (index !== -1) {
                    customAppsData[index] = { ...appData };
                    if (customAppGrid) {
                        customAppGrid.option('dataSource', []);
                        customAppGrid.option('dataSource', customAppsData);
                        customAppGrid.refresh();
                    }
                }
            },
            error: function (xhr, status, error) {
                console.error('Error updating app:', xhr.responseText);
            }
        });
    });

    $('#deleteAppBtn').on('click', function () {
        if (!selectedAppData) return;
        $('#deleteAppName').text(selectedAppData.PackageName);
        new bootstrap.Modal(document.getElementById('confirmDeleteAppModal')).show();
    });

    $('#confirmDeleteBtn').on('click', function () {
        if (!selectedAppData) return;

        $.ajax({
            url: `/custom-apps/delete/${selectedAppData.ID}`,
            type: 'DELETE',
            success: function (response) {
                // Close modal first
                bootstrap.Modal.getInstance(document.getElementById('confirmDeleteAppModal')).hide();

                // Remove from local data and refresh grid
                const index = customAppsData.findIndex(app => app.ID === selectedAppData.ID);
                if (index !== -1) {
                    customAppsData.splice(index, 1);
                    if (customAppGrid) {
                        customAppGrid.option('dataSource', []);
                        customAppGrid.option('dataSource', customAppsData);
                        customAppGrid.refresh();
                    }
                }

                // Show delete toast
                const deletedToastEl = document.getElementById('appDeletedToast');
                if (deletedToastEl) {
                    const deletedToast = new bootstrap.Toast(deletedToastEl, {
                        delay: 2500
                    });
                    deletedToast.show();
                }

                // Reset selection
                selectedAppData = null;
                $('#editAppBtn').prop('disabled', true);
                $('#deleteAppBtn').prop('disabled', true);
            },
            error: function (xhr, status, error) {
                console.error('Error deleting app:', xhr.responseText);
            }
        });
    });

    $("#appSearchInput").on("input", function () {
        const val = $(this).val();
        if (customAppGrid) {
            customAppGrid.searchByText(val);
        }

        if (val.length > 0) {
            $("#clearAppSearch").show();
        } else {
            $("#clearAppSearch").hide();
        }
    });

    $("#clearAppSearch").on("click", function () {
        $("#appSearchInput").val('').trigger('input');
        $(this).hide();
    });

    $('#EditAppModal .btn-close, #EditAppModal [data-dismiss="modal"]').on("click", function () {
        bootstrap.Modal.getInstance(document.getElementById('EditAppModal')).hide();
    });

    $('#confirmDeleteAppModal .del-btn, #confirmDeleteAppModal [data-dismiss="modal"]').on("click", function () {
        bootstrap.Modal.getInstance(document.getElementById('confirmDeleteAppModal')).hide();
    });

    $('#addAppBtn').on('click', function () {
        bootstrap.Modal.getInstance(document.getElementById('viewCustomAppsModal')).hide();
        if (typeof resetCreateCustomAppModal === 'function') {
            resetCreateCustomAppModal();
        }
        cameFromViewModal = true;

        new bootstrap.Modal(document.getElementById('createCustomAppsModal')).show();
    });

    $('#viewCustomAppsModal .btn-close, #viewCustomAppsModal .cancel-btn , #viewCustomAppsModal [data-dismiss="modal"]').on("click", function () {

        if (customAppGrid) {
            customAppGrid.clearSelection();
            customAppGrid.searchByText('');
        }

        selectedAppData = null;
        $('#editAppBtn').prop('disabled', true);
        $('#deleteAppBtn').prop('disabled', true);
        $('#appSearchInput').val('');

        const copyDropdownList = document.getElementById('copyDropdownList');
        if (copyDropdownList) {
            $('#copyDropdownList').hide();
        }

        bootstrap.Modal.getInstance(document.getElementById('viewCustomAppsModal')).hide();
    });
});

function handleEditURLCheckboxVisibility() {
    const urlInput = $('#appURL');
    const extractCheckbox = $('#extractCheckbox');

    // MOVED: Assign to global variable so it can be accessed from outside
    checkEditURLAndToggleCheckbox = function () {
        const url = urlInput.val().trim();

        if (url && isValidHTTPURLWithPath(url)) {
            extractCheckbox.closest('.form-group').show();
        } else {
            extractCheckbox.closest('.form-group').hide();
            extractCheckbox.prop('checked', false);
        }
    };

    function isValidHTTPURLWithPath(url) {
        const httpPattern = /^https?:\/\//i;
        if (!httpPattern.test(url)) {
            return false;
        }

        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;

            return pathname.length > 1 && pathname !== '/';

        } catch (error) {
            return false;
        }
    }

    urlInput.on('input keyup paste', function () {
        setTimeout(checkEditURLAndToggleCheckbox, 10);
    });

    urlInput.on('blur', checkEditURLAndToggleCheckbox);
}

function initEditFormValidation() {
    $('#EditAppForm').validate({
        errorClass: 'error',
        rules: {
            appPackageName: { required: true },
            appURL: {
                required: true,
                url: true
            },
            userLoginId: {
                required: () => $('#appRunAs').val() === 'User'
            },
            userPassword: {
                required: () => $('#appRunAs').val() === 'User'
            }
        },
        messages: {
            appPackageName: "This field is required",
            appURL: {
                required: "This field is required",
                url: "Please enter a valid URL"
            },
            userLoginId: "This field is required",
            userPassword: "This field is required"
        },
        errorPlacement: function (error, element) {
            error.insertAfter(element);
        }
    });
}

async function initializeCustomAppGrid() {
    try {
        const response = await $.get('/custom-apps/GetCustomApps');
        if (response.success && response.data) {
            customAppsData = response.data.map(function (item) {
                return {
                    ID: item.id,
                    PackageName: item.packageName,
                    URL: item.url,
                    Architecture: item.architecture,
                    InstallCommandLine: item.installCommandLine,
                    UninstallCommand: item.uninstallCommand,
                    Restart: item.restart,
                    InstallTimeout: item.installTimeout,
                    RunAs: item.runAs,
                    LoginId: item.loginId,
                    Password: item.password,
                    Domain: item.domain,
                    Extract: item.extract
                };
            });
        } else {
            customAppsData = [];
        }
    } catch (error) {
        console.error('Error loading custom apps:', error);
        customAppsData = [];
    }

    customAppGrid = $('#customAppGrid').dxDataGrid({
        dataSource: customAppsData,
        keyExpr: 'ID',
        selection: { mode: 'single' },
        hoverStateEnabled: true,
        columnAutoWidth: true,
        loadPanel: { enabled: false },
        pager: {
            visible: true,
            showInfo: true,
            showNavigationButtons: true
        },
        scrolling: { mode: "standard" },
        columns: [
            { dataField: 'PackageName', caption: 'Package Name', alignment: "start" },
            { dataField: 'URL', caption: 'URL', alignment: "start" },
            { dataField: 'Architecture', caption: 'Architecture', alignment: "start" },
            { dataField: 'InstallCommandLine', caption: 'Install Command Line', alignment: "start" },
            { dataField: 'UninstallCommand', caption: 'Uninstall Command Line', alignment: "start" },
            { dataField: 'Restart', caption: 'Restart', alignment: "start" },
            { dataField: 'InstallTimeout', caption: 'Install Timeout', alignment: "start" },
        ],
        onSelectionChanged(e) {
            const rows = e.selectedRowsData;
            selectedAppData = rows.length === 1 ? rows[0] : null;
            const hasSelection = rows.length === 1;

            $('#editAppBtn').prop('disabled', !hasSelection);
            $('#deleteAppBtn').prop('disabled', !hasSelection);

            $('#copyAppBtn').prop('disabled', !hasSelection);
            $('#dropdownToggle').prop('disabled', !hasSelection);
        }
    }).dxDataGrid('instance');
}

function addAppToLocalData(newAppData) {
    customAppsData.push(newAppData);
    if (customAppGrid) {
        customAppGrid.option('dataSource', []);
        customAppGrid.option('dataSource', [...customAppsData]);
        customAppGrid.refresh();
    }
}