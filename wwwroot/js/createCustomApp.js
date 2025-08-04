let cameFromViewModal = false;

const modalId = '#createCustomAppsModal';
let currentStep = 1;
let computerGrid = null;
let selectedComputerGrid = null;
let selectedRowData = null;
let appInstalled = false;

$(document).ready(function () {
    initFormValidation();
    initializeComputerGrid();
    initializeSelectedComputerGrid();
    toggleCredentialFields();
    handleURLCheckboxVisibility();
    initializeStepNavigation();
    updateStepCursors();
    showStep(1);
    handleInstallClick();
    setupEventListeners();
    setupTalkToSpecialistModal();
    $('.detected-app-section').hide();
});


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

function getStatusClass(status) {
    switch (status) {
        case "Waiting": return "status-waiting";
        case "Downloading": return "status-downloading";
        case "Installing": return "status-installing";
        case "4.42.117": return "status-installed";
        default: return "";
    }
}

function createOkButton() {
    const nextBtn = $(modalId + ' .next-btn')[0];
    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'btn btn-primary ok-btn';
    okBtn.id = 'okBtn';
    okBtn.textContent = 'OK';
    okBtn.style.display = 'none';

    $(okBtn).on('click', function () {
        const modalElement = $(modalId)[0];
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
    });

    nextBtn.parentNode.insertBefore(okBtn, nextBtn.nextSibling);
    return okBtn;
}

function showOkButton() {
    const nextBtn = $(modalId + ' .next-btn')[0];
    let okBtn = document.getElementById('okBtn');
    if (!okBtn) {
        okBtn = createOkButton();
    }
    nextBtn.style.display = 'none';
    okBtn.style.display = 'inline-block';
}

function hideOkButton() {
    const nextBtn = $(modalId + ' .next-btn')[0];
    const okBtn = document.getElementById('okBtn');
    if (okBtn) {
        okBtn.style.display = 'none';
    }
    nextBtn.style.display = 'inline-block';
}

function updateNextButtonState() {
    const nextBtn = $(modalId + ' .next-btn')[0];
    if (currentStep === 2) {
        nextBtn.disabled = !selectedRowData;
        nextBtn.style.opacity = selectedRowData ? '1' : '0.5';
        nextBtn.style.cursor = selectedRowData ? 'pointer' : 'not-allowed';
    }
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

    const newAppId = response.id;

    const newAppData = {
        ID: newAppId,
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

    if (typeof addAppToLocalData === 'function') {
        addAppToLocalData(newAppData);
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
    const stepItems = $(modalId + ' .step-item');
    stepItems.each(function () {
        const stepNum = parseInt($(this).attr('data-step'));
        $(this).removeClass('active completed');
        if (stepNum === step) $(this).addClass('active');
        else if (stepNum < step) $(this).addClass('completed');
    });
}

function updateStepPanels(step) {
    const stepPanels = $(modalId + ' .step-panel');
    stepPanels.each(function () {
        const stepNum = parseInt($(this).attr('data-step'));
        $(this).toggleClass('active', stepNum === step);
        $(this).toggleClass('d-none', stepNum !== step);
    });
}

function handleStepThreeSpecialCase(step) {
    const nextBtn = $(modalId + ' .next-btn')[0];
    if (step === 3) {
        $(nextBtn).addClass('d-none');
        if (selectedRowData && selectedComputerGrid) {
            const dataWithStatus = { ...selectedRowData, Status: "" };
            selectedComputerGrid.option('dataSource', [dataWithStatus]);
        }
    }
}

function updateButtonsForStep(step) {
    const nextBtn = $(modalId + ' .next-btn')[0];
    if (step !== 3) {
        $(nextBtn).removeClass('d-none');
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
        nextBtn.style.cursor = 'pointer';
        hideOkButton();
    }
}

function initializeStepNavigation() {
    $(modalId + ' .step-item').on('click', function () {
        const targetStep = parseInt($(this).attr('data-step'));
        if (targetStep <= currentStep) {
            showStep(targetStep);
        }
    });
}

function updateStepCursors() {
    $(modalId + ' .step-item').each(function () {
        $(this).css({
            'cursor': 'pointer',
            'opacity': '1'
        });
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

    $(modalId + ' .step-item').each(function () {
        const stepNum = parseInt($(this).attr('data-step'));
        $(this).removeClass('active completed');
        if (stepNum === 1) $(this).addClass('active');
    });
}

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

function handleInstallClick() {
    $('#installBtn').on('click', function () {
        if (!$(this).prop('disabled')) {
            const confirmModal = new bootstrap.Modal(document.getElementById('confirmInstallAppModal'));
            confirmModal.show();
        }
    });

    $('#confirmInstallBtn').on('click', function () {
        updateStatusSequentially();
    });
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
    $('#talkToSpecialistModal').on('hidden.bs.modal', function () {
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

    $('#talkToSpecialist').on('click', function () {
        new bootstrap.Modal(document.getElementById('talkToSpecialistModal')).show();
    });

    $(document).on('click', '#talkToSpecialistAfterInstalled', function (e) {
        e.preventDefault();
        new bootstrap.Modal(document.getElementById('talkToSpecialistModal')).show();
    });

    $('#createCustomAppsModal .cancel-btn, #createCustomAppsModal .btn-close').on('click', function (e) {
        e.preventDefault();
        handleCancelAction();
    });

    $('#confirmCancelBtn').on('click', function (e) {
        bootstrap.Modal.getInstance(document.getElementById('createCustomAppsModal')).hide();
    });

    $(modalId + ' .next-btn').on('click', goToNextStep);

    $(modalId).on('hidden.bs.modal', function () {
        resetModalSteps();

        if (cameFromViewModal) {
            const viewModalEl = document.getElementById('viewCustomAppsModal');
            const viewModal = bootstrap.Modal.getOrCreateInstance(viewModalEl);
            viewModal.show();
            cameFromViewModal = false;
        }
    });
}

window.resetCreateCustomAppModal = function () {
    resetModalSteps();
    showStep(1);
};