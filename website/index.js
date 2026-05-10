let filter_categories = [];
let filter_temperature = null;
let alternative_categories = [];
let number_of_main_categories = 0;
let search_input = "";
let columns_sorter = ["name", "categories", "manufacturer", "footprint", "value", "tolerance", "limit", "temp_format", "link"];

$(document).ready(function () {
    $("#categories").empty();
    for (let cat of EXPORTED.categories) {

        let style = "";
        if (cat.rank == 0) {
            number_of_main_categories += 1;
        }

        $("#categories").append(`
            <button id="cat-${cat.name}" class="btn btn-secondary mb-2 btn-category">
                ${cat.name}
            </button>
        `);

        $(`#cat-${cat.name}`).click(function () {
            on_category_pressed(cat.name);
        });
    }

    $("#categories").append(`
        <div class="temp-container">
            <div class="input-group">
                <span class="input-group-text bg-white"><i class="bi bi-thermometer-half"></i></span>
                <input type="text" id="tempFilter" class="form-control" placeholder="Temp °C">
            </div>
        </div>
    `);

    $("#tempFilter").on("input", function () {
        on_temperature_changed();
    });

    $("#searchInput").on("input", function () {
        on_search_input();
    });

    $("#datatable th").on("click", function () {
        // Get the column index
        let columnIndex = $(this).index();
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
    });

    update_table();
});

function update_table() {
    let data = EXPORTED.elements;

    $("#datatable_body").empty();

    alternative_categories = [];
    for (let e of data) {
        if (!is_filtered(e)) {
            continue;
        }

        for (let cat of e.category) {
            if (!alternative_categories.includes(cat)) {
                alternative_categories.push(cat);
            }
        }

        let final_column = `
            <a href="datasheets/${e.name}.pdf" 
                target="_blank" 
                class="icon-link text-danger mx-1" 
                title="Open Datasheet">
            <i class="bi bi-file-earmark-pdf-fill"></i>
            </a>
        `;

        let first_column = `
            <a href="datasheets/${e.name}.pdf" target="_blank" class="stealth-link">
                ${e.name}
            </a>
        `;

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

        if (e.mouser) {
            final_column += `
            <a href="${e.link}" 
                target="_blank" 
                class="icon-link mx-1" 
                title="Open Mouser">
           <img src="icons/mouser.png" class="icon-png" alt="Mouser">
           </a>`;
        } else {
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

        let $row = $(`
            <tr>
                <td>${first_column}</td>
                <td>${e.categories}</td>
                <td>${e.manufacturer || ""}</td>
                <td>${footprint}</td>
                <td>${e.value_format || ""}</td>
                <td>${e.tolerance || ""}</td>
                <td>${e.limit_format || ""}</td>
                <td>${e.temp_format || ""}</td>
                <td>${final_column}</td>
            </tr>
        `);

        $("#datatable_body").append($row);
    }

    let show_secondary = alternative_categories.length < number_of_main_categories;
    for (let cat of EXPORTED.categories) {
        let btn = $("#cat-" + cat.name);
        if (alternative_categories.includes(cat.name)) {
            btn.show();
        } else {
            btn.hide();
        }

        if (cat.rank == 1 && !show_secondary) {
            btn.hide();
        }

        btn.removeClass("btn-primary btn-secondary");
        if (filter_categories.includes(cat.name)) {
            btn.addClass("btn-primary");
        } else {
            btn.addClass("btn-secondary");
        }
    }
}

function is_filtered(e) {
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

function on_category_pressed(cat_name) {
    if (filter_categories.includes(cat_name)) {
        filter_categories.splice(filter_categories.indexOf(cat_name), 1);
    } else {
        filter_categories.push(cat_name);
    }

    update_table();
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

$(document).on("click", ".open-modal", function () {
    // 1. Get the data we stored earlier
    let content = $(this).data('content');
    let title = $(this).data('title');

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
});