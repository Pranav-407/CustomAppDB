//let cameFromViewModal = false;

//(() => {
//    const modalId = '#createCustomAppsModal';
//    const nextBtn = document.querySelector(`${modalId} .next-btn`);
//    const stepItems = document.querySelectorAll(`${modalId} .step-item`);
//    const stepPanels = document.querySelectorAll(`${modalId} .step-panel`);
//    let currentStep = 1;
//    let computerGrid = null;
//    let selectedComputerGrid = null;
//    let selectedRowData = null;
//    let appInstalled = false;
//    function initializeComputerGrid() {

//        const computerData = new DevExpress.data.CustomStore({
//            load: function () {
//                return $.ajax({
//                    url: '/Device/GetDevices',
//                    dataType: 'json',
//                    method: 'GET'
//                }).fail(function () {
//                    DevExpress.ui.notify("Failed to load devices.", "error", 3000);
//                });
//            }
//        });

//        computerGrid = $("#computerGrid").dxDataGrid({
//            dataSource: computerData,
//            showBorders: false,
//            columnAutoWidth: true,
//            scrolling: {
//                mode: 'standard',
//                scrollByContent: true,
//                scrollByThumb: true,
//                useNative: false
//            },
//            loadPanel: {
//                enabled: false
//            },
//            rowAlternationEnabled: false,
//            hoverStateEnabled: true,
//            pager: {
//                visible: true,
//                showInfo: true,
//                showNavigationButtons: true,
//            },
//            selection: { mode: 'single' },
//            onSelectionChanged: function (e) {
//                selectedRowData = e.selectedRowsData[0];
//                updateNextButtonState();
//            },
//            columns: [
//                {
//                    dataField: "computer",
//                    caption: `Computer Name`,
//                    cellTemplate: function (container, options) {
//                        const isOutdated = options.data.outdatedApps > 0;
//                        const indicatorColor = isOutdated ? "rgb(218, 68, 9)" : "rgb(141, 206, 45)";
//                        container.css({ padding: 0, margin: 0, height: "100%" });
//                        $("<div>").text(options.value).css({
//                            "border-left": `7px solid ${indicatorColor}`,
//                            "padding": "10px", "height": "100%",
//                            "display": "flex", "align-items": "center",
//                            "width": "100%", "box-sizing": "border-box"
//                        }).appendTo(container);
//                    },
//                },
//                { dataField: "group", caption: "Group"},
//                { dataField: "policy", caption: "Policy"},
//                { dataField: "image", caption: "Operating System"}
//            ]
//        }).dxDataGrid("instance");

//        $("#customSearchInput").on("input", function () {
//            const searchText = $(this).val();
//            computerGrid.searchByText(searchText);

//            if (searchText.length > 0) {
//                $("#clearSearchInput").show();
//            } else {
//                $("#clearSearchInput").hide();
//            }
//        });

//        $("#clearSearchInput").on("click", function () {
//            $("#customSearchInput").val('').trigger('input');
//            $(this).hide();
//        });
//    }

//    function initializeSelectedComputerGrid() {
//        selectedComputerGrid = $("#selectedComputerGrid").dxDataGrid({
//            dataSource: [],
//            showBorders: false,
//            columnAutoWidth: true,
//            loadPanel: {
//                enabled: false
//            },
//            scrolling: { mode: 'standard' },
//            rowAlternationEnabled: false,
//            hoverStateEnabled: true,
//            columns: [
//                {
//                    dataField: "computer",
//                    caption: "Selected Computer",
//                    width: 200,
//                    cellTemplate: function (container, options) {
//                        const isOutdated = options.data.outdatedApps > 0;
//                        const indicatorColor = isOutdated ? "rgb(218, 68, 9)" : "rgb(141, 206, 45)";
//                        container.css({ padding: 0, margin: 0, height: "100%" });
//                        $("<div>").text(options.value).css({
//                            "border-left": `7px solid ${indicatorColor}`,
//                            "padding": "10px", "height": "100%",
//                            "display": "flex", "align-items": "center",
//                            "width": "100%", "box-sizing": "border-box"
//                        }).appendTo(container);
//                    },
//                },
//                {
//                    dataField: "Status",
//                    caption: "",
//                    width: 150,
//                    cellTemplate: function (container, options) {
//                        container.addClass(getStatusClass(options.value)).text(options.value);
//                    }
//                },
//            ]
//        }).dxDataGrid("instance");
//    }

