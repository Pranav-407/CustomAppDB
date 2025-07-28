let cameFromViewModal = false;

(() => {
    const modalId = '#createCustomAppsModal';
    const nextBtn = document.querySelector(`${modalId} .next-btn`);
    const stepItems = document.querySelectorAll(`${modalId} .step-item`);
    const stepPanels = document.querySelectorAll(`${modalId} .step-panel`);

    let currentStep = 1;
    let computerGrid = null;
    let selectedComputerGrid = null;
    let selectedRowData = null;

    //const computerData = [
    //    {
    //        computer: "0922-VSMSDN14", installedApps: 37, outdatedApps: 3, policy: "Manual",
    //        group: "Default", tags: "-", configuration: "Last Applied", wingetStatus: "v1.9",
    //        lastSeen: "Now", wingetApps: "2 installed", browsers: "2 installed",
    //        messaging: "1 outdated", media: "2 available", runtimes: "1 installed", image: "-"
    //    },
    //    {
    //        computer: "0922-DESKTOP01", installedApps: 42, outdatedApps: 0, policy: "Automatic",
    //        group: "Production", tags: "Server", configuration: "Applied", wingetStatus: "v1.8",
    //        lastSeen: "2 mins ago", wingetApps: "5 installed", browsers: "1 installed",
    //        messaging: "2 installed", media: "3 available", runtimes: "2 installed", image: "Windows 11"
    //    },
    //    {
    //        computer: "0922-LAPTOP05", installedApps: 28, outdatedApps: 1, policy: "Manual",
    //        group: "Development", tags: "Mobile", configuration: "Pending", wingetStatus: "v1.9",
    //        lastSeen: "5 mins ago", wingetApps: "3 installed", browsers: "3 installed",
    //        messaging: "1 installed", media: "1 available", runtimes: "1 installed", image: "Windows 10"
    //    },
    //    {
    //        computer: "0922-WORKSTATION", installedApps: 55, outdatedApps: 7, policy: "Automatic",
    //        group: "Design", tags: "Workstation", configuration: "Failed", wingetStatus: "v1.7",
    //        lastSeen: "10 mins ago", wingetApps: "8 installed", browsers: "2 installed",
    //        messaging: "0 installed", media: "5 available", runtimes: "3 installed", image: "Windows 11"
    //    }
    //];

    function initializeComputerGrid() {

        const computerData = new DevExpress.data.CustomStore({
            load: function () {
                return $.ajax({
                    url: '/Device/GetDevices',
                    dataType: 'json',
                    method: 'GET'
                }).fail(function () {
                    DevExpress.ui.notify("Failed to load devices.", "error", 3000);
                });
            }
        });

        computerGrid = $("#computerGrid").dxDataGrid({
            dataSource: computerData,
            showBorders: false,
            columnAutoWidth: true,
            scrolling: {
                mode: 'standard',
                scrollByContent: true,
                scrollByThumb: true,
                useNative: false
            },
            rowAlternationEnabled: false,
            hoverStateEnabled: true,
            pager: {
                visible: true,
                showInfo: true,
                showNavigationButtons: true,
            },
            selection: { mode: 'single' },
            onSelectionChanged: function (e) {
                selectedRowData = e.selectedRowsData[0];
                updateNextButtonState();
            },
            columns: [
                {
                    dataField: "computer",
                    caption: `Computers`,
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

    // Create OK button function
    function createOkButton() {
        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.className = 'btn btn-primary ok-btn';
        okBtn.id = 'okBtn';
        okBtn.textContent = 'OK';
        okBtn.style.display = 'none';

        // Add click handler to close modal
        okBtn.addEventListener('click', function () {
            const modalElement = document.querySelector(modalId);
            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modal.hide();
        });

        // Insert OK button after the Next button
        nextBtn.parentNode.insertBefore(okBtn, nextBtn.nextSibling);

        return okBtn;
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

        //  Show 'installation initiated' toast
        const initiatedToastEl = document.getElementById('appInstallInitiatedToast');
        if (initiatedToastEl) {
            const initiatedToast = new bootstrap.Toast(initiatedToastEl, {
                delay: 3000
            });
            initiatedToast.show();
        }

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

                        // Show detected app section after successful installation
                        $('.detected-app-section').show();

                        // Update the dynamic package name
                        $('.custom-app-name-display').text($('#createAppPackageName').val());

                        //  Show 'App Installed' toast
                        const toastEl = document.getElementById('appInstalledToast');
                        if (toastEl) {
                            const toast = new bootstrap.Toast(toastEl, {
                                delay: 3000
                            });
                            toast.show();
                        }

                        // Show OK button and hide Next button after successful installation
                        showOkButton();

                        installBtn.disabled = true;
                        installBtn.textContent = 'Installed';
                    },
                    error: function (xhr, status, error) {
                        console.error('Error saving app:', xhr.responseText);
                        alert('Failed to save app. Please try again.');

                        installBtn.disabled = false;
                        installBtn.textContent = 'Install';
                    }
                });
            }
        }

        nextStep();
    }

    // Function to show OK button and hide Next button
    function showOkButton() {
        let okBtn = document.getElementById('okBtn');
        if (!okBtn) {
            okBtn = createOkButton();
        }

        // Hide Next button and show OK button
        nextBtn.style.display = 'none';
        okBtn.style.display = 'inline-block';
    }

    // Function to hide OK button and show Next button
    function hideOkButton() {
        const okBtn = document.getElementById('okBtn');
        if (okBtn) {
            okBtn.style.display = 'none';
        }
        nextBtn.style.display = 'inline-block';
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

            // Hide OK button when not on step 3
            hideOkButton();
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

        const validator = $('#createCustomAppForm').validate();
        validator.resetForm();

        // REMOVE RED BORDERS manually
        $('#createCustomAppForm')
            .find('.form-control')
            .removeClass('error')
            .removeAttr('aria-invalid');

        $('#createAppUserCredentialsFields').hide();

        // Hide detected app section when resetting
        $('.detected-app-section').hide();

        // Hide OK button when resetting
        hideOkButton();

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

        $('#talkToSpecialist').on('click', function () {
            new bootstrap.Modal(document.getElementById('talkToSpecialistModal')).show();
        });

        // Hide detected app section initially
        $('.detected-app-section').hide();

        initFormValidation();
        initializeComputerGrid();
        initializeSelectedComputerGrid();
        toggleCredentialFields();
        handleInstallClick();
        showStep(1);
    });

    nextBtn.addEventListener('click', goToNextStep);

    const modalElement = document.querySelector(modalId);
    modalElement.addEventListener('hidden.bs.modal', function () {
        resetModalSteps();

        if (cameFromViewModal) {
            const viewModalEl = document.getElementById('viewCustomAppsModal');
            const viewModal = bootstrap.Modal.getOrCreateInstance(viewModalEl);
            viewModal.show();

            cameFromViewModal = false;
        }
    });

    const talkModalEl = document.getElementById('talkToSpecialistModal');
    talkModalEl.addEventListener('hidden.bs.modal', function () {
        // Reset form fields
        $('#talkToSpecialistForm')[0].reset();

        // Reset validation messages
        const validator = $('#talkToSpecialistForm').validate();
        validator.resetForm();

        // Remove red borders and aria-invalid
        $('#talkToSpecialistForm')
            .find('.form-control, textarea')
            .removeClass('error')
            .removeAttr('aria-invalid');
    });

    $('#talkToSpecialistForm').validate({
        errorClass: 'error',
        rules: {
            specialistName: {
                required: true,
                minlength: 2
            },
            specialistPhone: {
                required: true,
                digits: true,
                minlength: 10,
                maxlength: 15
            },
            specialistQuery: {
                required: true,
                minlength: 5
            }
        },
        messages: {
            specialistName: {
                required: "Name is required",
                minlength: "Name must be at least 2 characters"
            },
            specialistPhone: {
                required: "Phone number is required",
                digits: "Only numbers allowed",
                minlength: "Minimum 10 digits",
                maxlength: "Maximum 15 digits"
            },
            specialistQuery: {
                required: "Please enter your query",
                minlength: "Query must be at least 5 characters"
            }
        },
        errorPlacement: function (error, element) {
            error.insertAfter(element);
        },
        submitHandler: function (form) {
            console.log('Talk to Specialist Form submitted');

            // Optional: perform AJAX here or just close the modal
            bootstrap.Modal.getInstance(document.getElementById('talkToSpecialistModal')).hide();
        }
    });

})();