let selectedDeviceRow = null;
let deviceGrid = null;
let devicesData = [];

$(document).ready(function () {
    initializeDeviceGrid();
    loadDevicesData();
});

// Load devices data from server and store in variable
async function loadDevicesData() {
    try {
        const response = await $.ajax({
            url: '/Device/GetDevices',
            dataType: 'json',
            method: 'GET'
        });

        if (response) {
            devicesData = response;
        } else {
            devicesData = [];
        }

        // Update grid if it exists
        if (deviceGrid) {
            deviceGrid.option('dataSource', [...devicesData]);
        }
    } catch (error) {
        console.error('Error loading devices:', error);
        DevExpress.ui.notify("Failed to load devices.", "error", 3000);
        devicesData = [];
    }
}

// Initialize the grid structure
function initializeDeviceGrid() {
    deviceGrid = $("#deviceGrid").dxDataGrid({
        dataSource: devicesData,
        showBorders: false,
        columnAutoWidth: true,
        rowAlternationEnabled: false,
        hoverStateEnabled: true,
        loadPanel: {
            enabled: false
        },
        scrolling: {
            mode: "standard",
            scrollByContent: true,
            scrollByThumb: true,
            useNative: false
        },
        paging: {
            pageSize: 5
        },
        pager: {
            visible: true,
            showInfo: true,
            showNavigationButtons: true,
        },
        columns: [
            {
                caption: "",
                width: 40,
                cssClass: "radio-column",
                cellTemplate: function (container, options) {
                    const radio = $("<input type='radio' name='deviceGridRadio' class='grid-radio'>")
                        .val(options.rowIndex)
                        .prop("checked", selectedDeviceRow === options.rowIndex)
                        .on("click", function () {
                            const grid = $("#deviceGrid").dxDataGrid("instance");
                            if (selectedDeviceRow === options.rowIndex) {
                                grid.clearSelection();
                                selectedDeviceRow = null;
                                $(this).prop("checked", false);
                            } else {
                                grid.selectRowsByIndexes([options.rowIndex]);
                                selectedDeviceRow = options.rowIndex;
                            }
                        });
                    $(container).append(radio);
                },
                allowSorting: false,
                allowFiltering: false
            },
            {
                dataField: "computer",
                caption: "Computers",
                width: 135,
                cellTemplate: function (container, options) {
                    const isOutdated = options.data.outdatedApps > 0;
                    const indicatorColor = isOutdated ? "rgb(218, 68, 9)" : "rgb(141, 206, 45)";

                    container.css({ padding: 0, margin: 0, height: "100%" });

                    $("<div>")
                        .text(options.value)
                        .css({
                            "border-left": `7px solid ${indicatorColor}`,
                            "padding": "10px",
                            "height": "100%",
                            "display": "flex",
                            "align-items": "center",
                            "width": "100%",
                            "box-sizing": "border-box"
                        })
                        .appendTo(container);
                },
            },
            { dataField: "installedApps", caption: "Installed Apps" },
            { dataField: "outdatedApps", caption: "Outdated Apps" },
            { dataField: "policy", caption: "Policy" },
            { dataField: "group", caption: "Group" },
            { dataField: "tags", caption: "Tags" },
            { dataField: "configuration", caption: "Configuration" },
            { dataField: "wingetStatus", caption: "Winget Status" },
            { dataField: "lastSeen", caption: "Last Seen" },
            { dataField: "wingetApps", caption: "Winget Apps" },
            { dataField: "browsers", caption: "Web Browsers" },
            { dataField: "messaging", caption: "Messaging" },
            { dataField: "media", caption: "Media" },
            { dataField: "runtimes", caption: "Runtimes" },
            { dataField: "image", caption: "Image" }
        ]
    }).dxDataGrid('instance');
}