//    function getStatusClass(status) {
//        switch (status) {
//            case "Waiting": return "status-waiting";
//            case "Downloading": return "status-downloading";
//            case "Installing": return "status-installing";
//            case "4.42.117": return "status-installed";
//            default: return "";
//        }
//    }

//    function createOkButton() {
//        const okBtn = document.createElement('button');
//        okBtn.type = 'button';
//        okBtn.className = 'btn btn-primary ok-btn';
//        okBtn.id = 'okBtn';
//        okBtn.textContent = 'OK';
//        okBtn.style.display = 'none';

//        okBtn.addEventListener('click', function () {
//            const modalElement = document.querySelector(modalId);
//            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
//            modal.hide();
//        });

//        nextBtn.parentNode.insertBefore(okBtn, nextBtn.nextSibling);

//        return okBtn;
//    }

//    function updateStatusSequentially() {
//        const sequence = [
//            { status: "Waiting", delay: 2000 },
//            { status: "Downloading", delay: 2500 },
//            { status: "Installing", delay: 2500 },
//            { status: "4.42.117", delay: 1500 }
//        ];

//        let step = 0;
//        const installBtn = document.getElementById('installBtn');

//        const initiatedToastEl = document.getElementById('appInstallInitiatedToast');
//        if (initiatedToastEl) {
//            const initiatedToast = new bootstrap.Toast(initiatedToastEl, {
//                delay: 1500
//            });
//            initiatedToast.show();
//        }

//        function nextStep() {
//            const { status, delay } = sequence[step];
//            const currentData = selectedComputerGrid.option('dataSource');

//            if (currentData.length > 0) {
//                currentData[0].Status = status;
//                selectedComputerGrid.option('dataSource', currentData);
//                selectedComputerGrid.repaint();
//            }

//            if (step === 0) {
//                installBtn.disabled = true;
//            }

//            if (++step < sequence.length) {
//                setTimeout(nextStep, delay);
//            } else {
//                const appData = {
//                    PackageName: $('#createAppPackageName').val(),
//                    URL: $('#createAppURL').val(),
//                    Architecture: $('#createAppArchitecture').val(),
//                    InstallCommandLine: $('#createAppInstallCmd').val(),
//                    UninstallCommand: $('#createAppUninstallCmd').val(),
//                    Restart: $('#createAppRestart').val(),
//                    InstallTimeout: parseInt($('#createAppTimeout').val(), 10) || 0,
//                    RunAs: $('#createAppRunAs').val(),
//                    LoginId: $('#createAppUserLoginId').val() || '',
//                    Password: $('#createAppUserPassword').val() || '',
//                    Domain: $('#createAppUserDomain').val() || '',
//                    Extract: $('#createAppExtractCheckbox').is(':checked')
//                };

//                $.ajax({
//                    url: '/custom-apps/create',
//                    type: 'POST',
//                    contentType: 'application/json',
//                    data: JSON.stringify(appData),
//                    success: function (response) {
//                        console.log('App saved successfully:', response);

//                        if (window.customAppGrid) {
//                            window.customAppGrid.refresh();
//                        }

//                        $('.detected-app-section').show();

//                        $('.custom-app-name-display').text($('#createAppPackageName').val());

//                        const toastEl = document.getElementById('appInstalledToast');
//                        if (toastEl) {
//                            const toast = new bootstrap.Toast(toastEl, {
//                                delay: 1500
//                            });
//                            toast.show();
//                        }

//                        showOkButton();
//                        appInstalled = true;
//                        installBtn.disabled = true;
//                    },
//                    error: function (xhr, status, error) {
//                        console.error('Error saving app:', xhr.responseText);
//                        alert('Failed to save app. Please try again.');

//                        installBtn.disabled = false;
//                    }
//                });
//            }
//        }

//        nextStep();
//    }

