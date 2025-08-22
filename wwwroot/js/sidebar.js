document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const body = document.body;

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function () {
            const isCollapsed = sidebar.classList.toggle('collapsed');

            // Also toggle the body class
            if (isCollapsed) {
                body.classList.add('sidebar-collapsed');
            } else {
                body.classList.remove('sidebar-collapsed');
            }

            // Save state
            localStorage.setItem('sidebarCollapsed', isCollapsed);
            document.cookie = `sidebarCollapsed=${isCollapsed}; path=/; max-age=31536000`;
        });
    }

    // Initialize sidebar state on page load
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
        sidebar.classList.add('collapsed');
        body.classList.add('sidebar-collapsed');
    }

    document.querySelectorAll("#sidebar a").forEach(link => {
        link.addEventListener("click", function () {
            const url = new URL(this.href, window.location.origin);
            const section = url.searchParams.get("section");
            if (section) {
                localStorage.setItem("selectedSection", section);
            }
        });
    });

    window.addEventListener("pageshow", function (event) {
        const section = new URLSearchParams(window.location.search).get("section");

        if ((event.persisted || performance.navigation.type === 1) && section) {
            localStorage.removeItem("selectedSection");
            window.location.href = "/Home/Index";
        }
    });

    // User Dropdown Functionality
    const userDropdownToggle = document.getElementById('userDropdownToggle');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const dropdownArrow = document.getElementById('dropdownArrow');

    if (userDropdownToggle && userDropdownMenu && dropdownArrow) {

        // Function to position dropdown correctly
        function positionDropdown() {
            const sidebar = document.getElementById('sidebar');
            const isCollapsed = sidebar.classList.contains('collapsed');
            const sidebarWidth = isCollapsed ? 70 : 220;

            userDropdownMenu.style.left = (sidebarWidth + 10) + 'px';
        }

        userDropdownToggle.addEventListener('click', function (e) {
            e.stopPropagation();

            const isOpen = userDropdownMenu.classList.contains('show');

            if (isOpen) {
                userDropdownMenu.classList.remove('show');
                dropdownArrow.classList.remove('rotated');
            } else {
                positionDropdown();
                userDropdownMenu.classList.add('show');
                dropdownArrow.classList.add('rotated');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!userDropdownToggle.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.classList.remove('show');
                dropdownArrow.classList.remove('rotated');
            }
        });

        // Prevent dropdown from closing when clicking inside the menu
        userDropdownMenu.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        // Update position when sidebar is toggled
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () {
                // Close dropdown when sidebar is toggled
                userDropdownMenu.classList.remove('show');
                dropdownArrow.classList.remove('rotated');
            });
        }
    }
});