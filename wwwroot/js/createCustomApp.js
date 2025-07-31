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
    let appInstalled = false;
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
            loadPanel: {
                enabled: false
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
                    caption: `Computer Name`,
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
                { dataField: "group", caption: "Group"},
                { dataField: "policy", caption: "Policy"},
                { dataField: "image", caption: "Operating System"}
            ]
        }).dxDataGrid("instance");

        $("#customSearchInput").on("input", function () {
            const searchText = $(this).val();
            computerGrid.searchByText(searchText);

            if (searchText.length > 0) {
                $("#clearSearchInput").show();
            } else {
                $("#clearSearchInput").hide();
            }
        });

        $("#clearSearchInput").on("click", function () {
            $("#customSearchInput").val('').trigger('input');
            $(this).hide();
        });
    }

    function initializeSelectedComputerGrid() {
        selectedComputerGrid = $("#selectedComputerGrid").dxDataGrid({
            dataSource: [],
            showBorders: false,
            columnAutoWidth: true,
            loadPanel: {
                enabled: false
            },
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
                    caption: "",
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
            case "4.42.117": return "status-installed";
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
            { status: "Waiting", delay: 2000 },
            { status: "Downloading", delay: 2500 },
            { status: "Installing", delay: 2500 },
            { status: "4.42.117", delay: 1500 }
        ];

        let step = 0;
        const installBtn = document.getElementById('installBtn');

        //  Show 'installation initiated' toast
        const initiatedToastEl = document.getElementById('appInstallInitiatedToast');
        if (initiatedToastEl) {
            const initiatedToast = new bootstrap.Toast(initiatedToastEl, {
                delay: 1500
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
                                delay: 1500
                            });
                            toast.show();
                        }

                        // Show OK button and hide Next button after successful installation
                        showOkButton();
                        appInstalled = true;
                        installBtn.disabled = true;
                    },
                    error: function (xhr, status, error) {
                        console.error('Error saving app:', xhr.responseText);
                        alert('Failed to save app. Please try again.');

                        installBtn.disabled = false;
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
                const dataWithStatus = { ...selectedRowData, Status: "" };
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
        if (currentStep === 2 && selectedComputerGrid) {
            const packageName = $('#createAppPackageName').val();
            selectedComputerGrid.columnOption("Status", "caption", packageName);
            selectedComputerGrid.repaint();
        }
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

        $('#extractCheckboxRow').hide();
        $('#createAppExtractCheckbox').prop('checked', false);

        // Hide OK button when resetting
        hideOkButton();
        appInstalled = false;
        selectedRowData = null;
        if (computerGrid) computerGrid.clearSelection();
        if (selectedComputerGrid) selectedComputerGrid.option('dataSource', []);

        stepItems.forEach(item => {
            const stepNum = parseInt(item.getAttribute('data-step'));
            item.classList.remove('active', 'completed');
            if (stepNum === 1) item.classList.add('active');
        });

        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.disabled = false;
        }
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
                    const confirmModal = new bootstrap.Modal(document.getElementById('confirmInstallAppModal'));
                    confirmModal.show();
                }
            });
        }

        // Now handle the confirm install button inside the modal
        const confirmInstallBtn = document.getElementById('confirmInstallBtn');
        if (confirmInstallBtn) {
            confirmInstallBtn.addEventListener('click', function () {
                updateStatusSequentially();
            });
        }
    }

    function handleCancelAction() {

        if (appInstalled) {
            bootstrap.Modal.getInstance(document.getElementById('createCustomAppsModal')).hide();
        } else {
            if (currentStep > 1) {
                new bootstrap.Modal(document.getElementById('confirmCancelAppModal')).show();
            } else {
                bootstrap.Modal.getInstance(document.getElementById('createCustomAppsModal')).hide();
            }
        }
    }

    function handleURLCheckboxVisibility() {
        const urlInput = $('#createAppURL');
        const checkboxRow = $('#extractCheckboxRow');
        const extractCheckbox = $('#createAppExtractCheckbox');

        function checkURLAndToggleCheckbox() {
            const url = urlInput.val().trim();

            // Check if URL is valid HTTP/HTTPS and has content after domain
            if (url && isValidHTTPURLWithPath(url)) {
                checkboxRow.show();
            } else {
                checkboxRow.hide();
                // Uncheck the checkbox when hiding it
                extractCheckbox.prop('checked', false);
            }
        }

        function isValidHTTPURLWithPath(url) {
            // Only allow HTTP and HTTPS URLs
            const httpPattern = /^https?:\/\//i;
            if (!httpPattern.test(url)) {
                return false;
            }

            try {
                const urlObj = new URL(url);
                const pathname = urlObj.pathname;

                // Check if pathname has more than just '/' 
                // Examples:
                // https://google.com -> pathname = '/' (should not show checkbox)
                // https://google.com/ -> pathname = '/' (should not show checkbox)
                // https://google.com/deploy -> pathname = '/deploy' (should show checkbox)
                // https://google.com/folder/file.zip -> pathname = '/folder/file.zip' (should show checkbox)

                return pathname.length > 1 && pathname !== '/';

            } catch (error) {
                // If URL parsing fails, return false
                return false;
            }
        }

        // Add event listeners using jQuery
        urlInput.on('input keyup paste', function () {
            // Small delay to allow paste to complete
            setTimeout(checkURLAndToggleCheckbox, 10);
        });

        urlInput.on('blur', checkURLAndToggleCheckbox);

        // Initial check when page loads
        checkURLAndToggleCheckbox();
    }

    document.addEventListener('DOMContentLoaded', () => {

        $('#talkToSpecialist').on('click', function () {
            new bootstrap.Modal(document.getElementById('talkToSpecialistModal')).show();
        });

        $(document).on('click', '#talkToSpecialistAfterInstalled', function (e) {
            e.preventDefault(); // Prevent default link behavior
            new bootstrap.Modal(document.getElementById('talkToSpecialistModal')).show();
        });

        $('.cancel-btn, #createCustomAppsModal .btn-close').on('click', function (e) {
            e.preventDefault();
            handleCancelAction();
        });

        $('#confirmCancelBtn').on('click', function (e) {
            bootstrap.Modal.getInstance(document.getElementById('createCustomAppsModal')).hide();
        });
        
        // Hide detected app section initially
        $('.detected-app-section').hide();

        handleURLCheckboxVisibility();
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