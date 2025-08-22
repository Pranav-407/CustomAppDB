let selectedDeviceKey = null;
let userGrid = null;
let searchExpanded = false;

$(document).ready(function () {
    initializeUsersGrid();
    initializeTableHelperSearch();
});

function getRoleColor(role) {
    const roleColors = {
        'Super Administrator': '#8DCE2D',
        'Limited Administrator': '#8A2BE2',
        'Administrator': '#FF6B35',
        'Remote Support': '#1E90FF',
        'Report Viewer': '#DC143C'
    };

    return roleColors[role] || '#6C757D';
}

function initializeTableHelperSearch() {
    const $searchButton = $('.table-header .icon-btn:has(.bi-search)')
        .add('.table-header button:has(.bi-search)')
        .add('.table-header .btn:has(.bi-search)');

    const $tableHeader = $('.table-header');

    console.log('Search button found:', $searchButton.length);

    $searchButton.on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (!searchExpanded) {
            expandSearch();
        } else {
            const $searchInput = $tableHeader.find('.search-input');
            if ($searchInput.length > 0) {
                $searchInput.focus();
            }
        }
    });
}

function expandSearch() {
    const $tableHeader = $('.table-header');
    const $rightControls = $tableHeader.find('.d-flex.align-items-center.gap-1').last();

    const $searchButton = $('.table-header .icon-btn:has(.bi-search)')
        .add('.table-header button:has(.bi-search)')
        .add('.table-header .btn:has(.bi-search)');

    console.log('Hiding search button, found:', $searchButton.length);

    $searchButton.css({
        'display': 'none !important',
        'visibility': 'hidden'
    }).addClass('search-button-hidden');

    const searchHtml = `
        <div class="search-container-inline d-flex align-items-center me-2">
            <div class="position-relative" style="min-width: 200px;">
                <i class="bi bi-search search-icon-input"></i>
                <input type="text" 
                       class="form-control table-search-input" 
                       placeholder="Search users..." 
                       id="tableUserSearchInput" />
                <span class="table-clear-search-icon" 
                      id="tableClearUserSearch" 
                      style="display: none;">&times;</span>
            </div>
        </div>
    `;

    $rightControls.before(searchHtml);

    setTimeout(() => {
        $('#tableUserSearchInput').focus();
    }, 100);

    searchExpanded = true;

    setupSearchHandlers();
}

function collapseSearch() {
    const $searchButton = $('.table-header .icon-btn:has(.bi-search)')
        .add('.table-header button:has(.bi-search)')
        .add('.table-header .btn:has(.bi-search)');

    console.log('Showing search button, found:', $searchButton.length);

    $('.search-container-inline').remove();

    $searchButton.css({
        'display': 'flex',
        'visibility': 'visible'
    }).removeClass('search-button-hidden');

    searchExpanded = false;

    if (userGrid) {
        userGrid.searchByText('');
    }
}

function setupSearchHandlers() {
    const $searchInput = $('#tableUserSearchInput');
    const $clearButton = $('#tableClearUserSearch');

    $searchInput.on('input', function () {
        const val = $(this).val();
        if (userGrid) {
            userGrid.searchByText(val);
        }

        if (val.length > 0) {
            $clearButton.show();
        } else {
            $clearButton.hide();
        }
    });

    $clearButton.on('click', function () {
        $searchInput.val('').trigger('input');
        $(this).hide();
        $searchInput.focus();
    });

    $searchInput.on('keydown', function (e) {
        if (e.key === 'Escape') {
            if ($(this).val().trim() === '') {
                collapseSearch();
            } else {
                $(this).val('').trigger('input');
                setTimeout(() => {
                    collapseSearch();
                }, 150);
            }
        }
    });

    $(document).on('click.searchCollapse', function (e) {
        const $searchContainer = $('.search-container-inline');
        if (searchExpanded &&
            !$searchContainer.is(e.target) &&
            $searchContainer.has(e.target).length === 0 &&
            !$('.table-header .icon-btn:has(.bi-search)').is(e.target)) {

            if ($searchInput.val().trim() === '') {
                collapseSearch();
                $(document).off('click.searchCollapse');
            }
        }
    });
}

function initializeUsersGrid() {
    $.ajax({
        url: '/User/GetUsers',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            initializeGridWithData(data);
        },
        error: function (xhr, status, error) {
            console.error('Failed to load users data:', error);
            alert('Failed to load users data. Please refresh the page.');
        }
    });
}