//    function showOkButton() {
//        let okBtn = document.getElementById('okBtn');
//        if (!okBtn) {
//            okBtn = createOkButton();
//        }

//        nextBtn.style.display = 'none';
//        okBtn.style.display = 'inline-block';
//    }

//    function hideOkButton() {
//        const okBtn = document.getElementById('okBtn');
//        if (okBtn) {
//            okBtn.style.display = 'none';
//        }
//        nextBtn.style.display = 'inline-block';
//    }

//    function updateNextButtonState() {
//        if (currentStep === 2) {
//            nextBtn.disabled = !selectedRowData;
//            nextBtn.style.opacity = selectedRowData ? '1' : '0.5';
//            nextBtn.style.cursor = selectedRowData ? 'pointer' : 'not-allowed';
//        }
//    }

//    function showStep(step) {
//        stepItems.forEach(item => {
//            const stepNum = parseInt(item.getAttribute('data-step'));
//            item.classList.remove('active', 'completed');
//            if (stepNum === step) item.classList.add('active');
//            else if (stepNum < step) item.classList.add('completed');
//        });

//        stepPanels.forEach(panel => {
//            const stepNum = parseInt(panel.getAttribute('data-step'));
//            panel.classList.toggle('active', stepNum === step);
//            panel.classList.toggle('d-none', stepNum !== step);
//        });

//        if (step === 3) {
//            nextBtn.classList.add('d-none');
//            if (selectedRowData && selectedComputerGrid) {
//                const dataWithStatus = { ...selectedRowData, Status: "" };
//                selectedComputerGrid.option('dataSource', [dataWithStatus]);
//            }
//        } else {
//            nextBtn.classList.remove('d-none');
//            nextBtn.disabled = false;
//            nextBtn.style.opacity = '1';
//            nextBtn.style.cursor = 'pointer';

//            hideOkButton();
//        }

//        currentStep = step;
//        updateNextButtonState();
//        updateStepCursors();
//    }

//    function initializeStepNavigation() {
//        stepItems.forEach(item => {
//            item.addEventListener('click', function () {
//                const targetStep = parseInt(this.getAttribute('data-step'));

//                if (targetStep <= currentStep) {
//                    showStep(targetStep);
//                }
//            });
//        });
//    }

//    function updateStepCursors() {
//        stepItems.forEach(item => {
//            const stepNum = parseInt(item.getAttribute('data-step'));
//            if (stepNum <= currentStep) {
//                item.style.cursor = 'pointer';
//                item.style.opacity = '1';
//            } else {
//                item.style.cursor = 'pointer';
//                item.style.opacity = '1';
//            }
//        });
//    }

//    function goToNextStep() {
//        if (currentStep === 1 && !$('#createCustomAppForm').valid()) return;
//        if (currentStep === 2 && !selectedRowData) return;
//        if (currentStep === 2 && selectedComputerGrid) {
//            const packageName = $('#createAppPackageName').val();
//            selectedComputerGrid.columnOption("Status", "caption", packageName);
//            selectedComputerGrid.repaint();
//        }
//        if (currentStep < 3) showStep(currentStep + 1);
//    }

//    function resetModalSteps() {
//        showStep(1);

//        $('#createCustomAppForm')[0].reset();

//        const validator = $('#createCustomAppForm').validate();
//        validator.resetForm();

//        $('#createCustomAppForm')
//            .find('.form-control')
//            .removeClass('error')
//            .removeAttr('aria-invalid');

//        $('#createAppUserCredentialsFields').hide();

//        $('.detected-app-section').hide();

//        $('#extractCheckboxRow').hide();
//        $('#createAppExtractCheckbox').prop('checked', false);

//        hideOkButton();
//        appInstalled = false;
//        selectedRowData = null;
//        if (computerGrid) computerGrid.clearSelection();
//        if (selectedComputerGrid) selectedComputerGrid.option('dataSource', []);

//        stepItems.forEach(item => {
//            const stepNum = parseInt(item.getAttribute('data-step'));
//            item.classList.remove('active', 'completed');
//            if (stepNum === 1) item.classList.add('active');
//        });

//        const installBtn = document.getElementById('installBtn');
//        if (installBtn) {
//            installBtn.disabled = false;
//        }

