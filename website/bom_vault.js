
let filter_temperature = null;
let search_input = "";
let columns_sorter = ["name", "categories", "manufacturer", "footprint", "value", "tolerance", "limit", "temp_format", "link"];

$(document).ready(function () {
    categories_init();

    $("#footer").html(EXPORTED.footer);

    $("#tempFilter").on("input", function () {
        on_temperature_changed();
    });

    $("#searchInput").on("input", function () {
        on_search_input();
    });

    $("#datatable th").on("click", function () {
        on_table_header_clicked($(this));
    });

    $(document).on("click", ".open-modal", function () {
        open_modal($(this));
    });

    update_table();
});

function update_table() {
    $("#datatable_body").empty();

    let alternative_categories = [];
    for (let e of EXPORTED.elements) {
        if (!is_filtered(e)) {
            continue;
        }

        for (let cat of e.category) {
            if (!alternative_categories.includes(cat)) {
                alternative_categories.push(cat);
            }
        }

        let $row = $(`
            <tr>
                <td>${get_first_column(e)}</td>
                <td>${e.categories}</td>
                <td>${e.manufacturer || ""}</td>
                <td>${get_footprint(e)}</td>
                <td>${e.value_format || ""}</td>
                <td>${e.tolerance || ""}</td>
                <td>${e.limit_format || ""}</td>
                <td>${e.temp_format || ""}</td>
                <td>${get_final_column(e)}</td>
            </tr>
        `);

        $("#datatable_body").append($row);
    }

    update_categories(alternative_categories);
}

function is_filtered(e) {
    for (let cat_name of e.category) {
        let cat = EXPORTED.categories[cat_name];
        if (cat.hide && !filter_categories.includes(cat_name) && search_input == "") {
            return false;
        }
    }

    for (let cat of filter_categories) {
        if (!e.category.includes(cat)) {
            return false;
        }
    }

    if (filter_temperature != null) {
        if (filter_temperature < e.Tmin || filter_temperature > e.Tmax) {
            return false;
        }
    }

    if (search_input != "") {
        if (!e.search.includes(search_input)) {
            return false;
        }
    }

    return true;
}

function get_first_column(e) {
    return `
        <a href="datasheets/${e.name}.pdf" 
            target="_blank" 
            class="stealth-link">
            <img src="icons/${e.icon.toLowerCase()}.png" class="icon-png">
            ${e.name}
        </a>
    `;
}

function get_footprint(e) {
    let footprint = e.footprint || "";
    if (e.kicad) {
        footprint += `
            <a href="javascript:void(0)" 
                class="open-modal icon-link mx-1" 
                title="KiCad"
                data-content="${e.kicad}"
                data-title="${e.name}">
            <img src="icons/kicad.png" class="icon-png" alt="KiCad">
            </a>
        `;
    }
    return footprint;
}

function get_final_column(e) {
    let final_column = `
            <a href="datasheets/${e.name}.pdf" 
                target="_blank" 
                class="icon-link text-danger mx-1" 
                title="Open Datasheet">
            <i class="bi bi-file-earmark-pdf-fill"></i>
            </a>
        `;

    if (e.mouser) {
        final_column += `
            <a href="${e.link}" 
                target="_blank" 
                class="icon-link mx-1" 
                title="Open Mouser">
           <img src="icons/mouser.png" class="icon-png" alt="Mouser">
           </a>`;
    } else if (e.link) {
        final_column += `
            <a href="${e.link}" 
                target="_blank" 
                class="icon-link text-primary mx-1" 
                title="Open Link">
            <i class="bi bi-globe"></i>
            </a>
            `;
    }

    if (e.show_note) {
        final_column += `
                <a href="javascript:void(0)" 
                    class="open-modal icon-link text-warning mx-1" 
                    title="View Notes"
                    data-content="${e.notes}"
                    data-title="${e.name}">
                <i class="bi bi-sticky-fill"></i>
                </a>`;
    }

    return final_column;
}

function on_temperature_changed() {
    let val = parseInt($("#tempFilter").val());

    if (isNaN(val)) {
        filter_temperature = null;
    } else {
        filter_temperature = val;
    }

    update_table();
}

function on_search_input() {
    search_input = $("#searchInput").val()
    search_input = search_input.toLowerCase();
    update_table();
}

function on_table_header_clicked(e) {
    // Get the column index
    let columnIndex = e.index();
    let columnName = columns_sorter[columnIndex];

    // Sort the table by the clicked column
    EXPORTED.elements.sort((a, b) => {
        let aValue = a[columnName] || "";
        aValue = aValue.toLowerCase();
        let bValue = b[columnName] || "";
        bValue = bValue.toLowerCase();

        // Compare the values and return the sort order
        if (aValue < bValue) {
            return -1;
        }
        if (aValue > bValue) {
            return 1;
        }
        return 0;
    });

    update_table();
}

function open_modal(e) {
    // 1. Get the data we stored earlier
    let content = e.data('content');
    let title = e.data('title');

    let urlRegex = /(?<!href="|">)(https?:\/\/[^\s<]+)/g;
    content = content.replace(urlRegex, function (url) {
        return `<a href="${url}" target="_blank" class="text-primary text-decoration-underline">${url}</a>`;
    });

    // 2. Inject the HTML into the modals
    $("#modalTitle").text(title);
    $("#modalBody").html(content); // Using .html() allows e.notes to render tags

    $("#modalBody table").addClass("table table-sm table-striped table-hover table-bordered border-light");

    // 3. Show the modal using Bootstrap's API
    var myModal = new bootstrap.Modal(document.getElementById('notesModal'));
    myModal.show();
};