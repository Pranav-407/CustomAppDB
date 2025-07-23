$(function () {

    const recentApps = new DevExpress.data.CustomStore({
        load: function () {
            return $.ajax({
                url: '/Device/GetRecentApps',
                dataType: 'json',
                method: 'GET'
            }).fail(function () {
                DevExpress.ui.notify("Failed to load devices.", "error", 3000);
            });
        }
    });
    $("#recentAppsGrid").dxDataGrid({
        dataSource: recentApps,
        loadPanel: {
            enabled: false
        },
        showBorders: false,
        columnAutoWidth: true,
        rowAlternationEnabled: false,
        hoverStateEnabled: true,
        height: 300,
        scrolling: {
            mode: "standard",
            scrollByContent: true,
            scrollByThumb: true,
            useNative: false
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
                            const grid = $("#recentAppsGrid").dxDataGrid("instance");
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
                dataField: "name",
                caption: "Name",
                cellTemplate: function (container, options) {
                    const isOutdated = options.data.outdated > 0;
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
                }
            },
            { dataField: "releaseDate", caption: "Released Date" },
            { dataField: "version", caption: "Version" },
            {
                dataField: "installed",
                caption: "Installed",
                alignment: "center"
            },
            {
                dataField: "outdated",
                caption: "Outdated",
                alignment: "center"
            }
        ]
    });
});