//        updateStepCursors();
//    }

//    window.resetCreateCustomAppModal = function () {
//        resetModalSteps();
//        showStep(1);
//    };

//    function initFormValidation() {
//        $('#createCustomAppForm').validate({
//            errorClass: 'error',
//            rules: {
//                createAppPackageName: { required: true },
//                createAppURL: { required: true, url: true },
//                createAppUserLoginId: {
//                    required: () => $('#createAppRunAs').val() === 'User'
//                },
//                createAppUserPassword: {
//                    required: () => $('#createAppRunAs').val() === 'User'
//                },
//            },
//            messages: {
//                createAppPackageName: "This field is required",
//                createAppURL: {
//                    required: "This field is required",
//                    url: "Please enter a valid URL"
//                },
//                createAppUserLoginId: "This field is required",
//                createAppUserPassword: "This field is required",
//            },
//            errorPlacement: function (error, element) {
//                error.insertAfter(element);
//            }
//        });
//    }

//    function toggleCredentialFields() {
//        $('#createAppRunAs').on('change', function () {
//            const show = $(this).val() === 'User';
//            $('#createAppUserCredentialsFields').toggle(show);
//        });
//    }

//    function handleInstallClick() {
//        const installBtn = document.getElementById('installBtn');
//        if (installBtn) {
//            installBtn.addEventListener('click', function () {
//                if (!this.disabled) {
//                    const confirmModal = new bootstrap.Modal(document.getElementById('confirmInstallAppModal'));
//                    confirmModal.show();
//                }
//            });
//        }

//        const confirmInstallBtn = document.getElementById('confirmInstallBtn');
//        if (confirmInstallBtn) {
//            confirmInstallBtn.addEventListener('click', function () {
//                updateStatusSequentially();
//            });
//        }
//    }

//    function handleCancelAction() {

//        if (appInstalled) {
//            bootstrap.Modal.getInstance(document.getElementById('createCustomAppsModal')).hide();
//        } else {
//            if (currentStep > 1) {
//                new bootstrap.Modal(document.getElementById('confirmCancelAppModal')).show();
//            } else {
//                bootstrap.Modal.getInstance(document.getElementById('createCustomAppsModal')).hide();
//            }
//        }
//    }

//    function handleURLCheckboxVisibility() {
//        const urlInput = $('#createAppURL');
//        const checkboxRow = $('#extractCheckboxRow');
//        const extractCheckbox = $('#createAppExtractCheckbox');

//        function checkURLAndToggleCheckbox() {
//            const url = urlInput.val().trim();

//            if (url && isValidHTTPURLWithPath(url)) {
//                checkboxRow.show();
//            } else {
//                checkboxRow.hide();
//                extractCheckbox.prop('checked', false);
//            }
//        }

//        function isValidHTTPURLWithPath(url) {
//            const httpPattern = /^https?:\/\//i;
//            if (!httpPattern.test(url)) {
//                return false;
//            }

//            try {
//                const urlObj = new URL(url);
//                const pathname = urlObj.pathname;

//                // Examples:
//                // https://google.com -> pathname = '/' (should not show checkbox)
//                // https://google.com/ -> pathname = '/' (should not show checkbox)
//                // https://google.com/deploy -> pathname = '/deploy' (should show checkbox)
//                // https://google.com/folder/file.zip -> pathname = '/folder/file.zip' (should show checkbox)

//                return pathname.length > 1 && pathname !== '/';

//            } catch (error) {
//                return false;
//            }
//        }

//        urlInput.on('input keyup paste', function () {
//            setTimeout(checkURLAndToggleCheckbox, 10);
//        });

//        urlInput.on('blur', checkURLAndToggleCheckbox);

//        checkURLAndToggleCheckbox();
//    }

//    document.addEventListener('DOMContentLoaded', () => {

//        $('#talkToSpecialist').on('click', function () {
//            new bootstrap.Modal(document.getElementById('talkToSpecialistModal')).show();
//        });

//        $(document).on('click', '#talkToSpecialistAfterInstalled', function (e) {
//            e.preventDefault();
//            new bootstrap.Modal(document.getElementById('talkToSpecialistModal')).show();
//        });