function initializeGridWithData(usersData) {
    userGrid = $("#userGrid").dxDataGrid({
        dataSource: usersData,
        keyExpr: "id",

        Borders: false,
        columnAutoWidth: true,
        rowAlternationEnabled: false,
        hoverStateEnabled: true,
        selection: {
            mode: "single",
            showCheckBoxesMode: "none",
            allowSelectAll: false
        },
        loadPanel: {
            enabled: false
        },
        scrolling: {
            mode: "standard",
            scrollByContent: true,
            scrollByThumb: true,
            useNative: false
        },
        allowColumnResizing: true,
        columnResizingMode: "widget", // or "widget"
        searchPanel: {
            visible: false,
            highlightSearchText: true,
            width: 240,
            placeholder: "Search..."
        },

        onSelectionChanged: function (e) {
            if (e.selectedRowsData.length > 0) {
                console.log("Selected Row Data:", e.selectedRowsData[0]);
                selectedDeviceKey = e.selectedRowKeys[0];
            } else {
                console.log("No row selected");
                selectedDeviceKey = null;
            }
            updateRadioButtons();
        },
        columns: [
            {
                caption: "",
                width: 40,
                fixed: true,
                fixedPosition: "left", // or "right"
                cssClass: "radio-column",
                cellTemplate: function (container, options) {
                    $(container).css({
                        'background-color': 'inherit',
                        'padding': '0',
                        'margin': '0',
                        'display': 'flex',
                        'justify-content': 'center',
                        'align-items': 'center',
                        'height': '100%',
                        'min-height': '40px',
                        'box-sizing': 'border-box'
                    });

                    const radio = $('<input type="radio" name="userSelection">')
                        .val(options.data.id)
                        .attr('data-key', options.data.id)
                        .prop("checked", selectedDeviceKey === options.data.id)
                        .css({
                            'margin': '0',
                            'padding': '0',
                            'transform': 'scale(1.2)',
                            'accent-color': '#007bff',
                            'cursor': 'pointer',
                            'vertical-align': 'middle'
                        })
                        .on("click", function (e) {
                            const grid = $("#userGrid").dxDataGrid("instance");
                            const dataKey = $(this).attr('data-key');

                            if (selectedDeviceKey === dataKey) {
                                grid.clearSelection();
                            } else {
                                grid.selectRows([dataKey]);
                            }

                            e.stopPropagation();
                        });

                    $(container).append(radio);
                },
                allowSorting: false,
                allowFiltering: false,
                allowSearch: false
            },
            {
                dataField: "fullName",
                caption: "Full Name",
                fixed: true,
                fixedPosition: "left", // or "right"
                cellTemplate: function (container, options) {
                    const roleColor = getRoleColor(options.data.role);

                    container.css({ padding: 0, margin: 0, height: "100%" });

                    $("<div>")
                        .text(options.value)
                        .css({
                            "border-left": `7px solid ${roleColor}`,
                            "padding": "7px 8px",
                            "height": "100%",
                            "display": "flex",
                            "align-items": "start",
                            "width": "100%",
                            "box-sizing": "border-box"
                        })
                        .appendTo(container);
                },
            },
            {
                dataField: "email",
                caption: "User Name",
            },
            {
                dataField: "userType",
                caption: "User Type",
            },
            {
                dataField: "role",
                caption: "Role",
            },
            {
                dataField: "sites",
                caption: "Sites",
            },
            {
                dataField: "features",
                caption: "Features",
                width: 180,
            },
            {
                dataField: "groups",
                caption: "Groups",
            },
            {
                dataField: "createdOn",
                caption: "Created On",
            },
            {
                dataField: "lastLogin",
                caption: "Last Login",
            },
        ]
    }).dxDataGrid('instance');
}

function updateRadioButtons() {
    $('input[name="userSelection"]').each(function () {
        const dataKey = $(this).attr('data-key');
        $(this).prop("checked", selectedDeviceKey === dataKey);
    });
}

function refreshUsersGrid() {
    if (userGrid) {
        $.ajax({
            url: '/User/GetUsers',
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                userGrid.option('dataSource', data);
                userGrid.refresh();
            },
            error: function (xhr, status, error) {
                console.error('Failed to refresh users data:', error);
                alert('Failed to refresh users data. Please try again.');
            }
        });
    }
}

function clearUserSearch() {
    const $searchInput = $('#tableUserSearchInput');
    $searchInput.val('');
    $('#tableClearUserSearch').hide();
    if (userGrid) {
        userGrid.searchByText('');
    }
    if (searchExpanded) {
        collapseSearch();
    }
}