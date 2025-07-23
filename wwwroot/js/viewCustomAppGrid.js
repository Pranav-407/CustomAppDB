
    let selectedAppData = null;
    window.customAppGrid = null;

    $(document).ready(function () {
        initializeCustomAppGrid();

        $('#appRunAs').on('change', function () {
            $('#userCredentialsFields').toggle($(this).val() === 'User');
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
            $('#extractCheckbox').prop('checked', selectedAppData.Extract);

            if (selectedAppData.RunAs === 'User') {
                $('#userCredentialsFields').show();
                $('#userLoginId').val(selectedAppData.LoginId);
                $('#userPassword').val(selectedAppData.Password);
                $('#userDomain').val(selectedAppData.Domain);
            } else {
                $('#userCredentialsFields').hide();
            }

            new bootstrap.Modal(document.getElementById('EditAppModal')).show();
        });

        $('#saveAppBtn').on('click', function () {
            const appData = {
                ID: selectedAppData ? selectedAppData.ID : Date.now(),
                PackageName: $('#appPackageName').val(),
                URL: $('#appURL').val(),
                Architecture: $('#appArchitecture').val(),
                InstallCommandLine: $('#appInstallCmd').val(),
                UninstallCommand: $('#appUninstallCmd').val(),
                Restart: $('#appRestart').val(),
                InstallTimeout: parseInt($('#appTimeout').val(), 10),
                RunAs: $('#appRunAs').val(),
                LoginId: $('#userLoginId').val(),
                Password: $('#userPassword').val(),
                Domain: $('#userDomain').val(),
                Extract: $('#extractCheckbox').is(':checked')
            };

            alert("Edited Successfully");
            bootstrap.Modal.getInstance(document.getElementById('EditAppModal')).hide();
        });

        $('#deleteAppBtn').on('click', function () {
            if (!selectedAppData) return;
            new bootstrap.Modal(document.getElementById('confirmDeleteAppModal')).show();
        });

        $('#confirmDeleteBtn').on('click', function () {
            if (!selectedAppData) return;
            alert("Deleted Successfully");
            bootstrap.Modal.getInstance(document.getElementById('confirmDeleteAppModal')).hide();
        });

        $("#appSearchInput").on("input", function () {
            if (window.customAppGrid) {
                window.customAppGrid.searchByText($(this).val());
            }
        });

        $('#EditAppModal .btn-close, #EditAppModal [data-dismiss="modal"]').on("click", function () {
            bootstrap.Modal.getInstance(document.getElementById('EditAppModal')).hide();
        });

        $('#confirmDeleteAppModal .btn-close, #confirmDeleteAppModal [data-dismiss="modal"]').on("click", function () {
            bootstrap.Modal.getInstance(document.getElementById('confirmDeleteAppModal')).hide();
        });


        $('#addAppBtn').on('click', function () {
            bootstrap.Modal.getInstance(document.getElementById('viewCustomAppsModal')).hide();

            if (typeof resetCreateCustomAppModal === 'function') {
                resetCreateCustomAppModal();
            }

            new bootstrap.Modal(document.getElementById('createCustomAppsModal')).show();
        });

        $('#viewCustomAppsModal .cancel-btn, #viewCustomAppsModal [data-dismiss="modal"]').on("click", function () {

            if (window.customAppGrid) {
                window.customAppGrid.clearSelection();
                window.customAppGrid.searchByText('');
            }

            selectedAppData = null;
            $('#editAppBtn').prop('disabled', true);
            $('#deleteAppBtn').prop('disabled', true);
            $('#appSearchInput').val('');
            bootstrap.Modal.getInstance(document.getElementById('viewCustomAppsModal')).hide();
        });

    });

    function initializeCustomAppGrid() {
        window.customAppGrid = $('#customAppGrid').dxDataGrid({
            dataSource: {
                load: function () {
                    return $.get('/custom-apps/list')
                        .then(function (response) {
                            if (response.success && response.data) {
                                // Transform the API response to match the expected format
                                return response.data.map(function (item) {
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
                            }
                            return [];
                        })
                        .catch(function (error) {
                            console.error('Error loading custom apps:', error);
                            return [];
                        });
                }
            },
            keyExpr: 'ID',
            selection: { mode: 'single' },
            hoverStateEnabled: true,
            columnAutoWidth: true,
            pager: {
                visible: true,
                showInfo: true,
                showNavigationButtons: true
            },
            scrolling: { mode: "standard" },
            columns: [
                { dataField: 'PackageName', caption: 'Package Name' },
                { dataField: 'URL', caption: 'URL' },
                { dataField: 'Architecture', caption: 'Architecture' },
                { dataField: 'InstallCommandLine', caption: 'Install Command' },
                { dataField: 'UninstallCommand', caption: 'Uninstall Command' },
                { dataField: 'Restart', caption: 'Restart' },
                { dataField: 'InstallTimeout', caption: 'Timeout (min)' },
                { dataField: 'RunAs', caption: 'Run As' }
            ],
            onRowClick(e) {
                selectedAppData = e.data;
                $('#editAppBtn').prop('disabled', false);
                $('#deleteAppBtn').prop('disabled', false);
            },
            onSelectionChanged(e) {
                const rows = e.selectedRowsData;
                selectedAppData = rows.length === 1 ? rows[0] : null;
                $('#editAppBtn').prop('disabled', rows.length !== 1);
                $('#deleteAppBtn').prop('disabled', rows.length !== 1);
            }
        }).dxDataGrid('instance');
    }