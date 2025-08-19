document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function () {
            const isCollapsed = sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
            document.cookie = `sidebarCollapsed=${isCollapsed}; path=/; max-age=31536000`;
        });
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
            window.location.href = "/Homepage";
        }
    });
});