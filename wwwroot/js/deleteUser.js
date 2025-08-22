$(document).ready(function () {
    setupDeleteFunctionality();
});
function setupDeleteFunctionality() {
    // Handle Delete User dropdown item click
    $(document).on('click', 'a.dropdown-item:contains("Delete User")', function (e) {
        e.preventDefault();
        handleDeleteUserClick();
    });

    // NEW: Handle Delete User button click from within Edit User modal
    $(document).on('click', '#deleteUserBtn', function (e) {
        e.preventDefault();
        e.stopPropagation();
        handleDeleteFromEditModal();
    });

    // Handle Delete button in confirmation modal
    $(document).on('click', '#deleteConfirmBtn', function (e) {
        e.preventDefault();
        confirmDeleteUser();
    });

    // Handle Cancel button in confirmation modal
    $(document).on('click', '#deleteCancelBtn', function (e) {
        e.preventDefault();
        $('#deleteConfirmationModal').modal('hide');
    });
}
function handleDeleteUserClick() {
    if (!selectedDeviceKey) {
        showNoUserSelectedToast()
        return;
    }

    // Get selected user data from the grid
    const grid = $("#userGrid").dxDataGrid("instance");
    const selectedRowData = grid.getSelectedRowsData();

    if (!selectedRowData || selectedRowData.length === 0) {
        showNoUserSelectedToast();
        return;
    }

    const userData = selectedRowData[0];

    $('#deleteConfirmationModal').modal('show');
}
function handleDeleteFromEditModal() {
    if (!selectedDeviceKey) {
        showNoUserSelectedToast();
        return;
    }

    $('#deleteConfirmationModal').modal('show');
}
function confirmDeleteUser() {
    if (!selectedDeviceKey) {
        showNoUserSelectedToast();
        $('#deleteConfirmationModal').modal('hide');
        return;
    }
    const grid = $("#userGrid").dxDataGrid("instance");
    const selectedRowData = grid.getSelectedRowsData();
    const userData = selectedRowData[0];

    $.ajax({
        url: '/User/DeleteUser',
        type: 'DELETE',
        data: { email: selectedDeviceKey },
        success: function (response) {
            $('#deleteConfirmationModal').modal('hide');

            // NEW: Close Edit User modal if it's open
            if ($('#EditUserModal').hasClass('show')) {
                $('#EditUserModal').modal('hide');
            }

            showDeletedToast(userData.fullName);

            console.log(selectedDeviceKey);
            selectedDeviceKey = null;
            console.log(selectedDeviceKey);

            // NEW: Clear grid selection
            if (typeof clearGridSelection === 'function') {
                clearGridSelection();
            }

            if (typeof refreshUsersGrid === 'function') {
                refreshUsersGrid();
            }
        },
        error: function (xhr, status, error) {
            console.error('Failed to delete user:', error);

            $('#deleteConfirmationModal').modal('hide');

            let errorMessage = 'Failed to delete user. Please try again.';
            if (xhr.responseText) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMessage = response.message || xhr.responseText;
                } catch (e) {
                    errorMessage = xhr.responseText;
                }
            }

            // NEW: Show error message instead of just logging
            alert(errorMessage);
        },
    });
}
function showNoUserSelectedToast() {
    const noUserSelectedToastEl = document.getElementById('userNotSelectedToast');
    if (noUserSelectedToastEl) {
        const noUserSelectedToast = new bootstrap.Toast(noUserSelectedToastEl, { delay: 1500 });
        noUserSelectedToast.show();
    }
}
function showDeletedToast(fullName) {
    const deletedToastEl = document.getElementById('userDeletedToast');
    if (deletedToastEl) {
        // Update the toast message to include the user's name
        const toastBody = deletedToastEl.querySelector('.toast-body');
        if (toastBody) {
            toastBody.innerHTML = `<i class="bi bi-check-circle me-2"></i>"${fullName}" User deleted successfully.`;
        }

        const deletedToast = new bootstrap.Toast(deletedToastEl, { delay: 1500 });
        deletedToast.show();
    }
}