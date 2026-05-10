let filter_categories = [];
let number_of_main_categories = 0;

function categories_init() {
    $("#categories").empty();
    for (let cat_name in EXPORTED.categories) {
        let cat = EXPORTED.categories[cat_name];


        let style = "";
        if (cat.rank == 0) {
            number_of_main_categories += 1;
        }

        $("#categories").append(`
            <button id="cat-${cat_name}" class="btn btn-secondary mb-2 btn-category">
                ${cat_name}
            </button>
        `);

        $(`#cat-${cat_name}`).click(function () {
            on_category_pressed(cat_name);
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
}

function on_category_pressed(cat_name) {
    if (filter_categories.includes(cat_name)) {
        filter_categories.splice(filter_categories.indexOf(cat_name), 1);
    } else {
        filter_categories.push(cat_name);
    }

    update_table();
}

function update_categories(alternative_categories) {
    let cat_rank = -1;

    for (let cat_name of filter_categories) {
        let cat = EXPORTED.categories[cat_name];
        if (cat_rank < cat.rank) {
            cat_rank = cat.rank;
        }
    }

    if (alternative_categories.length < number_of_main_categories) {
        cat_rank = 0;
    }

    console.log("show only categories with rank <= " + (cat_rank + 1));

    for (let cat_name in EXPORTED.categories) {
        let cat = EXPORTED.categories[cat_name];
        let btn = $("#cat-" + cat_name);

        if (alternative_categories.includes(cat_name)) {
            btn.show();
        } else {
            btn.hide();
        }

        if (cat.rank > cat_rank + 1) {
            btn.hide();
        }

        btn.removeClass("btn-primary btn-secondary");
        if (filter_categories.includes(cat_name)) {
            btn.addClass("btn-primary");
        } else {
            btn.addClass("btn-secondary");
        }
    }
}