//        $('.cancel-btn, #createCustomAppsModal .btn-close').on('click', function (e) {
//            e.preventDefault();
//            handleCancelAction();
//        });

//        $('#confirmCancelBtn').on('click', function (e) {
//            bootstrap.Modal.getInstance(document.getElementById('createCustomAppsModal')).hide();
//        });

//        $('.detected-app-section').hide();

//        handleURLCheckboxVisibility();
//        initFormValidation();
//        initializeComputerGrid();
//        initializeSelectedComputerGrid();
//        toggleCredentialFields();
//        handleInstallClick();
//        initializeStepNavigation();
//        updateStepCursors();
//        showStep(1);
//    });

//    nextBtn.addEventListener('click', goToNextStep);

//    const modalElement = document.querySelector(modalId);
//    modalElement.addEventListener('hidden.bs.modal', function () {
//        resetModalSteps();

//        if (cameFromViewModal) {
//            const viewModalEl = document.getElementById('viewCustomAppsModal');
//            const viewModal = bootstrap.Modal.getOrCreateInstance(viewModalEl);
//            viewModal.show();

//            cameFromViewModal = false;
//        }
//    });

//    const talkModalEl = document.getElementById('talkToSpecialistModal');
//    talkModalEl.addEventListener('hidden.bs.modal', function () {
//        $('#talkToSpecialistForm')[0].reset();

//        const validator = $('#talkToSpecialistForm').validate();
//        validator.resetForm();

//        $('#talkToSpecialistForm')
//            .find('.form-control, textarea')
//            .removeClass('error')
//            .removeAttr('aria-invalid');
//    });

//    $('#talkToSpecialistForm').validate({
//        errorClass: 'error',
//        rules: {
//            specialistName: {
//                required: true,
//                minlength: 2
//            },
//            specialistPhone: {
//                required: true,
//                digits: true,
//                minlength: 10,
//                maxlength: 15
//            },
//            specialistQuery: {
//                required: true,
//                minlength: 5
//            }
//        },
//        messages: {
//            specialistName: {
//                required: "Name is required",
//                minlength: "Name must be at least 2 characters"
//            },
//            specialistPhone: {
//                required: "Phone number is required",
//                digits: "Only numbers allowed",
//                minlength: "Minimum 10 digits",
//                maxlength: "Maximum 15 digits"
//            },
//            specialistQuery: {
//                required: "Please enter your query",
//                minlength: "Query must be at least 5 characters"
//            }
//        },
//        errorPlacement: function (error, element) {
//            error.insertAfter(element);
//        },
//        submitHandler: function (form) {
//            console.log('Talk to Specialist Form submitted');

//            bootstrap.Modal.getInstance(document.getElementById('talkToSpecialistModal')).hide();
//        }
//    });
//})();
























































































let cameFromViewModal = false;

