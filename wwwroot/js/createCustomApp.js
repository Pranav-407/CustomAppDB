(() => {
    const modalId = '#createCustomAppsModal';
    const nextBtn = document.querySelector(`${modalId} .next-btn`);
    const stepItems = document.querySelectorAll(`${modalId} .step-item`);
    const stepPanels = document.querySelectorAll(`${modalId} .step-panel`);

    let currentStep = 1;
    let computerGrid = null;
    let selectedComputerGrid = null;
    let selectedRowData = null;

    const computerData = [
        {
            computer: "0922-VSMSDN14", installedApps: 37, outdatedApps: 3, policy: "Manual",
            group: "Default", tags: "-", configuration: "Last Applied", wingetStatus: "v1.9",
            lastSeen: "Now", wingetApps: "2 installed", browsers: "2 installed",
            messaging: "1 outdated", media: "2 available", runtimes: "1 installed", image: "-"
        },
        {
            computer: "0922-DESKTOP01", installedApps: 42, outdatedApps: 0, policy: "Automatic",
            group: "Production", tags: "Server", configuration: "Applied", wingetStatus: "v1.8",
            lastSeen: "2 mins ago", wingetApps: "5 installed", browsers: "1 installed",
            messaging: "2 installed", media: "3 available", runtimes: "2 installed", image: "Windows 11"
        },
        {
            computer: "0922-LAPTOP05", installedApps: 28, outdatedApps: 1, policy: "Manual",
            group: "Development", tags: "Mobile", configuration: "Pending", wingetStatus: "v1.9",
            lastSeen: "5 mins ago", wingetApps: "3 installed", browsers: "3 installed",
            messaging: "1 installed", media: "1 available", runtimes: "1 installed", image: "Windows 10"
        },
        {
            computer: "0922-WORKSTATION", installedApps: 55, outdatedApps: 7, policy: "Automatic",
            group: "Design", tags: "Workstation", configuration: "Failed", wingetStatus: "v1.7",
            lastSeen: "10 mins ago", wingetApps: "8 installed", browsers: "2 installed",
            messaging: "0 installed", media: "5 available", runtimes: "3 installed", image: "Windows 11"
        }
    ];

    function initializeComputerGrid() {
        computerGrid = $("#computerGrid").dxDataGrid({
            dataSource: computerData,
            showBorders: false,
            columnAutoWidth: true,
            scrolling: { mode: 'standard' },
            rowAlternationEnabled: false,
            hoverStateEnabled: true,
            selection: { mode: 'single' },
            onSelectionChanged: function (e) {
                selectedRowData = e.selectedRowsData[0];
                updateNextButtonState();
            },
            columns: [
                {
                    dataField: "computer",
                    caption: `Computers(${computerData.length})`,
                    width: 200,
                    cellTemplate: function (container, options) {
                        const isOutdated = options.data.outdatedApps > 0;
                        const indicatorColor = isOutdated ? "rgb(218, 68, 9)" : "rgb(141, 206, 45)";
                        container.css({ padding: 0, margin: 0, height: "100%" });
                        $("<div>").text(options.value).css({
                            "border-left": `7px solid ${indicatorColor}`,
                            "padding": "10px", "height": "100%",
                            "display": "flex", "align-items": "center",
                            "width": "100%", "box-sizing": "border-box"
                        }).appendTo(container);
                    },
                },
                { dataField: "installedApps", caption: "Installed Apps", width: 135 },
                { dataField: "outdatedApps", caption: "Outdated Apps", width: 135 },
                { dataField: "policy", caption: "Policy", width: 135 },
                { dataField: "group", caption: "Group", width: 135 },
                { dataField: "tags", caption: "Tags", width: 135 },
                { dataField: "configuration", caption: "Configuration", width: 135 },
                { dataField: "wingetStatus", caption: "Winget Status", width: 135 },
                { dataField: "lastSeen", caption: "Last Seen", width: 135 },
                { dataField: "wingetApps", caption: "Winget Apps", width: 135 },
                { dataField: "browsers", caption: "Web Browsers", width: 135 },
                { dataField: "messaging", caption: "Messaging", width: 135 },
                { dataField: "media", caption: "Media", width: 135 },
                { dataField: "runtimes", caption: "Runtimes", width: 135 },
                { dataField: "image", caption: "Image", width: 135 }
            ]
        }).dxDataGrid("instance");

        $("#customSearchInput").on("input", function () {
            const searchText = $(this).val();
            computerGrid.searchByText(searchText);
        });
    }

    function initializeSelectedComputerGrid() {
        selectedComputerGrid = $("#selectedComputerGrid").dxDataGrid({
            dataSource: [],
            showBorders: false,
            columnAutoWidth: true,
            scrolling: { mode: 'standard' },
            rowAlternationEnabled: false,
            hoverStateEnabled: true,
            columns: [
                {
                    dataField: "computer",
                    caption: "Selected Computer",
                    width: 200,
                    cellTemplate: function (container, options) {
                        const isOutdated = options.data.outdatedApps > 0;
                        const indicatorColor = isOutdated ? "rgb(218, 68, 9)" : "rgb(141, 206, 45)";
                        container.css({ padding: 0, margin: 0, height: "100%" });
                        $("<div>").text(options.value).css({
                            "border-left": `7px solid ${indicatorColor}`,
                            "padding": "10px", "height": "100%",
                            "display": "flex", "align-items": "center",
                            "width": "100%", "box-sizing": "border-box"
                        }).appendTo(container);
                    },
                },
                {
                    dataField: "Status",
                    caption: "Status",
                    width: 150,
                    cellTemplate: function (container, options) {
                        container.addClass(getStatusClass(options.value)).text(options.value);
                    }
                },
            ]
        }).dxDataGrid("instance");
    }

    function getStatusClass(status) {
        switch (status) {
            case "Waiting": return "status-waiting";
            case "Downloading": return "status-downloading";
            case "Installing": return "status-installing";
            case "Installed": return "status-installed";
            default: return "";
        }
    }

    function updateStatusSequentially() {
        const sequence = [
            { status: "Waiting", delay: 1000 },
            { status: "Downloading", delay: 2000 },
            { status: "Installing", delay: 2000 },
            { status: "Installed", delay: 1000 }
        ];

        let step = 0;
        const installBtn = document.getElementById('installBtn');

        function nextStep() {
            const { status, delay } = sequence[step];
            const currentData = selectedComputerGrid.option('dataSource');

            if (currentData.length > 0) {
                currentData[0].Status = status;
                selectedComputerGrid.option('dataSource', currentData);
                selectedComputerGrid.repaint();
            }

            if (step === 0) {
                installBtn.disabled = true;
                installBtn.textContent = 'Installing...';
            }

            if (++step < sequence.length) {
                setTimeout(nextStep, delay);
            } else {
                // Reset button state
                installBtn.disabled = false;
                installBtn.textContent = 'Install';

                // Prepare app data for API
                const appData = {
                    PackageName: $('#createAppPackageName').val(),
                    URL: $('#createAppURL').val(),
                    Architecture: $('#createAppArchitecture').val(),
                    InstallCommandLine: $('#createAppInstallCmd').val(),
                    UninstallCommand: $('#createAppUninstallCmd').val(),
                    Restart: $('#createAppRestart').val(),
                    InstallTimeout: parseInt($('#createAppTimeout').val(), 10) || 0,
                    RunAs: $('#createAppRunAs').val(),
                    LoginId: $('#createAppUserLoginId').val() || '',
                    Password: $('#createAppUserPassword').val() || '',
                    Domain: $('#createAppUserDomain').val() || '',
                    Extract: $('#createAppExtractCheckbox').is(':checked')
                };

                // Save to API
                $.ajax({
                    url: '/custom-apps/create',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(appData),
                    success: function (response) {
                        console.log('App saved successfully:', response);

                        // Refresh the grid if it exists
                        if (window.customAppGrid) {
                            window.customAppGrid.refresh();
                        }

                        // Show success toast
                        const toastEl = document.getElementById('appCreatedToast');
                        if (toastEl) {
                            const toast = new bootstrap.Toast(toastEl);
                            toast.show();
                        }

                        // Close modal
                        const modalEl = document.getElementById('createCustomAppsModal');
                        const modalInstance = bootstrap.Modal.getInstance(modalEl);
                        if (modalInstance) {
                            modalInstance.hide();
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error('Error saving app:', xhr.responseText);
                        alert('Failed to save app. Please try again.');

                        // Reset button on error
                        installBtn.disabled = false;
                        installBtn.textContent = 'Install';
                    }
                });
            }
        }

        nextStep();
    }

    function updateNextButtonState() {
        if (currentStep === 2) {
            nextBtn.disabled = !selectedRowData;
            nextBtn.style.opacity = selectedRowData ? '1' : '0.5';
            nextBtn.style.cursor = selectedRowData ? 'pointer' : 'not-allowed';
        }
    }

    function showStep(step) {
        stepItems.forEach(item => {
            const stepNum = parseInt(item.getAttribute('data-step'));
            item.classList.remove('active', 'completed');
            if (stepNum === step) item.classList.add('active');
            else if (stepNum < step) item.classList.add('completed');
        });

        stepPanels.forEach(panel => {
            const stepNum = parseInt(panel.getAttribute('data-step'));
            panel.classList.toggle('active', stepNum === step);
            panel.classList.toggle('d-none', stepNum !== step);
        });

        if (step === 3) {
            nextBtn.classList.add('d-none');
            if (selectedRowData && selectedComputerGrid) {
                const dataWithStatus = { ...selectedRowData, Status: "Not Installed" };
                selectedComputerGrid.option('dataSource', [dataWithStatus]);
            }
        } else {
            nextBtn.classList.remove('d-none');
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        }

        currentStep = step;
        updateNextButtonState();
    }

    function goToNextStep() {
        if (currentStep === 1 && !$('#createCustomAppForm').valid()) return;
        if (currentStep === 2 && !selectedRowData) return;
        if (currentStep < 3) showStep(currentStep + 1);
    }

    function resetModalSteps() {
        showStep(1);
        $('#createCustomAppForm')[0].reset();
        $('#createCustomAppForm').validate().resetForm();
        $('#createAppUserCredentialsFields').hide();
        selectedRowData = null;
        if (computerGrid) computerGrid.clearSelection();
        if (selectedComputerGrid) selectedComputerGrid.option('dataSource', []);
        stepItems.forEach(item => {
            const stepNum = parseInt(item.getAttribute('data-step'));
            item.classList.remove('active', 'completed');
            if (stepNum === 1) item.classList.add('active');
        });
    }

    window.resetCreateCustomAppModal = function () {
        resetModalSteps();
        showStep(1);
    };

    function initFormValidation() {
        $('#createCustomAppForm').validate({
            errorClass: 'error',
            rules: {
                createAppPackageName: { required: true },
                createAppURL: { required: true, url: true },
                createAppUserLoginId: {
                    required: () => $('#createAppRunAs').val() === 'User'
                },
                createAppUserPassword: {
                    required: () => $('#createAppRunAs').val() === 'User'
                },
            },
            messages: {
                createAppPackageName: "This field is required",
                createAppURL: {
                    required: "This field is required",
                    url: "Please enter a valid URL"
                },
                createAppUserLoginId: "This field is required",
                createAppUserPassword: "This field is required",
            },
            errorPlacement: function (error, element) {
                error.insertAfter(element);
            }
        });
    }

    function toggleCredentialFields() {
        $('#createAppRunAs').on('change', function () {
            const show = $(this).val() === 'User';
            $('#createAppUserCredentialsFields').toggle(show);
        });
    }

    function handleInstallClick() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.addEventListener('click', function () {
                if (!this.disabled) {
                    updateStatusSequentially();
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initFormValidation();
        initializeComputerGrid();
        initializeSelectedComputerGrid();
        toggleCredentialFields();
        handleInstallClick();
        showStep(1);
    });

    nextBtn.addEventListener('click', goToNextStep);

    const modalElement = document.querySelector(modalId);
    modalElement.addEventListener('hidden.bs.modal', resetModalSteps);
})();