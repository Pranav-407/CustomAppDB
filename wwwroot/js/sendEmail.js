$(document).ready(function () {
    setupSendEmailFunctionality();
});

function setupSendEmailFunctionality() {

    $(document).on('click', 'a.dropdown-item:contains("Send Invite Email")', function (e) {
        e.preventDefault();
        if (!selectedDeviceKey) {
            showNoUserSelectedToast()
        } else {
            showSendInviteEmailToast();

            // Clear the grid selection properly
            clearGridSelection();
        }
    });

    $(document).on('click', 'a.dropdown-item:contains("Send Password Reset Email")', function (e) {
        e.preventDefault();
        if (!selectedDeviceKey) {
            showNoUserSelectedToast();
        } else {
            showPasswordResetEmailToast();

            // Clear the grid selection properly
            clearGridSelection();
        }
    });
}

function clearGridSelection() {
    // Clear the selectedDeviceKey variable
    selectedDeviceKey = null;

    // Clear the grid selection visually
    const grid = $("#userGrid").dxDataGrid("instance");
    if (grid) {
        grid.clearSelection();
    }

    // Update radio buttons to reflect no selection
    if (typeof updateRadioButtons === 'function') {
        updateRadioButtons();
    }

    // Optional: Refresh the grid to ensure clean state
    if (typeof refreshUsersGrid === 'function') {
        refreshUsersGrid();
    }
}

function showSendInviteEmailToast() {
    const sendInviteToastEl = document.getElementById('EmailInviteToast');
    if (sendInviteToastEl) {
        const sendInviteToast = new bootstrap.Toast(sendInviteToastEl, { delay: 3000 });
        sendInviteToast.show();
    }
}

function showPasswordResetEmailToast() {
    const passwordResetEmailToastEl = document.getElementById('PasswordResetEmailToast');
    if (passwordResetEmailToastEl) {
        const passwordResetEmailToast = new bootstrap.Toast(passwordResetEmailToastEl, { delay: 3000 });
        passwordResetEmailToast.show();
    }
}

function showNoUserSelectedToast() {
    const noUserSelectedToastEl = document.getElementById('userNotSelectedToast');
    if (noUserSelectedToastEl) {
        const noUserSelectedToast = new bootstrap.Toast(noUserSelectedToastEl, { delay: 1500 });
        noUserSelectedToast.show();
    }
}