(() => {
    // Constants and Variables
    const modalId = '#createCustomAppsModal';
    const nextBtn = document.querySelector(`${modalId} .next-btn`);
    const stepItems = document.querySelectorAll(`${modalId} .step-item`);
    const stepPanels = document.querySelectorAll(`${modalId} .step-panel`);

    let currentStep = 1;
    let computerGrid = null;
    let selectedComputerGrid = null;
    let selectedRowData = null;
    let appInstalled = false;

    // Grid initialization functions
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
            loadPanel: { enabled: false },
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
            columns: getComputerGridColumns()
        }).dxDataGrid("instance");

        setupComputerGridSearch();
    }

    function initializeSelectedComputerGrid() {
        selectedComputerGrid = $("#selectedComputerGrid").dxDataGrid({
            dataSource: [],
            showBorders: false,
            columnAutoWidth: true,
            loadPanel: { enabled: false },
            scrolling: { mode: 'standard' },
            rowAlternationEnabled: false,
            hoverStateEnabled: true,
            columns: getSelectedComputerGridColumns()
        }).dxDataGrid("instance");
    }

    // Grid column definitions
    function getComputerGridColumns() {
        return [
            {
                dataField: "computer",
                caption: "Computer Name",
                cellTemplate: function (container, options) {
                    const isOutdated = options.data.outdatedApps > 0;
                    const indicatorColor = isOutdated ? "rgb(218, 68, 9)" : "rgb(141, 206, 45)";
                    container.css({ padding: 0, margin: 0, height: "100%" });
                    $("<div>").text(options.value).css({
                        "border-left": `7px solid ${indicatorColor}`,
                        "padding": "10px",
                        "height": "100%",
                        "display": "flex",
                        "align-items": "center",
                        "width": "100%",
                        "box-sizing": "border-box"
                    }).appendTo(container);
                }
            },
            { dataField: "group", caption: "Group" },
            { dataField: "policy", caption: "Policy" },
            { dataField: "image", caption: "Operating System" }
        ];
    }

    function getSelectedComputerGridColumns() {
        return [
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
                        "padding": "10px",
                        "height": "100%",
                        "display": "flex",
                        "align-items": "center",
                        "width": "100%",
                        "box-sizing": "border-box"
                    }).appendTo(container);
                }
            },
            {
                dataField: "Status",
                caption: "",
                width: 150,
                cellTemplate: function (container, options) {
                    container.addClass(getStatusClass(options.value)).text(options.value);
                }
            }
        ];
    }

    // Grid search functionality
    function setupComputerGridSearch() {
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

    // Status helper functions
    function getStatusClass(status) {
        switch (status) {
            case "Waiting": return "status-waiting";
            case "Downloading": return "status-downloading";
            case "Installing": return "status-installing";
            case "4.42.117": return "status-installed";
            default: return "";
        }
    }

    // Button management functions
    function createOkButton() {
        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.className = 'btn btn-primary ok-btn';
        okBtn.id = 'okBtn';
        okBtn.textContent = 'OK';
        okBtn.style.display = 'none';

        okBtn.addEventListener('click', function () {
            const modalElement = document.querySelector(modalId);
            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modal.hide();
        });

        nextBtn.parentNode.insertBefore(okBtn, nextBtn.nextSibling);
        return okBtn;
    }

    function showOkButton() {
        let okBtn = document.getElementById('okBtn');
        if (!okBtn) {
            okBtn = createOkButton();
        }
        nextBtn.style.display = 'none';
        okBtn.style.display = 'inline-block';
    }

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

    // Installation status update functions
    function updateStatusSequentially() {
        const sequence = [
            { status: "Waiting", delay: 2000 },
            { status: "Downloading", delay: 2500 },
            { status: "Installing", delay: 2500 },
            { status: "4.42.117", delay: 1500 }
        ];

        let step = 0;
        const installBtn = document.getElementById('installBtn');

        showInstallInitiatedToast();
        processStatusUpdate(sequence, step, installBtn);
    }

    function showInstallInitiatedToast() {
        const initiatedToastEl = document.getElementById('appInstallInitiatedToast');
        if (initiatedToastEl) {
            const initiatedToast = new bootstrap.Toast(initiatedToastEl, { delay: 1500 });
            initiatedToast.show();
        }
    }

    function processStatusUpdate(sequence, step, installBtn) {
        function nextStep() {
            const { status, delay } = sequence[step];
            updateGridStatus(status);

            if (step === 0) {
                installBtn.disabled = true;
            }

            if (++step < sequence.length) {
                setTimeout(nextStep, delay);
            } else {
                saveAppData(installBtn);
            }
        }
        nextStep();
    }

    function updateGridStatus(status) {
        const currentData = selectedComputerGrid.option('dataSource');
        if (currentData.length > 0) {
            currentData[0].Status = status;
            selectedComputerGrid.option('dataSource', currentData);
            selectedComputerGrid.repaint();
        }
    }

    function saveAppData(installBtn) {
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

        $.ajax({
            url: '/custom-apps/create',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(appData),
            success: handleAppSaveSuccess,
            error: function (xhr, status, error) {
                handleAppSaveError(xhr, installBtn);
            }
        });
    }

    function handleAppSaveSuccess(response) {
        console.log('App saved successfully:', response);

        if (window.customAppGrid) {
            window.customAppGrid.refresh();
        }

        $('.detected-app-section').show();
        $('.custom-app-name-display').text($('#createAppPackageName').val());

        showAppInstalledToast();
        showOkButton();
        appInstalled = true;
        document.getElementById('installBtn').disabled = true;
    }

    function handleAppSaveError(xhr, installBtn) {
        console.error('Error saving app:', xhr.responseText);
        alert('Failed to save app. Please try again.');
        installBtn.disabled = false;
    }

    function showAppInstalledToast() {
        const toastEl = document.getElementById('appInstalledToast');
        if (toastEl) {
            const toast = new bootstrap.Toast(toastEl, { delay: 1500 });
            toast.show();
        }
    }

    // Step navigation functions
    function showStep(step) {
        updateStepItems(step);
        updateStepPanels(step);
        handleStepThreeSpecialCase(step);
        updateButtonsForStep(step);

        currentStep = step;
        updateNextButtonState();
        updateStepCursors();
    }

    function updateStepItems(step) {
        stepItems.forEach(item => {
            const stepNum = parseInt(item.getAttribute('data-step'));
            item.classList.remove('active', 'completed');
            if (stepNum === step) item.classList.add('active');
            else if (stepNum < step) item.classList.add('completed');
        });
    }

    function updateStepPanels(step) {
        stepPanels.forEach(panel => {
            const stepNum = parseInt(panel.getAttribute('data-step'));
            panel.classList.toggle('active', stepNum === step);
            panel.classList.toggle('d-none', stepNum !== step);
        });
    }

    function handleStepThreeSpecialCase(step) {
        if (step === 3) {
            nextBtn.classList.add('d-none');
            if (selectedRowData && selectedComputerGrid) {
                const dataWithStatus = { ...selectedRowData, Status: "" };
                selectedComputerGrid.option('dataSource', [dataWithStatus]);
            }
        }
    }

    function updateButtonsForStep(step) {
        if (step !== 3) {
            nextBtn.classList.remove('d-none');
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
            hideOkButton();
        }
    }

    function initializeStepNavigation() {
        stepItems.forEach(item => {
            item.addEventListener('click', function () {
                const targetStep = parseInt(this.getAttribute('data-step'));
                if (targetStep <= currentStep) {
                    showStep(targetStep);
                }
            });
        });
    }

    function updateStepCursors() {
        stepItems.forEach(item => {
            item.style.cursor = 'pointer';
            item.style.opacity = '1';
        });
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

    // Modal reset functions
    function resetModalSteps() {
        showStep(1);
        resetForm();
        resetUIElements();
        resetGrids();
        resetVariables();
        updateStepCursors();
    }

    function resetForm() {
        $('#createCustomAppForm')[0].reset();

        const validator = $('#createCustomAppForm').validate();
        validator.resetForm();

        $('#createCustomAppForm')
            .find('.form-control')
            .removeClass('error')
            .removeAttr('aria-invalid');
    }

    function resetUIElements() {
        $('#createAppUserCredentialsFields').hide();
        $('.detected-app-section').hide();
        $('#extractCheckboxRow').hide();
        $('#createAppExtractCheckbox').prop('checked', false);
        hideOkButton();

        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.disabled = false;
        }
    }

    function resetGrids() {
        if (computerGrid) computerGrid.clearSelection();
        if (selectedComputerGrid) selectedComputerGrid.option('dataSource', []);
    }

    function resetVariables() {
        appInstalled = false;
        selectedRowData = null;

        stepItems.forEach(item => {
            const stepNum = parseInt(item.getAttribute('data-step'));
            item.classList.remove('active', 'completed');
            if (stepNum === 1) item.classList.add('active');
        });
    }

    // Form validation functions
    function initFormValidation() {
        $('#createCustomAppForm').validate({
            errorClass: 'error',
            rules: getFormValidationRules(),
            messages: getFormValidationMessages(),
            errorPlacement: function (error, element) {
                error.insertAfter(element);
            }
        });
    }

    function getFormValidationRules() {
        return {
            createAppPackageName: { required: true },
            createAppURL: { required: true, url: true },
            createAppUserLoginId: {
                required: () => $('#createAppRunAs').val() === 'User'
            },
            createAppUserPassword: {
                required: () => $('#createAppRunAs').val() === 'User'
            }
        };
    }

    function getFormValidationMessages() {
        return {
            createAppPackageName: "This field is required",
            createAppURL: {
                required: "This field is required",
                url: "Please enter a valid URL"
            },
            createAppUserLoginId: "This field is required",
            createAppUserPassword: "This field is required"
        };
    }

    function toggleCredentialFields() {
        $('#createAppRunAs').on('change', function () {
            const show = $(this).val() === 'User';

            $('#createAppUserLoginId').val("");
            $('#createAppUserPassword').val("");
            $('#createAppUserDomain').val("");

            $('#createAppUserCredentialsFields').toggle(show);
        });
    }

    function handleURLCheckboxVisibility() {
        const urlInput = $('#createAppURL');
        const checkboxRow = $('#extractCheckboxRow');
        const extractCheckbox = $('#createAppExtractCheckbox');

        function checkURLAndToggleCheckbox() {
            const url = urlInput.val().trim();

            if (url && isValidHTTPURLWithPath(url)) {
                checkboxRow.show();
            } else {
                checkboxRow.hide();
                extractCheckbox.prop('checked', false);
            }
        }

        urlInput.on('input keyup paste', function () {
            setTimeout(checkURLAndToggleCheckbox, 10);
        });

        urlInput.on('blur', checkURLAndToggleCheckbox);
        checkURLAndToggleCheckbox();
    }

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

    // Event handler functions
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

    function setupTalkToSpecialistModal() {
        const talkModalEl = document.getElementById('talkToSpecialistModal');
        talkModalEl.addEventListener('hidden.bs.modal', function () {
            $('#talkToSpecialistForm')[0].reset();

            const validator = $('#talkToSpecialistForm').validate();
            validator.resetForm();

            $('#talkToSpecialistForm')
                .find('.form-control, textarea')
                .removeClass('error')
                .removeAttr('aria-invalid');
        });

        $('#talkToSpecialistForm').validate({
            errorClass: 'error',
            rules: getTalkToSpecialistRules(),
            messages: getTalkToSpecialistMessages(),
            errorPlacement: function (error, element) {
                error.insertAfter(element);
            },
            submitHandler: function (form) {
                console.log('Talk to Specialist Form submitted');
                bootstrap.Modal.getInstance(document.getElementById('talkToSpecialistModal')).hide();
            }
        });
    }

    function getTalkToSpecialistRules() {
        return {
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
        };
    }

    function getTalkToSpecialistMessages() {
        return {
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
        };
    }

    function setupEventListeners() {
        // Talk to specialist button events
        $('#talkToSpecialist').on('click', function () {
            new bootstrap.Modal(document.getElementById('talkToSpecialistModal')).show();
        });

        $(document).on('click', '#talkToSpecialistAfterInstalled', function (e) {
            e.preventDefault();
            new bootstrap.Modal(document.getElementById('talkToSpecialistModal')).show();
        });

        // Cancel button events
        $('#createCustomAppsModal .cancel-btn, #createCustomAppsModal .btn-close').on('click', function (e) {
            e.preventDefault();
            handleCancelAction();
        });

        $('#confirmCancelBtn').on('click', function (e) {
            bootstrap.Modal.getInstance(document.getElementById('createCustomAppsModal')).hide();
        });

        // Next button event
        nextBtn.addEventListener('click', goToNextStep);

        // Modal hide event
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
    }

    // Global function for external access
    window.resetCreateCustomAppModal = function () {
        resetModalSteps();
        showStep(1);
    };

    // Main initialization function
    document.addEventListener('DOMContentLoaded', function () {
        // Initialize form validation
        initFormValidation();

        // Initialize grids
        initializeComputerGrid();
        initializeSelectedComputerGrid();

        // Setup form functionality
        toggleCredentialFields();
        handleURLCheckboxVisibility();

        // Initialize step navigation
        initializeStepNavigation();
        updateStepCursors();
        showStep(1);

        // Setup event handlers
        handleInstallClick();
        setupEventListeners();
        setupTalkToSpecialistModal();

        // Hide detected app section initially
        $('.detected-app-section').hide();
    });
})();